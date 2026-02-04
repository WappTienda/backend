import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User, UserRole } from './entities/user.entity';

@Injectable()
export class UsersService implements OnModuleInit {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
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

      const existingAdmin = await this.userRepository.findOne({
        where: { email: adminEmail },
      });

      if (existingAdmin) {
        this.logger.log('Admin user already exists');
        return;
      }

      const hashedPassword = await bcrypt.hash(adminPassword, 10);

      const admin = this.userRepository.create({
        email: adminEmail,
        password: hashedPassword,
        name: 'Administrator',
        role: UserRole.ADMIN,
        isActive: true,
      });

      await this.userRepository.save(admin);
      this.logger.log(`Admin user created with email: ${adminEmail}`);
    } catch {
      this.logger.warn('Could not create admin user (table may not exist yet)');
    }
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { email } });
  }

  async findById(id: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { id } });
  }

  async create(userData: Partial<User>): Promise<User> {
    const user = this.userRepository.create(userData);
    return this.userRepository.save(user);
  }
}
