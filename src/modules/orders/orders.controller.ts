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
import { OrdersService } from './orders.service';
import { SettingsService } from '../settings/settings.service';
import { CreatePublicOrderDto, UpdateOrderDto, OrderQueryDto } from './dto';
import { Order } from './entities/order.entity';
import { Public } from '../../common/decorators';
import { PaginatedResponseDto } from '../../common/dto';

@ApiTags('Orders')
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
  ): Promise<PaginatedResponseDto<Order>> {
    return this.ordersService.findAll(query);
  }

  @Get(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get order by ID (admin)' })
  @ApiResponse({ status: 200, type: Order })
  @ApiResponse({ status: 404, description: 'Order not found' })
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<Order> {
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
  @ApiResponse({ status: 200, type: Order })
  @ApiResponse({ status: 404, description: 'Order not found' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateOrderDto,
  ): Promise<Order> {
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
