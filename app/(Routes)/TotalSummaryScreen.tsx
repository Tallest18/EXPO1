// app/(Routes)/TotalSummaryScreen.tsx
import { Feather, Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
  DocumentData,
  QueryDocumentSnapshot,
  collection,
  onSnapshot,
  orderBy,
  query,
  where,
} from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Image,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { auth, db } from "../config/firebaseConfig";

const { width, height } = Dimensions.get("window");

// Responsive sizing functions
const scale = (size: number) => (width / 375) * size;
const verticalScale = (size: number) => (height / 812) * size;
const moderateScale = (size: number, factor = 0.5) =>
  size + (scale(size) - size) * factor;

interface SalesSummaryItem {
  id: string;
  image?: string;
  name: string;
  quantity: number;
  date: string;
  amount: number;
  profit: number;
  productId?: string;
}

const TotalSummaryScreen = () => {
  const router = useRouter();
  const [sales, setSales] = useState<SalesSummaryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalSales, setTotalSales] = useState(0);
  const [totalProfit, setTotalProfit] = useState(0);
  const [totalTransactions, setTotalTransactions] = useState(0);

  useEffect(() => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      router.back();
      return;
    }

    const salesQuery = query(
      collection(db, "sales"),
      where("userId", "==", currentUser.uid),
      orderBy("date", "desc"),
    );

    const unsubscribe = onSnapshot(salesQuery, (querySnapshot) => {
      let salesTotal = 0;
      let profitTotal = 0;
      const salesData: SalesSummaryItem[] = [];

      querySnapshot.forEach((doc: QueryDocumentSnapshot<DocumentData>) => {
        const saleData = doc.data();
        const sale = {
          id: doc.id,
          ...saleData,
          amount: saleData.amount || 0,
          profit: saleData.profit || 0,
          quantity: saleData.quantity || 1,
          name: saleData.name || "Unknown Product",
          date: saleData.date || new Date().toISOString(),
          image: saleData.image || "https://via.placeholder.com/40",
        } as SalesSummaryItem;

        salesTotal += sale.amount;
        profitTotal += sale.profit;
        salesData.push(sale);
      });

      setSales(salesData);
      setTotalSales(salesTotal);
      setTotalProfit(profitTotal);
      setTotalTransactions(salesData.length);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const formatCurrency = (value: number) => {
    return `₦${(value || 0).toFixed(2)}`;
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (error) {
      return "Recent";
    }
  };

  const renderSaleItem = ({ item }: { item: SalesSummaryItem }) => (
    <TouchableOpacity
      style={styles.saleItem}
      onPress={() =>
        router.push({
          pathname: "/(Routes)/SalesDetailScreen",
          params: { sale: JSON.stringify(item) },
        })
      }
    >
      <Image
        source={{ uri: item.image || "https://via.placeholder.com/40" }}
        style={styles.image}
      />
      <View style={styles.itemInfo}>
        <Text style={styles.name}>
          {item.name} ×{item.quantity}
        </Text>
        <Text style={styles.date}>{formatDate(item.date)}</Text>
      </View>
      <View style={styles.amountContainer}>
        <Text style={styles.amount}>{formatCurrency(item.amount)}</Text>
        <Text style={styles.profit}>+{formatCurrency(item.profit)}</Text>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Sales Summary</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0056D2" />
          <Text style={styles.loadingText}>Loading sales data...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#E7EEFA" barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Sales Summary</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Summary Cards */}
      <View style={styles.summaryContainer}>
        <View style={styles.summaryCard}>
          <View style={[styles.iconContainer, { backgroundColor: "#E3F2FD" }]}>
            <Feather name="dollar-sign" size={20} color="#0056D2" />
          </View>
          <Text style={styles.summaryValue}>{formatCurrency(totalSales)}</Text>
          <Text style={styles.summaryLabel}>Total Sales</Text>
        </View>

        <View style={styles.summaryCard}>
          <View style={[styles.iconContainer, { backgroundColor: "#E8F5E8" }]}>
            <Feather name="trending-up" size={20} color="#22C55E" />
          </View>
          <Text style={styles.summaryValue}>{formatCurrency(totalProfit)}</Text>
          <Text style={styles.summaryLabel}>Total Profit</Text>
        </View>

        <View style={styles.summaryCard}>
          <View style={[styles.iconContainer, { backgroundColor: "#F3E5F5" }]}>
            <Feather name="shopping-bag" size={20} color="#8B5CF6" />
          </View>
          <Text style={styles.summaryValue}>{totalTransactions}</Text>
          <Text style={styles.summaryLabel}>Transactions</Text>
        </View>
      </View>

      {/* Sales List Header */}
      <View style={styles.listHeader}>
        <Text style={styles.listHeaderTitle}>Recent Sales</Text>
        <Text style={styles.listHeaderCount}>{sales.length} items</Text>
      </View>

      {/* Sales List */}
      <FlatList
        data={sales}
        keyExtractor={(item) => item.id}
        renderItem={renderSaleItem}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Feather name="shopping-bag" size={64} color="#E0E0E0" />
            <Text style={styles.emptyText}>No sales recorded yet</Text>
            <Text style={styles.emptySubtext}>
              Your sales will appear here once you start making transactions
            </Text>
            <TouchableOpacity
              style={styles.quickSellButton}
              onPress={() => router.push("/(Routes)/QuickSellScreen")}
            >
              <Text style={styles.quickSellText}>Start Selling</Text>
            </TouchableOpacity>
          </View>
        }
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#E7EEFA",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: scale(20),
    paddingVertical: verticalScale(16),
    backgroundColor: "#E7EEFA",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  backButton: {
    padding: scale(4),
  },
  headerTitle: {
    fontSize: moderateScale(20),
    fontWeight: "600",
    fontFamily: "Poppins-Bold",
    color: "#333",
  },
  placeholder: {
    width: scale(24),
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: verticalScale(12),
    fontSize: moderateScale(16),
    color: "#666",
    fontFamily: "Poppins-Regular",
  },
  summaryContainer: {
    flexDirection: "row",
    paddingHorizontal: scale(20),
    marginVertical: verticalScale(20),
  },
  summaryCard: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: moderateScale(12),
    padding: scale(16),
    marginHorizontal: scale(4),
    alignItems: "center",
  },
  iconContainer: {
    width: scale(40),
    height: verticalScale(40),
    borderRadius: moderateScale(20),
    justifyContent: "center",
    alignItems: "center",
    marginBottom: verticalScale(8),
  },
  summaryValue: {
    fontSize: moderateScale(14),
    fontWeight: "600",
    fontFamily: "Poppins-Bold",
    color: "#333",
    marginBottom: verticalScale(4),
  },
  summaryLabel: {
    fontSize: moderateScale(12),
    color: "#666",
    fontFamily: "Poppins-Regular",
  },
  listHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: scale(20),
    marginBottom: verticalScale(16),
  },
  listHeaderTitle: {
    fontSize: moderateScale(18),
    fontWeight: "600",
    fontFamily: "Poppins-Bold",
    color: "#333",
  },
  listHeaderCount: {
    fontSize: moderateScale(14),
    color: "#666",
    fontFamily: "Poppins-Regular",
  },
  listContent: {
    paddingHorizontal: scale(20),
    paddingBottom: verticalScale(20),
  },
  saleItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: moderateScale(12),
    padding: scale(16),
    marginBottom: verticalScale(12),
  },
  image: {
    width: scale(48),
    height: verticalScale(48),
    borderRadius: moderateScale(8),
    backgroundColor: "#f0f0f0",
  },
  itemInfo: {
    flex: 1,
    marginLeft: 12,
  },
  name: {
    fontSize: moderateScale(16),
    fontWeight: "600",
    fontFamily: "Poppins-Regular",
    color: "#333",
    marginBottom: verticalScale(4),
  },
  date: {
    fontSize: moderateScale(12),
    color: "#666",
    fontFamily: "Poppins-Regular",
  },
  amountContainer: {
    alignItems: "flex-end",
  },
  amount: {
    fontSize: moderateScale(16),
    fontWeight: "600",
    fontFamily: "Poppins-Bold",
    color: "#0056D2",
    marginBottom: verticalScale(2),
  },
  profit: {
    fontSize: moderateScale(12),
    color: "#22C55E",
    fontFamily: "Poppins-Regular",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: verticalScale(60),
    paddingHorizontal: scale(40),
  },
  emptyText: {
    fontSize: moderateScale(18),
    fontWeight: "600",
    color: "#666",
    marginTop: verticalScale(16),
    marginBottom: verticalScale(8),
    fontFamily: "Poppins-Bold",
  },
  emptySubtext: {
    fontSize: moderateScale(14),
    color: "#999",
    textAlign: "center",
    fontFamily: "Poppins-Regular",
    lineHeight: 20,
    marginBottom: verticalScale(24),
  },
  quickSellButton: {
    backgroundColor: "#0056D2",
    paddingHorizontal: scale(24),
    paddingVertical: verticalScale(12),
    borderRadius: moderateScale(8),
  },
  quickSellText: {
    color: "#fff",
    fontSize: moderateScale(16),
    fontWeight: "600",
    fontFamily: "Poppins-Regular",
  },
});

export default TotalSummaryScreen;
