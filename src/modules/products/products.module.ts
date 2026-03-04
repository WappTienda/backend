import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from './infrastructure/entities/product.entity';
import { ProductImage } from './infrastructure/entities/product-image.entity';
import { ProductsService } from './domain/services/products-domain.service';
import { ProductsController } from './infrastructure/adapters/in/products.controller';
import { TypeOrmProductRepository } from './infrastructure/adapters/out/typeorm-product.repository';
import { PRODUCT_REPOSITORY } from './domain/ports/out/product-repository.port';
import { CategoriesModule } from '../categories/categories.module';

@Module({
  imports: [TypeOrmModule.forFeature([Product, ProductImage]), CategoriesModule],
  providers: [
    ProductsService,
    {
      provide: PRODUCT_REPOSITORY,
      useClass: TypeOrmProductRepository,
    },
  ],
  controllers: [ProductsController],
  exports: [ProductsService],
})
export class ProductsModule {}
