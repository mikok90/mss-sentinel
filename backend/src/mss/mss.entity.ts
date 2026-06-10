import { Entity, PrimaryGeneratedColumn, Column, Index, CreateDateColumn } from 'typeorm';

@Entity('mss_readings')
@Index(['timestamp'])
export class MssReading {
  @PrimaryGeneratedColumn()
  id: number;

  @CreateDateColumn({ name: 'timestamp' })
  timestamp: Date;

  @Column({ type: 'decimal', precision: 6, scale: 2, name: 'vix_value' })
  vixValue: number;

  @Column({ type: 'integer', name: 'fng_value' })
  fngValue: number;

  @Column({ type: 'decimal', precision: 5, scale: 1, name: 'vix_score' })
  vixScore: number;

  @Column({ type: 'decimal', precision: 5, scale: 1, name: 'fng_score' })
  fngScore: number;

  @Column({ type: 'decimal', precision: 4, scale: 1, name: 'mss' })
  mss: number;

  @Column({ type: 'varchar', length: 20, name: 'zone' })
  zone: string;

  @Column({ type: 'boolean', default: false, name: 'zone_confirmed' })
  zoneConfirmed: boolean;

  @Column({ type: 'varchar', length: 10, name: 'action' })
  action: string;

  @Column({ type: 'integer', nullable: true, name: 'action_percent' })
  actionPercent: number | null;

  @Column({ type: 'boolean', default: false, name: 'zone_changed' })
  zoneChanged: boolean;

  @Column({ type: 'varchar', length: 20, name: 'data_source_vix' })
  dataSourceVix: string;

  @Column({ type: 'varchar', length: 20, name: 'data_source_fng' })
  dataSourceFng: string;

  @Column({ type: 'boolean', name: 'market_open' })
  marketOpen: boolean;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true, name: 'spx_price' })
  spxPrice: number | null;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true, name: 'spx_52w_high' })
  spx52wHigh: number | null;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true, name: 'spx_drawdown' })
  spxDrawdown: number | null;
}
