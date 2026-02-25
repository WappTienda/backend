import { SettingModel } from '../../domain/models/setting.model';
import { Setting } from '../entities/setting.entity';

export class SettingMapper {
  static toDomain(entity: Setting): SettingModel {
    const model = new SettingModel();
    model.id = entity.id;
    model.key = entity.key;
    model.value = entity.value;
    model.description = entity.description;
    model.isPublic = entity.isPublic;
    model.updatedAt = entity.updatedAt;
    return model;
  }

  static toEntity(model: Partial<SettingModel>): Partial<Setting> {
    const entity: Partial<Setting> = {};
    if (model.id !== undefined) entity.id = model.id;
    if (model.key !== undefined) entity.key = model.key;
    if (model.value !== undefined) entity.value = model.value;
    if (model.description !== undefined) entity.description = model.description;
    if (model.isPublic !== undefined) entity.isPublic = model.isPublic;
    return entity;
  }
}
