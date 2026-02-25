import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { StoragePort } from '../../../domain/ports/out/storage.port';

@Injectable()
export class S3StorageAdapter implements StoragePort {
  private readonly logger = new Logger(S3StorageAdapter.name);
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

  async upload(
    key: string,
    body: Buffer,
    contentType: string,
  ): Promise<string> {
    if (!this.bucket) {
      throw new BadRequestException('S3 bucket is not configured');
    }

    await this.s3Client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: body,
        ContentType: contentType,
      }),
    );

    // Generate URL based on endpoint (LocalStack or AWS)
    const url = this.endpoint
      ? `${this.endpoint}/${this.bucket}/${key}`
      : `https://${this.bucket}.s3.${this.region}.amazonaws.com/${key}`;

    return url;
  }

  async delete(imageUrl: string): Promise<void> {
    if (!this.bucket || !imageUrl.includes(this.bucket)) {
      return;
    }

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
  }
}
