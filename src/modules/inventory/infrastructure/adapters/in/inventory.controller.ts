import {
  Controller,
  Get,
  Patch,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { InventoryService } from '../../../domain/services/inventory-domain.service';
import { AdjustStockDto, InventoryQueryDto } from '../../../application/dto';
import { InventoryModel } from '../../../domain/models/inventory.model';
import { PaginatedResponseDto } from '../../../../../common/dto';

@ApiTags('Inventory')
@ApiBearerAuth()
@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get()
  @ApiOperation({ summary: 'Get all inventory records (admin)' })
  @ApiResponse({ status: 200 })
  async findAll(
    @Query() query: InventoryQueryDto,
  ): Promise<PaginatedResponseDto<InventoryModel>> {
    return this.inventoryService.findAll(query);
  }

  @Get(':productId')
  @ApiOperation({ summary: 'Get inventory for a specific product (admin)' })
  @ApiResponse({ status: 200 })
  @ApiResponse({ status: 404, description: 'Inventory record not found' })
  async findOne(
    @Param('productId', ParseUUIDPipe) productId: string,
  ): Promise<InventoryModel> {
    return this.inventoryService.findByProductId(productId);
  }

  @Patch(':productId/adjust')
  @ApiOperation({ summary: 'Manually adjust stock for a product (admin)' })
  @ApiResponse({ status: 200 })
  @ApiResponse({ status: 404, description: 'Inventory record not found' })
  async adjustStock(
    @Param('productId', ParseUUIDPipe) productId: string,
    @Body() dto: AdjustStockDto,
  ): Promise<InventoryModel> {
    return this.inventoryService.adjustStock(productId, dto);
  }
}
