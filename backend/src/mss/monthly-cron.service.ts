import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { TelegramService } from '../telegram/telegram.service';

@Injectable()
export class MonthlyCronService {
  private readonly logger = new Logger(MonthlyCronService.name);

  constructor(private readonly telegramService: TelegramService) {}

  // 1st of every month at 08:00 UTC
  @Cron('0 0 8 1 * *')
  async handleMonthlyReminder(): Promise<void> {
    this.logger.log('Firing monthly discipline reminder');
    await this.telegramService.sendMonthlyReminder();
  }
}
