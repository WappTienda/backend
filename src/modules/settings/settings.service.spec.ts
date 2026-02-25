/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { SettingsService } from './domain/services/settings-domain.service';
import { SettingModel } from './domain/models/setting.model';
import {
  SETTING_REPOSITORY,
  SettingRepositoryPort,
} from './domain/ports/out/setting-repository.port';

describe('SettingsService', () => {
  let service: SettingsService;
  let repository: jest.Mocked<SettingRepositoryPort>;

  const mockSetting: SettingModel = Object.assign(new SettingModel(), {
    id: 'setting-uuid',
    key: 'businessName',
    value: 'Mi Tienda',
    description: 'Nombre del negocio',
    isPublic: true,
    updatedAt: new Date(),
  });

  const mockSettingRepository: jest.Mocked<SettingRepositoryPort> = {
    findAll: jest.fn(),
    findPublic: jest.fn(),
    findByKey: jest.fn(),
    save: jest.fn(),
    create: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SettingsService,
        { provide: SETTING_REPOSITORY, useValue: mockSettingRepository },
      ],
    }).compile();

    service = module.get<SettingsService>(SettingsService);
    repository = module.get(SETTING_REPOSITORY);
  });

  describe('findAll', () => {
    it('should return all settings ordered by key', async () => {
      repository.findAll.mockResolvedValue([mockSetting]);

      const result = await service.findAll();

      expect(result).toEqual([mockSetting]);
      expect(repository.findAll).toHaveBeenCalled();
    });
  });

  describe('findPublic', () => {
    it('should return public settings as key-value object', async () => {
      repository.findPublic.mockResolvedValue([
        mockSetting,
        Object.assign(new SettingModel(), {
          ...mockSetting,
          key: 'currency',
          value: 'ARS',
        }),
      ]);

      const result = await service.findPublic();

      expect(result).toEqual({
        businessName: 'Mi Tienda',
        currency: 'ARS',
      });
      expect(repository.findPublic).toHaveBeenCalled();
    });

    it('should return empty object when no public settings', async () => {
      repository.findPublic.mockResolvedValue([]);

      const result = await service.findPublic();

      expect(result).toEqual({});
    });
  });

  describe('getValue', () => {
    it('should return setting value when found', async () => {
      repository.findByKey.mockResolvedValue(mockSetting);

      const result = await service.getValue('businessName');

      expect(result).toBe('Mi Tienda');
    });

    it('should return null when setting not found', async () => {
      repository.findByKey.mockResolvedValue(null);

      const result = await service.getValue('unknownKey');

      expect(result).toBeNull();
    });
  });

  describe('update', () => {
    it('should update existing setting', async () => {
      repository.findByKey.mockResolvedValue(mockSetting);
      repository.save.mockResolvedValue(
        Object.assign(new SettingModel(), {
          ...mockSetting,
          value: 'Nueva Tienda',
        }),
      );

      const result = await service.update({
        key: 'businessName',
        value: 'Nueva Tienda',
      });

      expect(result.value).toBe('Nueva Tienda');
      expect(repository.save).toHaveBeenCalled();
    });

    it('should create new setting when not found', async () => {
      repository.findByKey.mockResolvedValue(null);
      repository.create.mockResolvedValue(
        Object.assign(new SettingModel(), {
          id: 'new-uuid',
          key: 'newSetting',
          value: 'newValue',
        }),
      );

      const result = await service.update({
        key: 'newSetting',
        value: 'newValue',
      });

      expect(result.value).toBe('newValue');
      expect(repository.create).toHaveBeenCalled();
    });

    it('should handle empty value', async () => {
      repository.findByKey.mockResolvedValue(mockSetting);
      repository.save.mockResolvedValue(
        Object.assign(new SettingModel(), { ...mockSetting, value: '' }),
      );

      const result = await service.update({ key: 'businessName', value: '' });

      expect(result.value).toBe('');
    });
  });

  describe('updateMany', () => {
    it('should update multiple settings', async () => {
      repository.findByKey.mockResolvedValue(mockSetting);
      repository.save.mockImplementation((setting) =>
        Promise.resolve(setting),
      );

      const result = await service.updateMany([
        { key: 'businessName', value: 'Tienda 1' },
        { key: 'currency', value: 'USD' },
      ]);

      expect(result).toHaveLength(2);
      expect(repository.save).toHaveBeenCalledTimes(2);
    });

    it('should return empty array when no settings provided', async () => {
      const result = await service.updateMany([]);

      expect(result).toEqual([]);
    });
  });
});
