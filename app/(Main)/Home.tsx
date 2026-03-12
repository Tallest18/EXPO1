// app/(Main)/Home.tsx
import { Feather, Ionicons } from "@expo/vector-icons";
import { useFonts } from "expo-font";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    FlatList,
    Image,
    SafeAreaView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

import {
    ApiProduct,
    ApiSale,
    ApiSaleItem,
    getDashboardOverview,
    getProfile,
    listNotifications,
    listProducts,
    listSales,
} from "@/src/api";
import AddProductFlow from "../(Routes)/AddProductFlow";

const { width, height } = Dimensions.get("window");

// Device detection
const isSmallDevice = width < 375;
const isMediumDevice = width >= 375 && width < 414;
const isTablet = width >= 768;

// Enhanced responsive sizing
const scale = (size: number) => {
  const baseWidth = 375;
  const ratio = width / baseWidth;

  if (isTablet) {
    return size * Math.min(ratio, 1.5);
  }
  return size * ratio;
};

const verticalScale = (size: number) => {
  const baseHeight = 812;
  const ratio = height / baseHeight;

  if (isTablet) {
    return size * Math.min(ratio, 1.5);
  }
  return size * ratio;
};

const moderateScale = (size: number, factor = 0.5) => {
  return size + (scale(size) - size) * factor;
};

// Responsive font sizes
const getFontSize = (base: number) => {
  if (isSmallDevice) return base * 0.9;
  if (isTablet) return base * 1.2;
  return base;
};

// Updated Notification type to match the data structure from the backend
interface Notification {
  id: string;
  type:
    | "low_stock"
    | "out_of_stock"
    | "high_selling"
    | "zero_sales"
    | "daily_summary"
    | "weekly_summary"
    | "expense"
    | "expiry"
    | "backup"
    | "app_update"
    | "sale"
    | "product_added";
  title: string;
  message: string;
  time: string;
  isRead: boolean;
  productId?: string;
  dateAdded: number;
}

// Fixed Product type definition
interface Product {
  id: string;
  name: string;
  category: string;
  barcode: string;
  image?: {
    uri: string;
    type?: string;
    fileName?: string;
    fileSize?: number;
  } | null;
  quantityType: string;
  unitsInStock: number;
  costPrice: number;
  sellingPrice: number;
  lowStockThreshold: number;
  expiryDate: string;
  supplier: {
    name: string;
    phone: string;
  };
  dateAdded: string;
  userId: string;
}

// Added this interface to fix the salesSummary errors
interface SalesSummaryItem {
  id: string;
  image?: string;
  name: string;
  quantity: number;
  date: string;
  amount: number;
  profit: number;
}

