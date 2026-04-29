import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import { SafeAreaView } from "react-native-safe-area-context";
import { styles } from "./Finance.styles";

import { Period } from "./finance.types";
import {
  DailySummaryCard,
  MonthlyReportCard,
  SalesTrendChart,
  SeasonalInsightsSection,
  SlowMovingStockSection,
  StockRecommendationsSection,
  SummaryCards,
  TopProductsSection,
} from "./FinanceSections";
import { verticalScale } from "./scaling";
import { useFinanceData } from "./useFinanceData";
import { usePdfReport } from "./usePdfReport";

const Finance = () => {
  const [selectedPeriod, setSelectedPeriod] = useState<Period>("Week");
  const [isDatePickerVisible, setIsDatePickerVisible] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  const showDatePicker = useCallback(() => setIsDatePickerVisible(true), []);
  const hideDatePicker = useCallback(() => setIsDatePickerVisible(false), []);
  const handleDateConfirm = useCallback((date: Date) => {
    setSelectedDate(date);
    setIsDatePickerVisible(false);
  }, []);

  const {
    dataLoading,
    financialSummary,
    dailySummary,
    topProducts,
    slowMovingStock,
    stockRecommendations,
    seasonalInsights,
    chartData,
    monthlyReport,
  } = useFinanceData(selectedPeriod, selectedDate);

  const { pdfLoading, generatePDFReport } = usePdfReport({
    monthlyReport,
    financialSummary,
    topProducts,
    slowMovingStock,
    stockRecommendations,
  });

  return (
    // FIX: Plain View as root so we control stacking ourselves.
    // SafeAreaView moves inside — it only wraps content, not the picker.
    <View style={styles.root}>
      <SafeAreaView style={styles.container}>
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Financial Central</Text>
            <Text style={styles.headerSubtitle}>
              See how your business is performing
            </Text>
          </View>

          {/* Period Selector */}
          <View style={styles.periodSelector}>
            {(["Today", "Week", "Month"] as const).map((p) => (
              <TouchableOpacity
                key={p}
                style={[
                  styles.periodButton,
                  selectedPeriod === p && styles.periodButtonActive,
                ]}
                onPress={() => setSelectedPeriod(p)}
              >
                <Text
                  style={[
                    styles.periodText,
                    selectedPeriod === p && styles.periodTextActive,
                  ]}
                >
                  {p}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <SummaryCards
            financialSummary={
              financialSummary || {
                totalProfit: 0,
                totalRevenue: 0,
                totalExpenses: 0,
              }
            }
          />

          <DailySummaryCard
            dailySummary={
              dailySummary || {
                revenue: 0,
                profit: 0,
                sales: 0,
                orders: 0,
                date: "-",
              }
            }
            selectedDate={selectedDate}
            onOpenDatePicker={showDatePicker}
          />

          <TopProductsSection topProducts={topProducts || []} />

          <SlowMovingStockSection slowMovingStock={slowMovingStock || []} />

          <StockRecommendationsSection
            stockRecommendations={stockRecommendations || []}
          />

          <SalesTrendChart
            chartData={
              chartData || {
                labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
                datasets: [
                  {
                    data: [0, 0, 0, 0, 0, 0, 0],
                    color: () => "#2046AE",
                    strokeWidth: 3,
                  },
                  {
                    data: [0, 0, 0, 0, 0, 0, 0],
                    color: () => "#FBBF24",
                    strokeWidth: 3,
                  },
                ],
              }
            }
          />

          <SeasonalInsightsSection seasonalInsights={seasonalInsights || []} />

          <MonthlyReportCard
            monthlyReport={
              monthlyReport || {
                month: "-",
                totalSales: 0,
                totalCost: 0,
                totalProfit: 0,
              }
            }
            pdfLoading={pdfLoading}
            onDownload={generatePDFReport}
          />

          <View style={{ height: verticalScale(40) }} />
        </ScrollView>

        {/*
          FIX: Overlay rendered AFTER ScrollView (paint order = on top)
          with no zIndex so it never forms a stacking context.
          pointerEvents="none" means it shows the spinner but swallows
          zero touches.
        */}
        {dataLoading && (
          <View style={styles.loadingOverlay} pointerEvents="none">
            <ActivityIndicator size="large" color="#1155CC" />
            <Text style={styles.loadingText}>Loading financial data...</Text>
          </View>
        )}
      </SafeAreaView>

      {/*
        FIX: DateTimePickerModal lives OUTSIDE SafeAreaView as a sibling
        of the entire content tree. No zIndex from any child can ever
        block it. Always mounted so the native modal layer is never torn
        down mid-gesture.
      */}
      <DateTimePickerModal
        isVisible={isDatePickerVisible}
        mode="date"
        date={selectedDate}
        onConfirm={handleDateConfirm}
        onCancel={hideDatePicker}
        maximumDate={new Date()}
        display="default"
        themeVariant="light"
        accentColor="#1155CC"
        confirmTextIOS="Apply"
        cancelTextIOS="Cancel"
      />
    </View>
  );
};

export default Finance;
