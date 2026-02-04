import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { nanoid } from 'nanoid';

@Injectable()
export class UploadsService {
  private readonly logger = new Logger(UploadsService.name);
  private readonly s3Client: S3Client;
  private readonly bucket: string;
  private readonly region: string;
  private readonly endpoint: string | undefined;

  constructor(private readonly configService: ConfigService) {
    this.region = this.configService.get<string>('aws.region', 'us-east-1');
    this.bucket = this.configService.get<string>('aws.s3Bucket', '');
    this.endpoint = this.configService.get<string>('aws.s3Endpoint');

    const s3Config: ConstructorParameters<typeof S3Client>[0] = {
      region: this.region,
      credentials: {
        accessKeyId: this.configService.get<string>('aws.accessKeyId', ''),
        secretAccessKey: this.configService.get<string>(
          'aws.secretAccessKey',
          '',
        ),
      },
    };

    // LocalStack configuration
    if (this.endpoint) {
      s3Config.endpoint = this.endpoint;
      s3Config.forcePathStyle = true;
    }

    this.s3Client = new S3Client(s3Config);
  }

  async uploadImage(
    file: Express.Multer.File,
    folder = 'products',
  ): Promise<string> {
    if (!this.bucket) {
      throw new BadRequestException('S3 bucket is not configured');
    }

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
      await this.s3Client.send(
        new PutObjectCommand({
          Bucket: this.bucket,
          Key: key,
          Body: file.buffer,
          ContentType: file.mimetype,
        }),
      );

      // Generate URL based on endpoint (LocalStack or AWS)
      const url = this.endpoint
        ? `${this.endpoint}/${this.bucket}/${key}`
        : `https://${this.bucket}.s3.${this.region}.amazonaws.com/${key}`;

      this.logger.log(`Image uploaded: ${url}`);
      return url;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to upload image: ${errorMessage}`);
      throw new BadRequestException('Failed to upload image');
    }
  }

  async deleteImage(imageUrl: string): Promise<void> {
    if (!this.bucket || !imageUrl.includes(this.bucket)) {
      return;
    }

    try {
      // Extract key from URL (supports both LocalStack and AWS)
      let key: string | undefined;
      if (this.endpoint && imageUrl.includes(this.endpoint)) {
        key = imageUrl.split(`${this.bucket}/`)[1];
      } else {
        key = imageUrl.split('.amazonaws.com/')[1];
      }

      if (!key) return;

      await this.s3Client.send(
        new DeleteObjectCommand({
          Bucket: this.bucket,
          Key: key,
        }),
      );

      this.logger.log(`Image deleted: ${imageUrl}`);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to delete image: ${errorMessage}`);
    }
  }
}
