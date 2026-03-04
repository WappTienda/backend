import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Inventory } from './infrastructure/entities/inventory.entity';
import { InventoryService } from './domain/services/inventory-domain.service';
import { InventoryController } from './infrastructure/adapters/in/inventory.controller';
import { TypeOrmInventoryRepository } from './infrastructure/adapters/out/typeorm-inventory.repository';
import { INVENTORY_REPOSITORY } from './domain/ports/out/inventory-repository.port';

@Module({
  imports: [TypeOrmModule.forFeature([Inventory])],
  providers: [
    InventoryService,
    {
      provide: INVENTORY_REPOSITORY,
      useClass: TypeOrmInventoryRepository,
    },
  ],
  controllers: [InventoryController],
  exports: [InventoryService],
})
export class InventoryModule {}
