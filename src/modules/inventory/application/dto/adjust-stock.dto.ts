import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString, MaxLength } from 'class-validator';

export class AdjustStockDto {
  @ApiProperty({
    description: 'Stock quantity delta (positive to add, negative to remove)',
    example: 10,
  })
  @IsNumber()
  quantity: number;

  @ApiPropertyOptional({ description: 'Reason for the adjustment', example: 'Manual correction' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}
