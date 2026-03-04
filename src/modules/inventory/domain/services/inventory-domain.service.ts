import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { InventoryModel } from '../models/inventory.model';
import {
  INVENTORY_REPOSITORY,
  InventoryRepositoryPort,
} from '../ports/out/inventory-repository.port';
import { InventoryUseCasePort } from '../ports/in/inventory-use-case.port';
import { AdjustStockDto, InventoryQueryDto } from '../../application/dto';
import { PaginatedResponseDto } from '../../../../common/dto';

@Injectable()
export class InventoryService implements InventoryUseCasePort {
  constructor(
    @Inject(INVENTORY_REPOSITORY)
    private readonly inventoryRepository: InventoryRepositoryPort,
  ) {}

  async findAll(
    query: InventoryQueryDto,
  ): Promise<PaginatedResponseDto<InventoryModel>> {
    const { page = 1, limit = 10 } = query;
    const { data, total } = await this.inventoryRepository.findAll(query);
    return new PaginatedResponseDto(data, total, page, limit);
  }

  async findByProductId(productId: string): Promise<InventoryModel> {
    const inventory =
      await this.inventoryRepository.findByProductId(productId);

    if (!inventory) {
      throw new NotFoundException(
        `Inventory record for product ${productId} not found`,
      );
    }

    return inventory;
  }

  async adjustStock(
    productId: string,
    dto: AdjustStockDto,
  ): Promise<InventoryModel> {
    await this.findByProductId(productId);
    return this.inventoryRepository.adjustStock(productId, dto.quantity);
  }

  async initializeForProduct(
    productId: string,
    stockQuantity: number,
  ): Promise<InventoryModel> {
    return this.inventoryRepository.upsertForProduct(productId, stockQuantity);
  }

  async syncStockForProduct(
    productId: string,
    newStockQuantity: number,
  ): Promise<InventoryModel> {
    await this.findByProductId(productId);
    return this.inventoryRepository.syncStock(productId, newStockQuantity);
  }
}
