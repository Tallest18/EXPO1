export interface FinancialSummary {
  totalProfit: number;
  totalRevenue: number;
  totalExpenses: number;
}

export interface DailySummary {
  revenue: number;
  profit: number;
  sales: number;
  orders: number;
  date: string;
}

export interface TopProduct {
  name: string;
  quantity: number;
  revenue: number;
  imageUrl: string;
  profit: number;
}

export interface SlowMovingProduct {
  name: string;
  daysInStock: number;
  quantity: number;
  imageUrl: string;
}

export interface StockRecommendation {
  type: "warning" | "info" | "success";
  icon: string;
  message: string;
  detail: string;
}

export interface SeasonalInsight {
  month: string;
  label: string;
  performance: string;
  description: string;
}

export interface MonthlyReport {
  month: string;
  totalSales: number;
  totalCost: number;
  totalProfit: number;
}

export interface ChartData {
  labels: string[];
  datasets: {
    data: number[];
    color: (opacity?: number) => string;
    strokeWidth: number;
  }[];
}

export type Period = "Today" | "Week" | "Month";
