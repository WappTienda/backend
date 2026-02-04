/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SettingsService } from './settings.service';
import { Setting } from './entities/setting.entity';

describe('SettingsService', () => {
  let service: SettingsService;
  let repository: jest.Mocked<Repository<Setting>>;

  const mockSetting: Setting = {
    id: 'setting-uuid',
    key: 'businessName',
    value: 'Mi Tienda',
    description: 'Nombre del negocio',
    isPublic: true,
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const mockRepository = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SettingsService,
        { provide: getRepositoryToken(Setting), useValue: mockRepository },
      ],
    }).compile();

    service = module.get<SettingsService>(SettingsService);
    repository = module.get(getRepositoryToken(Setting));
  });

  describe('findAll', () => {
    it('should return all settings ordered by key', async () => {
      repository.find.mockResolvedValue([mockSetting]);

      const result = await service.findAll();

      expect(result).toEqual([mockSetting]);
      expect(repository.find).toHaveBeenCalledWith({ order: { key: 'ASC' } });
    });
  });

  describe('findPublic', () => {
    it('should return public settings as key-value object', async () => {
      repository.find.mockResolvedValue([
        mockSetting,
        { ...mockSetting, key: 'currency', value: 'ARS' },
      ]);

      const result = await service.findPublic();

      expect(result).toEqual({
        businessName: 'Mi Tienda',
        currency: 'ARS',
      });
      expect(repository.find).toHaveBeenCalledWith({
        where: { isPublic: true },
      });
    });

    it('should return empty object when no public settings', async () => {
      repository.find.mockResolvedValue([]);

      const result = await service.findPublic();

      expect(result).toEqual({});
    });
  });

  describe('getValue', () => {
    it('should return setting value when found', async () => {
      repository.findOne.mockResolvedValue(mockSetting);

      const result = await service.getValue('businessName');

      expect(result).toBe('Mi Tienda');
    });

    it('should return null when setting not found', async () => {
      repository.findOne.mockResolvedValue(null);

      const result = await service.getValue('unknownKey');

      expect(result).toBeNull();
    });
  });

  describe('update', () => {
    it('should update existing setting', async () => {
      repository.findOne.mockResolvedValue(mockSetting);
      repository.save.mockResolvedValue({
        ...mockSetting,
        value: 'Nueva Tienda',
      });

      const result = await service.update({
        key: 'businessName',
        value: 'Nueva Tienda',
      });

      expect(result.value).toBe('Nueva Tienda');
      expect(repository.save).toHaveBeenCalled();
    });

    it('should create new setting when not found', async () => {
      repository.findOne.mockResolvedValue(null);
      repository.create.mockReturnValue({
        key: 'newSetting',
        value: 'newValue',
      } as Setting);
      repository.save.mockResolvedValue({
        id: 'new-uuid',
        key: 'newSetting',
        value: 'newValue',
      } as Setting);

      const result = await service.update({
        key: 'newSetting',
        value: 'newValue',
      });

      expect(result.value).toBe('newValue');
      expect(repository.create).toHaveBeenCalled();
    });

    it('should handle empty value', async () => {
      repository.findOne.mockResolvedValue(mockSetting);
      repository.save.mockResolvedValue({ ...mockSetting, value: '' });

      const result = await service.update({ key: 'businessName', value: '' });

      expect(result.value).toBe('');
    });
  });

  describe('updateMany', () => {
    it('should update multiple settings', async () => {
      repository.findOne.mockResolvedValue(mockSetting);
      repository.save.mockImplementation((setting) =>
        Promise.resolve(setting as Setting),
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
