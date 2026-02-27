import { Injectable } from '@nestjs/common';
import {
  HealthIndicatorResult,
  HealthIndicatorService,
} from '@nestjs/terminus';
import { ConfigService } from '@nestjs/config';
import { S3Client, HeadBucketCommand } from '@aws-sdk/client-s3';

@Injectable()
export class S3HealthIndicator {
  private readonly s3Client: S3Client;
  private readonly bucket: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly healthIndicatorService: HealthIndicatorService,
  ) {
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
    const indicator = this.healthIndicatorService.check(key);
    const accessKeyId = this.configService.get<string>('aws.accessKeyId', '');
    const secretAccessKey = this.configService.get<string>(
      'aws.secretAccessKey',
      '',
    );

    if (!this.bucket || !accessKeyId || !secretAccessKey) {
      return indicator.down({
        message: 'S3 not configured (missing bucket or credentials)',
      });
    }

    try {
      await this.s3Client.send(new HeadBucketCommand({ Bucket: this.bucket }));
      return indicator.up();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'S3 connection failed';
      return indicator.down({ message });
    }
  }
}
