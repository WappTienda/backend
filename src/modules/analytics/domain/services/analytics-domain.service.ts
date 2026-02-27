import { Injectable, Inject } from '@nestjs/common';
import {
  DashboardStats,
  OrderStats,
  TopProduct,
} from '../models/analytics.model';
import {
  ANALYTICS_REPOSITORY,
  AnalyticsRepositoryPort,
} from '../ports/out/analytics-repository.port';
import { AnalyticsUseCasePort } from '../ports/in/analytics-use-case.port';

@Injectable()
export class AnalyticsService implements AnalyticsUseCasePort {
  constructor(
    @Inject(ANALYTICS_REPOSITORY)
    private readonly analyticsRepository: AnalyticsRepositoryPort,
  ) {}

  async getDashboard(): Promise<DashboardStats> {
    return this.analyticsRepository.getDashboardStats();
  }

  async getOrderStats(days = 30): Promise<OrderStats> {
    return this.analyticsRepository.getOrderStats(days);
  }

  async getTopProducts(limit = 10): Promise<TopProduct[]> {
    return this.analyticsRepository.getTopProducts(limit);
  }
}
