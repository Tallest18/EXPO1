export interface FinancialSummary {
  totalSales: number;
  totalCost: number;
  totalProfit: number;
  totalSalesChange: number;
  totalCostChange: number;
  totalProfitChange: number;
}

export interface DailySummary {
  salesAmount: number;
  profit: number;
  transactions: number;
  itemsSold: number;
}

export interface TopProduct {
  product_id: string;
  product_name: string;
  image_url: string | null;
  units_sold: number;
  profit: number;
}

export interface SlowMovingProduct {
  product_id: string;
  product_name: string;
  image_url: string | null;
  units_sold: number;
  days_in_stock: number;
}

export interface StockRecommendation {
  type: string;
  icon: string;
  product_id?: string;
  product_name?: string;
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
  status?: string;
  totalSales: number;
  totalCost: number;
  totalProfit: number;
  pdfUrl?: string;
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
