import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../entities/user.entity';
import { UserMapper } from '../../mappers/user.mapper';
import { UserModel } from '../../../domain/models/user.model';
import { UserRepositoryPort } from '../../../domain/ports/out/user-repository.port';

@Injectable()
export class TypeOrmUserRepository implements UserRepositoryPort {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async findByEmail(email: string): Promise<UserModel | null> {
    const entity = await this.userRepository.findOne({ where: { email } });
    return entity ? UserMapper.toDomain(entity) : null;
  }

  async findById(id: string): Promise<UserModel | null> {
    const entity = await this.userRepository.findOne({ where: { id } });
    return entity ? UserMapper.toDomain(entity) : null;
  }

  async create(userData: Partial<UserModel>): Promise<UserModel> {
    const entityData = UserMapper.toEntity(userData);
    const entity = this.userRepository.create(entityData);
    const saved = await this.userRepository.save(entity);
    return UserMapper.toDomain(saved);
  }
}
