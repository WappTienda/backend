export interface DashboardStats {
  orders: {
    total: number;
    pending: number;
    confirmed: number;
    delivered: number;
    cancelled: number;
  };
  revenue: {
    total: number;
    today: number;
    thisWeek: number;
    thisMonth: number;
  };
  products: {
    total: number;
    visible: number;
    outOfStock: number;
  };
  customers: {
    total: number;
  };
}

export interface OrderStats {
  byStatus: Record<string, number>;
  byDate: { date: string; count: number; total: number }[];
}

export interface TopProduct {
  productId: string;
  productName: string;
  productSku: string;
  totalQuantity: number;
  totalRevenue: number;
}
