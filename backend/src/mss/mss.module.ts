import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MssReading } from './mss.entity';
import { MssService } from './mss.service';
import { MssController } from './mss.controller';
import { WidgetController } from '../widget/widget.controller';
import { MssCronService } from './mss-cron.service';
import { KeepAliveService } from './keep-alive.service';
import { VixService } from '../data-sources/vix.service';
import { FngService } from '../data-sources/fng.service';
import { TelegramService } from '../telegram/telegram.service';

@Module({
  imports: [TypeOrmModule.forFeature([MssReading])],
  providers: [MssService, MssCronService, KeepAliveService, VixService, FngService, TelegramService],
  controllers: [MssController, WidgetController],
})
export class MssModule {}
