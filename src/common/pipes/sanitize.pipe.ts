import { Injectable, PipeTransform, ArgumentMetadata } from '@nestjs/common';
import { filterXSS } from 'xss';

@Injectable()
export class SanitizePipe implements PipeTransform {
  transform(value: unknown, metadata: ArgumentMetadata): unknown {
    if (metadata.type !== 'body') {
      return value;
    }
    return this.sanitize(value);
  }

  private sanitize(value: unknown): unknown {
    if (typeof value === 'string') {
      return filterXSS(value);
    }
    if (Array.isArray(value)) {
      return value.map((item) => this.sanitize(item));
    }
    if (value !== null && typeof value === 'object') {
      const sanitized: Record<string, unknown> = {};
      for (const key of Object.keys(value as Record<string, unknown>)) {
        sanitized[key] = this.sanitize(
          (value as Record<string, unknown>)[key],
        );
      }
      return sanitized;
    }
    return value;
  }
}
