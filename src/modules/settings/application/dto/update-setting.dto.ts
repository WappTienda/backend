import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  MaxLength,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateSettingDto {
  @ApiProperty()
  @IsString()
  @MaxLength(100)
  key: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  value?: string;
}

export class UpdateSettingsDto {
  @ApiProperty({ type: [UpdateSettingDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateSettingDto)
  settings: UpdateSettingDto[];
}
