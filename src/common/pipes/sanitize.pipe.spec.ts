import { SanitizePipe } from './sanitize.pipe';
import { ArgumentMetadata } from '@nestjs/common';

describe('SanitizePipe', () => {
  let pipe: SanitizePipe;

  const bodyMeta: ArgumentMetadata = { type: 'body', metatype: Object };

  beforeEach(() => {
    pipe = new SanitizePipe();
  });

  it('should strip XSS script tags from string fields', () => {
    const result = pipe.transform(
      { customerNote: '<script>alert("xss")</script>Hello' },
      bodyMeta,
    );
    expect((result as Record<string, string>).customerNote).not.toContain(
      '<script>',
    );
    expect((result as Record<string, string>).customerNote).toContain('Hello');
  });

  it('should strip HTML from product description', () => {
    const result = pipe.transform(
      { description: '<img src=x onerror=alert(1)>Nice product' },
      bodyMeta,
    );
    expect((result as Record<string, string>).description).not.toContain(
      'onerror',
    );
    expect((result as Record<string, string>).description).toContain(
      'Nice product',
    );
  });

  it('should preserve plain text values unchanged', () => {
    const result = pipe.transform(
      { name: 'Electronics', description: 'Best electronics store' },
      bodyMeta,
    );
    expect((result as Record<string, string>).name).toBe('Electronics');
    expect((result as Record<string, string>).description).toBe(
      'Best electronics store',
    );
  });

  it('should sanitize strings inside nested arrays', () => {
    const result = pipe.transform(
      {
        items: [
          { productId: 'uuid-1', quantity: 2 },
          { productId: '<script>bad</script>', quantity: 1 },
        ],
      },
      bodyMeta,
    );
    const items = (result as Record<string, unknown[]>).items;
    expect((items[1] as Record<string, string>).productId).not.toContain(
      '<script>',
    );
  });

  it('should not modify non-body metadata types', () => {
    const queryMeta: ArgumentMetadata = { type: 'query', metatype: Object };
    const input = { search: '<script>xss</script>' };
    const result = pipe.transform(input, queryMeta);
    expect(result).toBe(input);
  });

  it('should pass non-string, non-object values through unchanged', () => {
    const result = pipe.transform({ price: 99.99, isActive: true }, bodyMeta);
    expect((result as Record<string, unknown>).price).toBe(99.99);
    expect((result as Record<string, unknown>).isActive).toBe(true);
  });

  it('should handle null values without throwing', () => {
    const result = pipe.transform({ note: null }, bodyMeta);
    expect((result as Record<string, unknown>).note).toBeNull();
  });
});
