/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { UsersService } from './domain/services/users-domain.service';
import { UserModel, UserRole } from './domain/models/user.model';
import {
  USER_REPOSITORY,
  UserRepositoryPort,
} from './domain/ports/out/user-repository.port';

describe('UsersService', () => {
  let service: UsersService;
  let repository: jest.Mocked<UserRepositoryPort>;

  const mockUser: UserModel = {
    id: 'user-uuid',
    email: 'test@example.com',
    password: 'hashedPassword',
    name: 'Test User',
    role: UserRole.ADMIN,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const mockRepository: jest.Mocked<UserRepositoryPort> = {
      findByEmail: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
    };

    const mockConfigService = {
      get: jest.fn().mockReturnValue('test-value'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: USER_REPOSITORY, useValue: mockRepository },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    repository = module.get(USER_REPOSITORY);
  });

  describe('findByEmail', () => {
    it('should return a user when found', async () => {
      repository.findByEmail.mockResolvedValue(mockUser);

      const result = await service.findByEmail('test@example.com');

      expect(result).toEqual(mockUser);
      expect(repository.findByEmail).toHaveBeenCalledWith('test@example.com');
    });

    it('should return null when user not found', async () => {
      repository.findByEmail.mockResolvedValue(null);

      const result = await service.findByEmail('unknown@example.com');

      expect(result).toBeNull();
    });
  });

  describe('findById', () => {
    it('should return a user when found', async () => {
      repository.findById.mockResolvedValue(mockUser);

      const result = await service.findById('user-uuid');

      expect(result).toEqual(mockUser);
      expect(repository.findById).toHaveBeenCalledWith('user-uuid');
    });

    it('should return null when user not found', async () => {
      repository.findById.mockResolvedValue(null);

      const result = await service.findById('unknown-uuid');

      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('should create and save a new user', async () => {
      const userData = {
        email: 'new@example.com',
        password: 'hashedPassword',
        name: 'New User',
      };

      repository.create.mockResolvedValue(mockUser);

      const result = await service.create(userData);

      expect(result).toEqual(mockUser);
      expect(repository.create).toHaveBeenCalledWith(userData);
    });
  });
});
