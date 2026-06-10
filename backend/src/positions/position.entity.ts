import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('positions')
export class Position {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  value: number;

  @Column({ type: 'varchar', length: 20 })
  category: string; // ΔΕΙΚΤΗΣ, ΚΟΛΟΣΣΟΣ, RISKY

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
