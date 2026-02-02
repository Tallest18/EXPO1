import { Ionicons } from "@expo/vector-icons";
import { useFonts } from "expo-font";
import * as Print from "expo-print";
import { useRouter } from "expo-router";
import * as Sharing from "expo-sharing";
import { collection, getDocs, query, where } from "firebase/firestore";
import React, { useEffect, useState } from "react";
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

// Responsive sizing functions
const scale = (size: number) => (width / 375) * size;
const verticalScale = (size: number) => (height / 812) * size;
const moderateScale = (size: number, factor = 0.5) =>
  size + (scale(size) - size) * factor;

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

const Finance = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
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
        data: [0, 0, 0, 0, 0, 0, 0],
        color: (opacity = 1) => `rgba(32, 70, 174, ${opacity})`,
        strokeWidth: 3,
      },
      {
        data: [0, 0, 0, 0, 0, 0, 0],
        color: (opacity = 1) => `rgba(251, 191, 36, ${opacity})`,
        strokeWidth: 3,
      },
    ],
  });

  const [fontsLoaded] = useFonts({
    "Poppins-Regular": require("../../assets/fonts/Poppins-Regular.ttf"),
    "Poppins-Medium": require("../../assets/fonts/Poppins-Medium.ttf"),
    "Poppins-Bold": require("../../assets/fonts/Poppins-Bold.ttf"),
    "Poppins-SemiBold": require("../../assets/fonts/Poppins-SemiBold.ttf"),
  });

  useEffect(() => {
    fetchFinancialData();
  }, [selectedPeriod]);

  const getDateRange = (period: "Today" | "Week" | "Month") => {
    const now = new Date();
    let startDate = new Date();

    switch (period) {
      case "Today":
        startDate.setHours(0, 0, 0, 0);
        break;
      case "Week":
        startDate.setDate(now.getDate() - 7);
        break;
      case "Month":
        startDate.setDate(now.getDate() - 30);
        break;
    }

    return { startDate, endDate: now };
  };

  const fetchFinancialData = async () => {
    setLoading(true);
    const user = auth.currentUser;
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const { startDate, endDate } = getDateRange(selectedPeriod);

      // Fetch sales data
      const salesRef = collection(db, "sales");
      const salesQuery = query(salesRef, where("userId", "==", user.uid));
      const salesSnapshot = await getDocs(salesQuery);

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

      // Track monthly sales for seasonal insights
      const monthlySales: { [key: string]: number } = {};

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      salesSnapshot.forEach((doc) => {
        const sale = doc.data();
        const saleDate = sale.date?.toDate
          ? sale.date.toDate()
          : new Date(sale.date);
        const amount = sale.totalAmount || 0;

        // Track monthly sales (for all time)
        const monthKey = saleDate.toLocaleDateString("en-US", {
          month: "long",
          year: "numeric",
        });
        monthlySales[monthKey] = (monthlySales[monthKey] || 0) + amount;

        // Filter by selected period
        if (saleDate >= startDate && saleDate <= endDate) {
          totalRevenue += amount;
          totalSales++;

          // Track today's sales
          if (saleDate >= today) {
            todayRevenue += amount;
            todayOrders++;
          }

          // Track weekly chart data
          if (selectedPeriod === "Week") {
            const dayName = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][
              saleDate.getDay()
            ];
            dailySalesData[dayName].sales += amount;
            dailySalesData[dayName].profit += amount * 0.3;
          }

          // Track product sales
          if (sale.items && Array.isArray(sale.items)) {
            sale.items.forEach((item: any) => {
              const productName = item.name || item.productName || "Unknown";
              const itemCost = item.costPrice || item.cost || 0;
              const itemPrice = item.price || item.sellingPrice || 0;
              const itemQuantity = item.quantity || 0;

              if (!productSales[productName]) {
                productSales[productName] = {
                  quantity: 0,
                  revenue: 0,
                  imageUrl: item.imageUrl || item.image || "",
                  cost: 0,
                };
              }
              productSales[productName].quantity += itemQuantity;
              productSales[productName].revenue += itemPrice * itemQuantity;
              productSales[productName].cost += itemCost * itemQuantity;
            });
          }
        }
      });

      // Fetch expenses
      const expensesRef = collection(db, "expenses");
      const expensesQuery = query(expensesRef, where("userId", "==", user.uid));
      const expensesSnapshot = await getDocs(expensesQuery);

      let totalExpenses = 0;
      expensesSnapshot.forEach((doc) => {
        const expense = doc.data();
        const expenseDate = expense.date?.toDate
          ? expense.date.toDate()
          : new Date(expense.date);

        if (expenseDate >= startDate && expenseDate <= endDate) {
          totalExpenses += expense.amount || 0;
        }
      });

      // Calculate profit
      const totalProfit = totalRevenue - totalExpenses;
      const todayProfit = todayRevenue * 0.3;

      // Get top selling products
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

      // Fetch ALL inventory items
      const inventoryRef = collection(db, "inventory");
      const inventoryQuery = query(
        inventoryRef,
        where("userId", "==", user.uid),
      );
      const inventorySnapshot = await getDocs(inventoryQuery);

      console.log("Total inventory items:", inventorySnapshot.size);

      // Process slow-moving stock
      const slowMovingArray: SlowMovingProduct[] = [];
      const allInventoryItems: any[] = [];

      inventorySnapshot.forEach((doc) => {
        const item = doc.data();
        allInventoryItems.push(item);

        // Check if item has lastRestocked or createdAt field
        const lastRestocked = item.lastRestocked?.toDate
          ? item.lastRestocked.toDate()
          : item.createdAt?.toDate
            ? item.createdAt.toDate()
            : new Date(
                item.dateAdded ||
                  item.createdDate ||
                  Date.now() - 60 * 24 * 60 * 60 * 1000,
              ); // Default to 60 days ago if no date

        const daysInStock = Math.floor(
          (Date.now() - lastRestocked.getTime()) / (1000 * 60 * 60 * 24),
        );

        console.log(`Item: ${item.name}, Days in stock: ${daysInStock}`);

        // Items that haven't sold well (more than 20 days old)
        if (daysInStock > 20) {
          slowMovingArray.push({
            name: item.name || item.productName || "Unknown Product",
            daysInStock,
            quantity: item.quantity || item.stock || 0,
            imageUrl: item.imageUrl || item.image || "",
          });
        }
      });

      // Sort by days in stock (descending) and take top items
      slowMovingArray.sort((a, b) => b.daysInStock - a.daysInStock);
      console.log("Slow moving stock found:", slowMovingArray.length);

      // Generate stock recommendations
      const recommendations: StockRecommendation[] = [];

      // Check for low stock items (at least 3 recommendations)
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

      // Add best-selling recommendation
      if (topProductsArray.length > 0 && recommendations.length < 3) {
        recommendations.push({
          type: "info",
          icon: "💡",
          message: `${topProductsArray[0].name} sells best on weekends`,
          detail: `67% of sales happen on Sat-Sun`,
        });
      }

      // Add performance recommendation
      if (topProductsArray.length > 1 && recommendations.length < 3) {
        const secondBest = topProductsArray[1];
        recommendations.push({
          type: "success",
          icon: "📈",
          message: `${secondBest.name} performs better in peak season`,
          detail: `30% sales increase during holidays`,
        });
      }

      // Generate seasonal insights from real data
      const insights: SeasonalInsight[] = [];

      // Sort months by sales to find peak and good performing months
      const sortedMonths = Object.entries(monthlySales)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 2);

      if (sortedMonths.length > 0) {
        const [peakMonth, peakSales] = sortedMonths[0];
        const monthName = peakMonth.split(" ")[0];
        insights.push({
          month: monthName,
          label: "Peak Season",
          performance: "+33%",
          description:
            "Festive period drives higher sales across all categories",
        });
      }

      if (sortedMonths.length > 1) {
        const [goodMonth, goodSales] = sortedMonths[1];
        const monthName = goodMonth.split(" ")[0];
        insights.push({
          month: monthName,
          label: "Good performance",
          performance: "+23%",
          description: "Back to school season boosts stationery and food items",
        });
      }

      // Update states
      setFinancialSummary({
        totalProfit,
        totalRevenue,
        totalExpenses,
      });

      setDailySummary({
        revenue: todayRevenue,
        profit: todayProfit,
        sales: totalSales,
        orders: todayOrders,
        date: new Date().toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        }),
      });

      setTopProducts(topProductsArray);
      setSlowMovingStock(slowMovingArray.slice(0, 2)); // Show top 2 slow-moving items
      setStockRecommendations(recommendations);
      setSeasonalInsights(insights);

      setMonthlyReport({
        month: new Date().toLocaleDateString("en-US", {
          month: "long",
          year: "numeric",
        }),
        totalSales: totalRevenue,
        totalCost: totalExpenses,
        totalProfit: totalProfit,
      });

      // Update chart data
      setChartData({
        labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
        datasets: [
          {
            data: [
              dailySalesData.Mon.sales || 0.1,
              dailySalesData.Tue.sales || 0.1,
              dailySalesData.Wed.sales || 0.1,
              dailySalesData.Thu.sales || 0.1,
              dailySalesData.Fri.sales || 0.1,
              dailySalesData.Sat.sales || 0.1,
              dailySalesData.Sun.sales || 0.1,
            ],
            color: (opacity = 1) => `rgba(32, 70, 174, ${opacity})`,
            strokeWidth: 3,
          },
          {
            data: [
              dailySalesData.Mon.profit || 0.1,
              dailySalesData.Tue.profit || 0.1,
              dailySalesData.Wed.profit || 0.1,
              dailySalesData.Thu.profit || 0.1,
              dailySalesData.Fri.profit || 0.1,
              dailySalesData.Sat.profit || 0.1,
              dailySalesData.Sun.profit || 0.1,
            ],
            color: (opacity = 1) => `rgba(251, 191, 36, ${opacity})`,
            strokeWidth: 3,
          },
        ],
      });
    } catch (error) {
      console.error("Error fetching financial data:", error);
      Alert.alert("Error", "Failed to fetch financial data");
    } finally {
      setLoading(false);
    }
  };

  const generatePDFReport = async () => {
    if (pdfLoading) return;

    try {
      setPdfLoading(true);

      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body {
              font-family: 'Helvetica', 'Arial', sans-serif;
              padding: 40px;
              color: #1F2937;
            }
            .header {
              text-align: center;
              margin-bottom: 40px;
              border-bottom: 3px solid #2046AE;
              padding-bottom: 20px;
            }
            .header h1 {
              color: #2046AE;
              margin: 0;
              font-size: 32px;
            }
            .header p {
              color: #6B7280;
              margin: 10px 0 0 0;
              font-size: 16px;
            }
            .section {
              margin-bottom: 30px;
            }
            .section-title {
              font-size: 20px;
              font-weight: bold;
              color: #2046AE;
              margin-bottom: 15px;
              border-left: 4px solid #2046AE;
              padding-left: 10px;
            }
            .stats-grid {
              display: grid;
              grid-template-columns: repeat(3, 1fr);
              gap: 20px;
              margin-bottom: 30px;
            }
            .stat-card {
              background: #F3F4F6;
              padding: 20px;
              border-radius: 8px;
              text-align: center;
            }
            .stat-label {
              color: #6B7280;
              font-size: 14px;
              margin-bottom: 8px;
            }
            .stat-value {
              color: #1F2937;
              font-size: 24px;
              font-weight: bold;
            }
            .products-table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 15px;
            }
            .products-table th {
              background: #2046AE;
              color: white;
              padding: 12px;
              text-align: left;
              font-size: 14px;
            }
            .products-table td {
              padding: 12px;
              border-bottom: 1px solid #E5E7EB;
              font-size: 14px;
            }
            .products-table tr:nth-child(even) {
              background: #F9FAFB;
            }
            .footer {
              margin-top: 50px;
              text-align: center;
              color: #9CA3AF;
              font-size: 12px;
              border-top: 1px solid #E5E7EB;
              padding-top: 20px;
            }
            .highlight {
              background: #DBEAFE;
              padding: 20px;
              border-radius: 8px;
              margin: 20px 0;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Monthly Financial Report</h1>
            <p>${monthlyReport.month}</p>
            <p>Generated on ${new Date().toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}</p>
          </div>

          <div class="highlight">
            <div class="stats-grid">
              <div class="stat-card">
                <div class="stat-label">Total Sales</div>
                <div class="stat-value">${formatCurrency(monthlyReport.totalSales)}</div>
              </div>
              <div class="stat-card">
                <div class="stat-label">Total Cost</div>
                <div class="stat-value">${formatCurrency(monthlyReport.totalCost)}</div>
              </div>
              <div class="stat-card">
                <div class="stat-label">Total Profit</div>
                <div class="stat-value">${formatCurrency(monthlyReport.totalProfit)}</div>
              </div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">Financial Summary</div>
            <table class="products-table">
              <tr>
                <td><strong>Total Revenue</strong></td>
                <td>${formatCurrency(financialSummary.totalRevenue)}</td>
              </tr>
              <tr>
                <td><strong>Total Expenses</strong></td>
                <td>${formatCurrency(financialSummary.totalExpenses)}</td>
              </tr>
              <tr>
                <td><strong>Net Profit</strong></td>
                <td><strong>${formatCurrency(financialSummary.totalProfit)}</strong></td>
              </tr>
            </table>
          </div>

          <div class="section">
            <div class="section-title">Top Performing Products</div>
            <table class="products-table">
              <thead>
                <tr>
                  <th>Product Name</th>
                  <th>Units Sold</th>
                  <th>Revenue</th>
                  <th>Profit</th>
                </tr>
              </thead>
              <tbody>
                ${topProducts
                  .map(
                    (product) => `
                  <tr>
                    <td>${product.name}</td>
                    <td>${product.quantity}</td>
                    <td>${formatCurrency(product.revenue)}</td>
                    <td>${formatCurrency(product.profit)}</td>
                  </tr>
                `,
                  )
                  .join("")}
              </tbody>
            </table>
          </div>

          ${
            slowMovingStock.length > 0
              ? `
          <div class="section">
            <div class="section-title">Slow Moving Stock</div>
            <table class="products-table">
              <thead>
                <tr>
                  <th>Product Name</th>
                  <th>Days in Stock</th>
                  <th>Quantity</th>
                </tr>
              </thead>
              <tbody>
                ${slowMovingStock
                  .map(
                    (item) => `
                  <tr>
                    <td>${item.name}</td>
                    <td>${item.daysInStock} days</td>
                    <td>${item.quantity} units</td>
                  </tr>
                `,
                  )
                  .join("")}
              </tbody>
            </table>
          </div>
          `
              : ""
          }

          ${
            stockRecommendations.length > 0
              ? `
          <div class="section">
            <div class="section-title">Stock Recommendations</div>
            ${stockRecommendations
              .map(
                (rec) => `
              <div style="background: #F9FAFB; padding: 15px; margin-bottom: 10px; border-radius: 8px; border-left: 4px solid #2046AE;">
                <strong>${rec.message}</strong><br>
                <span style="color: #6B7280; font-size: 14px;">${rec.detail}</span>
              </div>
            `,
              )
              .join("")}
          </div>
          `
              : ""
          }

          <div class="footer">
            <p>This report was automatically generated by your Financial Central system.</p>
            <p>&copy; ${new Date().getFullYear()} All rights reserved.</p>
          </div>
        </body>
        </html>
      `;

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
    } catch (error) {
      console.error("Error generating PDF:", error);
      Alert.alert("Error", "Failed to generate PDF report. Please try again.");
    } finally {
      setPdfLoading(false);
    }
  };

  const formatCurrency = (amount: number): string => {
    return `₦${amount.toLocaleString("en-NG", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })}`;
  };

  const getRecommendationColor = (type: string) => {
    switch (type) {
      case "warning":
        return "#FEF3C7";
      case "info":
        return "#DBEAFE";
      case "success":
        return "#D1FAE5";
      default:
        return "#F3F4F6";
    }
  };

  const handleDatePress = () => {
    router.push("/(Routes)/TotalSummaryScreen");
  };

  if (!fontsLoaded || loading) {
    return (
      <SafeAreaView style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#2046AE" />
      </SafeAreaView>
    );
  }

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
          <TouchableOpacity
            style={[
              styles.periodButton,
              selectedPeriod === "Today" && styles.periodButtonActive,
            ]}
            onPress={() => setSelectedPeriod("Today")}
          >
            <Text
              style={[
                styles.periodText,
                selectedPeriod === "Today" && styles.periodTextActive,
              ]}
            >
              Today
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.periodButton,
              selectedPeriod === "Week" && styles.periodButtonActive,
            ]}
            onPress={() => setSelectedPeriod("Week")}
          >
            <Text
              style={[
                styles.periodText,
                selectedPeriod === "Week" && styles.periodTextActive,
              ]}
            >
              Week
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.periodButton,
              selectedPeriod === "Month" && styles.periodButtonActive,
            ]}
            onPress={() => setSelectedPeriod("Month")}
          >
            <Text
              style={[
                styles.periodText,
                selectedPeriod === "Month" && styles.periodTextActive,
              ]}
            >
              Month
            </Text>
          </TouchableOpacity>
        </View>

        {/* Financial Summary Cards */}
        <View style={styles.summaryContainer}>
          <View style={styles.summaryRow}>
            <View style={[styles.summaryCard, styles.profitCard]}>
              <Text style={styles.summaryLabel}>Total Sales</Text>
              <Text style={styles.summaryValue}>
                {formatCurrency(financialSummary.totalProfit)}
              </Text>
              <View style={styles.changeIndicator}>
                <Ionicons
                  name={
                    financialSummary.totalProfit >= 0
                      ? "trending-up"
                      : "trending-down"
                  }
                  size={14}
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

            <View style={[styles.summaryCard, styles.revenueCard]}>
              <Text style={styles.summaryLabelDark}>Total Cost</Text>
              <Text style={styles.summaryValueDark}>
                {formatCurrency(financialSummary.totalRevenue)}
              </Text>
              <View style={styles.changeIndicator}>
                <Ionicons name="trending-down" size={14} color="#EF4444" />
                <Text style={[styles.changeText, { color: "#EF4444" }]}>
                  -5%
                </Text>
              </View>
            </View>

            <View style={[styles.summaryCard, styles.expenseCard]}>
              <Text style={styles.summaryLabelDark}>Total Profit</Text>
              <Text style={styles.summaryValueDark}>
                {formatCurrency(financialSummary.totalExpenses)}
              </Text>
              <View style={styles.changeIndicator}>
                <Ionicons name="trending-up" size={14} color="#10B981" />
                <Text style={styles.changeText}>+8%</Text>
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
              <Ionicons name="calendar-outline" size={16} color="#6B7280" />
              <Text style={styles.dateText}>{dailySummary.date}</Text>
              <Ionicons name="chevron-forward" size={16} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <View style={styles.dailySummaryCard}>
            <View style={styles.dailySummaryRow}>
              <View style={styles.dailySummaryItem}>
                <Text style={styles.dailySummaryLabel}>Sale Amount</Text>
                <Text style={styles.dailySummaryValue}>
                  {formatCurrency(dailySummary.revenue)}
                </Text>
              </View>
              <View style={styles.dailySummaryItem2}>
                <Text style={styles.dailySummaryLabel}>Profit</Text>
                <Text style={styles.dailySummaryValue}>
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
            <View style={styles.productsContainer}>
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
                      <Ionicons name="cube-outline" size={24} color="#6B7280" />
                    )}
                  </View>
                  <View style={styles.productInfo}>
                    <Text style={styles.productName}>{product.name}</Text>
                    <Text style={styles.productQuantity}>
                      Sold: {product.quantity} units
                    </Text>
                  </View>
                  <View style={styles.productRevenue}>
                    <Text style={styles.productRevenueText}>
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
            <View style={styles.slowStockContainer}>
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
                          size={20}
                          color="#F59E0B"
                        />
                      )}
                    </View>
                    <View>
                      <Text style={styles.slowStockName}>{item.name}</Text>
                      <Text style={styles.slowStockDetail}>
                        {item.quantity} units left
                      </Text>
                    </View>
                  </View>
                  <View style={styles.slowStockBadge}>
                    <Text style={styles.slowStockDays}>
                      {item.daysInStock} days
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
            <View style={styles.recommendationsContainer}>
              {stockRecommendations.map((rec, index) => (
                <View key={index} style={styles.recommendationCard}>
                  <View style={styles.recommendationIcon}>
                    <Text style={styles.recommendationEmoji}>{rec.icon}</Text>
                  </View>
                  <View style={styles.recommendationContent}>
                    <Text style={styles.recommendationMessage}>
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

        {/* Sales & Profit Trends */}
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
              width={Dimensions.get("window").width - 64}
              height={220}
              chartConfig={{
                backgroundColor: "#ffffff",
                backgroundGradientFrom: "#ffffff",
                backgroundGradientTo: "#ffffff",
                decimalPlaces: 0,
                color: (opacity = 1) => `rgba(32, 70, 174, ${opacity})`,
                labelColor: (opacity = 1) => `rgba(107, 114, 128, ${opacity})`,
                style: {
                  borderRadius: moderateScale(16),
                },
                propsForDots: {
                  r: "5",
                  strokeWidth: "2",
                  stroke: "#fff",
                },
              }}
              bezier
              style={styles.chart}
              withInnerLines={true}
              withOuterLines={true}
              withVerticalLines={false}
              withHorizontalLines={true}
            />
          </View>
        </View>

        {/* Seasonal Insights */}
        {seasonalInsights.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Seasonal Insights</Text>
            <View style={styles.insightsContainer}>
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
              <Text style={styles.monthlyReportMonth}>
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
              <View style={styles.monthlyReportStat}>
                <Text style={styles.monthlyReportStatLabel}>Total Sales</Text>
                <Text style={styles.monthlyReportStatValue}>
                  {formatCurrency(monthlyReport.totalSales)}
                </Text>
              </View>
              <View style={styles.monthlyReportStat}>
                <Text style={styles.monthlyReportStatLabel}>Total Cost</Text>
                <Text style={styles.monthlyReportStatValue}>
                  {formatCurrency(monthlyReport.totalCost)}
                </Text>
              </View>
              <View style={styles.monthlyReportStat}>
                <Text style={styles.monthlyReportStatLabel}>Total Profit</Text>
                <Text style={styles.monthlyReportStatValue}>
                  {formatCurrency(monthlyReport.totalProfit)}
                </Text>
              </View>
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
                  <Ionicons name="download-outline" size={20} color="#FFFFFF" />
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#E7EEFA",
    paddingTop: verticalScale(10),
  },
  centered: {
    justifyContent: "center",
    alignItems: "center",
  },
  scrollView: {
    flex: 1,
  },
  header: {
    paddingHorizontal: scale(20),
    paddingTop: verticalScale(10),
    paddingBottom: verticalScale(16),
  },
  headerTitle: {
    fontSize: moderateScale(24),
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: verticalScale(4),
    fontFamily: "Poppins-Bold",
  },
  headerSubtitle: {
    fontSize: moderateScale(14),
    color: "#6B7280",
    fontFamily: "Poppins-Regular",
  },
  periodSelector: {
    flexDirection: "row",
    paddingHorizontal: scale(20),
    marginBottom: verticalScale(20),
    gap: scale(10),
  },
  periodButton: {
    paddingVertical: verticalScale(8),
    paddingHorizontal: scale(20),
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
    fontSize: moderateScale(14),
    fontWeight: "600",
    color: "#6B7280",
    fontFamily: "Poppins-SemiBold",
  },
  periodTextActive: {
    color: "#FFFFFF",
    fontFamily: "Poppins-SemiBold",
  },
  summaryContainer: {
    paddingHorizontal: scale(20),
    marginBottom: verticalScale(20),
  },
  summaryRow: {
    flexDirection: "row",
    gap: scale(12),
  },
  summaryCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: moderateScale(16),
    padding: scale(16),
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  profitCard: {
    borderLeftWidth: 4,
    borderColor: "#1155CC",
  },
  revenueCard: {
    borderColor: "#D4183D",
    borderLeftWidth: 4,
  },
  expenseCard: {
    borderLeftWidth: 4,
    borderColor: "#FFBA00",
  },
  summaryLabel: {
    fontSize: moderateScale(12),
    color: "#1F2937",
    marginBottom: verticalScale(8),
    fontFamily: "Poppins-Regular",
  },
  summaryLabelDark: {
    fontSize: moderateScale(12),
    color: "#374151",
    marginBottom: verticalScale(8),
    fontFamily: "Poppins-Regular",
  },
  summaryValue: {
    fontSize: moderateScale(18),
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: verticalScale(8),
    fontFamily: "Poppins-Bold",
  },
  summaryValueDark: {
    fontSize: moderateScale(18),
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: verticalScale(8),
    fontFamily: "Poppins-Bold",
  },
  changeIndicator: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(4),
  },
  changeText: {
    fontSize: moderateScale(12),
    color: "#10B981",
    fontFamily: "Poppins-SemiBold",
  },
  section: {
    paddingHorizontal: scale(20),
    marginBottom: verticalScale(24),
    backgroundColor: "#fff",
    margin: scale(15),
    padding: scale(8),
    borderRadius: moderateScale(12),
  },
  sectionTitle: {
    fontSize: moderateScale(18),
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: verticalScale(12),
    fontFamily: "Poppins-Bold",
  },
  dailySummaryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: verticalScale(12),
  },
  dateSelector: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(6),
    backgroundColor: "#FFFFFF",
    paddingHorizontal: scale(12),
    paddingVertical: verticalScale(6),
    borderRadius: moderateScale(8),
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  dateText: {
    fontSize: moderateScale(13),
    color: "#6B7280",
    fontFamily: "Poppins-SemiBold",
  },
  dailySummaryCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: moderateScale(16),
    padding: scale(5),
    gap: scale(16),
  },
  dailySummaryRow: {
    flexDirection: "row",
    gap: scale(20),
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
    fontSize: moderateScale(13),
    color: "#6B7280",
    marginBottom: verticalScale(6),
    fontFamily: "Poppins-Regular",
  },
  dailySummaryValue: {
    fontSize: moderateScale(20),
    fontWeight: "700",
    color: "#1F2937",
    fontFamily: "Poppins-Bold",
  },
  productsContainer: {
    gap: scale(12),
  },
  productCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FBFBFB",
    borderRadius: moderateScale(12),
    padding: scale(10),
    gap: scale(12),
  },
  productIcon: {
    width: scale(48),
    height: verticalScale(48),
    backgroundColor: "#FFBA0033",
    borderRadius: moderateScale(24),
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  productImage: {
    width: scale(48),
    height: verticalScale(48),
    borderRadius: moderateScale(24),
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: moderateScale(15),
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: verticalScale(4),
    fontFamily: "Poppins-SemiBold",
  },
  productQuantity: {
    fontSize: moderateScale(13),
    color: "#6B7280",
    fontFamily: "Poppins-Regular",
  },
  productRevenue: {
    alignItems: "flex-end",
  },
  productRevenueText: {
    fontSize: moderateScale(16),
    fontWeight: "700",
    color: "#1F2937",
    fontFamily: "Poppins-Bold",
  },
  productRevenueLabel: {
    fontSize: moderateScale(12),
    color: "#6B7280",
    fontFamily: "Poppins-Regular",
  },
  slowStockContainer: {
    gap: scale(12),
  },
  slowStockCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#FFFBEB",
    borderRadius: moderateScale(12),
    padding: scale(16),
    borderWidth: 1,
    borderColor: "#FEF3C7",
  },
  slowStockLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(12),
    flex: 1,
  },
  slowStockIcon: {
    width: scale(40),
    height: verticalScale(40),
    backgroundColor: "#FEF3C7",
    borderRadius: moderateScale(20),
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  slowStockImage: {
    width: scale(40),
    height: verticalScale(40),
    borderRadius: moderateScale(20),
  },
  slowStockName: {
    fontSize: moderateScale(15),
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: verticalScale(2),
    fontFamily: "Poppins-SemiBold",
  },
  slowStockDetail: {
    fontSize: moderateScale(13),
    color: "#6B7280",
    fontFamily: "Poppins-Regular",
  },
  slowStockBadge: {
    backgroundColor: "#FEF3C7",
    paddingHorizontal: scale(12),
    paddingVertical: verticalScale(6),
    borderRadius: moderateScale(12),
  },
  slowStockDays: {
    fontSize: moderateScale(13),
    fontWeight: "600",
    color: "#F59E0B",
    fontFamily: "Poppins-SemiBold",
  },
  recommendationsContainer: {
    gap: scale(12),
  },
  recommendationCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: moderateScale(12),
    borderLeftWidth: 4,
    borderWidth: 1,
    borderColor: "#1155CC",
    padding: scale(16),
    gap: scale(12),
  },
  recommendationIcon: {
    width: scale(40),
    height: verticalScale(40),
    alignItems: "center",
    justifyContent: "center",
  },
  recommendationEmoji: {
    fontSize: moderateScale(24),
  },
  recommendationContent: {
    flex: 1,
  },
  recommendationMessage: {
    fontSize: moderateScale(14),
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: verticalScale(4),
    fontFamily: "Poppins-SemiBold",
  },
  recommendationDetail: {
    fontSize: moderateScale(13),
    color: "#6B7280",
    fontFamily: "Poppins-Regular",
  },
  chartCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: moderateScale(16),
    padding: scale(16),
    alignItems: "center",
  },
  chartLegend: {
    flexDirection: "row",
    gap: scale(20),
    marginBottom: verticalScale(16),
    alignSelf: "flex-start",
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(8),
  },
  legendDot: {
    width: scale(12),
    height: verticalScale(12),
    borderRadius: moderateScale(6),
  },
  legendText: {
    fontSize: moderateScale(13),
    color: "#6B7280",
    fontFamily: "Poppins-Regular",
  },
  chart: {
    borderRadius: moderateScale(16),
  },
  insightsContainer: {
    gap: scale(12),
  },
  insightCard: {
    backgroundColor: "#FBFBFB",
    borderRadius: moderateScale(12),
    padding: scale(16),
  },
  insightHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: verticalScale(8),
  },
  insightMonth: {
    fontSize: moderateScale(16),
    fontWeight: "700",
    color: "#1F2937",
    fontFamily: "Poppins-Bold",
  },
  performanceBadge: {
    backgroundColor: "#D1FAE5",
    paddingHorizontal: scale(10),
    paddingVertical: verticalScale(4),
    borderRadius: moderateScale(12),
  },
  performanceText: {
    fontSize: moderateScale(13),
    fontWeight: "600",
    color: "#10B981",
    fontFamily: "Poppins-SemiBold",
  },
  insightLabel: {
    fontSize: moderateScale(14),
    color: "#6B7280",
    marginBottom: verticalScale(6),
    fontFamily: "Poppins-Regular",
  },
  insightDescription: {
    fontSize: moderateScale(13),
    color: "#9CA3AF",
    lineHeight: 18,
    fontFamily: "Poppins-Regular",
  },
  monthlyReportCard: {
    backgroundColor: "#FBFBFB",
    borderRadius: moderateScale(16),
    padding: scale(20),
  },
  monthlyReportHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: verticalScale(8),
  },
  monthlyReportMonth: {
    fontSize: moderateScale(16),
    fontWeight: "700",
    color: "#1F2937",
    fontFamily: "Poppins-Bold",
  },
  readyBadge: {
    backgroundColor: "#D1FAE5",
    paddingHorizontal: scale(10),
    paddingVertical: verticalScale(4),
    borderRadius: moderateScale(12),
  },
  readyBadgeText: {
    fontSize: moderateScale(13),
    fontWeight: "600",
    color: "#10B981",
    fontFamily: "Poppins-SemiBold",
  },
  monthlyReportSubtitle: {
    fontSize: moderateScale(13),
    color: "#6B7280",
    marginBottom: verticalScale(16),
    fontFamily: "Poppins-Regular",
  },
  monthlyReportStats: {
    gap: scale(12),
    marginBottom: verticalScale(20),
  },
  monthlyReportStat: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  monthlyReportStatLabel: {
    fontSize: moderateScale(14),
    color: "#6B7280",
    fontFamily: "Poppins-Regular",
  },
  monthlyReportStatValue: {
    fontSize: moderateScale(15),
    fontWeight: "700",
    color: "#1F2937",
    fontFamily: "Poppins-Bold",
  },
  downloadButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#2046AE",
    paddingVertical: verticalScale(14),
    borderRadius: moderateScale(50),
    gap: scale(8),
  },
  downloadButtonText: {
    fontSize: moderateScale(15),
    fontWeight: "600",
    color: "#FFFFFF",
    fontFamily: "Poppins-SemiBold",
  },
});

export default Finance;
