import { Controller, Get, Query, ParseIntPipe, DefaultValuePipe } from '@nestjs/common';
import { MssService } from './mss.service';

@Controller('mss')
export class MssController {
  constructor(private readonly mssService: MssService) {}

  /** GET /api/mss/current — used by KWGT widget and frontend */
  @Get('current')
  getCurrent() {
    return this.mssService.getCurrent();
  }

  /** GET /api/mss/history?days=30 — charting data */
  @Get('history')
  getHistory(
    @Query('days', new DefaultValuePipe(30), ParseIntPipe) days: number,
  ) {
    return this.mssService.getHistory(days);
  }

  /** GET /api/mss/health — uptime check for Render */
  @Get('health')
  getHealth() {
    return this.mssService.getHealth();
  }
}
