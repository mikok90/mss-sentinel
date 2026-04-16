import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { MssService } from './mss.service';

const CRON_MINUTES = parseInt(process.env.CRON_INTERVAL_MINUTES || '30');

// Build cron expression: every N minutes
// For 30min: '0 */30 * * * *' (runs at :00 and :30)
function buildCron(minutes: number): string {
  return `0 */${minutes} * * * *`;
}

@Injectable()
export class MssCronService {
  private readonly logger = new Logger(MssCronService.name);

  constructor(private readonly mssService: MssService) {}

  // Default: every 30 minutes
  @Cron(buildCron(CRON_MINUTES))
  async handleCron() {
    this.logger.log(`Cron triggered — running MSS reading`);
    try {
      await this.mssService.runReading();
    } catch (err) {
      this.logger.error(`Cron reading failed: ${err.message}`);
    }
  }

  // Also run once at startup (after a short delay for DB to connect)
  onApplicationBootstrap() {
    setTimeout(async () => {
      this.logger.log('Running initial MSS reading on startup...');
      try {
        await this.mssService.runReading();
      } catch (err) {
        this.logger.warn(`Startup reading failed: ${err.message}`);
      }
    }, 5000);
  }
}
