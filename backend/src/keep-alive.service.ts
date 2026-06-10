import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';

const SELF_URL = process.env.RENDER_EXTERNAL_URL || process.env.SELF_URL || '';

@Injectable()
export class KeepAliveService {
  private readonly logger = new Logger(KeepAliveService.name);

  // Ping every 10 minutes to prevent Render free tier spin-down
  @Cron('0 */10 * * * *')
  async ping() {
    if (!SELF_URL) return;

    try {
      const res = await fetch(`${SELF_URL}/api/mss/health`);
      this.logger.debug(`Keep-alive ping: ${res.status}`);
    } catch (err) {
      this.logger.warn(`Keep-alive ping failed: ${err.message}`);
    }
  }
}
