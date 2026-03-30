import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  ActivityIndicator,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { LineChart } from "react-native-chart-kit";
import {
  ChartData,
  DailySummary,
  FinancialSummary,
  MonthlyReport,
  SeasonalInsight,
  SlowMovingProduct,
  StockRecommendation,
  TopProduct,
} from "./finance.types";
import { formatCurrency, formatDateLabel } from "./formatters";
import {
  getFontSize,
  H_PAD,
  isSmallDevice,
  moderateScale,
  scale,
  screenWidth,
  verticalScale,
} from "./scaling";
// import { getFontSize } from "./scaling";

// ─── Summary Cards ────────────────────────────────────────────────────────────

interface SummaryCardsProps {
  financialSummary: FinancialSummary;
}

export const SummaryCards: React.FC<SummaryCardsProps> = ({
  financialSummary,
}) => (
  <View style={styles.summaryContainer}>
    <View style={styles.summaryRow}>
      <View style={[styles.summaryCard, styles.profitCard]}>
        <Text style={styles.summaryLabel}>Total Sales</Text>
        <Text
          style={styles.summaryValue}
          numberOfLines={1}
          adjustsFontSizeToFit
        >
          {formatCurrency(financialSummary.totalProfit)}
        </Text>
        <View style={styles.changeIndicator}>
          <Ionicons
            name={
              financialSummary.totalProfit >= 0
                ? "trending-up"
                : "trending-down"
            }
            size={moderateScale(11)}
            color={financialSummary.totalProfit >= 0 ? "#10B981" : "#EF4444"}
          />
          <Text
            style={[
              styles.changeText,
              {
                color:
                  financialSummary.totalProfit >= 0 ? "#10B981" : "#EF4444",
              },
            ]}
          >
            {financialSummary.totalProfit >= 0 ? "+" : ""}
            {(
              (financialSummary.totalProfit /
                (financialSummary.totalRevenue || 1)) *
              100
            ).toFixed(0)}
            %
          </Text>
        </View>
      </View>

      <View style={[styles.summaryCard, styles.revenueCard]}>
        <Text style={styles.summaryLabel}>Total Cost</Text>
        <Text
          style={styles.summaryValue}
          numberOfLines={1}
          adjustsFontSizeToFit
        >
          {formatCurrency(financialSummary.totalRevenue)}
        </Text>
        <View style={styles.changeIndicator}>
          <Ionicons
            name="trending-down"
            size={moderateScale(11)}
            color="#EF4444"
          />
          <Text style={[styles.changeText, { color: "#EF4444" }]}>-5%</Text>
        </View>
      </View>

      <View style={[styles.summaryCard, styles.expenseCard]}>
        <Text style={styles.summaryLabel}>Total Profit</Text>
        <Text
          style={styles.summaryValue}
          numberOfLines={1}
          adjustsFontSizeToFit
        >
          {formatCurrency(financialSummary.totalExpenses)}
        </Text>
        <View style={styles.changeIndicator}>
          <Ionicons
            name="trending-up"
            size={moderateScale(11)}
            color="#10B981"
          />
          <Text style={[styles.changeText, { color: "#10B981" }]}>+8%</Text>
        </View>
      </View>
    </View>
  </View>
);

// ─── Daily Summary ────────────────────────────────────────────────────────────

interface DailySummaryCardProps {
  dailySummary: DailySummary;
  selectedDate: Date;
  onOpenDatePicker: () => void;
}

