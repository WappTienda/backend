import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsEnum, IsString } from 'class-validator';
import { PaginationQueryDto } from '../../../../common/dto';
import { OrderStatus } from '../../domain/models/order.model';

export class OrderQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: OrderStatus })
  @IsOptional()
  @IsEnum(OrderStatus)
  status?: OrderStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;
}
