import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { MssReading } from './mss.entity';
import { CycleState } from './cycle-state.entity';
import { VixService } from '../data-sources/vix.service';
import { FngService } from '../data-sources/fng.service';
import { SpxService } from '../data-sources/spx.service';
import { TelegramService } from '../telegram/telegram.service';
import { computeMss, getZoneInfo, getDrawdownOverride, Zone } from './mss.calculator';

const MAX_DATA_AGE_HOURS = parseInt(process.env.MAX_DATA_AGE_HOURS || '24');
const STABILITY_READINGS = parseInt(process.env.STABILITY_READINGS || '2');
const CRON_MINUTES = parseInt(process.env.CRON_INTERVAL_MINUTES || '30');

@Injectable()
export class MssService {
  private readonly logger = new Logger(MssService.name);

  // In-memory state for stability rule
  private previousRawZone: Zone | null = null;
  private displayedZone: Zone | null = null;

  constructor(
    @InjectRepository(MssReading)
    private readonly repo: Repository<MssReading>,
    @InjectRepository(CycleState)
    private readonly cycleRepo: Repository<CycleState>,
    private readonly vixService: VixService,
    private readonly fngService: FngService,
    private readonly spxService: SpxService,
    private readonly telegramService: TelegramService,
  ) {}

  /** Rehydrate stability state from DB (survives restarts) */
  private async rehydrateState(): Promise<void> {
    if (this.displayedZone !== null) return; // already initialized

    // Last confirmed zone = displayedZone
    const lastConfirmed = await this.repo.findOne({
      where: { zoneConfirmed: true },
      order: { timestamp: 'DESC' },
    });

    // Most recent reading = previousRawZone
    const lastReading = await this.repo.findOne({
      where: {},
      order: { timestamp: 'DESC' },
    });

    if (lastConfirmed) {
      this.displayedZone = lastConfirmed.zone as Zone;
      this.logger.log(`Rehydrated displayedZone: ${this.displayedZone}`);
    }
    if (lastReading) {
      this.previousRawZone = lastReading.zone as Zone;
      this.logger.log(`Rehydrated previousRawZone: ${this.previousRawZone}`);
    }
  }

  /** Get or create the single-row cycle state */
  private async getCycleState(): Promise<CycleState> {
    let state = await this.cycleRepo.findOne({ where: { id: 1 } });
    if (!state) {
      state = this.cycleRepo.create({ id: 1, alertedTiers: [], cycleHighWatermark: 0 });
      await this.cycleRepo.save(state);
    }
    return state;
  }