export const DailySummaryCard: React.FC<DailySummaryCardProps> = ({
  dailySummary,
  selectedDate,
  onOpenDatePicker,
}) => (
  <View style={styles.section}>
    <View style={styles.dailySummaryHeader}>
      <Text style={styles.sectionTitle}>Daily Summary</Text>
      <TouchableOpacity
        style={styles.dateSelector}
        onPress={onOpenDatePicker}
        activeOpacity={0.7}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Ionicons
          name="calendar-outline"
          size={moderateScale(13)}
          color="#2046AE"
        />
        <Text style={styles.dateText}>{formatDateLabel(selectedDate)}</Text>
        <Ionicons
          name="chevron-down"
          size={moderateScale(13)}
          color="#2046AE"
        />
      </TouchableOpacity>
    </View>

    <View style={styles.dailySummaryCard}>
      <View style={styles.dailySummaryRow}>
        <View style={styles.dailySummaryItem}>
          <Text style={styles.dailySummaryLabel}>Sale Amount</Text>
          <Text
            style={styles.dailySummaryValue}
            numberOfLines={1}
            adjustsFontSizeToFit
          >
            {formatCurrency(dailySummary.revenue)}
          </Text>
        </View>
        <View style={styles.dailySummaryItem2}>
          <Text style={styles.dailySummaryLabel}>Profit</Text>
          <Text
            style={styles.dailySummaryValue}
            numberOfLines={1}
            adjustsFontSizeToFit
          >
            {formatCurrency(dailySummary.profit)}
          </Text>
        </View>
      </View>
      <View style={styles.dailySummaryRow}>
        <View style={styles.dailySummaryItem3}>
          <Text style={styles.dailySummaryLabel}>Transactions</Text>
          <Text style={styles.dailySummaryValue}>{dailySummary.sales}</Text>
        </View>
        <View style={styles.dailySummaryItem3}>
          <Text style={styles.dailySummaryLabel}>Items Sold</Text>
          <Text style={styles.dailySummaryValue}>{dailySummary.orders}</Text>
        </View>
      </View>
    </View>
  </View>
);

// ─── Top Products ─────────────────────────────────────────────────────────────

interface TopProductsProps {
  topProducts: TopProduct[];
}