const Home = () => {
  const router = useRouter();
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [inventory, setInventory] = useState<Product[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const [userData, setUserData] = useState({
    name: "",
    profileImage: "",
    todaySales: 0,
    profit: 0,
    transactions: 0,
    stockLeft: 0,
    salesSummary: [] as SalesSummaryItem[],
  });

  const [fontsLoaded] = useFonts({
    "Poppins-Regular": require("../../assets/fonts/Poppins-Regular.ttf"),
    "Poppins-Bold": require("../../assets/fonts/Poppins-Bold.ttf"),
    "Poppins-Light": require("../../assets/fonts/Poppins-Light.ttf"),
  });

  const mapApiProduct = (product: ApiProduct): Product => ({
    id: String(product.id),
    name: product.name,
    category: product.category_name || "",
    barcode: product.barcode || "",
    image: product.image ? { uri: product.image } : null,
    quantityType: product.quantity_type || "Single Items",
    unitsInStock: product.quantity_left ?? product.quantity,
    costPrice: Number(product.buying_price || 0),
    sellingPrice: Number(product.selling_price || 0),
    lowStockThreshold: product.low_stock_threshold ?? 0,
    expiryDate: product.expiry_date || "",
    supplier: {
      name: product.supplier_name || product.supplier_obj_name || "",
      phone: product.supplier_phone || "",
    },
    dateAdded: product.created_at || new Date().toISOString(),
    userId: "api-user",
  });

  const toSalesSummary = (sales: ApiSale[]): SalesSummaryItem[] => {
    const summary: SalesSummaryItem[] = [];

    sales.forEach((sale) => {
      const items = Array.isArray(sale.items) ? sale.items : [];

      items.forEach((item: ApiSaleItem, index: number) => {
        const quantity = Number(item.quantity || 0);
        const amount = Number(item.subtotal || 0);
        const profit = Number(item.profit || 0);

        summary.push({
          id: `${sale.id}-${item.product}-${index}`,
          image: "",
          name: item.product_name || "Unknown Product",
          quantity,
          date: sale.sale_date || sale.created_at || new Date().toISOString(),
          amount,
          profit,
        });
      });
    });

    return summary.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );
  };

  const getTimeAgo = (dateString?: string): string => {
    if (!dateString) return "Just now";

    const date = new Date(dateString).getTime();
    const diff = Math.max(0, Date.now() - date);
    const minute = 60 * 1000;
    const hour = 60 * minute;
    const day = 24 * hour;

    if (diff < minute) return "Just now";
    if (diff < hour) return `${Math.floor(diff / minute)}m ago`;
    if (diff < day) return `${Math.floor(diff / hour)}h ago`;
    return `${Math.floor(diff / day)}d ago`;
  };

  const loadHomeData = useCallback(async () => {
    try {
      const [
        profile,
        overview,
        productsResponse,
        salesResponse,
        notificationsRes,
      ] = await Promise.all([
        getProfile(),
        getDashboardOverview(),
        listProducts(),
        listSales(),
        listNotifications(),
      ]);

      const mappedProducts = productsResponse.map(mapApiProduct);
      const salesSummary = toSalesSummary(salesResponse);
      const mappedNotifications: Notification[] = notificationsRes.map((n) => ({
        id: String(n.id),
        type: (n.type as Notification["type"]) || "daily_summary",
        title: n.title,
        message: n.message,
        time: getTimeAgo(n.created_at),
        isRead: n.is_read,
        productId: n.product ? String(n.product) : undefined,
        dateAdded: n.created_at ? new Date(n.created_at).getTime() : Date.now(),
      }));

      setInventory(mappedProducts);
      setNotifications(mappedNotifications);

      setUserData((prev) => ({
        ...prev,
        name: profile?.name || profile?.phone || "User",
        profileImage:
          profile?.profile_image || "https://via.placeholder.com/40",
        todaySales: Number(overview.today?.sales || 0),
        profit: Number(overview.today?.profit || 0),
        transactions: Number(overview.today?.transactions || 0),
        stockLeft: mappedProducts.reduce(
          (sum, p) => sum + (p.unitsInStock || 0),
          0,
        ),
        salesSummary,
      }));
    } catch (error) {
      console.error("Error loading home data:", error);
    }
  }, []);

  const handleAddProduct = async (productData: Omit<Product, "id">) => {
    try {
      const newProductWithId: Product = {
        ...productData,
        id: `temp-${Date.now()}`,
      };
      setInventory((prev: Product[]) => [...prev, newProductWithId]);

      setUserData((prev) => ({
        ...prev,
        stockLeft: prev.stockLeft + (productData.unitsInStock || 0),
      }));

      Alert.alert("Success", "Product added successfully!");
      await loadHomeData();
    } catch (error) {
      console.error("Error adding product:", error);
      Alert.alert("Error", "Failed to add product. Please try again.");
    }
  };

  useEffect(() => {
    loadHomeData();

    const interval = setInterval(() => {
      loadHomeData();
    }, 15000);

    return () => clearInterval(interval);
  }, [loadHomeData]);

  // Helper function to get the correct icon based on notification type
  const getNotificationIcon = (type: Notification["type"]) => {
    switch (type) {
      case "low_stock":
      case "out_of_stock":
        return (
          <Feather name="package" size={moderateScale(24)} color="#0056D2" />
        );
      case "high_selling":
        return (
          <Feather
            name="trending-up"
            size={moderateScale(24)}
            color="#0056D2"
          />
        );
      case "expiry":
        return (
          <Feather name="calendar" size={moderateScale(24)} color="#0056D2" />
        );
      case "daily_summary":
      case "weekly_summary":
        return (
          <Feather
            name="bar-chart-2"
            size={moderateScale(24)}
            color="#0056D2"
          />
        );
      default:
        return (
          <Ionicons
            name="notifications-outline"
            size={moderateScale(24)}
            color="#0056D2"
          />
        );
    }
  };

  // Helper function to format date for sales summary
  const formatSalesDate = (dateString: string) => {
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

  // Helper function to safely format currency
  const formatCurrency = (value: number | undefined) => {
    return `₦${(value || 0).toFixed(2)}`;
  };

  if (!fontsLoaded) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1155CC" />
        </View>
      </SafeAreaView>
    );
  }

  const renderHeader = () => (
    <>
      <View style={styles.header}>
        <View>
          <Text style={styles.hello}>Hello,</Text>
          <Text style={styles.username} numberOfLines={1}>
            {userData.name}
          </Text>
        </View>

        <View style={styles.headerIcons}>
          <TouchableOpacity
            onPress={() => router.push("/(Routes)/NotificationsScreen")}
            activeOpacity={0.7}
          >
            <Ionicons
              name="notifications-outline"
              size={moderateScale(24)}
              color="black"
            />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push("/(Routes)/MessagesScreen")}
            activeOpacity={0.7}
          >
            <Feather
              name="message-square"
              size={moderateScale(24)}
              color="black"
            />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              router.push("/(Routes)/Profile");
            }}
            activeOpacity={0.7}
          >
            <Image
              source={{
                uri: userData.profileImage || "https://via.placeholder.com/40",
              }}
              style={styles.avatar}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Today Sales */}
      <View style={styles.salesBox}>
        <View style={styles.salesTop}>
          <Text style={styles.salesLabel}>Today Sales</Text>
          <Text style={styles.salesRate}>+6.5%</Text>
        </View>
        <Text style={styles.salesAmount} numberOfLines={1} adjustsFontSizeToFit>
          {formatCurrency(userData.todaySales)}
        </Text>

        <View style={styles.profitRow}>
          <Text style={styles.profitLabel}>Profit</Text>
          <Text style={styles.profitAmount} numberOfLines={1}>
            {formatCurrency(userData.profit)}
          </Text>
        </View>
      </View>

      <View style={styles.row}>
        <View style={styles.infoBox}>
          <View style={styles.transactionRow}>
            <Text style={styles.infoLabel}>Transactions</Text>
            <Text style={styles.salesRate}>+6.5%</Text>
          </View>
          <Text style={styles.infoValue}>{userData.transactions}</Text>
        </View>
        <View style={styles.infoBox}>
          <Text style={styles.infoLabel}>Stock Left</Text>
          <Text style={styles.infoValue} numberOfLines={1} adjustsFontSizeToFit>
            {userData.stockLeft} Items
          </Text>
        </View>
      </View>

      <View style={styles.row}>
        <TouchableOpacity
          style={[styles.actionBox, { backgroundColor: "#061E47" }]}
          onPress={() => setShowAddProduct(true)}
          activeOpacity={0.8}
        >
          <Text style={styles.actionText}>
            New Product{" "}
            <Ionicons
              name="add-circle-outline"
              size={moderateScale(30)}
              color="#fff"
            />
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionBox, { backgroundColor: "#1155CC" }]}
          onPress={() => router.push("/(Routes)/QuickSellScreen")}
          activeOpacity={0.8}
        >
          <Text style={styles.actionText}>
            Quick Sell
            <Ionicons
              name="cart-outline"
              size={moderateScale(30)}
              color="#fff"
            />
          </Text>
        </TouchableOpacity>
      </View>

      {/* Updated Sales Summary Section - Matching Image */}
      <View style={styles.salesSummarySection}>
        <View style={styles.salesSummaryHeader}>
          <View style={styles.salesSummaryHeaderLeft}>
            <View style={styles.dollarIconCircle}>
              <Feather
                name="dollar-sign"
                size={moderateScale(20)}
                color="#000"
              />
            </View>
            <View style={styles.salesSummaryHeaderTextContainer}>
              <Text style={styles.salesSummaryHeaderTitle}>Sales Summary</Text>
              <Text style={styles.salesSummaryHeaderSubtitle}>
                Items sold are captured here
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.arrowIconCircle}
            onPress={() => {
              router.push({
                pathname: "/(Main)/Sell" as any,
                params: { tab: "history" },
              });
            }}
            activeOpacity={0.7}
          >
            <Feather
              name="arrow-up-right"
              size={moderateScale(20)}
              color="#fff"
            />
          </TouchableOpacity>
        </View>

        <FlatList
          data={userData.salesSummary.slice(0, 3)}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.salesSummaryCard}
              onPress={() =>
                router.push({
                  pathname: "/(Routes)/SalesDetailScreen" as any,
                  params: { sale: JSON.stringify(item) },
                })
              }
              activeOpacity={0.7}
            >
              {/* Product Image/Icon */}
              <View style={styles.productImageContainer}>
                {item.image ? (
                  <Image
                    source={{ uri: item.image }}
                    style={styles.productThumbnail}
                  />
                ) : (
                  <View style={styles.productPlaceholder}>
                    <Feather
                      name="package"
                      size={moderateScale(20)}
                      color="#666"
                    />
                  </View>
                )}
              </View>

              {/* Product Details */}
              <View style={styles.salesSummaryContent}>
                <Text style={styles.salesSummaryProductName} numberOfLines={1}>
                  {item.name} ×{item.quantity || 1}
                </Text>
                <Text style={styles.salesSummaryDate}>
                  {formatSalesDate(item.date)}
                </Text>
              </View>

              {/* Amount and Label */}
              <View style={styles.salesSummaryRight}>
                <Text
                  style={styles.salesSummaryAmount}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                >
                  {formatCurrency(item.amount)}
                </Text>
                <Text style={styles.salesSummaryLabel}>Cost</Text>
              </View>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No sales recorded yet</Text>
          }
          scrollEnabled={false}
        />
      </View>
    </>
  );

  const renderFooter = () => (
    <View style={styles.notificationSection}>
      <View style={styles.notificationHeader}>
        <View
          style={{ flexDirection: "row", alignItems: "center", gap: scale(8) }}
        >
          <Ionicons
            name="notifications"
            size={moderateScale(24)}
            color="#FACC15"
          />
          <Text style={styles.notificationHeaderTitle}>Notifications</Text>
        </View>
        <TouchableOpacity
          onPress={() => router.push("/(Routes)/NotificationsScreen")}
          activeOpacity={0.7}
        >
          <Text style={styles.viewAllLink}>View all notification</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={notifications.slice(0, 3)}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.notificationCard}
            onPress={() =>
              router.push({
                pathname: "/(Routes)/NotificationDetails" as any,
                params: { notification: JSON.stringify(item) },
              })
            }
            activeOpacity={0.7}
          >
            <View style={styles.notifLeftSection}>
              <View style={styles.notifIconBox}>
                {getNotificationIcon(item.type)}
              </View>
              <View style={styles.notifContent}>
                <View style={styles.notifTitleRow}>
                  <Text style={styles.notifTitle} numberOfLines={1}>
                    {item.title}
                  </Text>
                  <Text style={styles.notifTime}>{item.time}</Text>
                </View>
                <Text style={styles.notifMessage} numberOfLines={2}>
                  {item.message}
                </Text>
                {/* Action links based on notification type */}
                {(item.type === "low_stock" ||
                  item.type === "out_of_stock") && (
                  <Text style={styles.notifActions} numberOfLines={1}>
                    Tap to restock | View product page
                  </Text>
                )}
                {item.type === "daily_summary" && (
                  <Text style={styles.notifActions}>
                    Tap to open Daily Sales Summary
                  </Text>
                )}
              </View>
            </View>
            {/* Yellow indicator dot */}
            {!item.isRead && <View style={styles.unreadDot} />}
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No recent updates</Text>
        }
        scrollEnabled={false}
      />
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={[]} // Empty data since we're using ListHeaderComponent and ListFooterComponent
        keyExtractor={() => "main-list"}
        renderItem={null}
        ListHeaderComponent={renderHeader}
        ListFooterComponent={renderFooter}
        contentContainerStyle={{ paddingBottom: verticalScale(40) }}
        showsVerticalScrollIndicator={false}
      />

      <AddProductFlow
        visible={showAddProduct}
        onClose={() => setShowAddProduct(false)}
        onSaveProduct={handleAddProduct}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#E7EEFA",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#E7EEFA",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: scale(20),
    marginTop: verticalScale(20),
  },
  hello: {
    fontSize: getFontSize(moderateScale(20)),
    color: "#1C1C1C",
    fontFamily: "Poppins-Regular",
  },
  username: {
    fontSize: getFontSize(moderateScale(22)),
    fontWeight: "600",
    fontFamily: "Poppins-Regular",
    maxWidth: scale(isTablet ? 300 : 200),
    color: "#1C1C1C",
  },
  headerIcons: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(12),
    backgroundColor: "white",
    padding: scale(8),
    borderRadius: moderateScale(50),
  },
  avatar: {
    width: scale(40),
    height: scale(40),
    borderRadius: moderateScale(20),
    backgroundColor: "#eee",
  },
  salesBox: {
    backgroundColor: "#1155CC",
    borderRadius: moderateScale(12),
    padding: scale(16),
    margin: scale(20),
  },
  salesTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  salesLabel: {
    color: "#fff",
    fontSize: getFontSize(moderateScale(14)),
    fontFamily: "Poppins-Regular",
  },
  salesRate: {
    backgroundColor: "#E6F9EF",
    color: "#22C55E",
    paddingHorizontal: scale(8),
    paddingVertical: verticalScale(2),
    borderRadius: moderateScale(12),
    fontSize: getFontSize(moderateScale(12)),
    fontFamily: "Poppins-Regular",
  },
  salesAmount: {
    color: "white",
    fontSize: getFontSize(moderateScale(28)),
    fontWeight: "bold",
    marginTop: verticalScale(4),
    fontFamily: "Poppins-Bold",
  },
  profitRow: {
    marginTop: verticalScale(12),
    backgroundColor: "#fff",
    padding: scale(12),
    borderRadius: moderateScale(8),
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  profitLabel: {
    color: "#444",
    fontFamily: "Poppins-Regular",
    fontSize: getFontSize(moderateScale(14)),
  },
  profitAmount: {
    fontWeight: "600",
    fontFamily: "Poppins-Bold",
    fontSize: getFontSize(moderateScale(14)),
    flex: 1,
    textAlign: "right",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginHorizontal: scale(20),
    marginBottom: verticalScale(12),
    gap: scale(8),
  },
  infoBox: {
    flex: 1,
    backgroundColor: "white",
    borderRadius: moderateScale(12),
    padding: scale(10),
  },
  infoValue: {
    fontSize: getFontSize(moderateScale(20)),
    fontWeight: "600",
    fontFamily: "Poppins-Bold",
    marginTop: verticalScale(8),
  },
  infoLabel: {
    color: "#777",
    fontFamily: "Poppins-Regular",
    fontSize: getFontSize(moderateScale(13)),
  },
  transactionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: verticalScale(8),
  },
  actionBox: {
    flex: 1,
    borderRadius: moderateScale(12),
    padding: scale(20),
    alignItems: "center",
    justifyContent: "center",
    minHeight: verticalScale(60),
  },
  actionText: {
    color: "white",
    fontWeight: "600",
    fontFamily: "Poppins-Regular",
    fontSize: getFontSize(moderateScale(14)),
  },

  // Updated Sales Summary Styles - Matching Image
  salesSummarySection: {
    marginTop: verticalScale(20),
    marginHorizontal: scale(20),
    backgroundColor: "white",
    borderRadius: moderateScale(12),
    padding: scale(16),
  },
  salesSummaryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: verticalScale(16),
  },
  salesSummaryHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(12),
    flex: 1,
  },
  salesSummaryHeaderTextContainer: {
    flex: 1,
  },
  dollarIconCircle: {
    width: scale(40),
    height: scale(40),
    borderRadius: moderateScale(20),
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
  },
  salesSummaryHeaderTitle: {
    fontSize: getFontSize(moderateScale(16)),
    fontWeight: "600",
    fontFamily: "Poppins-Bold",
    color: "#000",
  },
  salesSummaryHeaderSubtitle: {
    fontSize: getFontSize(moderateScale(11)),
    fontFamily: "Poppins-Regular",
    color: "#999",
    marginTop: verticalScale(2),
  },
  arrowIconCircle: {
    width: scale(40),
    height: scale(40),
    borderRadius: moderateScale(20),
    backgroundColor: "#1C1C1C",
    justifyContent: "center",
    alignItems: "center",
  },
  salesSummaryCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    padding: scale(12),
    borderRadius: moderateScale(8),
    marginBottom: verticalScale(12),
    gap: scale(12),
    borderWidth: 1,
    borderColor: "#F3F4F6",
  },
  productImageContainer: {
    width: scale(48),
    height: scale(48),
  },
  productThumbnail: {
    width: scale(48),
    height: scale(48),
    borderRadius: moderateScale(8),
    backgroundColor: "#F3F4F6",
  },
  productPlaceholder: {
    width: scale(48),
    height: scale(48),
    borderRadius: moderateScale(8),
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
  },
  salesSummaryContent: {
    flex: 1,
  },
  salesSummaryProductName: {
    fontSize: getFontSize(moderateScale(14)),
    fontWeight: "500",
    fontFamily: "Poppins-Regular",
    color: "#000",
    marginBottom: verticalScale(4),
  },
  salesSummaryDate: {
    fontSize: getFontSize(moderateScale(11)),
    color: "#999",
    fontFamily: "Poppins-Regular",
  },
  salesSummaryRight: {
    alignItems: "flex-end",
    minWidth: scale(80),
  },
  salesSummaryAmount: {
    fontSize: getFontSize(moderateScale(16)),
    fontWeight: "600",
    fontFamily: "Poppins-Bold",
    color: "#000",
    marginBottom: verticalScale(2),
  },
  salesSummaryLabel: {
    fontSize: getFontSize(moderateScale(11)),
    color: "#999",
    fontFamily: "Poppins-Regular",
  },
  viewAllLink: {
    color: "#0056D2",
    fontSize: getFontSize(moderateScale(14)),
    fontFamily: "Poppins-Regular",
  },

  // Notification Styles
  notificationSection: {
    marginTop: verticalScale(20),
    marginHorizontal: scale(20),
    backgroundColor: "white",
    borderRadius: moderateScale(12),
    padding: scale(16),
    marginBottom: verticalScale(40),
  },
  notificationHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: verticalScale(16),
  },
  notificationHeaderTitle: {
    fontSize: getFontSize(moderateScale(18)),
    fontWeight: "600",
    fontFamily: "Poppins-Bold",
  },
  notificationCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    backgroundColor: "#F8F9FA",
    padding: scale(12),
    borderRadius: moderateScale(8),
    marginBottom: verticalScale(12),
  },
  notifLeftSection: {
    flexDirection: "row",
    flex: 1,
    gap: scale(12),
  },
  notifIconBox: {
    width: scale(48),
    height: scale(48),
    borderRadius: moderateScale(8),
    backgroundColor: "#E3F2FD",
    justifyContent: "center",
    alignItems: "center",
  },
  notifContent: {
    flex: 1,
  },
  notifTitleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: verticalScale(4),
  },
  notifTitle: {
    fontSize: getFontSize(moderateScale(14)),
    fontWeight: "600",
    fontFamily: "Poppins-Regular",
    color: "#333",
    flex: 1,
  },
  notifTime: {
    fontSize: getFontSize(moderateScale(11)),
    color: "#999",
    fontFamily: "Poppins-Regular",
    marginLeft: scale(8),
  },
  notifMessage: {
    fontSize: getFontSize(moderateScale(13)),
    color: "#666",
    fontFamily: "Poppins-Regular",
    marginBottom: verticalScale(4),
  },
  notifActions: {
    fontSize: getFontSize(moderateScale(12)),
    color: "#1155CC",
    fontFamily: "Poppins-Regular",
    marginTop: verticalScale(4),
  },
  unreadDot: {
    width: scale(8),
    height: scale(8),
    borderRadius: moderateScale(4),
    backgroundColor: "#FACC15",
    marginTop: verticalScale(8),
    marginLeft: scale(8),
  },
  emptyText: {
    textAlign: "center",
    color: "#777",
    marginTop: verticalScale(10),
    fontFamily: "Poppins-Regular",
    fontSize: getFontSize(moderateScale(14)),
  },
});

export default Home;
