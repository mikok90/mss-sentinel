import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { MssReading } from './mss.entity';
import { VixService } from '../data-sources/vix.service';
import { FngService } from '../data-sources/fng.service';
import { TelegramService } from '../telegram/telegram.service';
import { computeMss, getZoneInfo, Zone } from './mss.calculator';

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
    private readonly vixService: VixService,
    private readonly fngService: FngService,
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
    });

    await this.repo.save(reading);
    this.logger.log(
      `MSS: ${calc.mss} | Zone: ${calc.zoneLabel} | Confirmed: ${zoneConfirmed} | Changed: ${zoneChanged}`,
    );

    // Send Telegram alert on confirmed zone change
    if (zoneChanged && zoneConfirmed) {
      await this.telegramService.sendZoneChangeAlert({
        zone: calc.zone as Zone,
        zoneLabel: calc.zoneLabel,
        mss: calc.mss,
        action: calc.action,
        actionDetail: calc.actionDetail,
        vix: vixValue,
        fng: fngValue,
      });
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

    return {
      mss: Number(latest.mss),
      zone: displayZoneInfo.zone,
      zoneLabel: displayZoneInfo.zoneLabel,
      zoneConfirmed: latest.zoneConfirmed,
      action: displayZoneInfo.action,
      actionDetail: latest.zoneConfirmed ? displayZoneInfo.actionDetail : 'Waiting for zone confirmation...',
      actionPercent: displayZoneInfo.actionPercent,
      actionType: displayZoneInfo.action === 'DEPLOY' ? 'buy' : displayZoneInfo.action === 'TRIM' ? 'sell' : null,
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
    // US market: Mon-Fri 9:30am-4:00pm ET (UTC-4 or UTC-5)
    const utcHour = now.getUTCHours();
    const utcMin = now.getUTCMinutes();
    const day = now.getUTCDay(); // 0=Sun, 6=Sat

    if (day === 0 || day === 6) return false;

    // Approximate ET offset: -4 (EDT) or -5 (EST)
    const etOffset = this.isDaylightSaving(now) ? -4 : -5;
    const etHour = ((utcHour + etOffset) % 24 + 24) % 24;
    const etMin = utcMin;

    const afterOpen = etHour > 9 || (etHour === 9 && etMin >= 30);
    const beforeClose = etHour < 16;
    return afterOpen && beforeClose;
  }

  private isDaylightSaving(date: Date): boolean {
    // US DST: 2nd Sunday March → 1st Sunday November
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
