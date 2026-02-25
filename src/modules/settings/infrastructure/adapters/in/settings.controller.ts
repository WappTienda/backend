import { Controller, Get, Patch, Body } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { SettingsService } from '../../../domain/services/settings-domain.service';
import { UpdateSettingsDto } from '../../../application/dto';
import { SettingModel } from '../../../domain/models/setting.model';
import { Public } from '../../../../../common/decorators';

@ApiTags('Settings')
@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Public()
  @Get('public')
  @ApiOperation({ summary: 'Get public settings' })
  @ApiResponse({ status: 200 })
  async findPublic(): Promise<Record<string, string>> {
    return this.settingsService.findPublic();
  }

  @Get()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all settings (admin)' })
  @ApiResponse({ status: 200 })
  async findAll(): Promise<SettingModel[]> {
    return this.settingsService.findAll();
  }

  @Patch()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update settings (admin)' })
  @ApiResponse({ status: 200 })
  async update(@Body() dto: UpdateSettingsDto): Promise<SettingModel[]> {
    return this.settingsService.updateMany(dto.settings);
  }
}
