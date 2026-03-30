import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import { SafeAreaView } from "react-native-safe-area-context";

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
import {
  getFontSize,
  H_PAD,
  isSmallDevice,
  isTablet,
  moderateScale,
  scale,
  verticalScale,
} from "./scaling";
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

          <SummaryCards financialSummary={financialSummary} />

          <DailySummaryCard
            dailySummary={dailySummary}
            selectedDate={selectedDate}
            onOpenDatePicker={showDatePicker}
          />

          <TopProductsSection topProducts={topProducts} />

          <SlowMovingStockSection slowMovingStock={slowMovingStock} />

          <StockRecommendationsSection
            stockRecommendations={stockRecommendations}
          />

          <SalesTrendChart chartData={chartData} />

          <SeasonalInsightsSection seasonalInsights={seasonalInsights} />

          <MonthlyReportCard
            monthlyReport={monthlyReport}
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
            <ActivityIndicator size="large" color="#2046AE" />
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
        accentColor="#2046AE"
        confirmTextIOS="Apply"
        cancelTextIOS="Cancel"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#E7EEFA" },
  container: { flex: 1 },
  scrollView: { flex: 1 },

  loadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(231, 238, 250, 0.9)",
    // FIX: zIndex removed — rendered after ScrollView handles visual stacking.
    // Having zIndex here was creating a stacking context that trapped the
    // native date picker underneath it on Android.
  },
  loadingText: {
    marginTop: verticalScale(12),
    fontSize: getFontSize(moderateScale(14)),
    color: "#6B7280",
    fontFamily: "DMSans_400Regular",
  },

  header: {
    paddingHorizontal: H_PAD,
    paddingTop: verticalScale(isTablet ? 20 : 14),
    paddingBottom: verticalScale(12),
  },
  headerTitle: {
    fontSize: getFontSize(
      moderateScale(isSmallDevice ? 20 : isTablet ? 30 : 24),
    ),
    color: "#1F2937",
    marginBottom: verticalScale(4),
    fontFamily: "DMSans_700Bold",
  },
  headerSubtitle: {
    fontSize: getFontSize(moderateScale(isSmallDevice ? 12 : 14)),
    color: "#6B7280",
    fontFamily: "DMSans_400Regular",
  },

  periodSelector: {
    flexDirection: "row",
    paddingHorizontal: H_PAD,
    marginBottom: verticalScale(14),
    gap: scale(8),
  },
  periodButton: {
    paddingVertical: verticalScale(7),
    paddingHorizontal: scale(isSmallDevice ? 10 : 18),
    borderRadius: moderateScale(20),
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  periodButtonActive: { backgroundColor: "#2046AE", borderColor: "#2046AE" },
  periodText: {
    fontSize: getFontSize(moderateScale(isSmallDevice ? 12 : 14)),
    color: "#6B7280",
    fontFamily: "DMSans_600SemiBold",
  },
  periodTextActive: { color: "#FFFFFF", fontFamily: "DMSans_600SemiBold" },
});

export default Finance;
