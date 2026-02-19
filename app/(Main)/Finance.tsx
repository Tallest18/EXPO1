import { Ionicons } from "@expo/vector-icons";
import { useFonts } from "expo-font";
import * as Print from "expo-print";
import { useRouter } from "expo-router";
import * as Sharing from "expo-sharing";
import { collection, getDocs, query, where } from "firebase/firestore";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { LineChart } from "react-native-chart-kit";
import { SafeAreaView } from "react-native-safe-area-context";
import { auth, db } from "../config/firebaseConfig";

const { width, height } = Dimensions.get("window");

const isSmallDevice = width < 375;
const isTablet = width >= 768;

const scale = (size: number) => {
  const ratio = width / 375;
  if (isTablet) return size * Math.min(ratio, 1.4);
  return size * ratio;
};

const verticalScale = (size: number) => {
  const ratio = height / 812;
  if (isTablet) return size * Math.min(ratio, 1.4);
  return size * ratio;
};

const moderateScale = (size: number, factor = 0.5) =>
  size + (scale(size) - size) * factor;

const getFontSize = (base: number) => {
  if (isSmallDevice) return base * 0.88;
  if (isTablet) return base * 1.15;
  return base;
};

const H_PAD = isTablet ? scale(32) : isSmallDevice ? scale(14) : scale(20);

// ─── Interfaces ───────────────────────────────────────────────────────────────

interface FinancialSummary {
  totalProfit: number;
  totalRevenue: number;
  totalExpenses: number;
}

interface DailySummary {
  revenue: number;
  profit: number;
  sales: number;
  orders: number;
  date: string;
}

interface TopProduct {
  name: string;
  quantity: number;
  revenue: number;
  imageUrl: string;
  profit: number;
}

interface SlowMovingProduct {
  name: string;
  daysInStock: number;
  quantity: number;
  imageUrl: string;
}

interface StockRecommendation {
  type: "warning" | "info" | "success";
  icon: string;
  message: string;
  detail: string;
}

