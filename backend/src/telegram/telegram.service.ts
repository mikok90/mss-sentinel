import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { Zone, ActionType } from '../mss/mss.calculator';

const ZONE_EMOJI: Record<Zone, string> = {
  EXTREME_PANIC: '🟢🟢🟢',
  TOTAL_PANIC: '🟢🟢',
  HIGH_FEAR: '🟢',
  NEUTRAL: '⬛',
  HIGH_GREED: '🟠',
  EUPHORIA: '🔴🔴',
};

const ACTION_EMOJI: Record<ActionType, string> = {
  DEPLOY: '📈 BUY',
  TRIM: '📉 SELL',
  HOLD: '⏸ HOLD',
};

@Injectable()
export class TelegramService {
  private readonly logger = new Logger(TelegramService.name);
  private readonly enabled = process.env.TELEGRAM_ENABLED === 'true';
  private readonly botToken = process.env.TELEGRAM_BOT_TOKEN;
  private readonly chatId = process.env.TELEGRAM_CHAT_ID;

  async sendZoneChangeAlert(params: {
    zone: Zone;
    zoneLabel: string;
    mss: number;
    action: ActionType;
    actionDetail: string;
    vix: number;
    fng: number;
  }): Promise<void> {
    if (!this.enabled) {
      this.logger.log('Telegram disabled — skipping alert');
      return;
    }
    if (!this.botToken || !this.chatId) {
      this.logger.warn('Telegram credentials not configured');
      return;
    }

    const emoji = ZONE_EMOJI[params.zone] || '📊';
    const actionEmoji = ACTION_EMOJI[params.action] || '📊';

    const message = [
      `${emoji} *MSS ZONE CHANGE: ${params.zoneLabel}* (${params.mss})`,
      ``,
      `► ${actionEmoji}: ${params.actionDetail}`,
      ``,
      `VIX: ${params.vix} | F&G: ${params.fng}`,
      ``,
      `_MSS Sentinel — ${new Date().toUTCString()}_`,
    ].join('\n');

    try {
      await axios.post(
        `https://api.telegram.org/bot${this.botToken}/sendMessage`,
        {
          chat_id: this.chatId,
          text: message,
          parse_mode: 'Markdown',
        },
        { timeout: 8000 },
      );
      this.logger.log(`Telegram alert sent: ${params.zoneLabel} (${params.mss})`);
    } catch (err) {
      this.logger.error(`Telegram send failed: ${err.message}`);
    }
  }
}
