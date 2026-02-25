import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Category } from './infrastructure/entities/category.entity';
import { CategoriesService } from './domain/services/categories-domain.service';
import { CategoriesController } from './infrastructure/adapters/in/categories.controller';
import { TypeOrmCategoryRepository } from './infrastructure/adapters/out/typeorm-category.repository';
import { CATEGORY_REPOSITORY } from './domain/ports/out/category-repository.port';

@Module({
  imports: [TypeOrmModule.forFeature([Category])],
  providers: [
    CategoriesService,
    {
      provide: CATEGORY_REPOSITORY,
      useClass: TypeOrmCategoryRepository,
    },
  ],
  controllers: [CategoriesController],
  exports: [CategoriesService],
})
export class CategoriesModule {}
