import { Controller, Get, Post, Patch, Delete, Body, Param, HttpException, HttpStatus } from '@nestjs/common';
import { PositionsService } from './positions.service';

@Controller('positions')
export class PositionsController {
  constructor(private readonly positionsService: PositionsService) {}

  @Get()
  findAll() {
    return this.positionsService.findAll();
  }

  @Post()
  create(@Body() body: { name: string; value: number; category: string }) {
    if (!body.name || body.value == null || !body.category) {
      throw new HttpException('name, value, and category are required', HttpStatus.BAD_REQUEST);
    }
    return this.positionsService.create(body);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() body: Partial<{ name: string; value: number; category: string }>) {
    const result = await this.positionsService.update(parseInt(id), body);
    if (!result) throw new HttpException('Position not found', HttpStatus.NOT_FOUND);
    return result;
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    const ok = await this.positionsService.remove(parseInt(id));
    if (!ok) throw new HttpException('Position not found', HttpStatus.NOT_FOUND);
    return { deleted: true };
  }
}
