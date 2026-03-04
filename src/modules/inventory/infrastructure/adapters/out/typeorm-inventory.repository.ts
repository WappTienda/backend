import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Inventory } from '../../entities/inventory.entity';
import { InventoryMapper } from '../../mappers/inventory.mapper';
import { InventoryModel } from '../../../domain/models/inventory.model';
import {
  InventoryRepositoryPort,
  FindInventoryQuery,
  PaginatedInventory,
} from '../../../domain/ports/out/inventory-repository.port';

@Injectable()
export class TypeOrmInventoryRepository implements InventoryRepositoryPort {
  constructor(
    @InjectRepository(Inventory)
    private readonly inventoryRepository: Repository<Inventory>,
  ) {}

  async findAll(query: FindInventoryQuery): Promise<PaginatedInventory> {
    const { page = 1, limit = 10, productId } = query;

    const qb = this.inventoryRepository
      .createQueryBuilder('inventory')
      .leftJoinAndSelect('inventory.product', 'product');

    if (productId) {
      qb.andWhere('inventory.productId = :productId', { productId });
    }

    qb.orderBy('inventory.createdAt', 'DESC');
    qb.skip((page - 1) * limit).take(limit);

    const [entities, total] = await qb.getManyAndCount();

    return {
      data: entities.map((entity) => InventoryMapper.toDomain(entity)),
      total,
    };
  }

  async findByProductId(productId: string): Promise<InventoryModel | null> {
    const entity = await this.inventoryRepository.findOne({
      where: { productId },
    });

    return entity ? InventoryMapper.toDomain(entity) : null;
  }

  async upsertForProduct(
    productId: string,
    stockQuantity: number,
  ): Promise<InventoryModel> {
    await this.inventoryRepository
      .createQueryBuilder()
      .insert()
      .into(Inventory)
      .values({ productId, stockQuantity, reservedQuantity: 0 })
      .orUpdate(['stockQuantity'], ['productId'])
      .execute();

    const entity = await this.inventoryRepository.findOneOrFail({
      where: { productId },
    });

    return InventoryMapper.toDomain(entity);
  }

  async adjustStock(productId: string, delta: number): Promise<InventoryModel> {
    await this.inventoryRepository
      .createQueryBuilder()
      .update(Inventory)
      .set({ stockQuantity: () => '"stockQuantity" + :delta' })
      .where('"productId" = :productId', { productId, delta })
      .execute();

    const entity = await this.inventoryRepository.findOneOrFail({
      where: { productId },
    });

    return InventoryMapper.toDomain(entity);
  }

  async syncStock(
    productId: string,
    newStockQuantity: number,
  ): Promise<InventoryModel> {
    await this.inventoryRepository
      .createQueryBuilder()
      .update(Inventory)
      .set({ stockQuantity: newStockQuantity })
      .where('"productId" = :productId', { productId })
      .execute();

    const entity = await this.inventoryRepository.findOneOrFail({
      where: { productId },
    });

    return InventoryMapper.toDomain(entity);
  }
}
