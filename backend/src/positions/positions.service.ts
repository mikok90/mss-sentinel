import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Position } from './position.entity';

@Injectable()
export class PositionsService {
  constructor(
    @InjectRepository(Position)
    private readonly repo: Repository<Position>,
  ) {}

  findAll(): Promise<Position[]> {
    return this.repo.find({ order: { category: 'ASC', name: 'ASC' } });
  }

  create(data: { name: string; value: number; category: string }): Promise<Position> {
    const position = this.repo.create(data);
    return this.repo.save(position);
  }

  async update(id: number, data: Partial<{ name: string; value: number; category: string }>): Promise<Position | null> {
    await this.repo.update(id, data);
    return this.repo.findOne({ where: { id } });
  }

  async remove(id: number): Promise<boolean> {
    const result = await this.repo.delete(id);
    return (result.affected ?? 0) > 0;
  }
}
