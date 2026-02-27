import { Injectable, Inject, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { UserModel, UserRole } from '../models/user.model';
import {
  USER_REPOSITORY,
  UserRepositoryPort,
} from '../ports/out/user-repository.port';
import { UsersUseCasePort } from '../ports/in/users-use-case.port';

@Injectable()
export class UsersService implements UsersUseCasePort, OnModuleInit {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: UserRepositoryPort,
    private readonly configService: ConfigService,
  ) {}

  onModuleInit() {
    // Delay to allow TypeORM to sync tables first
    setTimeout(() => {
      void this.ensureAdminUser();
    }, 2500);
  }

  private async ensureAdminUser(): Promise<void> {
    try {
      const adminEmail =
        this.configService.get<string>('admin.email') || 'admin@example.com';
      const adminPassword =
        this.configService.get<string>('admin.password') || 'Admin123!';

      const existingAdmin = await this.userRepository.findByEmail(adminEmail);

      if (existingAdmin) {
        this.logger.log('Admin user already exists');
        return;
      }

      const hashedPassword = await bcrypt.hash(adminPassword, 10);

      await this.userRepository.create({
        email: adminEmail,
        password: hashedPassword,
        name: 'Administrator',
        role: UserRole.ADMIN,
        isActive: true,
      });

      this.logger.log(`Admin user created with email: ${adminEmail}`);
    } catch {
      this.logger.warn('Could not create admin user (table may not exist yet)');
    }
  }

  async findByEmail(email: string): Promise<UserModel | null> {
    return this.userRepository.findByEmail(email);
  }

  async findById(id: string): Promise<UserModel | null> {
    return this.userRepository.findById(id);
  }

  async create(userData: Partial<UserModel>): Promise<UserModel> {
    return this.userRepository.create(userData);
  }
}
