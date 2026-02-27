import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Customer } from './infrastructure/entities/customer.entity';
import { CustomersService } from './domain/services/customers-domain.service';
import { CustomersController } from './infrastructure/adapters/in/customers.controller';
import { TypeOrmCustomerRepository } from './infrastructure/adapters/out/typeorm-customer.repository';
import { CUSTOMER_REPOSITORY } from './domain/ports/out/customer-repository.port';

@Module({
  imports: [TypeOrmModule.forFeature([Customer])],
  providers: [
    CustomersService,
    {
      provide: CUSTOMER_REPOSITORY,
      useClass: TypeOrmCustomerRepository,
    },
  ],
  controllers: [CustomersController],
  exports: [CustomersService],
})
export class CustomersModule {}
