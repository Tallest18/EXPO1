import { Ionicons } from "@expo/vector-icons";
import Octicons from "@expo/vector-icons/Octicons";
import React from "react";
import {
  ActivityIndicator,
  Image,
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
import { styles } from "./FinanceSections.styles";
import { formatCurrency, formatDateLabel } from "./formatters";
import { H_PAD, moderateScale, scale, screenWidth } from "./scaling";
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
        <View
          style={[
            styles.changeIndicator,
            {
              backgroundColor: "#DCFCE7",
              paddingVertical: moderateScale(2),
              borderRadius: moderateScale(10),
              width: moderateScale(60),
            },
          ]}
        >
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
        <View
          style={[
            styles.changeIndicator,
            {
              backgroundColor: "#FFEDD4",
              paddingVertical: moderateScale(2),
              borderRadius: moderateScale(10),
              width: moderateScale(50),
            },
          ]}
        >
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
        <View
          style={[
            styles.changeIndicator,
            {
              backgroundColor: "#DCFCE7",
              paddingVertical: moderateScale(2),
              borderRadius: moderateScale(10),
              width: moderateScale(50),
            },
          ]}
        >
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
            style={{ ...styles.dailySummaryValue, color: "#1155CC" }}
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
              <Text style={styles.productRevenueLabel}>Profit</Text>
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
                  <View style={styles.slowStockBadge}>
                    <Ionicons
                      name="time-outline"
                      size={moderateScale(18)}
                      color="#FF6900"
                    />
                  </View>
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
            <View style={styles.recommendationIcon}>
              <Octicons name="light-bulb" size={20} color="black" />
            </View>
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
