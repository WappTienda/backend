import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Setting } from '../../entities/setting.entity';
import { SettingMapper } from '../../mappers/setting.mapper';
import { SettingModel } from '../../../domain/models/setting.model';
import { SettingRepositoryPort } from '../../../domain/ports/out/setting-repository.port';

@Injectable()
export class TypeOrmSettingRepository implements SettingRepositoryPort {
  constructor(
    @InjectRepository(Setting)
    private readonly settingRepository: Repository<Setting>,
  ) {}

  async findAll(): Promise<SettingModel[]> {
    const entities = await this.settingRepository.find({
      order: { key: 'ASC' },
    });
    return entities.map((entity) => SettingMapper.toDomain(entity));
  }

  async findPublic(): Promise<SettingModel[]> {
    const entities = await this.settingRepository.find({
      where: { isPublic: true },
    });
    return entities.map((entity) => SettingMapper.toDomain(entity));
  }

  async findByKey(key: string): Promise<SettingModel | null> {
    const entity = await this.settingRepository.findOne({ where: { key } });
    return entity ? SettingMapper.toDomain(entity) : null;
  }

  async save(setting: SettingModel): Promise<SettingModel> {
    const entityData = SettingMapper.toEntity(setting);
    const entity = this.settingRepository.create(entityData);
    const saved = await this.settingRepository.save(entity);
    return SettingMapper.toDomain(saved);
  }

  async create(data: Partial<SettingModel>): Promise<SettingModel> {
    const entityData = SettingMapper.toEntity(data);
    const entity = this.settingRepository.create(entityData);
    const saved = await this.settingRepository.save(entity);
    return SettingMapper.toDomain(saved);
  }
}
