import { SettingModel } from '../../models/setting.model';

export const SETTING_REPOSITORY = Symbol('SETTING_REPOSITORY');

export interface SettingRepositoryPort {
  findAll(): Promise<SettingModel[]>;
  findPublic(): Promise<SettingModel[]>;
  findByKey(key: string): Promise<SettingModel | null>;
  save(setting: SettingModel): Promise<SettingModel>;
  create(data: Partial<SettingModel>): Promise<SettingModel>;
}
