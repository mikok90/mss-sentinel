import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MssReading } from './mss.entity';
import { CycleState } from './cycle-state.entity';
import { MssService } from './mss.service';
import { MssController } from './mss.controller';
import { WidgetController } from '../widget/widget.controller';
import { MssCronService } from './mss-cron.service';
import { MonthlyCronService } from './monthly-cron.service';
import { KeepAliveService } from './keep-alive.service';
import { VixService } from '../data-sources/vix.service';
import { FngService } from '../data-sources/fng.service';
import { SpxService } from '../data-sources/spx.service';
import { TelegramService } from '../telegram/telegram.service';

@Module({
  imports: [TypeOrmModule.forFeature([MssReading, CycleState])],
  providers: [MssService, MssCronService, MonthlyCronService, KeepAliveService, VixService, FngService, SpxService, TelegramService],
  controllers: [MssController, WidgetController],
})
export class MssModule {}