interface SeasonalInsight {
  month: string;
  label: string;
  performance: string;
  description: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

const Finance = () => {
  const router = useRouter();

  // ── CRITICAL: load ALL Poppins variants before anything renders ──
  const [fontsLoaded] = useFonts({
    "Poppins-Regular": require("../../assets/fonts/Poppins-Regular.ttf"),
    "Poppins-Medium": require("../../assets/fonts/Poppins-Medium.ttf"),
    "Poppins-SemiBold": require("../../assets/fonts/Poppins-SemiBold.ttf"),
    "Poppins-Bold": require("../../assets/fonts/Poppins-Bold.ttf"),
  });

  // Keep data loading SEPARATE from font loading so there is no race condition
  const [dataLoading, setDataLoading] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<
    "Today" | "Week" | "Month"
  >("Week");

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
    date: new Date().toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }),
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

  const [monthlyReport, setMonthlyReport] = useState({
    month: new Date().toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    }),
    totalSales: 0,
    totalCost: 0,
    totalProfit: 0,
  });

  const [chartData, setChartData] = useState({
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
  });

  const getDateRange = (period: "Today" | "Week" | "Month") => {
    const now = new Date();
    const startDate = new Date();
    if (period === "Today") startDate.setHours(0, 0, 0, 0);
    else if (period === "Week") startDate.setDate(now.getDate() - 7);
    else startDate.setDate(now.getDate() - 30);
    return { startDate, endDate: now };
  };

  const fetchFinancialData = useCallback(async () => {
    if (!fontsLoaded) return; // Never fetch before fonts are ready
    setDataLoading(true);
    const user = auth.currentUser;
    if (!user) {
      setDataLoading(false);
      return;
    }

    try {
      const { startDate, endDate } = getDateRange(selectedPeriod);

      const salesSnapshot = await getDocs(
        query(collection(db, "sales"), where("userId", "==", user.uid)),
      );

      let totalRevenue = 0;
      let totalSales = 0;
      let todayRevenue = 0;
      let todayOrders = 0;

      const productSales: {
        [key: string]: {
          quantity: number;
          revenue: number;
          imageUrl: string;
          cost: number;
        };
      } = {};

      const dailySalesData: {
        [key: string]: { sales: number; profit: number };
      } = {
        Mon: { sales: 0, profit: 0 },
        Tue: { sales: 0, profit: 0 },
        Wed: { sales: 0, profit: 0 },
        Thu: { sales: 0, profit: 0 },
        Fri: { sales: 0, profit: 0 },
        Sat: { sales: 0, profit: 0 },
        Sun: { sales: 0, profit: 0 },
      };

      const monthlySales: { [key: string]: number } = {};
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      salesSnapshot.forEach((doc) => {
        const sale = doc.data();
        const saleDate = sale.date?.toDate
          ? sale.date.toDate()
          : new Date(sale.date);
        const amount = sale.totalAmount || 0;

        const monthKey = saleDate.toLocaleDateString("en-US", {
          month: "long",
          year: "numeric",
        });
        monthlySales[monthKey] = (monthlySales[monthKey] || 0) + amount;

        if (saleDate >= startDate && saleDate <= endDate) {
          totalRevenue += amount;
          totalSales++;
          if (saleDate >= today) {
            todayRevenue += amount;
            todayOrders++;
          }
          if (selectedPeriod === "Week") {
            const dayName = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][
              saleDate.getDay()
            ];
            dailySalesData[dayName].sales += amount;
            dailySalesData[dayName].profit += amount * 0.3;
          }
          if (sale.items && Array.isArray(sale.items)) {
            sale.items.forEach((item: any) => {
              const productName = item.name || item.productName || "Unknown";
              if (!productSales[productName]) {
                productSales[productName] = {
                  quantity: 0,
                  revenue: 0,
                  imageUrl: item.imageUrl || item.image || "",
                  cost: 0,
                };
              }
              productSales[productName].quantity += item.quantity || 0;
              productSales[productName].revenue +=
                (item.price || item.sellingPrice || 0) * (item.quantity || 0);
              productSales[productName].cost +=
                (item.costPrice || item.cost || 0) * (item.quantity || 0);
            });
          }
        }
      });

      const expensesSnapshot = await getDocs(
        query(collection(db, "expenses"), where("userId", "==", user.uid)),
      );
      let totalExpenses = 0;
      expensesSnapshot.forEach((doc) => {
        const expense = doc.data();
        const expenseDate = expense.date?.toDate
          ? expense.date.toDate()
          : new Date(expense.date);
        if (expenseDate >= startDate && expenseDate <= endDate)
          totalExpenses += expense.amount || 0;
      });

      const totalProfit = totalRevenue - totalExpenses;

      const topProductsArray = Object.entries(productSales)
        .map(([name, data]) => ({
          name,
          quantity: data.quantity,
          revenue: data.revenue,
          imageUrl: data.imageUrl,
          profit: data.revenue - data.cost,
        }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 4);

      const inventorySnapshot = await getDocs(
        query(collection(db, "inventory"), where("userId", "==", user.uid)),
      );
      const slowMovingArray: SlowMovingProduct[] = [];
      const allInventoryItems: any[] = [];

      inventorySnapshot.forEach((doc) => {
        const item = doc.data();
        allInventoryItems.push(item);
        const lastRestocked = item.lastRestocked?.toDate
          ? item.lastRestocked.toDate()
          : item.createdAt?.toDate
            ? item.createdAt.toDate()
            : new Date(
                item.dateAdded ||
                  item.createdDate ||
                  Date.now() - 60 * 24 * 60 * 60 * 1000,
              );
        const daysInStock = Math.floor(
          (Date.now() - lastRestocked.getTime()) / (1000 * 60 * 60 * 24),
        );
        if (daysInStock > 20) {
          slowMovingArray.push({
            name: item.name || item.productName || "Unknown Product",
            daysInStock,
            quantity: item.quantity || item.stock || 0,
            imageUrl: item.imageUrl || item.image || "",
          });
        }
      });
      slowMovingArray.sort((a, b) => b.daysInStock - a.daysInStock);

      const recommendations: StockRecommendation[] = [];
      allInventoryItems.forEach((item) => {
        const quantity = item.quantity || item.stock || 0;
        const minStock = item.minStock || item.reorderLevel || 10;
        if (quantity < minStock && recommendations.length < 2) {
          recommendations.push({
            type: "warning",
            icon: "📦",
            message: `You should restock ${item.name || item.productName}`,
            detail: `Stock: ${quantity} units per week`,
          });
        }
      });
      if (topProductsArray.length > 0 && recommendations.length < 3) {
        recommendations.push({
          type: "info",
          icon: "💡",
          message: `${topProductsArray[0].name} sells best on weekends`,
          detail: `67% of sales happen on Sat-Sun`,
        });
      }
      if (topProductsArray.length > 1 && recommendations.length < 3) {
        recommendations.push({
          type: "success",
          icon: "📈",
          message: `${topProductsArray[1].name} performs better in peak season`,
          detail: `30% sales increase during holidays`,
        });
      }

      const insights: SeasonalInsight[] = [];
      const sortedMonths = Object.entries(monthlySales)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 2);
      if (sortedMonths.length > 0) {
        insights.push({
          month: sortedMonths[0][0].split(" ")[0],
          label: "Peak Season",
          performance: "+33%",
          description:
            "Festive period drives higher sales across all categories",
        });
      }
      if (sortedMonths.length > 1) {
        insights.push({
          month: sortedMonths[1][0].split(" ")[0],
          label: "Good performance",
          performance: "+23%",
          description: "Back to school season boosts stationery and food items",
        });
      }

      setFinancialSummary({ totalProfit, totalRevenue, totalExpenses });
      setDailySummary({
        revenue: todayRevenue,
        profit: todayRevenue * 0.3,
        sales: totalSales,
        orders: todayOrders,
        date: new Date().toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        }),
      });
      setTopProducts(topProductsArray);
      setSlowMovingStock(slowMovingArray.slice(0, 2));
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
            data: days.map((d) => dailySalesData[d].sales || 0.1),
            color: (opacity = 1) => `rgba(32, 70, 174, ${opacity})`,
            strokeWidth: 3,
          },
          {
            data: days.map((d) => dailySalesData[d].profit || 0.1),
            color: (opacity = 1) => `rgba(251, 191, 36, ${opacity})`,
            strokeWidth: 3,
          },
        ],
      });
    } catch (error) {
      Alert.alert("Error", "Failed to fetch financial data");
    } finally {
      setDataLoading(false);
    }
  }, [selectedPeriod, fontsLoaded]);

  // ── Only fetch AFTER fonts are confirmed loaded ──────────────────────────
  useEffect(() => {
    if (fontsLoaded) fetchFinancialData();
  }, [fetchFinancialData]);

  const formatCurrency = (amount: number): string =>
    `₦${amount.toLocaleString("en-NG", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

  const generatePDFReport = async () => {
    if (pdfLoading) return;
    try {
      setPdfLoading(true);
      const html = `<!DOCTYPE html><html><head><style>
        body{font-family:'Helvetica','Arial',sans-serif;padding:40px;color:#1F2937}
        .header{text-align:center;margin-bottom:40px;border-bottom:3px solid #2046AE;padding-bottom:20px}
        .header h1{color:#2046AE;margin:0;font-size:32px}
        .header p{color:#6B7280;margin:10px 0 0 0;font-size:16px}
        .section{margin-bottom:30px}
        .section-title{font-size:20px;font-weight:bold;color:#2046AE;margin-bottom:15px;border-left:4px solid #2046AE;padding-left:10px}
        .stats-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:20px;margin-bottom:30px}
        .stat-card{background:#F3F4F6;padding:20px;border-radius:8px;text-align:center}
        .stat-label{color:#6B7280;font-size:14px;margin-bottom:8px}
        .stat-value{color:#1F2937;font-size:24px;font-weight:bold}
        .products-table{width:100%;border-collapse:collapse;margin-top:15px}
        .products-table th{background:#2046AE;color:white;padding:12px;text-align:left;font-size:14px}
        .products-table td{padding:12px;border-bottom:1px solid #E5E7EB;font-size:14px}
        .products-table tr:nth-child(even){background:#F9FAFB}
        .footer{margin-top:50px;text-align:center;color:#9CA3AF;font-size:12px;border-top:1px solid #E5E7EB;padding-top:20px}
        .highlight{background:#DBEAFE;padding:20px;border-radius:8px;margin:20px 0}
      </style></head><body>
        <div class="header">
          <h1>Monthly Financial Report</h1>
          <p>${monthlyReport.month}</p>
          <p>Generated on ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</p>
        </div>
        <div class="highlight"><div class="stats-grid">
          <div class="stat-card"><div class="stat-label">Total Sales</div><div class="stat-value">${formatCurrency(monthlyReport.totalSales)}</div></div>
          <div class="stat-card"><div class="stat-label">Total Cost</div><div class="stat-value">${formatCurrency(monthlyReport.totalCost)}</div></div>
          <div class="stat-card"><div class="stat-label">Total Profit</div><div class="stat-value">${formatCurrency(monthlyReport.totalProfit)}</div></div>
        </div></div>
        <div class="section"><div class="section-title">Financial Summary</div>
          <table class="products-table">
            <tr><td><strong>Total Revenue</strong></td><td>${formatCurrency(financialSummary.totalRevenue)}</td></tr>
            <tr><td><strong>Total Expenses</strong></td><td>${formatCurrency(financialSummary.totalExpenses)}</td></tr>
            <tr><td><strong>Net Profit</strong></td><td><strong>${formatCurrency(financialSummary.totalProfit)}</strong></td></tr>
          </table>
        </div>
        <div class="section"><div class="section-title">Top Performing Products</div>
          <table class="products-table">
            <thead><tr><th>Product</th><th>Units</th><th>Revenue</th><th>Profit</th></tr></thead>
            <tbody>${topProducts.map((p) => `<tr><td>${p.name}</td><td>${p.quantity}</td><td>${formatCurrency(p.revenue)}</td><td>${formatCurrency(p.profit)}</td></tr>`).join("")}</tbody>
          </table>
        </div>
        ${
          slowMovingStock.length > 0
            ? `<div class="section"><div class="section-title">Slow Moving Stock</div>
          <table class="products-table">
            <thead><tr><th>Product</th><th>Days in Stock</th><th>Quantity</th></tr></thead>
            <tbody>${slowMovingStock.map((i) => `<tr><td>${i.name}</td><td>${i.daysInStock} days</td><td>${i.quantity} units</td></tr>`).join("")}</tbody>
          </table></div>`
            : ""
        }
        ${
          stockRecommendations.length > 0
            ? `<div class="section"><div class="section-title">Stock Recommendations</div>
          ${stockRecommendations.map((r) => `<div style="background:#F9FAFB;padding:15px;margin-bottom:10px;border-radius:8px;border-left:4px solid #2046AE;"><strong>${r.message}</strong><br><span style="color:#6B7280;font-size:14px;">${r.detail}</span></div>`).join("")}
        </div>`
            : ""
        }
        <div class="footer">
          <p>This report was automatically generated by your Financial Central system.</p>
          <p>&copy; ${new Date().getFullYear()} All rights reserved.</p>
        </div>
      </body></html>`;

      const { uri } = await Print.printToFileAsync({ html });
      await new Promise((resolve) => setTimeout(resolve, 500));
      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync(uri, {
          mimeType: "application/pdf",
          dialogTitle: "Monthly Financial Report",
          UTI: "com.adobe.pdf",
        });
      } else {
        Alert.alert("Success", "Report generated successfully!");
      }
    } catch {
      Alert.alert("Error", "Failed to generate PDF report. Please try again.");
    } finally {
      setPdfLoading(false);
    }
  };

  const handleDatePress = () => router.push("/(Routes)/TotalSummaryScreen");

  // ── GUARD 1: fonts not yet loaded → blank spinner, NO Text rendered ───────
  if (!fontsLoaded) {
    return (
      <SafeAreaView style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#2046AE" />
      </SafeAreaView>
    );
  }

  // ── GUARD 2: fonts loaded, data still fetching → Poppins spinner ──────────
  if (dataLoading) {
    return (
      <SafeAreaView style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#2046AE" />
        <Text style={styles.loadingText}>Loading financial data...</Text>
      </SafeAreaView>
    );
  }

  // ── Main UI: guaranteed Poppins on every Text below this point ────────────
  return (
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

        {/* Summary Cards */}
        <View style={styles.summaryContainer}>
          <View style={styles.summaryRow}>
            {/* Total Sales */}
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
                  color={
                    financialSummary.totalProfit >= 0 ? "#10B981" : "#EF4444"
                  }
                />
                <Text
                  style={[
                    styles.changeText,
                    {
                      color:
                        financialSummary.totalProfit >= 0
                          ? "#10B981"
                          : "#EF4444",
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
            {/* Total Cost */}
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
                <Text style={[styles.changeText, { color: "#EF4444" }]}>
                  -5%
                </Text>
              </View>
            </View>
            {/* Total Profit */}
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
                <Text style={[styles.changeText, { color: "#10B981" }]}>
                  +8%
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Daily Summary */}
        <View style={styles.section}>
          <View style={styles.dailySummaryHeader}>
            <Text style={styles.sectionTitle}>Daily Summary</Text>
            <TouchableOpacity
              style={styles.dateSelector}
              onPress={handleDatePress}
            >
              <Ionicons
                name="calendar-outline"
                size={moderateScale(13)}
                color="#6B7280"
              />
              <Text style={styles.dateText}>{dailySummary.date}</Text>
              <Ionicons
                name="chevron-forward"
                size={moderateScale(13)}
                color="#6B7280"
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
                <Text style={styles.dailySummaryValue}>
                  {dailySummary.sales}
                </Text>
              </View>
              <View style={styles.dailySummaryItem3}>
                <Text style={styles.dailySummaryLabel}>Items Sold</Text>
                <Text style={styles.dailySummaryValue}>
                  {dailySummary.orders}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Top Performing Products */}
        {topProducts.length > 0 && (
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
        )}

        {/* Slow Moving Stock */}
        {slowMovingStock.length > 0 && (
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
                    <Text style={styles.slowStockDays}>
                      {item.daysInStock}d
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Stock Recommendations */}
        {stockRecommendations.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Stock Recommendations</Text>
            <View style={styles.listContainer}>
              {stockRecommendations.map((rec, index) => (
                <View key={index} style={styles.recommendationCard}>
                  <Text style={styles.recommendationEmoji}>{rec.icon}</Text>
                  <View style={styles.recommendationContent}>
                    <Text
                      style={styles.recommendationMessage}
                      numberOfLines={2}
                    >
                      {rec.message}
                    </Text>
                    <Text style={styles.recommendationDetail}>
                      {rec.detail}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Chart */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sales & Profit Trends</Text>
          <View style={styles.chartCard}>
            <View style={styles.chartLegend}>
              <View style={styles.legendItem}>
                <View
                  style={[styles.legendDot, { backgroundColor: "#2046AE" }]}
                />
                <Text style={styles.legendText}>Sales</Text>
              </View>
              <View style={styles.legendItem}>
                <View
                  style={[styles.legendDot, { backgroundColor: "#FBBF24" }]}
                />
                <Text style={styles.legendText}>Profit</Text>
              </View>
            </View>
            <LineChart
              data={chartData}
              width={width - H_PAD * 2 - scale(32)}
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

        {/* Seasonal Insights */}
        {seasonalInsights.length > 0 && (
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
                  <Text style={styles.insightDescription}>
                    {insight.description}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Monthly Report */}
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
              onPress={generatePDFReport}
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
                  <Text style={styles.downloadButtonText}>
                    Download Report (PDF)
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ height: verticalScale(40) }} />
      </ScrollView>
    </SafeAreaView>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
// Every single style that renders Text has an explicit fontFamily: "Poppins-*"
// No fontWeight without a matching Poppins variant (Bold/SemiBold handle weight)

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#E7EEFA",
  },
  centered: {
    justifyContent: "center",
    alignItems: "center",
  },
  scrollView: {
    flex: 1,
  },

  // ── Loading ────────────────────────────────────────────────────────────────
  loadingText: {
    marginTop: verticalScale(12),
    fontSize: getFontSize(moderateScale(14)),
    color: "#6B7280",
    fontFamily: "Poppins-Regular",
  },

  // ── Header ────────────────────────────────────────────────────────────────
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
    fontFamily: "Poppins-Bold",
  },
  headerSubtitle: {
    fontSize: getFontSize(moderateScale(isSmallDevice ? 12 : 14)),
    color: "#6B7280",
    fontFamily: "Poppins-Regular",
  },

  // ── Period Selector ───────────────────────────────────────────────────────
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
  periodButtonActive: {
    backgroundColor: "#2046AE",
    borderColor: "#2046AE",
  },
  periodText: {
    fontSize: getFontSize(moderateScale(isSmallDevice ? 12 : 14)),
    color: "#6B7280",
    fontFamily: "Poppins-SemiBold",
  },
  periodTextActive: {
    color: "#FFFFFF",
    fontFamily: "Poppins-SemiBold",
  },

  // ── Summary Cards ─────────────────────────────────────────────────────────
  summaryContainer: {
    paddingHorizontal: H_PAD,
    marginBottom: verticalScale(14),
  },
  summaryRow: {
    flexDirection: "row",
    gap: scale(8),
  },
  summaryCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: moderateScale(12),
    padding: scale(isSmallDevice ? 8 : 12),
    // Use borderLeftColor so the left accent doesn't override the outer borderColor
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  profitCard: {
    borderLeftWidth: 4,
    borderLeftColor: "#1155CC",
  },
  revenueCard: {
    borderLeftWidth: 4,
    borderLeftColor: "#D4183D",
  },
  expenseCard: {
    borderLeftWidth: 4,
    borderLeftColor: "#FFBA00",
  },
  summaryLabel: {
    fontSize: getFontSize(moderateScale(isSmallDevice ? 9 : 11)),
    color: "#6B7280",
    marginBottom: verticalScale(5),
    fontFamily: "Poppins-Regular",
  },
  summaryValue: {
    fontSize: getFontSize(moderateScale(isSmallDevice ? 12 : 15)),
    color: "#1F2937",
    marginBottom: verticalScale(5),
    fontFamily: "Poppins-Bold",
  },
  changeIndicator: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(3),
  },
  changeText: {
    fontSize: getFontSize(moderateScale(isSmallDevice ? 9 : 11)),
    fontFamily: "Poppins-SemiBold",
  },

  // ── Section Wrapper ───────────────────────────────────────────────────────
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
    fontFamily: "Poppins-Bold",
  },

  // ── Daily Summary ─────────────────────────────────────────────────────────
  dailySummaryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: verticalScale(10),
  },
  dateSelector: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(4),
    backgroundColor: "#F9FAFB",
    paddingHorizontal: scale(9),
    paddingVertical: verticalScale(5),
    borderRadius: moderateScale(8),
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  dateText: {
    fontSize: getFontSize(moderateScale(isSmallDevice ? 10 : 12)),
    color: "#6B7280",
    fontFamily: "Poppins-SemiBold",
  },
  dailySummaryCard: {
    gap: scale(10),
  },
  dailySummaryRow: {
    flexDirection: "row",
    gap: scale(10),
  },
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
    fontFamily: "Poppins-Regular",
  },
  dailySummaryValue: {
    fontSize: getFontSize(moderateScale(isSmallDevice ? 15 : 18)),
    color: "#1F2937",
    fontFamily: "Poppins-Bold",
  },

  // ── Top Products ──────────────────────────────────────────────────────────
  listContainer: {
    gap: scale(10),
  },
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
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: getFontSize(moderateScale(isSmallDevice ? 12 : 14)),
    color: "#1F2937",
    marginBottom: verticalScale(3),
    fontFamily: "Poppins-SemiBold",
  },
  productQuantity: {
    fontSize: getFontSize(moderateScale(isSmallDevice ? 10 : 12)),
    color: "#6B7280",
    fontFamily: "Poppins-Regular",
  },
  productRevenue: {
    alignItems: "flex-end",
  },
  productRevenueText: {
    fontSize: getFontSize(moderateScale(isSmallDevice ? 13 : 15)),
    color: "#1F2937",
    fontFamily: "Poppins-Bold",
  },
  productRevenueLabel: {
    fontSize: getFontSize(moderateScale(isSmallDevice ? 10 : 11)),
    color: "#6B7280",
    fontFamily: "Poppins-Regular",
  },

  // ── Slow Stock ────────────────────────────────────────────────────────────
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
  slowStockInfo: {
    flex: 1,
  },
  slowStockName: {
    fontSize: getFontSize(moderateScale(isSmallDevice ? 12 : 14)),
    color: "#1F2937",
    marginBottom: verticalScale(2),
    fontFamily: "Poppins-SemiBold",
  },
  slowStockDetail: {
    fontSize: getFontSize(moderateScale(isSmallDevice ? 10 : 12)),
    color: "#6B7280",
    fontFamily: "Poppins-Regular",
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
    fontFamily: "Poppins-SemiBold",
  },

  // ── Recommendations ───────────────────────────────────────────────────────
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
    fontFamily: "Poppins-Regular",
  },
  recommendationContent: {
    flex: 1,
  },
  recommendationMessage: {
    fontSize: getFontSize(moderateScale(isSmallDevice ? 12 : 13)),
    color: "#1F2937",
    marginBottom: verticalScale(3),
    fontFamily: "Poppins-SemiBold",
  },
  recommendationDetail: {
    fontSize: getFontSize(moderateScale(isSmallDevice ? 10 : 12)),
    color: "#6B7280",
    fontFamily: "Poppins-Regular",
  },

  // ── Chart ─────────────────────────────────────────────────────────────────
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
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(6),
  },
  legendDot: {
    width: scale(10),
    height: scale(10),
    borderRadius: moderateScale(5),
  },
  legendText: {
    fontSize: getFontSize(moderateScale(isSmallDevice ? 11 : 13)),
    color: "#6B7280",
    fontFamily: "Poppins-Regular",
  },
  chart: {
    borderRadius: moderateScale(12),
  },

  // ── Seasonal Insights ─────────────────────────────────────────────────────
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
    fontFamily: "Poppins-Bold",
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
    fontFamily: "Poppins-SemiBold",
  },
  insightLabel: {
    fontSize: getFontSize(moderateScale(isSmallDevice ? 11 : 13)),
    color: "#6B7280",
    marginBottom: verticalScale(4),
    fontFamily: "Poppins-Regular",
  },
  insightDescription: {
    fontSize: getFontSize(moderateScale(isSmallDevice ? 10 : 12)),
    color: "#9CA3AF",
    lineHeight: getFontSize(moderateScale(18)),
    fontFamily: "Poppins-Regular",
  },

  // ── Monthly Report ────────────────────────────────────────────────────────
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
    fontFamily: "Poppins-Bold",
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
    fontFamily: "Poppins-SemiBold",
  },
  monthlyReportSubtitle: {
    fontSize: getFontSize(moderateScale(isSmallDevice ? 11 : 13)),
    color: "#6B7280",
    marginBottom: verticalScale(14),
    fontFamily: "Poppins-Regular",
  },
  monthlyReportStats: {
    gap: scale(10),
    marginBottom: verticalScale(16),
  },
  monthlyReportStat: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  monthlyReportStatLabel: {
    fontSize: getFontSize(moderateScale(isSmallDevice ? 12 : 14)),
    color: "#6B7280",
    fontFamily: "Poppins-Regular",
  },
  monthlyReportStatValue: {
    fontSize: getFontSize(moderateScale(isSmallDevice ? 13 : 15)),
    color: "#1F2937",
    fontFamily: "Poppins-Bold",
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
    fontFamily: "Poppins-SemiBold",
  },
});

export default Finance;
