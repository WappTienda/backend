import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Throttle, SkipThrottle } from '@nestjs/throttler';
import { OrdersService } from '../../../domain/services/orders-domain.service';
import { SettingsService } from '../../../../settings';
import {
  CreatePublicOrderDto,
  UpdateOrderDto,
  OrderQueryDto,
} from '../../../application/dto';
import { OrderModel } from '../../../domain/models/order.model';
import { Public } from '../../../../../common/decorators';
import { PaginatedResponseDto } from '../../../../../common/dto';

@ApiTags('Orders')
@SkipThrottle()
@Controller('orders')
export class OrdersController {
  constructor(
    private readonly ordersService: OrdersService,
    private readonly settingsService: SettingsService,
  ) {}

  @Get()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all orders (admin)' })
  @ApiResponse({ status: 200 })
  async findAll(
    @Query() query: OrderQueryDto,
  ): Promise<PaginatedResponseDto<OrderModel>> {
    return this.ordersService.findAll(query);
  }

  @Get(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get order by ID (admin)' })
  @ApiResponse({ status: 200 })
  @ApiResponse({ status: 404, description: 'Order not found' })
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<OrderModel> {
    return this.ordersService.findById(id);
  }

  @Public()
  @Get('public/:publicId')
  @ApiOperation({ summary: 'Get order by public ID (public)' })
  @ApiResponse({ status: 200 })
  @ApiResponse({ status: 404, description: 'Order not found' })
  async findByPublicId(@Param('publicId') publicId: string) {
    const order = await this.ordersService.findByPublicId(publicId);
    const businessPhone =
      await this.settingsService.getValue('businessWhatsApp');

    return {
      order: this.ordersService.getOrderSummary(order),
      whatsappLink: businessPhone
        ? this.ordersService.generateWhatsAppMessage(order, businessPhone)
        : null,
    };
  }

  @Public()
  @SkipThrottle({ default: false })
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('public')
  @ApiOperation({ summary: 'Create a new order (public)' })
  @ApiResponse({ status: 201 })
  @ApiResponse({ status: 400, description: 'Invalid order data' })
  async createPublic(@Body() dto: CreatePublicOrderDto) {
    const order = await this.ordersService.createPublicOrder(dto);
    const businessPhone =
      await this.settingsService.getValue('businessWhatsApp');

    return {
      order: this.ordersService.getOrderSummary(order),
      whatsappLink: businessPhone
        ? this.ordersService.generateWhatsAppMessage(order, businessPhone)
        : null,
    };
  }

  @Patch(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update order status/notes (admin)' })
  @ApiResponse({ status: 200 })
  @ApiResponse({ status: 404, description: 'Order not found' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateOrderDto,
  ): Promise<OrderModel> {
    return this.ordersService.update(id, dto);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete an order (admin)' })
  @ApiResponse({ status: 204, description: 'Order deleted' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  async delete(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.ordersService.delete(id);
  }
}
