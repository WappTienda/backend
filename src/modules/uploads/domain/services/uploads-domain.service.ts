import { Injectable, Inject, BadRequestException, Logger } from '@nestjs/common';
import { nanoid } from 'nanoid';
import { UploadsUseCasePort } from '../ports/in/uploads-use-case.port';
import { STORAGE_PORT, StoragePort } from '../ports/out/storage.port';

@Injectable()
export class UploadsService implements UploadsUseCasePort {
  private readonly logger = new Logger(UploadsService.name);

  constructor(
    @Inject(STORAGE_PORT)
    private readonly storagePort: StoragePort,
  ) {}

  async uploadImage(
    file: Express.Multer.File,
    folder = 'products',
  ): Promise<string> {
    const allowedMimeTypes = [
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/gif',
    ];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        'Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed.',
      );
    }

    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      throw new BadRequestException('File size exceeds 5MB limit');
    }

    const extension = file.originalname.split('.').pop();
    const key = `${folder}/${nanoid()}.${extension}`;

    try {
      const url = await this.storagePort.upload(
        key,
        file.buffer,
        file.mimetype,
      );

      this.logger.log(`Image uploaded: ${url}`);
      return url;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to upload image: ${errorMessage}`);
      throw new BadRequestException('Failed to upload image');
    }
  }

  async deleteImage(imageUrl: string): Promise<void> {
    try {
      await this.storagePort.delete(imageUrl);
      this.logger.log(`Image deleted: ${imageUrl}`);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to delete image: ${errorMessage}`);
    }
  }
}
