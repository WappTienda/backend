import { Controller, Get, Query } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import {
  AnalyticsService,
  DashboardStats,
  OrderStats,
  TopProduct,
} from './analytics.service';

@ApiTags('Analytics')
@Controller('analytics')
@ApiBearerAuth()
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Get dashboard statistics' })
  @ApiResponse({ status: 200 })
  async getDashboard(): Promise<DashboardStats> {
    return this.analyticsService.getDashboard();
  }

  @Get('orders')
  @ApiOperation({ summary: 'Get order statistics' })
  @ApiQuery({ name: 'days', required: false, type: Number })
  @ApiResponse({ status: 200 })
  async getOrderStats(@Query('days') days?: number): Promise<OrderStats> {
    return this.analyticsService.getOrderStats(days || 30);
  }

  @Get('products')
  @ApiOperation({ summary: 'Get top selling products' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200 })
  async getTopProducts(@Query('limit') limit?: number): Promise<TopProduct[]> {
    return this.analyticsService.getTopProducts(limit || 10);
  }
}
