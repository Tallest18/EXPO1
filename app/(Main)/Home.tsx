// app/(Main)/Home.tsx
import { Feather, Ionicons } from "@expo/vector-icons";
import { useFonts } from "expo-font";
import { useRouter } from "expo-router";
import {
  addDoc,
  collection,
  doc,
  DocumentData,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  QueryDocumentSnapshot,
  where,
} from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
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
import AddProductFlow from "../(Routes)/AddProductFlow";
import { auth, db } from "../config/firebaseConfig";

const { width, height } = Dimensions.get("window");

// Responsive sizing functions
const scale = (size: number) => (width / 375) * size;
const verticalScale = (size: number) => (height / 812) * size;
const moderateScale = (size: number, factor = 0.5) =>
  size + (scale(size) - size) * factor;

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
    | "app_update";
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

  const handleAddProduct = async (productData: Omit<Product, "id">) => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        Alert.alert("Error", "Please log in to add products");
        return;
      }

      // 1. Prepare the data for Firestore
      const newProductData = {
        ...productData,
        userId: currentUser.uid,
        dateAdded: new Date().toISOString(),
        createdAt: new Date(),
      };

      // 2. Add document to Firestore
      const docRef = await addDoc(collection(db, "products"), newProductData);

      // 3. Update local state with the new product including the generated ID
      const newProductWithId: Product = { ...newProductData, id: docRef.id };
      setInventory((prev: Product[]) => [...prev, newProductWithId]);

      setUserData((prev) => ({
        ...prev,
        stockLeft: prev.stockLeft + (newProductData.unitsInStock || 0),
      }));

      Alert.alert("Success", "Product added successfully!");
    } catch (error) {
      console.error("Error adding product:", error);
      Alert.alert("Error", "Failed to add product. Please try again.");
    }
  };

  useEffect(() => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    // Fetch user profile data
    const fetchUserData = async () => {
      const userDoc = await getDoc(doc(db, "users", currentUser.uid));
      if (userDoc.exists()) {
        const profile = userDoc.data();
        setUserData((prev) => ({
          ...prev,
          name: profile?.name || currentUser.phoneNumber || "User",
          profileImage:
            profile?.profileImage || "https://via.placeholder.com/40",
        }));
      }
    };
    fetchUserData();

    // Set up real-time listener for sales summary
    const salesQuery = query(
      collection(db, "sales"),
      where("userId", "==", currentUser.uid),
    );
    const unsubscribeSales = onSnapshot(salesQuery, (querySnapshot) => {
      let totalSales = 0;
      let totalProfit = 0;
      const salesSummary: SalesSummaryItem[] = [];

      querySnapshot.forEach((doc: QueryDocumentSnapshot<DocumentData>) => {
        const saleData = doc.data();

        // Process each sale's items to create individual summary entries
        if (saleData.items && Array.isArray(saleData.items)) {
          saleData.items.forEach((item: any) => {
            const sale = {
              id: doc.id + "_" + item.productId, // Unique ID for each item in the sale
              image: item.image || item.imageUrl || "",
              name: item.productName || item.name || "Unknown Product",
              quantity: item.quantity || 1,
              date: saleData.date || new Date().toISOString(),
              amount: item.totalPrice || item.unitPrice * item.quantity || 0,
              profit:
                ((item.unitPrice || 0) - (item.costPrice || 0)) *
                (item.quantity || 0),
            } as SalesSummaryItem;

            totalSales += sale.amount;
            totalProfit += sale.profit;
            salesSummary.push(sale);
          });
        } else {
          // Fallback for old data structure
          const sale = {
            id: doc.id,
            image: saleData.image || "",
            name: saleData.productName || saleData.name || "Unknown Product",
            quantity: saleData.quantity || 1,
            date: saleData.date || new Date().toISOString(),
            amount: saleData.totalAmount || saleData.amount || 0,
            profit: saleData.profit || 0,
          } as SalesSummaryItem;

          totalSales += sale.amount;
          totalProfit += sale.profit;
          salesSummary.push(sale);
        }
      });

      // Sort by date (most recent first)
      salesSummary.sort((a, b) => {
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        return dateB - dateA;
      });

      setUserData((prev) => ({
        ...prev,
        todaySales: totalSales,
        profit: totalProfit,
        transactions: querySnapshot.size, // Count actual number of sales transactions
        salesSummary,
      }));
    });

    // Set up real-time listener for inventory/stock
    const productsQuery = query(
      collection(db, "products"),
      where("userId", "==", currentUser.uid),
    );
    const unsubscribeProducts = onSnapshot(productsQuery, (productsSnap) => {
      let totalStock = 0;
      const inventoryProducts: Product[] = [];

      productsSnap.forEach((doc: QueryDocumentSnapshot<DocumentData>) => {
        const productData = { id: doc.id, ...doc.data() } as Product;
        totalStock += productData.unitsInStock || 0;
        inventoryProducts.push(productData);
      });

      setInventory(inventoryProducts);
      setUserData((prev) => ({
        ...prev,
        stockLeft: totalStock,
      }));
    });

    // Set up real-time listener for notifications
    const notificationsQuery = query(
      collection(db, "notifications"),
      orderBy("dateAdded", "desc"),
    );
    const unsubscribeNotifications = onSnapshot(
      notificationsQuery,
      (snapshot) => {
        const fetchedNotifications: Notification[] = [];
        snapshot.forEach((doc: QueryDocumentSnapshot<DocumentData>) => {
          fetchedNotifications.push({
            id: doc.id,
            ...doc.data(),
          } as Notification);
        });
        setNotifications(fetchedNotifications);
      },
      (error) => {
        console.error("Firestore error:", error);
      },
    );

    return () => {
      unsubscribeSales();
      unsubscribeProducts();
      unsubscribeNotifications();
    };
  }, []);

  // Helper function to get the correct icon based on notification type
  const getNotificationIcon = (type: Notification["type"]) => {
    switch (type) {
      case "low_stock":
      case "out_of_stock":
        return <Feather name="package" size={24} color="#0056D2" />;
      case "high_selling":
        return <Feather name="trending-up" size={24} color="#0056D2" />;
      case "expiry":
        return <Feather name="calendar" size={24} color="#0056D2" />;
      case "daily_summary":
      case "weekly_summary":
        return <Feather name="bar-chart-2" size={24} color="#0056D2" />;
      default:
        return (
          <Ionicons name="notifications-outline" size={24} color="#0056D2" />
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

  const renderHeader = () => (
    <>
      <View style={styles.header}>
        <View>
          <Text style={styles.hello}>Hello,</Text>
          <Text style={styles.username}>{userData.name}</Text>
        </View>

        <View style={styles.headerIcons}>
          <TouchableOpacity
            onPress={() => router.push("/(Routes)/NotificationsScreen")}
          >
            <Ionicons name="notifications-outline" size={24} color="black" />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push("/(Routes)/MessagesScreen")}
          >
            <Feather name="message-square" size={24} color="black" />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              if (auth.currentUser) {
                router.push("/(Routes)/Profile");
              }
            }}
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
        <Text style={styles.salesAmount}>
          {formatCurrency(userData.todaySales)}
        </Text>

        <View style={styles.profitRow}>
          <Text style={styles.profitLabel}>Profit</Text>
          <Text style={styles.profitAmount}>
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
          <Text style={styles.infoValue}>{userData.stockLeft} Items</Text>
        </View>
      </View>

      <View style={styles.row}>
        <TouchableOpacity
          style={[styles.actionBox, { backgroundColor: "#061E47" }]}
          onPress={() => setShowAddProduct(true)}
        >
          <Text style={styles.actionText}>
            New Product {/* Plus Icon */}
            <Ionicons name="add-circle-outline" size={30} color="#fff" />
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionBox, { backgroundColor: "#1155CC" }]}
          onPress={() => router.push("/(Routes)/QuickSellScreen")}
        >
          <Text style={styles.actionText}>
            Quick Sell
            <Ionicons name="cart-outline" size={30} color="#fff" />
          </Text>
        </TouchableOpacity>
      </View>

      {/* Updated Sales Summary Section - Matching Image */}
      <View style={styles.salesSummarySection}>
        <View style={styles.salesSummaryHeader}>
          <View style={styles.salesSummaryHeaderLeft}>
            <View style={styles.dollarIconCircle}>
              <Feather name="dollar-sign" size={20} color="#000" />
            </View>
            <View>
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
          >
            <Feather name="arrow-up-right" size={20} color="#fff" />
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
                    <Feather name="package" size={20} color="#666" />
                  </View>
                )}
              </View>

              {/* Product Details */}
              <View style={styles.salesSummaryContent}>
                <Text style={styles.salesSummaryProductName}>
                  {item.name} ×{item.quantity || 1}
                </Text>
                <Text style={styles.salesSummaryDate}>
                  {formatSalesDate(item.date)}
                </Text>
              </View>

              {/* Amount and Label */}
              <View style={styles.salesSummaryRight}>
                <Text style={styles.salesSummaryAmount}>
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
          <Ionicons name="notifications" size={24} color="#FACC15" />
          <Text style={styles.notificationHeaderTitle}>Notifications</Text>
        </View>
        <TouchableOpacity
          onPress={() => router.push("/(Routes)/NotificationsScreen")}
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
          >
            <View style={styles.notifLeftSection}>
              <View style={styles.notifIconBox}>
                {getNotificationIcon(item.type)}
              </View>
              <View style={styles.notifContent}>
                <View style={styles.notifTitleRow}>
                  <Text style={styles.notifTitle}>{item.title}</Text>
                  <Text style={styles.notifTime}>{item.time}</Text>
                </View>
                <Text style={styles.notifMessage}>{item.message}</Text>
                {/* Action links based on notification type */}
                {(item.type === "low_stock" ||
                  item.type === "out_of_stock") && (
                  <Text style={styles.notifActions}>
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
    paddingTop: verticalScale(0),
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: scale(20),
    marginTop: verticalScale(20),
  },
  hello: {
    fontSize: moderateScale(20),
    color: "#555",
    fontFamily: "Poppins-Regular",
  },
  username: {
    fontSize: moderateScale(22),
    fontWeight: "600",
    fontFamily: "Poppins-Regular",
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
    height: verticalScale(40),
    borderRadius: moderateScale(20),
    backgroundColor: "#eee",
  },

  salesBox: {
    backgroundColor: "#1155CC",
    borderRadius: moderateScale(12),
    padding: scale(16),
    margin: scale(20),
  },
  salesTop: { flexDirection: "row", justifyContent: "space-between" },
  salesLabel: {
    color: "#fff",
    fontSize: moderateScale(14),
    fontFamily: "Poppins-Regular",
  },
  salesRate: {
    backgroundColor: "#E6F9EF",
    color: "#22C55E",
    paddingHorizontal: scale(8),
    paddingVertical: verticalScale(2),
    borderRadius: moderateScale(12),
    fontSize: moderateScale(12),
    fontFamily: "Poppins-Regular",
  },
  salesAmount: {
    color: "white",
    fontSize: moderateScale(28),
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
  },
  profitLabel: { color: "#444", fontFamily: "Poppins-Regular" },
  profitAmount: { fontWeight: "600", fontFamily: "Poppins-Bold" },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginHorizontal: scale(20),
    marginBottom: verticalScale(12),
  },
  infoBox: {
    flex: 1,
    backgroundColor: "white",
    borderRadius: moderateScale(12),
    padding: scale(10),
    marginHorizontal: scale(4),
  },
  infoValue: {
    fontSize: moderateScale(20),
    fontWeight: "600",
    fontFamily: "Poppins-Bold",
    marginTop: verticalScale(8),
  },
  infoLabel: {
    color: "#777",
    fontFamily: "Poppins-Regular",
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
    marginHorizontal: scale(4),
    alignItems: "center",
    justifyContent: "center",
  },
  actionText: {
    color: "white",
    fontWeight: "600",
    fontFamily: "Poppins-Regular",
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
  dollarIconCircle: {
    width: scale(40),
    height: verticalScale(40),
    borderRadius: moderateScale(20),
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
  },
  salesSummaryHeaderTitle: {
    fontSize: moderateScale(16),
    fontWeight: "600",
    fontFamily: "Poppins-Bold",
    color: "#000",
  },
  salesSummaryHeaderSubtitle: {
    fontSize: moderateScale(11),
    fontFamily: "Poppins-Regular",
    color: "#999",
    marginTop: verticalScale(2),
  },
  arrowIconCircle: {
    width: scale(40),
    height: verticalScale(40),
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
    height: verticalScale(48),
  },
  productThumbnail: {
    width: scale(48),
    height: verticalScale(48),
    borderRadius: moderateScale(8),
    backgroundColor: "#F3F4F6",
  },
  productPlaceholder: {
    width: scale(48),
    height: verticalScale(48),
    borderRadius: moderateScale(8),
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
  },
  salesSummaryContent: {
    flex: 1,
  },
  salesSummaryProductName: {
    fontSize: moderateScale(14),
    fontWeight: "500",
    fontFamily: "Poppins-Regular",
    color: "#000",
    marginBottom: verticalScale(4),
  },
  salesSummaryDate: {
    fontSize: moderateScale(11),
    color: "#999",
    fontFamily: "Poppins-Regular",
  },
  salesSummaryRight: {
    alignItems: "flex-end",
  },
  salesSummaryAmount: {
    fontSize: moderateScale(16),
    fontWeight: "600",
    fontFamily: "Poppins-Bold",
    color: "#000",
    marginBottom: verticalScale(2),
  },
  salesSummaryLabel: {
    fontSize: moderateScale(11),
    color: "#999",
    fontFamily: "Poppins-Regular",
  },
  viewAllLink: {
    color: "#0056D2",
    fontSize: moderateScale(14),
    fontFamily: "Poppins-Regular",
  },

  // Notification Styles (unchanged)
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
    fontSize: moderateScale(18),
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
    height: verticalScale(48),
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
    fontSize: moderateScale(14),
    fontWeight: "600",
    fontFamily: "Poppins-Regular",
    color: "#333",
    flex: 1,
  },
  notifTime: {
    fontSize: moderateScale(11),
    color: "#999",
    fontFamily: "Poppins-Regular",
    marginLeft: 8,
  },
  notifMessage: {
    fontSize: moderateScale(13),
    color: "#666",
    fontFamily: "Poppins-Regular",
    marginBottom: verticalScale(4),
  },
  notifActions: {
    fontSize: moderateScale(12),
    color: "#1155CC",
    fontFamily: "Poppins-Regular",
    marginTop: verticalScale(4),
  },
  unreadDot: {
    width: scale(8),
    height: verticalScale(8),
    borderRadius: moderateScale(4),
    backgroundColor: "#FACC15",
    marginTop: verticalScale(8),
    marginLeft: 8,
  },
  emptyText: {
    textAlign: "center",
    color: "#777",
    marginTop: verticalScale(10),
    fontFamily: "Poppins-Regular",
  },
});

export default Home;
