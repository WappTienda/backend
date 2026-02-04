import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  MinLength,
  MaxLength,
  Matches,
} from 'class-validator';

export class CreateCustomerDto {
  @ApiProperty({ example: 'Juan Pérez' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @ApiProperty({ example: '+5491112345678' })
  @IsString()
  @Matches(/^\+?[0-9]{8,15}$/, {
    message: 'Phone must be a valid phone number',
  })
  phone: string;

  @ApiPropertyOptional({ example: 'Calle Falsa 123, Ciudad' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  address?: string;

  @ApiPropertyOptional({ example: 'Cliente frecuente' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}
