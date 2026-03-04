import { InventoryModel } from '../../models/inventory.model';
import { AdjustStockDto, InventoryQueryDto } from '../../../application/dto';
import { PaginatedResponseDto } from '../../../../../common/dto';

export const INVENTORY_USE_CASE = Symbol('INVENTORY_USE_CASE');

export interface InventoryUseCasePort {
  findAll(
    query: InventoryQueryDto,
  ): Promise<PaginatedResponseDto<InventoryModel>>;
  findByProductId(productId: string): Promise<InventoryModel>;
  adjustStock(productId: string, dto: AdjustStockDto): Promise<InventoryModel>;
  initializeForProduct(
    productId: string,
    stockQuantity: number,
  ): Promise<InventoryModel>;
  syncStockForProduct(
    productId: string,
    newStockQuantity: number,
  ): Promise<InventoryModel>;
}
