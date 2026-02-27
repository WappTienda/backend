import {
  DashboardStats,
  OrderStats,
  TopProduct,
} from '../../models/analytics.model';

export const ANALYTICS_REPOSITORY = Symbol('ANALYTICS_REPOSITORY');

export interface AnalyticsRepositoryPort {
  getDashboardStats(): Promise<DashboardStats>;
  getOrderStats(days: number): Promise<OrderStats>;
  getTopProducts(limit: number): Promise<TopProduct[]>;
}
