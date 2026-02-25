import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { User } from './infrastructure/entities/user.entity';
import { UsersService } from './domain/services/users-domain.service';
import { USER_REPOSITORY } from './domain/ports/out/user-repository.port';
import { TypeOrmUserRepository } from './infrastructure/adapters/out/typeorm-user.repository';

@Module({
  imports: [TypeOrmModule.forFeature([User]), ConfigModule],
  providers: [
    UsersService,
    { provide: USER_REPOSITORY, useClass: TypeOrmUserRepository },
  ],
  exports: [UsersService],
})
export class UsersModule {}
