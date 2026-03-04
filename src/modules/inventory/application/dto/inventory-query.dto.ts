import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsUUID, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class InventoryQueryDto {
  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ example: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number;

  @ApiPropertyOptional({ description: 'Filter by product ID' })
  @IsOptional()
  @IsUUID()
  productId?: string;
}
