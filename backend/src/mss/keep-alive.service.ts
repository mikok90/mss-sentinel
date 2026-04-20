import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import axios from 'axios';

// Self-ping every 10 minutes to prevent Render free tier from sleeping.
// Render spins down after 15 min of inactivity — this keeps the service alive.
const SELF_URL =
  process.env.SELF_URL ||
  'https://mss-sentinel-backend.onrender.com/api/mss/health';

@Injectable()
export class KeepAliveService {
  private readonly logger = new Logger(KeepAliveService.name);

  @Cron('0 */10 * * * *') // every 10 minutes
  async ping() {
    try {
      const res = await axios.get(SELF_URL, { timeout: 8000 });
      this.logger.log(`Keep-alive ping OK (status: ${res.status})`);
    } catch (err) {
      this.logger.warn(`Keep-alive ping failed: ${err.message}`);
    }
  }
}
