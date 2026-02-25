import { SettingModel } from '../../models/setting.model';
import { UpdateSettingDto } from '../../../application/dto';

export const SETTINGS_USE_CASE = Symbol('SETTINGS_USE_CASE');

export interface SettingsUseCasePort {
  findAll(): Promise<SettingModel[]>;
  findPublic(): Promise<Record<string, string>>;
  getValue(key: string): Promise<string | null>;
  update(dto: UpdateSettingDto): Promise<SettingModel>;
  updateMany(settings: UpdateSettingDto[]): Promise<SettingModel[]>;
}
