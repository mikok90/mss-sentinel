import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { Zone, ActionType } from '../mss/mss.calculator';

const ZONE_EMOJI: Record<Zone, string> = {
  EXTREME_PANIC: '🟢🟢🟢', TOTAL_PANIC: '🟢🟢', HIGH_FEAR: '🟢',
  NEUTRAL: '⬛', HIGH_GREED: '🟠', EUPHORIA: '🔴🔴',
};
const ACTION_EMOJI: Record<ActionType, string> = {
  DEPLOY: '📈 ΑΓΟΡΑ', REVIEW: '🔍 ΕΛΕΓΧΟΣ', HOLD: '⏸ ΚΡΑΤΑ',
};

@Injectable()
export class TelegramService {
  private readonly logger = new Logger(TelegramService.name);
  private readonly enabled = process.env.TELEGRAM_ENABLED === 'true';
  private readonly botToken = process.env.TELEGRAM_BOT_TOKEN;
  private readonly chatId = process.env.TELEGRAM_CHAT_ID;

  async sendZoneChangeAlert(params: {
    zone: Zone; zoneLabel: string; mss: number;
    action: ActionType; actionDetail: string;
    vix: number; fng: number; spxDrawdown: number | null;
  }): Promise<void> {
    if (!this.enabled) { this.logger.log('Telegram disabled — skipping alert'); return; }
    if (!this.botToken || !this.chatId) { this.logger.warn('Telegram credentials not configured'); return; }

    const emoji = ZONE_EMOJI[params.zone] || '📊';
    const actionEmoji = ACTION_EMOJI[params.action] || '📊';

    const lines = [
      `${emoji} *MSS ZONE CHANGE: ${params.zoneLabel}* (${params.mss})`,
      ``,
      `► ${actionEmoji}: ${params.actionDetail}`,
      ``,
      `VIX: ${params.vix} | F&G: ${params.fng}`,
    ];

    // SPX drawdown line
    if (params.spxDrawdown !== null) {
      lines.push(`SPX Drawdown: ${params.spxDrawdown.toFixed(1)}%`);
    }

    // Discipline tail messages
    const isFear = ['EXTREME_PANIC', 'TOTAL_PANIC', 'HIGH_FEAR'].includes(params.zone);
    const isGreed = ['HIGH_GREED', 'EUPHORIA'].includes(params.zone);

    if (isFear) {
      lines.push(``, `⚠️ Υπενθύμιση: ΔΕΝ πουλάμε τίποτα σε πτώση. Ποτέ.`);
    }
    if (isGreed) {
      lines.push(``, `Καμία πώληση δείκτη. Έλεγξε μόνο τους δορυφόρους.`);
    }

    lines.push(``, `_MSS Sentinel v2 — ${new Date().toUTCString()}_`);

    const message = lines.join('\n');

    try {
      await axios.post(`https://api.telegram.org/bot${this.botToken}/sendMessage`,
        { chat_id: this.chatId, text: message, parse_mode: 'Markdown' },
        { timeout: 8000 });
      this.logger.log(`Telegram alert sent: ${params.zoneLabel} (${params.mss})`);
    } catch (err) {
      this.logger.error(`Telegram send failed: ${err.message}`);
    }
  }

  async sendMonthlyReminder(): Promise<void> {
    if (!this.enabled) return;
    if (!this.botToken || !this.chatId) return;

    const message = [
      `📅 *Μηνιαία Υπενθύμιση — MSS Sentinel v2*`,
      ``,
      `1. Έλεγξε κατανομή στο /katanomi`,
      `2. ΔΕΙΚΤΗΣ 70% | ΚΟΛΟΣΣΟΣ 20% | RISKY 10%`,
      `3. Καμία θέση >10% του συνόλου`,
      `4. ΔΕΝ πουλάμε δείκτες. Ποτέ.`,
      `5. DCA συνεχίζεται ανεξαρτήτως ζώνης.`,
      ``,
      `_Πειθαρχία > Χρονισμός_`,
    ].join('\n');

    try {
      await axios.post(`https://api.telegram.org/bot${this.botToken}/sendMessage`,
        { chat_id: this.chatId, text: message, parse_mode: 'Markdown' },
        { timeout: 8000 });
      this.logger.log('Monthly reminder sent');
    } catch (err) {
      this.logger.error(`Monthly reminder failed: ${err.message}`);
    }
  }
}
