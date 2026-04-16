import 'reflect-metadata';
import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MssModule } from './mss/mss.module';
import { MssReading } from './mss/mss.entity';

@Module({
  imports: [
    ScheduleModule.forRoot(),

    TypeOrmModule.forRootAsync({
      useFactory: () => {
        if (process.env.DATABASE_URL) {
          // Production: PostgreSQL on Render
          return {
            type: 'postgres' as const,
            url: process.env.DATABASE_URL,
            entities: [MssReading],
            synchronize: true,
            ssl: { rejectUnauthorized: false },
          };
        }
        // Local dev: SQLite (no setup needed)
        console.log('[DB] No DATABASE_URL — using SQLite (local dev)');
        return {
          type: 'sqlite' as const,
          database: './mss-local.sqlite',
          entities: [MssReading],
          synchronize: true,
        };
      },
    }),

    MssModule,
  ],
})
export class AppModule {}