  /** Called by cron every 30 minutes */
  async runReading(): Promise<void> {
    await this.rehydrateState();
    this.logger.log('Starting MSS reading...');

    let vixValue: number;
    let fngValue: number;
    let dataSourceVix: string;
    let dataSourceFng: string;
    let marketOpen = this.isMarketOpen();

    try {
      const vixResult = await this.vixService.fetchVix();
      vixValue = vixResult.value;
      dataSourceVix = vixResult.source;
    } catch (err) {
      this.logger.warn(`VIX fetch failed: ${err.message} — using cache`);
      const cached = await this.getLastValidReading();
      if (!cached) {
        this.logger.error('No cached VIX data available');
        return;
      }
      vixValue = Number(cached.vixValue);
      dataSourceVix = 'CACHE';
    }

    try {
      const fngResult = await this.fngService.fetchFng();
      fngValue = fngResult.value;
      dataSourceFng = fngResult.source;
    } catch (err) {
      this.logger.warn(`F&G fetch failed: ${err.message} — using cache`);
      const cached = await this.getLastValidReading();
      if (!cached) {
        this.logger.error('No cached F&G data available');
        return;
      }
      fngValue = Number(cached.fngValue);
      dataSourceFng = 'CACHE';
    }

    // Fetch SPX data (non-fatal — null if unavailable)
    let spxPrice: number | null = null;
    let spx52wHigh: number | null = null;
    let spxDrawdown: number | null = null;

    try {
      const spxResult = await this.spxService.fetchSpx();
      spxPrice = spxResult.price;
      spx52wHigh = spxResult.fiftyTwoWeekHigh;
      spxDrawdown = spxResult.drawdownPct;
    } catch (err) {
      this.logger.warn(`SPX fetch failed (non-fatal): ${err.message}`);
    }

    // Calculate MSS
    const calc = computeMss(vixValue, fngValue);
    const currentZone = calc.zone as Zone;

    // Stability rule: confirm zone change after STABILITY_READINGS consecutive readings
    let zoneConfirmed = false;
    let zoneChanged = false;

    if (this.displayedZone === null) {
      // First reading — just set it
      this.displayedZone = currentZone;
      this.previousRawZone = currentZone;
      zoneConfirmed = true;
    } else if (currentZone !== this.displayedZone) {
      if (currentZone === this.previousRawZone) {
        // Second consecutive reading in new zone → confirm
        this.displayedZone = currentZone;
        zoneConfirmed = true;
        zoneChanged = true;
      }
      // else: first reading in new zone — wait for next reading
    } else {
      zoneConfirmed = true;
    }

    this.previousRawZone = currentZone;

    // Manage cycle state — reset alertedTiers when SPX near 52w high
    if (spxDrawdown !== null) {
      const cycleState = await this.getCycleState();

      // Update high watermark
      if (spxPrice !== null && spxPrice > Number(cycleState.cycleHighWatermark)) {
        cycleState.cycleHighWatermark = spxPrice;
      }

      // Reset cycle if SPX is within 0.5% of 52w high
      if (spxDrawdown < 0.5 && cycleState.alertedTiers.length > 0) {
        this.logger.log('SPX near 52w high — resetting cycle alertedTiers');
        cycleState.alertedTiers = [];
      }

      await this.cycleRepo.save(cycleState);
    }

    // Save to DB
    const reading = this.repo.create({
      vixValue,
      fngValue,
      vixScore: calc.vixScore,
      fngScore: calc.fngScore,
      mss: calc.mss,
      zone: calc.zone,
      zoneConfirmed,
      action: calc.action,
      actionPercent: calc.actionPercent,
      zoneChanged,
      dataSourceVix,
      dataSourceFng,
      marketOpen,
      spxPrice,
      spx52wHigh,
      spxDrawdown,
    });

    await this.repo.save(reading);
    this.logger.log(
      `MSS: ${calc.mss} | Zone: ${calc.zoneLabel} | Confirmed: ${zoneConfirmed} | Changed: ${zoneChanged} | SPX drawdown: ${spxDrawdown?.toFixed(1) ?? 'N/A'}%`,
    );

    // Send Telegram alert on confirmed zone change (once per cycle per tier)
    if (zoneChanged && zoneConfirmed) {
      const cycleState = await this.getCycleState();
      const tier = calc.zone;

      if (!cycleState.alertedTiers.includes(tier)) {
        // Apply drawdown override to action detail for the alert
        const drawdownOverride = getDrawdownOverride(calc.zone as Zone, spxDrawdown);
        const alertDetail = drawdownOverride || calc.actionDetail;

        await this.telegramService.sendZoneChangeAlert({
          zone: calc.zone as Zone,
          zoneLabel: calc.zoneLabel,
          mss: calc.mss,
          action: calc.action,
          actionDetail: alertDetail,
          vix: vixValue,
          fng: fngValue,
          spxDrawdown,
        });

        cycleState.alertedTiers = [...cycleState.alertedTiers, tier];
        await this.cycleRepo.save(cycleState);
      } else {
        this.logger.log(`Tier ${tier} already alerted this cycle — skipping Telegram`);
      }
    }
  }