export const TopProductsSection: React.FC<TopProductsProps> = ({
  topProducts,
}) => {
  if (topProducts.length === 0) return null;
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Top Performing Products</Text>
      <View style={styles.listContainer}>
        {topProducts.map((product, index) => (
          <View key={index} style={styles.productCard}>
            <View style={styles.productIcon}>
              {product.imageUrl ? (
                <Image
                  source={{ uri: product.imageUrl }}
                  style={styles.productImage}
                  resizeMode="cover"
                />
              ) : (
                <Ionicons
                  name="cube-outline"
                  size={moderateScale(20)}
                  color="#6B7280"
                />
              )}
            </View>
            <View style={styles.productInfo}>
              <Text style={styles.productName} numberOfLines={1}>
                {product.name}
              </Text>
              <Text style={styles.productQuantity}>
                Sold: {product.quantity} units
              </Text>
            </View>
            <View style={styles.productRevenue}>
              <Text
                style={styles.productRevenueText}
                numberOfLines={1}
                adjustsFontSizeToFit
              >
                {formatCurrency(product.profit)}
              </Text>
              <Text style={styles.productRevenueLabel}>profit</Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
};

// ─── Slow Moving Stock ────────────────────────────────────────────────────────

interface SlowMovingStockProps {
  slowMovingStock: SlowMovingProduct[];
}

export const SlowMovingStockSection: React.FC<SlowMovingStockProps> = ({
  slowMovingStock,
}) => {
  if (slowMovingStock.length === 0) return null;
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Slow Moving Stock</Text>
      <View style={styles.listContainer}>
        {slowMovingStock.map((item, index) => (
          <View key={index} style={styles.slowStockCard}>
            <View style={styles.slowStockLeft}>
              <View style={styles.slowStockIcon}>
                {item.imageUrl ? (
                  <Image
                    source={{ uri: item.imageUrl }}
                    style={styles.slowStockImage}
                    resizeMode="cover"
                  />
                ) : (
                  <Ionicons
                    name="time-outline"
                    size={moderateScale(17)}
                    color="#F59E0B"
                  />
                )}
              </View>
              <View style={styles.slowStockInfo}>
                <Text style={styles.slowStockName} numberOfLines={1}>
                  {item.name}
                </Text>
                <Text style={styles.slowStockDetail}>
                  {item.quantity} units left
                </Text>
              </View>
            </View>
            <View style={styles.slowStockBadge}>
              <Text style={styles.slowStockDays}>{item.daysInStock}d</Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
};

// ─── Stock Recommendations ────────────────────────────────────────────────────

interface StockRecommendationsProps {
  stockRecommendations: StockRecommendation[];
}

export const StockRecommendationsSection: React.FC<
  StockRecommendationsProps
> = ({ stockRecommendations }) => {
  if (stockRecommendations.length === 0) return null;
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Stock Recommendations</Text>
      <View style={styles.listContainer}>
        {stockRecommendations.map((rec, index) => (
          <View key={index} style={styles.recommendationCard}>
            <Text style={styles.recommendationEmoji}>{rec.icon}</Text>
            <View style={styles.recommendationContent}>
              <Text style={styles.recommendationMessage} numberOfLines={2}>
                {rec.message}
              </Text>
              <Text style={styles.recommendationDetail}>{rec.detail}</Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
};

// ─── Chart ────────────────────────────────────────────────────────────────────

interface SalesTrendChartProps {
  chartData: ChartData;
}

export const SalesTrendChart: React.FC<SalesTrendChartProps> = ({
  chartData,
}) => (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>Sales & Profit Trends</Text>
    <View style={styles.chartCard}>
      <View style={styles.chartLegend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: "#2046AE" }]} />
          <Text style={styles.legendText}>Sales</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: "#FBBF24" }]} />
          <Text style={styles.legendText}>Profit</Text>
        </View>
      </View>
      <LineChart
        data={chartData}
        width={screenWidth - H_PAD * 2 - scale(32)}
        height={220}
        chartConfig={{
          backgroundColor: "#ffffff",
          backgroundGradientFrom: "#ffffff",
          backgroundGradientTo: "#ffffff",
          decimalPlaces: 0,
          color: (opacity = 1) => `rgba(32, 70, 174, ${opacity})`,
          labelColor: (opacity = 1) => `rgba(107, 114, 128, ${opacity})`,
          style: { borderRadius: moderateScale(16) },
          propsForDots: { r: "5", strokeWidth: "2", stroke: "#fff" },
        }}
        bezier
        style={styles.chart}
        withInnerLines
        withOuterLines
        withVerticalLines={false}
        withHorizontalLines
      />
    </View>
  </View>
);

// ─── Seasonal Insights ────────────────────────────────────────────────────────

interface SeasonalInsightsProps {
  seasonalInsights: SeasonalInsight[];
}

export const SeasonalInsightsSection: React.FC<SeasonalInsightsProps> = ({
  seasonalInsights,
}) => {
  if (seasonalInsights.length === 0) return null;
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Seasonal Insights</Text>
      <View style={styles.listContainer}>
        {seasonalInsights.map((insight, index) => (
          <View key={index} style={styles.insightCard}>
            <View style={styles.insightHeader}>
              <Text style={styles.insightMonth}>{insight.month}</Text>
              <View style={styles.performanceBadge}>
                <Text style={styles.performanceText}>
                  {insight.performance}
                </Text>
              </View>
            </View>
            <Text style={styles.insightLabel}>{insight.label}</Text>
            <Text style={styles.insightDescription}>{insight.description}</Text>
          </View>
        ))}
      </View>
    </View>
  );
};

// ─── Monthly Report ───────────────────────────────────────────────────────────

interface MonthlyReportCardProps {
  monthlyReport: MonthlyReport;
  pdfLoading: boolean;
  onDownload: () => void;
}

export const MonthlyReportCard: React.FC<MonthlyReportCardProps> = ({
  monthlyReport,
  pdfLoading,
  onDownload,
}) => (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>Monthly Report</Text>
    <View style={styles.monthlyReportCard}>
      <View style={styles.monthlyReportHeader}>
        <Text style={styles.monthlyReportMonth} numberOfLines={1}>
          {monthlyReport.month}
        </Text>
        <View style={styles.readyBadge}>
          <Text style={styles.readyBadgeText}>Ready</Text>
        </View>
      </View>
      <Text style={styles.monthlyReportSubtitle}>
        Your monthly financial report is ready
      </Text>
      <View style={styles.monthlyReportStats}>
        {[
          { label: "Total Sales", value: monthlyReport.totalSales },
          { label: "Total Cost", value: monthlyReport.totalCost },
          { label: "Total Profit", value: monthlyReport.totalProfit },
        ].map((row) => (
          <View key={row.label} style={styles.monthlyReportStat}>
            <Text style={styles.monthlyReportStatLabel}>{row.label}</Text>
            <Text
              style={styles.monthlyReportStatValue}
              numberOfLines={1}
              adjustsFontSizeToFit
            >
              {formatCurrency(row.value)}
            </Text>
          </View>
        ))}
      </View>
      <TouchableOpacity
        style={styles.downloadButton}
        onPress={onDownload}
        disabled={pdfLoading}
      >
        {pdfLoading ? (
          <ActivityIndicator size="small" color="#FFFFFF" />
        ) : (
          <>
            <Ionicons
              name="download-outline"
              size={moderateScale(17)}
              color="#FFFFFF"
            />
            <Text style={styles.downloadButtonText}>Download Report (PDF)</Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  </View>
);

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  summaryContainer: {
    paddingHorizontal: H_PAD,
    marginBottom: verticalScale(14),
  },
  summaryRow: { flexDirection: "row", gap: scale(8) },
  summaryCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: moderateScale(12),
    padding: scale(isSmallDevice ? 8 : 12),
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  profitCard: { borderLeftWidth: 4, borderLeftColor: "#1155CC" },
  revenueCard: { borderLeftWidth: 4, borderLeftColor: "#D4183D" },
  expenseCard: { borderLeftWidth: 4, borderLeftColor: "#FFBA00" },
  summaryLabel: {
    fontSize: getFontSize(moderateScale(isSmallDevice ? 9 : 11)),
    color: "#6B7280",
    marginBottom: verticalScale(5),
    fontFamily: "DMSans_400Regular",
  },
  summaryValue: {
    fontSize: getFontSize(moderateScale(isSmallDevice ? 12 : 15)),
    color: "#1F2937",
    marginBottom: verticalScale(5),
    fontFamily: "DMSans_700Bold",
  },
  changeIndicator: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(3),
  },
  changeText: {
    fontSize: getFontSize(moderateScale(isSmallDevice ? 9 : 11)),
    fontFamily: "DMSans_600SemiBold",
  },

  section: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: scale(15),
    marginBottom: verticalScale(14),
    padding: scale(isSmallDevice ? 12 : 16),
    borderRadius: moderateScale(12),
  },
  sectionTitle: {
    fontSize: getFontSize(moderateScale(isSmallDevice ? 15 : 17)),
    color: "#1F2937",
    marginBottom: verticalScale(12),
    fontFamily: "DMSans_700Bold",
  },

  dailySummaryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: verticalScale(10),
  },
  dateSelector: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(5),
    backgroundColor: "#EEF2FF",
    paddingHorizontal: scale(10),
    paddingVertical: verticalScale(6),
    borderRadius: moderateScale(10),
    borderWidth: 1,
    borderColor: "#C7D2FE",
    zIndex: 10,
  },
  dateText: {
    fontSize: getFontSize(moderateScale(isSmallDevice ? 10 : 12)),
    color: "#2046AE",
    fontFamily: "DMSans_600SemiBold",
  },
  dailySummaryCard: { gap: scale(10) },
  dailySummaryRow: { flexDirection: "row", gap: scale(10) },
  dailySummaryItem: {
    flex: 1,
    backgroundColor: "#1155CC0D",
    padding: scale(10),
    borderRadius: moderateScale(10),
  },
  dailySummaryItem2: {
    flex: 1,
    backgroundColor: "#FFBA001A",
    padding: scale(10),
    borderRadius: moderateScale(10),
  },
  dailySummaryItem3: {
    flex: 1,
    backgroundColor: "#ECECF0",
    padding: scale(10),
    borderRadius: moderateScale(10),
  },
  dailySummaryLabel: {
    fontSize: getFontSize(moderateScale(isSmallDevice ? 10 : 12)),
    color: "#6B7280",
    marginBottom: verticalScale(4),
    fontFamily: "DMSans_400Regular",
  },
  dailySummaryValue: {
    fontSize: getFontSize(moderateScale(isSmallDevice ? 15 : 18)),
    color: "#1F2937",
    fontFamily: "DMSans_700Bold",
  },

  listContainer: { gap: scale(10) },
  productCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    borderRadius: moderateScale(10),
    padding: scale(10),
    gap: scale(10),
  },
  productIcon: {
    width: scale(42),
    height: scale(42),
    backgroundColor: "#FFBA0033",
    borderRadius: moderateScale(21),
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  productImage: {
    width: scale(42),
    height: scale(42),
    borderRadius: moderateScale(21),
  },
  productInfo: { flex: 1 },
  productName: {
    fontSize: getFontSize(moderateScale(isSmallDevice ? 12 : 14)),
    color: "#1F2937",
    marginBottom: verticalScale(3),
    fontFamily: "DMSans_600SemiBold",
  },
  productQuantity: {
    fontSize: getFontSize(moderateScale(isSmallDevice ? 10 : 12)),
    color: "#6B7280",
    fontFamily: "DMSans_400Regular",
  },
  productRevenue: { alignItems: "flex-end" },
  productRevenueText: {
    fontSize: getFontSize(moderateScale(isSmallDevice ? 13 : 15)),
    color: "#1F2937",
    fontFamily: "DMSans_700Bold",
  },
  productRevenueLabel: {
    fontSize: getFontSize(moderateScale(isSmallDevice ? 10 : 11)),
    color: "#6B7280",
    fontFamily: "DMSans_400Regular",
  },

  slowStockCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#FFFBEB",
    borderRadius: moderateScale(10),
    padding: scale(12),
    borderWidth: 1,
    borderColor: "#FEF3C7",
  },
  slowStockLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(10),
    flex: 1,
  },
  slowStockIcon: {
    width: scale(36),
    height: scale(36),
    backgroundColor: "#FEF3C7",
    borderRadius: moderateScale(18),
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  slowStockImage: {
    width: scale(36),
    height: scale(36),
    borderRadius: moderateScale(18),
  },
  slowStockInfo: { flex: 1 },
  slowStockName: {
    fontSize: getFontSize(moderateScale(isSmallDevice ? 12 : 14)),
    color: "#1F2937",
    marginBottom: verticalScale(2),
    fontFamily: "DMSans_600SemiBold",
  },
  slowStockDetail: {
    fontSize: getFontSize(moderateScale(isSmallDevice ? 10 : 12)),
    color: "#6B7280",
    fontFamily: "DMSans_400Regular",
  },
  slowStockBadge: {
    backgroundColor: "#FEF3C7",
    paddingHorizontal: scale(10),
    paddingVertical: verticalScale(5),
    borderRadius: moderateScale(10),
  },
  slowStockDays: {
    fontSize: getFontSize(moderateScale(isSmallDevice ? 11 : 13)),
    color: "#F59E0B",
    fontFamily: "DMSans_600SemiBold",
  },

  recommendationCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: moderateScale(10),
    borderLeftWidth: 4,
    borderLeftColor: "#1155CC",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    padding: scale(12),
    gap: scale(10),
  },
  recommendationEmoji: {
    fontSize: getFontSize(moderateScale(22)),
    fontFamily: "DMSans_400Regular",
  },
  recommendationContent: { flex: 1 },
  recommendationMessage: {
    fontSize: getFontSize(moderateScale(isSmallDevice ? 12 : 13)),
    color: "#1F2937",
    marginBottom: verticalScale(3),
    fontFamily: "DMSans_600SemiBold",
  },
  recommendationDetail: {
    fontSize: getFontSize(moderateScale(isSmallDevice ? 10 : 12)),
    color: "#6B7280",
    fontFamily: "DMSans_400Regular",
  },

  chartCard: {
    backgroundColor: "#F9FAFB",
    borderRadius: moderateScale(12),
    padding: scale(12),
    alignItems: "center",
  },
  chartLegend: {
    flexDirection: "row",
    gap: scale(16),
    marginBottom: verticalScale(10),
    alignSelf: "flex-start",
  },
  legendItem: { flexDirection: "row", alignItems: "center", gap: scale(6) },
  legendDot: {
    width: scale(10),
    height: scale(10),
    borderRadius: moderateScale(5),
  },
  legendText: {
    fontSize: getFontSize(moderateScale(isSmallDevice ? 11 : 13)),
    color: "#6B7280",
    fontFamily: "DMSans_400Regular",
  },
  chart: { borderRadius: moderateScale(12) },

  insightCard: {
    backgroundColor: "#F9FAFB",
    borderRadius: moderateScale(10),
    padding: scale(12),
  },
  insightHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: verticalScale(6),
  },
  insightMonth: {
    fontSize: getFontSize(moderateScale(isSmallDevice ? 13 : 15)),
    color: "#1F2937",
    fontFamily: "DMSans_700Bold",
  },
  performanceBadge: {
    backgroundColor: "#D1FAE5",
    paddingHorizontal: scale(8),
    paddingVertical: verticalScale(3),
    borderRadius: moderateScale(10),
  },
  performanceText: {
    fontSize: getFontSize(moderateScale(isSmallDevice ? 11 : 12)),
    color: "#10B981",
    fontFamily: "DMSans_600SemiBold",
  },
  insightLabel: {
    fontSize: getFontSize(moderateScale(isSmallDevice ? 11 : 13)),
    color: "#6B7280",
    marginBottom: verticalScale(4),
    fontFamily: "DMSans_400Regular",
  },
  insightDescription: {
    fontSize: getFontSize(moderateScale(isSmallDevice ? 10 : 12)),
    color: "#9CA3AF",
    lineHeight: getFontSize(moderateScale(18)),
    fontFamily: "DMSans_400Regular",
  },

  monthlyReportCard: {
    backgroundColor: "#F9FAFB",
    borderRadius: moderateScale(12),
    padding: scale(isSmallDevice ? 12 : 16),
  },
  monthlyReportHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: verticalScale(6),
  },
  monthlyReportMonth: {
    fontSize: getFontSize(moderateScale(isSmallDevice ? 13 : 15)),
    color: "#1F2937",
    fontFamily: "DMSans_700Bold",
    flexShrink: 1,
    marginRight: scale(8),
  },
  readyBadge: {
    backgroundColor: "#D1FAE5",
    paddingHorizontal: scale(8),
    paddingVertical: verticalScale(3),
    borderRadius: moderateScale(10),
  },
  readyBadgeText: {
    fontSize: getFontSize(moderateScale(isSmallDevice ? 11 : 12)),
    color: "#10B981",
    fontFamily: "DMSans_600SemiBold",
  },
  monthlyReportSubtitle: {
    fontSize: getFontSize(moderateScale(isSmallDevice ? 11 : 13)),
    color: "#6B7280",
    marginBottom: verticalScale(14),
    fontFamily: "DMSans_400Regular",
  },
  monthlyReportStats: { gap: scale(10), marginBottom: verticalScale(16) },
  monthlyReportStat: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  monthlyReportStatLabel: {
    fontSize: getFontSize(moderateScale(isSmallDevice ? 12 : 14)),
    color: "#6B7280",
    fontFamily: "DMSans_400Regular",
  },
  monthlyReportStatValue: {
    fontSize: getFontSize(moderateScale(isSmallDevice ? 13 : 15)),
    color: "#1F2937",
    fontFamily: "DMSans_700Bold",
  },
  downloadButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#2046AE",
    paddingVertical: verticalScale(13),
    borderRadius: moderateScale(50),
    gap: scale(8),
  },
  downloadButtonText: {
    fontSize: getFontSize(moderateScale(isSmallDevice ? 13 : 15)),
    color: "#FFFFFF",
    fontFamily: "DMSans_600SemiBold",
  },
});
