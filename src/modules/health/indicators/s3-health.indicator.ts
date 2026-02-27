import { Injectable } from '@nestjs/common';
import { HealthIndicator, HealthIndicatorResult } from '@nestjs/terminus';
import { ConfigService } from '@nestjs/config';
import { S3Client, HeadBucketCommand } from '@aws-sdk/client-s3';

@Injectable()
export class S3HealthIndicator extends HealthIndicator {
  private readonly s3Client: S3Client;
  private readonly bucket: string;

  constructor(private readonly configService: ConfigService) {
    super();

    const region = this.configService.get<string>('aws.region', 'us-east-1');
    const endpoint = this.configService.get<string>('aws.s3Endpoint');
    this.bucket = this.configService.get<string>('aws.s3Bucket', '');

    const s3Config: ConstructorParameters<typeof S3Client>[0] = {
      region,
      credentials: {
        accessKeyId: this.configService.get<string>('aws.accessKeyId', ''),
        secretAccessKey: this.configService.get<string>(
          'aws.secretAccessKey',
          '',
        ),
      },
    };

    if (endpoint) {
      s3Config.endpoint = endpoint;
      s3Config.forcePathStyle = true;
    }

    this.s3Client = new S3Client(s3Config);
  }

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    const accessKeyId = this.configService.get<string>('aws.accessKeyId', '');
    const secretAccessKey = this.configService.get<string>(
      'aws.secretAccessKey',
      '',
    );

    if (!this.bucket || !accessKeyId || !secretAccessKey) {
      return this.getStatus(key, false, {
        message: 'S3 not configured (missing bucket or credentials)',
      });
    }

    try {
      await this.s3Client.send(new HeadBucketCommand({ Bucket: this.bucket }));
      return this.getStatus(key, true);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'S3 connection failed';
      return this.getStatus(key, false, { message });
    }
  }
}
