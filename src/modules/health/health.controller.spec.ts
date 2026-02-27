import { Test, TestingModule } from '@nestjs/testing';
import { HealthCheckService, TypeOrmHealthIndicator } from '@nestjs/terminus';
import { HealthController } from './health.controller';
import { S3HealthIndicator } from './indicators/s3-health.indicator';

describe('HealthController', () => {
  let controller: HealthController;
  let healthCheckService: jest.Mocked<HealthCheckService>;
  let dbIndicator: jest.Mocked<TypeOrmHealthIndicator>;
  let s3Indicator: jest.Mocked<S3HealthIndicator>;

  const mockHealthResult = {
    status: 'ok',
    info: { database: { status: 'up' }, s3: { status: 'up' } },
    error: {},
    details: { database: { status: 'up' }, s3: { status: 'up' } },
  };

  beforeEach(async () => {
    const mockHealthCheckService: jest.Mocked<HealthCheckService> = {
      check: jest.fn().mockResolvedValue(mockHealthResult),
    } as unknown as jest.Mocked<HealthCheckService>;

    const mockDbIndicator: jest.Mocked<TypeOrmHealthIndicator> = {
      pingCheck: jest.fn(),
    } as unknown as jest.Mocked<TypeOrmHealthIndicator>;

    const mockS3Indicator: jest.Mocked<S3HealthIndicator> = {
      isHealthy: jest.fn(),
    } as unknown as jest.Mocked<S3HealthIndicator>;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        { provide: HealthCheckService, useValue: mockHealthCheckService },
        { provide: TypeOrmHealthIndicator, useValue: mockDbIndicator },
        { provide: S3HealthIndicator, useValue: mockS3Indicator },
      ],
    }).compile();

    controller = module.get<HealthController>(HealthController);
    healthCheckService = module.get(HealthCheckService);
    dbIndicator = module.get(TypeOrmHealthIndicator);
    s3Indicator = module.get(S3HealthIndicator);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('check', () => {
    it('should return health check result', async () => {
      const result = await controller.check();

      expect(result).toEqual(mockHealthResult);
      expect(healthCheckService.check).toHaveBeenCalledWith([
        expect.any(Function),
        expect.any(Function),
      ]);
    });

    it('should include database and s3 checks', async () => {
      const dbResult = { database: { status: 'up' } };
      const s3Result = { s3: { status: 'up' } };

      dbIndicator.pingCheck.mockResolvedValue(dbResult as any);
      s3Indicator.isHealthy.mockResolvedValue(s3Result as any);

      healthCheckService.check.mockImplementation(async (checks) => {
        await Promise.all(checks.map((fn) => fn()));
        return mockHealthResult as any;
      });

      await controller.check();

      expect(dbIndicator.pingCheck).toHaveBeenCalledWith('database');
      expect(s3Indicator.isHealthy).toHaveBeenCalledWith('s3');
    });

    it('should propagate errors when database check fails', async () => {
      const unhealthyResult = {
        status: 'error',
        info: {},
        error: { database: { status: 'down' } },
        details: { database: { status: 'down' } },
      };

      healthCheckService.check.mockResolvedValue(unhealthyResult as any);

      const result = await controller.check();

      expect(result).toEqual(unhealthyResult);
    });

    it('should propagate errors when S3 check fails', async () => {
      const unhealthyResult = {
        status: 'error',
        info: { database: { status: 'up' } },
        error: { s3: { status: 'down', message: 'S3 connection failed' } },
        details: {
          database: { status: 'up' },
          s3: { status: 'down', message: 'S3 connection failed' },
        },
      };

      healthCheckService.check.mockResolvedValue(unhealthyResult as any);

      const result = await controller.check();

      expect(result).toEqual(unhealthyResult);
    });
  });
});
