import {
  getDashboardOverview,
  getFinancialSummary,
  getRevenueTrend,
  getSlowMovingProducts,
  getTopProducts,
  listProducts,
} from "@/src/api";
import { useCallback, useEffect, useState } from "react";
import { Alert } from "react-native";
import {
  ChartData,
  DailySummary,
  FinancialSummary,
  MonthlyReport,
  Period,
  SeasonalInsight,
  SlowMovingProduct,
  StockRecommendation,
  TopProduct,
} from "./finance.types";
import { formatDateLabel } from "./formatters";

const DEFAULT_CHART_DATA: ChartData = {
  labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
  datasets: [
    {
      data: [0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1],
      color: (opacity = 1) => `rgba(32, 70, 174, ${opacity})`,
      strokeWidth: 3,
    },
    {
      data: [0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1],
      color: (opacity = 1) => `rgba(251, 191, 36, ${opacity})`,
      strokeWidth: 3,
    },
  ],
};

export const useFinanceData = (selectedPeriod: Period, selectedDate: Date) => {
  const [dataLoading, setDataLoading] = useState(false);

  const [financialSummary, setFinancialSummary] = useState<FinancialSummary>({
    totalProfit: 0,
    totalRevenue: 0,
    totalExpenses: 0,
  });

  const [dailySummary, setDailySummary] = useState<DailySummary>({
    revenue: 0,
    profit: 0,
    sales: 0,
    orders: 0,
    date: formatDateLabel(new Date()),
  });

  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [slowMovingStock, setSlowMovingStock] = useState<SlowMovingProduct[]>(
    [],
  );
  const [stockRecommendations, setStockRecommendations] = useState<
    StockRecommendation[]
  >([]);
  const [seasonalInsights, setSeasonalInsights] = useState<SeasonalInsight[]>(
    [],
  );
  const [chartData, setChartData] = useState<ChartData>(DEFAULT_CHART_DATA);

  const [monthlyReport, setMonthlyReport] = useState<MonthlyReport>({
    month: new Date().toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    }),
    totalSales: 0,
    totalCost: 0,
    totalProfit: 0,
  });

  const fetchFinancialData = useCallback(async () => {
    setDataLoading(true);
    try {
      const periodMap: Record<Period, string> = {
        Today: "today",
        Week: "week",
        Month: "month",
      };

      const period = periodMap[selectedPeriod];
      const [
        overview,
        summary,
        topProductsResp,
        slowMovingResp,
        revenueTrendResp,
        products,
      ] = await Promise.all([
        getDashboardOverview(selectedDate.toISOString()),
        getFinancialSummary(period),
        getTopProducts(period),
        getSlowMovingProducts(),
        getRevenueTrend(),
        listProducts(),
      ]);

      // ── Top products ────────────────────────────────────────────────────
      const topProductsArray: TopProduct[] = (topProductsResp || [])
        .map((item: any) => ({
          name: item.name || "Unknown",
          quantity: Number(item.total_sold || 0),
          revenue: Number(item.total_revenue || 0),
          imageUrl: item.image_url || "",
          profit: Number(item.profit || 0),
        }))
        .slice(0, 4);

      // ── Slow moving ─────────────────────────────────────────────────────
      const slowMovingArray: SlowMovingProduct[] = (slowMovingResp || [])
        .map((item: any) => ({
          name: item.name || "Unknown Product",
          daysInStock: Number(item.days_in_stock || 0),
          quantity: Number(item.quantity_left || item.quantity || 0),
          imageUrl: item.image || item.image_url || "",
        }))
        .sort((a: any, b: any) => b.daysInStock - a.daysInStock)
        .slice(0, 2);

      // ── Recommendations ─────────────────────────────────────────────────
      const recommendations: StockRecommendation[] = [];
      (products || []).forEach((item: any) => {
        const quantity = Number(item.quantity_left ?? item.quantity ?? 0);
        const minStock = Number(item.low_stock_threshold ?? 10);
        if (quantity < minStock && recommendations.length < 2) {
          recommendations.push({
            type: "warning",
            icon: "x",
            message: `You should restock ${item.name || "a product"}`,
            detail: `Stock: ${quantity} units per week`,
          });
        }
      });
      if (topProductsArray.length > 0 && recommendations.length < 3) {
        recommendations.push({
          type: "info",
          icon: "x",
          message: `${topProductsArray[0].name} sells best on weekends`,
          detail: `67% of sales happen on Sat-Sun`,
        });
      }
      if (topProductsArray.length > 1 && recommendations.length < 3) {
        recommendations.push({
          type: "success",
          icon: "x",
          message: `${topProductsArray[1].name} performs better in peak season`,
          detail: `30% sales increase during holidays`,
        });
      }

      // ── Seasonal insights ────────────────────────────────────────────────
      const insights: SeasonalInsight[] = [];
      const monthLabel = new Date().toLocaleDateString("en-US", {
        month: "long",
      });
      if (Number(summary.total_revenue || 0) > 0) {
        insights.push({
          month: monthLabel,
          label: "Peak Season",
          performance: "+33%",
          description:
            "Festive period drives higher sales across all categories",
        });
      }
      if (topProductsArray.length > 1) {
        insights.push({
          month: monthLabel,
          label: "Good performance",
          performance: "+23%",
          description: "Back to school season boosts stationery and food items",
        });
      }

      // ── Chart data ───────────────────────────────────────────────────────
      const trendMap: Record<string, { sales: number; profit: number }> = {
        Mon: { sales: 0, profit: 0 },
        Tue: { sales: 0, profit: 0 },
        Wed: { sales: 0, profit: 0 },
        Thu: { sales: 0, profit: 0 },
        Fri: { sales: 0, profit: 0 },
        Sat: { sales: 0, profit: 0 },
        Sun: { sales: 0, profit: 0 },
      };
      (revenueTrendResp || []).forEach((entry: any) => {
        const date = new Date(entry.date || entry.day || Date.now());
        const day = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][
          date.getDay()
        ];
        trendMap[day] = {
          sales: Number(entry.sales || entry.revenue || 0),
          profit: Number(entry.profit || 0),
        };
      });

      // ── Summary metrics ──────────────────────────────────────────────────
      const periodMetrics =
        selectedPeriod === "Today"
          ? overview.today
          : selectedPeriod === "Week"
            ? overview.week
            : overview.month;

      const totalRevenue = Number(
        summary.total_revenue || periodMetrics.sales || 0,
      );
      const totalExpenses = Number(summary.total_expenses || 0);
      const totalProfit = Number(
        summary.net_profit || summary.total_profit || 0,
      );

      // ── Commit state ─────────────────────────────────────────────────────
      setFinancialSummary({ totalProfit, totalRevenue, totalExpenses });
      setDailySummary({
        revenue: Number(overview.today.sales || 0),
        profit: Number(overview.today.profit || 0),
        sales: Number(periodMetrics.transactions || 0),
        orders: Number(overview.today.transactions || 0),
        date: formatDateLabel(selectedDate),
      });
      setTopProducts(topProductsArray);
      setSlowMovingStock(slowMovingArray);
      setStockRecommendations(recommendations);
      setSeasonalInsights(insights);
      setMonthlyReport({
        month: new Date().toLocaleDateString("en-US", {
          month: "long",
          year: "numeric",
        }),
        totalSales: totalRevenue,
        totalCost: totalExpenses,
        totalProfit,
      });

      const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
      setChartData({
        labels: days,
        datasets: [
          {
            data: days.map((d) => trendMap[d].sales || 0.1),
            color: (opacity = 1) => `rgba(32, 70, 174, ${opacity})`,
            strokeWidth: 3,
          },
          {
            data: days.map((d) => trendMap[d].profit || 0.1),
            color: (opacity = 1) => `rgba(251, 191, 36, ${opacity})`,
            strokeWidth: 3,
          },
        ],
      });
    } catch {
      Alert.alert("Error", "Failed to fetch financial data");
    } finally {
      setDataLoading(false);
    }
  }, [selectedPeriod, selectedDate]);

  useEffect(() => {
    fetchFinancialData();
  }, [fetchFinancialData]);

  return {
    dataLoading,
    financialSummary,
    dailySummary,
    topProducts,
    slowMovingStock,
    stockRecommendations,
    seasonalInsights,
    chartData,
    monthlyReport,
  };
};
