import { ApiProperty } from '@nestjs/swagger';

export class PaginationMeta {
  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;

  @ApiProperty()
  totalPages: number;

  @ApiProperty()
  hasNextPage: boolean;

  @ApiProperty()
  hasPrevPage: boolean;
}

export class PaginatedResponseDto<T> {
  data: T[];

  @ApiProperty({ type: PaginationMeta })
  meta: PaginationMeta;

  constructor(data: T[], total: number, page: number, limit: number) {
    this.data = data;
    const totalPages = Math.ceil(total / limit);
    this.meta = {
      total,
      page,
      limit,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    };
  }
}
