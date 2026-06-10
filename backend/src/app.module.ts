import 'reflect-metadata';
import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MssModule } from './mss/mss.module';
import { MssReading } from './mss/mss.entity';
import { CycleState } from './mss/cycle-state.entity';
import { Position } from './positions/position.entity';
import { PositionsModule } from './positions/positions.module';
import { KeepAliveService } from './keep-alive.service';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    TypeOrmModule.forRootAsync({
      useFactory: () => {
        if (process.env.DATABASE_URL) {
          return { type: 'postgres', url: process.env.DATABASE_URL, entities: [MssReading, CycleState, Position], synchronize: true, ssl: { rejectUnauthorized: false } };
        }
        console.log('[DB] No DATABASE_URL — using SQLite (local dev)');
        return { type: 'sqlite', database: './mss-local.sqlite', entities: [MssReading, CycleState, Position], synchronize: true };
      },
    }),
    MssModule,
    PositionsModule,
  ],
  providers: [KeepAliveService],
})
export class AppModule {}
