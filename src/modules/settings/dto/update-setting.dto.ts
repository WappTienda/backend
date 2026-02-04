import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, MaxLength } from 'class-validator';

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
  settings: UpdateSettingDto[];
}
