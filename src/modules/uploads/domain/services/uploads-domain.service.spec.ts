/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { UploadsService } from './uploads-domain.service';
import { STORAGE_PORT, StoragePort } from '../ports/out/storage.port';

describe('UploadsService', () => {
  let service: UploadsService;
  let mockStoragePort: jest.Mocked<StoragePort>;

  const mockFile: Express.Multer.File = {
    fieldname: 'file',
    originalname: 'test-image.jpg',
    encoding: '7bit',
    mimetype: 'image/jpeg',
    buffer: Buffer.from('test image content'),
    size: 1024,
    destination: '',
    filename: '',
    path: '',
    stream: null as any,
  };

  beforeEach(async () => {
    mockStoragePort = {
      upload: jest.fn(),
      delete: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UploadsService,
        { provide: STORAGE_PORT, useValue: mockStoragePort },
      ],
    }).compile();

    service = module.get<UploadsService>(UploadsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('uploadImage', () => {
    it('should upload a valid image and return URL', async () => {
      mockStoragePort.upload.mockResolvedValue(
        'https://test-bucket.s3.us-east-1.amazonaws.com/products/abc123.jpg',
      );

      const result = await service.uploadImage(mockFile, 'products');

      expect(result).toContain(
        'https://test-bucket.s3.us-east-1.amazonaws.com/products/',
      );
      expect(result).toContain('.jpg');
      expect(mockStoragePort.upload).toHaveBeenCalledWith(
        expect.stringMatching(/^products\/.*\.jpg$/),
        mockFile.buffer,
        mockFile.mimetype,
      );
    });

    it('should throw BadRequestException for invalid mime type', async () => {
      const invalidFile = { ...mockFile, mimetype: 'application/pdf' };

      await expect(service.uploadImage(invalidFile)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.uploadImage(invalidFile)).rejects.toThrow(
        'Invalid file type',
      );
    });

    it('should throw BadRequestException when file exceeds size limit', async () => {
      const largeFile = { ...mockFile, size: 6 * 1024 * 1024 }; // 6MB

      await expect(service.uploadImage(largeFile)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.uploadImage(largeFile)).rejects.toThrow(
        'File size exceeds 5MB limit',
      );
    });

    it('should accept different valid image types', async () => {
      mockStoragePort.upload
        .mockResolvedValueOnce(
          'https://test-bucket.s3.us-east-1.amazonaws.com/products/abc.png',
        )
        .mockResolvedValueOnce(
          'https://test-bucket.s3.us-east-1.amazonaws.com/products/abc.webp',
        )
        .mockResolvedValueOnce(
          'https://test-bucket.s3.us-east-1.amazonaws.com/products/abc.gif',
        );

      const pngFile = {
        ...mockFile,
        mimetype: 'image/png',
        originalname: 'test.png',
      };
      const webpFile = {
        ...mockFile,
        mimetype: 'image/webp',
        originalname: 'test.webp',
      };
      const gifFile = {
        ...mockFile,
        mimetype: 'image/gif',
        originalname: 'test.gif',
      };

      const pngResult = await service.uploadImage(pngFile);
      const webpResult = await service.uploadImage(webpFile);
      const gifResult = await service.uploadImage(gifFile);

      expect(pngResult).toContain('.png');
      expect(webpResult).toContain('.webp');
      expect(gifResult).toContain('.gif');
    });

    it('should throw BadRequestException when S3 upload fails', async () => {
      mockStoragePort.upload.mockRejectedValue(new Error('S3 Error'));

      await expect(service.uploadImage(mockFile)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.uploadImage(mockFile)).rejects.toThrow(
        'Failed to upload image',
      );
    });

    it('should use default folder when not specified', async () => {
      mockStoragePort.upload.mockResolvedValue(
        'https://test-bucket.s3.us-east-1.amazonaws.com/products/abc.jpg',
      );

      const result = await service.uploadImage(mockFile);

      expect(result).toContain('/products/');
    });

    it('should throw BadRequestException when bucket is not configured', async () => {
      mockStoragePort.upload.mockRejectedValue(
        new BadRequestException('S3 bucket is not configured'),
      );

      await expect(service.uploadImage(mockFile)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.uploadImage(mockFile)).rejects.toThrow(
        'S3 bucket is not configured',
      );
    });
  });

  describe('deleteImage', () => {
    it('should delete an image from S3', async () => {
      mockStoragePort.delete.mockResolvedValue(undefined);

      await service.deleteImage(
        'https://test-bucket.s3.us-east-1.amazonaws.com/products/image123.jpg',
      );

      expect(mockStoragePort.delete).toHaveBeenCalledWith(
        'https://test-bucket.s3.us-east-1.amazonaws.com/products/image123.jpg',
      );
    });

    it('should not throw error when delete has issues', async () => {
      mockStoragePort.delete.mockResolvedValue(undefined);

      await expect(
        service.deleteImage('https://other-bucket.s3.amazonaws.com/image.jpg'),
      ).resolves.not.toThrow();
    });

    it('should handle S3 delete errors gracefully', async () => {
      mockStoragePort.delete.mockRejectedValue(new Error('Delete failed'));

      // Should not throw, just log the error
      await expect(
        service.deleteImage(
          'https://test-bucket.s3.us-east-1.amazonaws.com/products/image.jpg',
        ),
      ).resolves.not.toThrow();
    });
  });
});
