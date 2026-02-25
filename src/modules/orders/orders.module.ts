import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from './infrastructure/entities/order.entity';
import { OrderItem } from './infrastructure/entities/order-item.entity';
import { OrdersService } from './domain/services/orders-domain.service';
import { OrdersController } from './infrastructure/adapters/in/orders.controller';
import { TypeOrmOrderRepository } from './infrastructure/adapters/out/typeorm-order.repository';
import { ORDER_REPOSITORY } from './domain/ports/out/order-repository.port';
import { CustomersModule } from '../customers/customers.module';
import { ProductsModule } from '../products/products.module';
import { SettingsModule } from '../settings/settings.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Order, OrderItem]),
    CustomersModule,
    ProductsModule,
    forwardRef(() => SettingsModule),
  ],
  providers: [
    OrdersService,
    {
      provide: ORDER_REPOSITORY,
      useClass: TypeOrmOrderRepository,
    },
  ],
  controllers: [OrdersController],
  exports: [OrdersService],
})
export class OrdersModule {}
