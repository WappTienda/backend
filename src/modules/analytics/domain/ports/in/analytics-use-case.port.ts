import {
  DashboardStats,
  OrderStats,
  TopProduct,
} from '../../models/analytics.model';

export const ANALYTICS_USE_CASE = Symbol('ANALYTICS_USE_CASE');

export interface AnalyticsUseCasePort {
  getDashboard(): Promise<DashboardStats>;
  getOrderStats(days: number): Promise<OrderStats>;
  getTopProducts(limit: number): Promise<TopProduct[]>;
}
