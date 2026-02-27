import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { UploadsService } from './domain/services/uploads-domain.service';
import { UploadsController } from './infrastructure/adapters/in/uploads.controller';
import { S3StorageAdapter } from './infrastructure/adapters/out/s3-storage.adapter';
import { STORAGE_PORT } from './domain/ports/out/storage.port';

@Module({
  imports: [
    MulterModule.register({
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
      },
    }),
  ],
  providers: [
    UploadsService,
    {
      provide: STORAGE_PORT,
      useClass: S3StorageAdapter,
    },
  ],
  controllers: [UploadsController],
  exports: [UploadsService],
})
export class UploadsModule {}
