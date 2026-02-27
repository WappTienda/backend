import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Setting } from './infrastructure/entities/setting.entity';
import { SettingsService } from './domain/services/settings-domain.service';
import { SettingsController } from './infrastructure/adapters/in/settings.controller';
import { TypeOrmSettingRepository } from './infrastructure/adapters/out/typeorm-setting.repository';
import { SETTING_REPOSITORY } from './domain/ports/out/setting-repository.port';

@Module({
  imports: [TypeOrmModule.forFeature([Setting])],
  providers: [
    SettingsService,
    {
      provide: SETTING_REPOSITORY,
      useClass: TypeOrmSettingRepository,
    },
  ],
  controllers: [SettingsController],
  exports: [SettingsService],
})
export class SettingsModule {}
