import { apiClient } from "./client";

export interface DashboardOverview {
  total_products: number;
  total_inventory_value: number;
  today: {
    sales: number;
    profit: number;
    transactions: number;
  };
  week: {
    sales: number;
    profit: number;
    transactions: number;
  };
  month: {
    sales: number;
    profit: number;
    transactions: number;
  };
  all_time: {
    sales: number;
    profit: number;
    transactions: number;
  };
}

export interface FinancialSummary {
  period: string;
  total_revenue: number;
  total_profit: number;
  total_expenses: number;
  net_profit: number;
}

export async function getDashboardOverview(): Promise<DashboardOverview> {
  const response = await apiClient.get<DashboardOverview>(
    "/products/dashboard/overview/",
  );
  return response.data;
}

export async function getTopProducts(period = "month"): Promise<any[]> {
  const response = await apiClient.get<any[]>(
    "/products/analytics/top-products/",
    {
      params: { period },
    },
  );
  return response.data;
}

export async function getSlowMovingProducts(): Promise<any[]> {
  const response = await apiClient.get<any[]>(
    "/products/analytics/slow-moving/",
  );
  return response.data;
}

export async function getRevenueTrend(days = 7): Promise<any[]> {
  const response = await apiClient.get<any[]>(
    "/products/analytics/revenue-trend/",
    {
      params: { days },
    },
  );
  return response.data;
}

export async function getFinancialSummary(
  period = "month",
): Promise<FinancialSummary> {
  const response = await apiClient.get<FinancialSummary>(
    "/products/analytics/financial-summary/",
    { params: { period } },
  );
  return response.data;
}
