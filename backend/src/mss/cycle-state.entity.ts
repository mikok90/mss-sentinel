import { Entity, PrimaryColumn, Column, UpdateDateColumn } from 'typeorm';

@Entity('cycle_state')
export class CycleState {
  @PrimaryColumn({ default: 1 })
  id: number;

  @Column({ type: 'simple-array', name: 'alerted_tiers', default: '' })
  alertedTiers: string[];

  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'cycle_high_watermark', default: 0 })
  cycleHighWatermark: number;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
