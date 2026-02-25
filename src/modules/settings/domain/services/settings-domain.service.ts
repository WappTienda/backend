import { Injectable, OnModuleInit, Logger, Inject } from '@nestjs/common';
import { SettingModel } from '../models/setting.model';
import {
  SETTING_REPOSITORY,
  SettingRepositoryPort,
} from '../ports/out/setting-repository.port';
import { SettingsUseCasePort } from '../ports/in/settings-use-case.port';
import { UpdateSettingDto } from '../../application/dto';

interface DefaultSetting {
  key: string;
  value: string;
  description: string;
  isPublic: boolean;
}

@Injectable()
export class SettingsService implements SettingsUseCasePort, OnModuleInit {
  private readonly logger = new Logger(SettingsService.name);
  private readonly defaultSettings: DefaultSetting[] = [
    {
      key: 'businessName',
      value: 'Mi Tienda',
      description: 'Nombre del negocio',
      isPublic: true,
    },
    {
      key: 'businessWhatsApp',
      value: '',
      description: 'Número de WhatsApp del negocio (con código de país)',
      isPublic: true,
    },
    {
      key: 'businessAddress',
      value: '',
      description: 'Dirección del negocio',
      isPublic: true,
    },
    {
      key: 'currency',
      value: 'PEN',
      description: 'Moneda por defecto',
      isPublic: true,
    },
    {
      key: 'currencySymbol',
      value: 'S/',
      description: 'Símbolo de la moneda',
      isPublic: true,
    },
  ];

  constructor(
    @Inject(SETTING_REPOSITORY)
    private readonly settingRepository: SettingRepositoryPort,
  ) {}

  onModuleInit() {
    // Delay to allow TypeORM to sync tables first
    setTimeout(() => {
      void this.ensureDefaultSettings();
    }, 2000);
  }

  private async ensureDefaultSettings(): Promise<void> {
    try {
      for (const defaultSetting of this.defaultSettings) {
        const existing = await this.settingRepository.findByKey(
          defaultSetting.key,
        );

        if (!existing) {
          await this.settingRepository.create(defaultSetting);
        }
      }
      this.logger.log('Default settings initialized');
    } catch {
      this.logger.warn(
        'Could not initialize settings (table may not exist yet)',
      );
    }
  }

  async findAll(): Promise<SettingModel[]> {
    return this.settingRepository.findAll();
  }

  async findPublic(): Promise<Record<string, string>> {
    const settings = await this.settingRepository.findPublic();

    return settings.reduce(
      (acc, setting) => {
        acc[setting.key] = setting.value;
        return acc;
      },
      {} as Record<string, string>,
    );
  }

  async getValue(key: string): Promise<string | null> {
    const setting = await this.settingRepository.findByKey(key);
    return setting?.value || null;
  }

  async update(dto: UpdateSettingDto): Promise<SettingModel> {
    const setting = await this.settingRepository.findByKey(dto.key);

    if (!setting) {
      return this.settingRepository.create({
        key: dto.key,
        value: dto.value || '',
      });
    }

    setting.value = dto.value || '';
    return this.settingRepository.save(setting);
  }

  async updateMany(settings: UpdateSettingDto[]): Promise<SettingModel[]> {
    const results: SettingModel[] = [];
    for (const dto of settings) {
      const result = await this.update(dto);
      results.push(result);
    }
    return results;
  }
}
