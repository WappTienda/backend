/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { BadRequestException } from '@nestjs/common';
import { UploadsService } from './uploads.service';

// Mock the AWS SDK
jest.mock('@aws-sdk/client-s3', () => ({
  S3Client: jest.fn().mockImplementation(() => ({
    send: jest.fn(),
  })),
  PutObjectCommand: jest.fn(),
  DeleteObjectCommand: jest.fn(),
}));

import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';

describe('UploadsService', () => {
  let service: UploadsService;
  let mockS3Send: jest.Mock;

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
    mockS3Send = jest.fn();

    const mockConfigService = {
      get: jest.fn((key: string, defaultValue?: string) => {
        const config: Record<string, string> = {
          'aws.region': 'us-east-1',
          'aws.s3Bucket': 'test-bucket',
          'aws.s3Endpoint': '',
          'aws.accessKeyId': 'test-key',
          'aws.secretAccessKey': 'test-secret',
        };
        return config[key] || defaultValue;
      }),
    };

    // Reset the mock before each test
    (S3Client as jest.Mock).mockImplementation(() => ({
      send: mockS3Send,
    }));

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UploadsService,
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<UploadsService>(UploadsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('uploadImage', () => {
    it('should upload a valid image and return URL', async () => {
      mockS3Send.mockResolvedValue({});

      const result = await service.uploadImage(mockFile, 'products');

      expect(result).toContain(
        'https://test-bucket.s3.us-east-1.amazonaws.com/products/',
      );
      expect(result).toContain('.jpg');
      expect(PutObjectCommand).toHaveBeenCalled();
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
      mockS3Send.mockResolvedValue({});

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
      mockS3Send.mockRejectedValue(new Error('S3 Error'));

      await expect(service.uploadImage(mockFile)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.uploadImage(mockFile)).rejects.toThrow(
        'Failed to upload image',
      );
    });

    it('should use default folder when not specified', async () => {
      mockS3Send.mockResolvedValue({});

      const result = await service.uploadImage(mockFile);

      expect(result).toContain('/products/');
    });
  });

  describe('deleteImage', () => {
    it('should delete an image from S3', async () => {
      mockS3Send.mockResolvedValue({});

      await service.deleteImage(
        'https://test-bucket.s3.us-east-1.amazonaws.com/products/image123.jpg',
      );

      expect(DeleteObjectCommand).toHaveBeenCalled();
    });

    it('should not throw error when image URL does not contain bucket', async () => {
      await expect(
        service.deleteImage('https://other-bucket.s3.amazonaws.com/image.jpg'),
      ).resolves.not.toThrow();
    });

    it('should handle S3 delete errors gracefully', async () => {
      mockS3Send.mockRejectedValue(new Error('Delete failed'));

      // Should not throw, just log the error
      await expect(
        service.deleteImage(
          'https://test-bucket.s3.us-east-1.amazonaws.com/products/image.jpg',
        ),
      ).resolves.not.toThrow();
    });
  });
});

describe('UploadsService - No Bucket Configured', () => {
  it('should throw BadRequestException when bucket is not configured', async () => {
    const mockConfigService = {
      get: jest.fn((key: string, defaultValue?: string) => {
        const config: Record<string, string> = {
          'aws.region': 'us-east-1',
          'aws.s3Bucket': '',
          'aws.accessKeyId': 'test-key',
          'aws.secretAccessKey': 'test-secret',
        };
        return config[key] || defaultValue;
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UploadsService,
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    const service = module.get<UploadsService>(UploadsService);
    const mockFile: Express.Multer.File = {
      fieldname: 'file',
      originalname: 'test.jpg',
      encoding: '7bit',
      mimetype: 'image/jpeg',
      buffer: Buffer.from('test'),
      size: 1024,
      destination: '',
      filename: '',
      path: '',
      stream: null as any,
    };

    await expect(service.uploadImage(mockFile)).rejects.toThrow(
      BadRequestException,
    );
    await expect(service.uploadImage(mockFile)).rejects.toThrow(
      'S3 bucket is not configured',
    );
  });
});
