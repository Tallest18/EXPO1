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

const { width } = Dimensions.get("window");

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
      where("userId", "==", currentUser.uid)
    );
    const unsubscribeSales = onSnapshot(salesQuery, (querySnapshot) => {
      let totalSales = 0;
      let totalProfit = 0;
      const salesSummary: SalesSummaryItem[] = [];

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
        } as SalesSummaryItem;

        totalSales += sale.amount;
        totalProfit += sale.profit;
        salesSummary.push(sale);
      });

      setUserData((prev) => ({
        ...prev,
        todaySales: totalSales,
        profit: totalProfit,
        transactions: salesSummary.length,
        salesSummary,
      }));
    });

    // Set up real-time listener for inventory/stock
    const productsQuery = query(
      collection(db, "products"),
      where("userId", "==", currentUser.uid)
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
      orderBy("dateAdded", "desc")
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
      }
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
          <Text style={styles.salesRate}>+6.5%</Text>
          <Text style={styles.infoLabel}>Transactions</Text>
          <Text style={styles.infoValue}>{userData.transactions}</Text>
        </View>
        <View style={styles.infoBox}>
          <Text style={styles.infoLabel}>Stock Left</Text>
          <Text style={styles.infoValue}>{userData.stockLeft} Items</Text>
        </View>
      </View>

      <View style={styles.row}>
        <TouchableOpacity
          style={[styles.actionBox, { backgroundColor: "#001F54" }]}
          onPress={() => setShowAddProduct(true)}
        >
          <Text style={styles.actionText}>
            New Product {/* Plus Icon */}
            <Ionicons name="add-circle-outline" size={30} color="#fff" />
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionBox, { backgroundColor: "#0056D2" }]}
          onPress={() => router.push("/(Routes)/QuickSellScreen")}
        >
          <Text style={styles.actionText}>
            Quick Sell
            <Ionicons name="cart-outline" size={30} color="#fff" />
          </Text>
        </TouchableOpacity>
      </View>

      {/* Updated Sales Summary Section */}
      <View style={styles.salesSummarySection}>
        <View style={styles.salesSummaryHeader}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Feather name="dollar-sign" size={24} color="#22C55E" />
            <Text style={styles.salesSummaryHeaderTitle}>Sales Summary</Text>
          </View>
          <TouchableOpacity
            onPress={() => router.push("/(Routes)/TotalSummaryScreen")}
          >
            <Text style={styles.viewAllLink}>View all sales</Text>
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
              <View style={styles.salesSummaryLeftSection}>
                <View style={styles.salesSummaryIconBox}>
                  <Feather name="shopping-bag" size={24} color="#22C55E" />
                </View>
                <View style={styles.salesSummaryContent}>
                  <View style={styles.salesSummaryTitleRow}>
                    <Text style={styles.salesSummaryTitle}>
                      {item.name || "Unknown Product"} ×{item.quantity || 1}
                    </Text>
                    <Text style={styles.salesSummaryTime}>
                      {formatSalesDate(item.date)}
                    </Text>
                  </View>
                  <Text style={styles.salesSummaryMessage}>
                    Amount: {formatCurrency(item.amount)} • Profit:{" "}
                    {formatCurrency(item.profit)}
                  </Text>
                  <Text style={styles.salesSummaryActions}>
                    Tap to view sale details | View product
                  </Text>
                </View>
              </View>
              {/* Green indicator dot for recent sales */}
              <View style={styles.recentSaleDot} />
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
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
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
        contentContainerStyle={{ paddingBottom: 40 }}
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
    paddingTop: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginTop: 20,
  },
  hello: { fontSize: 20, color: "#555", fontFamily: "Poppins-Regular" },
  username: { fontSize: 22, fontWeight: "600", fontFamily: "Poppins-Regular" },
  headerIcons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "white",
    padding: 8,
    borderRadius: 50,
  },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: "#eee" },

  salesBox: {
    backgroundColor: "#0056D2",
    borderRadius: 12,
    padding: 16,
    margin: 20,
  },
  salesTop: { flexDirection: "row", justifyContent: "space-between" },
  salesLabel: { color: "#fff", fontSize: 14 },
  salesRate: {
    backgroundColor: "#E6F9EF",
    color: "#22C55E",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    fontSize: 12,
  },
  salesAmount: {
    color: "white",
    fontSize: 28,
    fontWeight: "bold",
    marginTop: 4,
  },
  profitRow: {
    marginTop: 12,
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 8,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  profitLabel: { color: "#444" },
  profitAmount: { fontWeight: "600" },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginHorizontal: 20,
    marginBottom: 12,
  },
  infoBox: {
    flex: 1,
    backgroundColor: "white",
    borderRadius: 12,
    padding: 10,
    marginHorizontal: 4,
    elevation: 2,
  },
  infoValue: {
    fontSize: 20,
    marginTop: 20,
    fontWeight: "600",
    fontFamily: "Poppins-Bold",
  },
  infoLabel: { color: "#777" },
  actionBox: {
    flex: 1,
    borderRadius: 12,
    padding: 20,
    marginHorizontal: 4,
    alignItems: "center",
    justifyContent: "center",
  },
  actionText: {
    color: "white",
    fontWeight: "600",
    fontFamily: "Poppins-Regular",
  },

  // Updated Sales Summary Styles (matching notification design)
  salesSummarySection: {
    marginTop: 20,
    marginHorizontal: 20,
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
  },
  salesSummaryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  salesSummaryHeaderTitle: {
    fontSize: 18,
    fontWeight: "600",
    fontFamily: "Poppins-Bold",
  },
  viewAllLink: {
    color: "#0056D2",
    fontSize: 14,
    fontFamily: "Poppins-Regular",
  },
  salesSummaryCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    backgroundColor: "#F0F9FF",
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  salesSummaryLeftSection: {
    flexDirection: "row",
    flex: 1,
    gap: 12,
  },
  salesSummaryIconBox: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: "#DCFCE7",
    justifyContent: "center",
    alignItems: "center",
  },
  salesSummaryContent: {
    flex: 1,
  },
  salesSummaryTitleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  salesSummaryTitle: {
    fontSize: 14,
    fontWeight: "600",
    fontFamily: "Poppins-Regular",
    color: "#333",
    flex: 1,
  },
  salesSummaryTime: {
    fontSize: 11,
    color: "#999",
    fontFamily: "Poppins-Regular",
    marginLeft: 8,
  },
  salesSummaryMessage: {
    fontSize: 13,
    color: "#666",
    fontFamily: "Poppins-Regular",
    marginBottom: 4,
  },
  salesSummaryActions: {
    fontSize: 12,
    color: "#0056D2",
    fontFamily: "Poppins-Regular",
    marginTop: 4,
  },
  recentSaleDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#22C55E",
    marginTop: 8,
    marginLeft: 8,
  },

  // Notification Styles (unchanged)
  notificationSection: {
    marginTop: 20,
    marginHorizontal: 20,
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    marginBottom: 40,
  },
  notificationHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  notificationHeaderTitle: {
    fontSize: 18,
    fontWeight: "600",
    fontFamily: "Poppins-Bold",
  },
  notificationCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    backgroundColor: "#F8F9FA",
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  notifLeftSection: {
    flexDirection: "row",
    flex: 1,
    gap: 12,
  },
  notifIconBox: {
    width: 48,
    height: 48,
    borderRadius: 8,
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
    marginBottom: 4,
  },
  notifTitle: {
    fontSize: 14,
    fontWeight: "600",
    fontFamily: "Poppins-Regular",
    color: "#333",
    flex: 1,
  },
  notifTime: {
    fontSize: 11,
    color: "#999",
    fontFamily: "Poppins-Regular",
    marginLeft: 8,
  },
  notifMessage: {
    fontSize: 13,
    color: "#666",
    fontFamily: "Poppins-Regular",
    marginBottom: 4,
  },
  notifActions: {
    fontSize: 12,
    color: "#0056D2",
    fontFamily: "Poppins-Regular",
    marginTop: 4,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#FACC15",
    marginTop: 8,
    marginLeft: 8,
  },
  emptyText: {
    textAlign: "center",
    color: "#777",
    marginTop: 10,
    fontFamily: "Poppins-Regular",
  },
});

export default Home;