  /** GET /api/mss/current */
  async getCurrent() {
    const latest = await this.repo.findOne({
      where: {},
      order: { timestamp: 'DESC' },
    });

    if (!latest) {
      return { status: 'NO_DATA', message: 'No readings yet. Cron has not run.' };
    }

    const ageHours = (Date.now() - new Date(latest.timestamp).getTime()) / 3600000;
    if (ageHours > MAX_DATA_AGE_HOURS) {
      return {
        status: 'DATA_UNAVAILABLE',
        message: `Last reading is ${Math.round(ageHours)}h old — exceeds ${MAX_DATA_AGE_HOURS}h limit`,
        lastTimestamp: latest.timestamp,
      };
    }

    const rawZoneInfo = getZoneInfo(Number(latest.mss));
    const nextUpdate = new Date(latest.timestamp);
    nextUpdate.setMinutes(nextUpdate.getMinutes() + CRON_MINUTES);

    // If unconfirmed, show the last confirmed zone's data instead
    let displayZoneInfo = rawZoneInfo;
    let pendingZone: string | null = null;

    if (!latest.zoneConfirmed) {
      const lastConfirmed = await this.repo.findOne({
        where: { zoneConfirmed: true },
        order: { timestamp: 'DESC' },
      });
      if (lastConfirmed) {
        displayZoneInfo = getZoneInfo(Number(lastConfirmed.mss));
        pendingZone = rawZoneInfo.zoneLabel;
      }
    }

    // Apply drawdown override for deploy zones
    const spxDrawdown = latest.spxDrawdown !== null ? Number(latest.spxDrawdown) : null;
    const drawdownOverride = getDrawdownOverride(displayZoneInfo.zone as Zone, spxDrawdown);
    const actionDetail = latest.zoneConfirmed
      ? (drawdownOverride || displayZoneInfo.actionDetail)
      : 'Αναμονή επιβεβαίωσης ζώνης...';

    return {
      mss: Number(latest.mss),
      zone: displayZoneInfo.zone,
      zoneLabel: displayZoneInfo.zoneLabel,
      zoneConfirmed: latest.zoneConfirmed,
      action: displayZoneInfo.action,
      actionDetail,
      actionPercent: displayZoneInfo.actionPercent,
      actionType: displayZoneInfo.action === 'DEPLOY' ? 'buy' : displayZoneInfo.action === 'REVIEW' ? 'review' : null,
      color: displayZoneInfo.color,
      pendingZone,
      vix: Number(latest.vixValue),
      fng: Number(latest.fngValue),
      vixScore: Number(latest.vixScore),
      fngScore: Number(latest.fngScore),
      timestamp: latest.timestamp,
      nextUpdate,
      marketOpen: latest.marketOpen,
      dataSourceVix: latest.dataSourceVix,
      dataSourceFng: latest.dataSourceFng,
      dataAgeMinutes: Math.round(ageHours * 60),
      stale: ageHours > 2,
      spxDrawdown,
    };
  }

  /** GET /api/mss/history?days=30 */
  async getHistory(days = 30) {
    days = Math.min(Math.max(1, days), 365);
    const since = new Date();
    since.setDate(since.getDate() - days);

    const readings = await this.repo
      .createQueryBuilder('r')
      .where('r.timestamp >= :since', { since })
      .orderBy('r.timestamp', 'ASC')
      .getMany();

    return readings.map((r) => ({
      timestamp: r.timestamp,
      mss: Number(r.mss),
      vix: Number(r.vixValue),
      fng: Number(r.fngValue),
      zone: r.zone,
      zoneChanged: r.zoneChanged,
      action: r.action,
    }));
  }

  /** GET /api/mss/health — always returns 200 for Render healthcheck */
  async getHealth() {
    const latest = await this.repo.findOne({
      where: {},
      order: { timestamp: 'DESC' },
    });
    if (!latest) return { status: 'no_data' };

    const ageMs = Date.now() - new Date(latest.timestamp).getTime();
    const ageMin = Math.round(ageMs / 60000);

    return {
      status: 'ok',
      lastReading: latest.timestamp,
      dataAgeMinutes: ageMin,
      zone: latest.zone,
      mss: Number(latest.mss),
    };
  }

  private async getLastValidReading(): Promise<MssReading | null> {
    const since = new Date();
    since.setHours(since.getHours() - MAX_DATA_AGE_HOURS);

    return this.repo.findOne({
      where: { timestamp: MoreThan(since) },
      order: { timestamp: 'DESC' },
    });
  }

  private isMarketOpen(): boolean {
    const now = new Date();
    const utcHour = now.getUTCHours();
    const utcMin = now.getUTCMinutes();
    const day = now.getUTCDay();

    if (day === 0 || day === 6) return false;

    const etOffset = this.isDaylightSaving(now) ? -4 : -5;
    const etHour = ((utcHour + etOffset) % 24 + 24) % 24;
    const etMin = utcMin;

    const afterOpen = etHour > 9 || (etHour === 9 && etMin >= 30);
    const beforeClose = etHour < 16;
    return afterOpen && beforeClose;
  }

  private isDaylightSaving(date: Date): boolean {
    const year = date.getUTCFullYear();
    const marchSecondSunday = this.getNthSunday(year, 2, 2);
    const novFirstSunday = this.getNthSunday(year, 10, 1);
    return date >= marchSecondSunday && date < novFirstSunday;
  }

  private getNthSunday(year: number, month: number, n: number): Date {
    const d = new Date(Date.UTC(year, month, 1));
    d.setUTCDate(1 + ((7 - d.getUTCDay()) % 7) + (n - 1) * 7);
    return d;
  }
}
