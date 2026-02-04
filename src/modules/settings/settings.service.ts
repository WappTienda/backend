import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Setting } from './entities/setting.entity';
import { UpdateSettingDto } from './dto';

interface DefaultSetting {
  key: string;
  value: string;
  description: string;
  isPublic: boolean;
}

@Injectable()
export class SettingsService implements OnModuleInit {
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
      value: 'ARS',
      description: 'Moneda por defecto',
      isPublic: true,
    },
    {
      key: 'currencySymbol',
      value: '$',
      description: 'Símbolo de la moneda',
      isPublic: true,
    },
  ];

  constructor(
    @InjectRepository(Setting)
    private readonly settingRepository: Repository<Setting>,
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
        const existing = await this.settingRepository.findOne({
          where: { key: defaultSetting.key },
        });

        if (!existing) {
          await this.settingRepository.save(
            this.settingRepository.create(defaultSetting),
          );
        }
      }
      this.logger.log('Default settings initialized');
    } catch {
      this.logger.warn(
        'Could not initialize settings (table may not exist yet)',
      );
    }
  }

  async findAll(): Promise<Setting[]> {
    return this.settingRepository.find({ order: { key: 'ASC' } });
  }

  async findPublic(): Promise<Record<string, string>> {
    const settings = await this.settingRepository.find({
      where: { isPublic: true },
    });

    return settings.reduce(
      (acc, setting) => {
        acc[setting.key] = setting.value;
        return acc;
      },
      {} as Record<string, string>,
    );
  }

  async getValue(key: string): Promise<string | null> {
    const setting = await this.settingRepository.findOne({ where: { key } });
    return setting?.value || null;
  }

  async update(dto: UpdateSettingDto): Promise<Setting> {
    let setting = await this.settingRepository.findOne({
      where: { key: dto.key },
    });

    if (!setting) {
      setting = this.settingRepository.create({
        key: dto.key,
        value: dto.value || '',
      });
    } else {
      setting.value = dto.value || '';
    }

    return this.settingRepository.save(setting);
  }

  async updateMany(settings: UpdateSettingDto[]): Promise<Setting[]> {
    const results: Setting[] = [];
    for (const dto of settings) {
      const result = await this.update(dto);
      results.push(result);
    }
    return results;
  }
}
