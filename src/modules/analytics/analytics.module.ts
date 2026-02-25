import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from '../orders/infrastructure/entities/order.entity';
import { Product } from '../products/infrastructure/entities/product.entity';
import { Customer } from '../customers/infrastructure/entities/customer.entity';
import { AnalyticsService } from './domain/services/analytics-domain.service';
import { AnalyticsController } from './infrastructure/adapters/in/analytics.controller';
import { ANALYTICS_REPOSITORY } from './domain/ports/out/analytics-repository.port';
import { TypeOrmAnalyticsRepository } from './infrastructure/adapters/out/typeorm-analytics.repository';

@Module({
  imports: [TypeOrmModule.forFeature([Order, Product, Customer])],
  providers: [
    AnalyticsService,
    {
      provide: ANALYTICS_REPOSITORY,
      useClass: TypeOrmAnalyticsRepository,
    },
  ],
  controllers: [AnalyticsController],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}
