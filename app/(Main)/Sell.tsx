import { Feather } from "@expo/vector-icons";
import { useFonts } from "expo-font";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  collection,
  DocumentData,
  onSnapshot,
  query,
  QueryDocumentSnapshot,
  where
} from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { auth, db } from "../config/firebaseConfig";

// Types
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

interface CartItem {
  productId: string;
  quantity: number;
}

interface SaleItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

interface Sale {
  id: string;
  items: SaleItem[];
  totalAmount: number;
  paymentMethod: string;
  date: string;
  timestamp: any;
}

type TabType = "all" | "history";

const Sell: React.FC = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [activeTab, setActiveTab] = useState<TabType>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);

  const [fontsLoaded] = useFonts({
    "Poppins-Regular": require("../../assets/fonts/Poppins-Regular.ttf"),
    "Poppins-Bold": require("../../assets/fonts/Poppins-Bold.ttf"),
    "Poppins-Light": require("../../assets/fonts/Poppins-Light.ttf"),
  });

  // Check if we should navigate to history tab from params
  useEffect(() => {
    if (params.tab === "history") {
      setActiveTab("history");
    }
  }, [params]);

  useEffect(() => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      console.log("ERROR: No authenticated user found");
      setLoading(false);
      return;
    }

    const productsQuery = query(
      collection(db, "products"),
      where("userId", "==", currentUser.uid)
    );

    const unsubscribe = onSnapshot(
      productsQuery,
      (snapshot) => {
        const productsData: Product[] = [];
        snapshot.forEach((doc: QueryDocumentSnapshot<DocumentData>) => {
          const data = doc.data();
          productsData.push({
            id: doc.id,
            ...data,
          } as Product);
        });

        // Sort by most frequently sold or date added
        productsData.sort((a, b) => {
          const dateA = new Date(a.dateAdded).getTime();
          const dateB = new Date(b.dateAdded).getTime();
          return dateB - dateA;
        });

        setProducts(productsData);
        setFilteredProducts(productsData);
        setLoading(false);
      },
      (error) => {
        console.error("Firestore error:", error);
        Alert.alert(
          "Error Loading Products",
          `There was an issue loading your products: ${error.message}`,
          [{ text: "OK" }]
        );
        setLoading(false);
      }
    );

    // Fetch sales history
    const salesQuery = query(
      collection(db, "sales"),
      where("userId", "==", currentUser.uid)
    );

    const unsubscribeSales = onSnapshot(
      salesQuery,
      (snapshot) => {
        const salesData: Sale[] = [];
        snapshot.forEach((doc: QueryDocumentSnapshot<DocumentData>) => {
          const data = doc.data();
          salesData.push({
            id: doc.id,
            ...data,
          } as Sale);
        });

        // Sort by date (most recent first)
        salesData.sort((a, b) => {
          const dateA = new Date(a.date).getTime();
          const dateB = new Date(b.date).getTime();
          return dateB - dateA;
        });

        setSales(salesData);
      },
      (error) => {
        console.error("Error loading sales:", error);
      }
    );

    return () => {
      unsubscribe();
      unsubscribeSales();
    };
  }, []);

  useEffect(() => {
    if (searchQuery.trim()) {
      const searchTerm = searchQuery.toLowerCase().trim();
      const filtered = products.filter((product) => {
        const name = product.name?.toLowerCase() || "";
        const category = product.category?.toLowerCase() || "";
        return name.includes(searchTerm) || category.includes(searchTerm);
      });
      setFilteredProducts(filtered);
    } else {
      setFilteredProducts(products);
    }
  }, [searchQuery, products]);

  const handleSearchChange = (text: string): void => {
    setSearchQuery(text);
  };

  const handleCartIconPress = (productId: string): void => {
    const product = products.find((p) => p.id === productId);
    if (!product) return;

    if (product.unitsInStock <= 0) {
      Alert.alert("Out of Stock", "This product is currently out of stock.");
      return;
    }

    // Add product to cart immediately with quantity 1
    setCart((prevCart) => {
      const existingItem = prevCart.find(
        (item) => item.productId === productId
      );
      if (existingItem) {
        // Already in cart, do nothing (quantity selector already visible)
        return prevCart;
      } else {
        // Add new item with quantity 1
        return [...prevCart, { productId, quantity: 1 }];
      }
    });
  };

  const incrementQuantity = (productId: string): void => {
    const product = products.find((p) => p.id === productId);
    if (!product) return;

    const cartItem = cart.find((item) => item.productId === productId);
    const currentQty = cartItem ? cartItem.quantity : 0;

    if (currentQty >= product.unitsInStock) {
      Alert.alert(
        "Stock Limit",
        `Only ${product.unitsInStock} units available in stock`
      );
      return;
    }

    setCart((prevCart) =>
      prevCart.map((item) =>
        item.productId === productId
          ? { ...item, quantity: item.quantity + 1 }
          : item
      )
    );
  };

  const decrementQuantity = (productId: string): void => {
    const cartItem = cart.find((item) => item.productId === productId);
    if (!cartItem) return;

    if (cartItem.quantity > 1) {
      setCart((prevCart) =>
        prevCart.map((item) =>
          item.productId === productId
            ? { ...item, quantity: item.quantity - 1 }
            : item
        )
      );
    } else {
      // Remove from cart if quantity would be 0
      setCart((prevCart) =>
        prevCart.filter((item) => item.productId !== productId)
      );
    }
  };

  const getTotalCartItems = (): number => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  };

  const viewCart = (): void => {
    if (cart.length === 0) {
      Alert.alert("Empty Cart", "Your cart is empty. Add some products first!");
      return;
    }
    
    console.log("Navigating to cart with items:", cart);
    
    router.push({
      pathname: "/(Routes)/Cart" as any,
      params: { 
        cartData: JSON.stringify(cart),
        timestamp: Date.now().toString() // Force refresh
      },
    });
  };

  const renderProductCard = (product: Product): React.ReactElement | null => {
    if (!product || !product.id) return null;

    const isOutOfStock = product.unitsInStock <= 0;
    const cartItem = cart.find((item) => item.productId === product.id);
    const isInCart = !!cartItem;
    const quantity = cartItem ? cartItem.quantity : 0;

    return (
      <View key={product.id} style={styles.productCard}>
        <Image
          source={
            product.image?.uri
              ? { uri: product.image.uri }
              : { uri: "https://via.placeholder.com/120" }
          }
          style={styles.productImage}
        />
        <View style={styles.productDetails}>
          <Text style={styles.productName} numberOfLines={2}>
            {product.name || "Unnamed Product"}
          </Text>
          
          {!isInCart ? (
            <View style={styles.priceRow}>
              <Text style={styles.productPrice}>
                ₦{(product.sellingPrice || 0).toLocaleString()}
              </Text>
              <TouchableOpacity
                style={[
                  styles.addToCartButton,
                  isOutOfStock && styles.addToCartButtonDisabled,
                ]}
                onPress={() => handleCartIconPress(product.id)}
                disabled={isOutOfStock}
              >
                <Feather
                  name="shopping-cart"
                  size={20}
                  color={isOutOfStock ? "#999" : "white"}
                />
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.quantityRow}>
              <TouchableOpacity
                style={styles.quantityButton}
                onPress={() => decrementQuantity(product.id)}
              >
                <Feather name="minus" size={18} color="#007AFF" />
              </TouchableOpacity>
              
              <Text style={styles.quantityText}>{quantity}</Text>
              
              <TouchableOpacity
                style={styles.quantityButton}
                onPress={() => incrementQuantity(product.id)}
              >
                <Feather name="plus" size={18} color="#007AFF" />
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    );
  };

  const renderEmptyState = (): React.ReactElement => (
    <View style={styles.emptyState}>
      <Feather name="package" size={80} color="#E0E0E0" />
      <Text style={styles.emptyTitle}>No Products Available</Text>
      <Text style={styles.emptyDescription}>
        Add products to your inventory to start selling
      </Text>
    </View>
  );

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const options: Intl.DateTimeFormatOptions = {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    };
    return date.toLocaleDateString("en-US", options);
  };

  const groupSalesByDate = (): { [key: string]: Sale[] } => {
    const grouped: { [key: string]: Sale[] } = {};
    sales.forEach((sale) => {
      const dateKey = formatDate(sale.date);
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(sale);
    });
    return grouped;
  };

  const renderSaleItem = (sale: Sale): React.ReactElement => {
    const firstItem = sale.items[0];
    const totalQuantity = sale.items.reduce(
      (sum, item) => sum + item.quantity,
      0
    );

    return (
      <View key={sale.id} style={styles.saleCard}>
        <View style={styles.saleCardContent}>
          <View style={styles.saleProductInfo}>
            <View style={styles.productIconContainer}>
              <View style={styles.productIcon} />
            </View>
            <View style={styles.saleDetails}>
              <Text style={styles.saleProductName}>
                {firstItem ? firstItem.productName : "Sale"}
              </Text>
              <Text style={styles.saleQuantity}>
                Qty: {totalQuantity}, {sale.items.length} item
                {sale.items.length > 1 ? "s" : ""} • {sale.paymentMethod}
              </Text>
            </View>
          </View>
          <View style={styles.saleRightSection}>
            <Text style={styles.saleAmount}>
              ₦{sale.totalAmount.toLocaleString()}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  const renderSalesHistory = (): React.ReactElement => {
    if (sales.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Feather name="clock" size={80} color="#E0E0E0" />
          <Text style={styles.emptyTitle}>No Sales History</Text>
          <Text style={styles.emptyDescription}>
            Your sales history will appear here
          </Text>
        </View>
      );
    }

    const groupedSales = groupSalesByDate();

    return (
      <View style={styles.historyContainer}>
        {Object.entries(groupedSales).map(([date, salesForDate]) => (
          <View key={date} style={styles.dateGroup}>
            <Text style={styles.dateHeader}>{date}</Text>
            {salesForDate.map((sale) => renderSaleItem(sale))}
          </View>
        ))}
      </View>
    );
  };

  if (loading || !fontsLoaded) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading products...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Sell</Text>
        <View style={styles.cartContainer}>
          <Text style={styles.cartfont}>Cart</Text>
          <TouchableOpacity style={styles.cartButton} onPress={viewCart}>
            <Feather name="shopping-cart" size={24} color="#007AFF" />
            {getTotalCartItems() > 0 && (
              <View style={styles.cartBadge}>
                <Text style={styles.cartBadgeText}>{getTotalCartItems()}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Feather name="search" size={16} color="#999" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search products"
            value={searchQuery}
            onChangeText={handleSearchChange}
            placeholderTextColor="#999"
            returnKeyType="search"
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>
        {/* Filter button is a placeholder, as the actual filtering is done via tabs */}
        <TouchableOpacity style={styles.filterButton}>
          <Feather name="sliders" size={20} color="#333" />
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "all" && styles.activeTab]}
          onPress={() => setActiveTab("all")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "all" && styles.activeTabText,
            ]}
          >
            All Products
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "history" && styles.activeTab]}
          onPress={() => setActiveTab("history")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "history" && styles.activeTabText,
            ]}
          >
            History
          </Text>
        </TouchableOpacity>
      </View>

      {/* Section Title */}
      {activeTab === "all" && products.length > 0 && (
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Frequently sold products</Text>
        </View>
      )}

      {/* Products Grid */}
      <ScrollView
        style={styles.productsContainer}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {activeTab === "all" ? (
          filteredProducts.length === 0 ? (
            renderEmptyState()
          ) : (
            <View style={styles.productsGrid}>
              {filteredProducts.map((product) => renderProductCard(product))}
            </View>
          )
        ) : (
          renderSalesHistory()
        )}

        {/* Bottom padding to ensure content doesn't get hidden behind the fixed button */}
        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* View Cart Button - Always visible when cart has items */}
      {getTotalCartItems() > 0 && (
        <View style={styles.viewCartContainer}>
          <TouchableOpacity style={styles.viewCartButton} onPress={viewCart}>
            <Feather name="shopping-cart" size={20} color="white" />
            <Text style={styles.viewCartButtonText}>
              Click to view cart ({getTotalCartItems()})
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#E7EEFA",
    paddingTop: 0,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#666",
    fontFamily: "Poppins-Regular",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: "#E7EEFA",
  },
  headerTitle: {
    fontSize: 34,
    color: "#000",
    fontFamily: "Poppins-Bold",
  },
  cartButton: {
    position: "relative",
    padding: 8,
  },
  cartBadge: {
    position: "absolute",
    top: 0,
    right: 0,
    backgroundColor: "#FF3B30",
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 5,
  },
  cartBadgeText: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
    fontFamily: "Poppins-Bold",
  },
  cartContainer: {
    flexDirection: "row",
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "#B5CAEF",
    margin: 5,
    paddingHorizontal: 10,
    paddingVertical: 1,
    alignItems: "center",
    gap: 5,
  },
  cartfont: {
    fontSize: 16,
    fontFamily: "Poppins-Regular",
  },
  searchContainer: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingVertical: 8,
    backgroundColor: "#E7EEFA",
    alignItems: "center",
    gap: 12,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 18,
    fontFamily: "Poppins-Regular",
    color: "#000",
  },
  filterButton: {
    backgroundColor: "#F8F9FA",
    borderRadius: 12,
    padding: 15,
  },
  tabsContainer: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingVertical: 10,
    gap: 12,
    backgroundColor: "#E7EEFA",
  },
  tab: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: "transparent",
  },
  activeTab: {
    backgroundColor: "#FFFFFF",
    borderColor: "#B5CAEF",
    borderWidth: 1,
  },
  tabText: {
    fontSize: 16,
    fontFamily: "Poppins-Regular",
    color: "#666",
  },
  activeTabText: {
    color: "#000",
    fontWeight: "600",
  },
  sectionHeader: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: "#E7EEFA",
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: "Poppins-Regular",
    color: "#666",
  },
  productsContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  scrollContent: {
    paddingBottom: 100, // Add padding for the fixed button
  },
  productsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    paddingTop: 10,
  },
  productCard: {
    width: "48%",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  productImage: {
    width: "100%",
    height: 120,
    borderRadius: 8,
    backgroundColor: "#F0F0F0",
    marginBottom: 8,
  },
  productDetails: {
    gap: 8,
  },
  productName: {
    fontSize: 16,
    fontFamily: "Poppins-Bold",
    color: "#000",
    minHeight: 40,
  },
  priceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#EBEFFC",
    padding: 5,
    borderRadius: 50,
  },
  productPrice: {
    fontSize: 18,
    fontFamily: "Poppins-Bold",
    color: "#000",
  },
  addToCartButton: {
    backgroundColor: "#007AFF",
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  addToCartButtonDisabled: {
    backgroundColor: "#E0E0E0",
  },
  quantityRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#EBEFFC",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 50,
    gap: 16,
  },
  quantityButton: {
    width: 32,
    height: 32,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
  },
  quantityText: {
    fontSize: 18,
    fontFamily: "Poppins-Bold",
    color: "#000",
    minWidth: 24,
    textAlign: "center",
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#666",
    marginTop: 16,
    marginBottom: 8,
    fontFamily: "Poppins-Regular",
  },
  emptyDescription: {
    fontSize: 14,
    color: "#999",
    textAlign: "center",
    paddingHorizontal: 40,
    fontFamily: "Poppins-Regular",
  },
  viewCartContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    backgroundColor: "#E7EEFA",
    borderTopWidth: 1,
    borderTopColor: "#D0D0D0",
  },
  viewCartButton: {
    backgroundColor: "#007AFF",
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  viewCartButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
    fontFamily: "Poppins-Regular",
  },
  bottomPadding: {
    height: 20,
  },
  // Sales History Styles
  historyContainer: {
    paddingTop: 10,
  },
  dateGroup: {
    marginBottom: 20,
  },
  dateHeader: {
    fontSize: 12,
    fontFamily: "Poppins-Regular",
    color: "#666",
    marginBottom: 10,
  },
  saleCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  saleCardContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  saleProductInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  productIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: "#F5F7FA",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  productIcon: {
    width: 24,
    height: 24,
    borderRadius: 4,
    backgroundColor: "#C77D4A",
  },
  saleDetails: {
    flex: 1,
  },
  saleProductName: {
    fontSize: 15,
    fontFamily: "Poppins-Regular",
    color: "#000",
    marginBottom: 2,
  },
  saleQuantity: {
    fontSize: 12,
    fontFamily: "Poppins-Regular",
    color: "#999",
  },
  saleAmount: {
    fontSize: 16,
    fontFamily: "Poppins-Bold",
    color: "#000",
    marginBottom: 4,
  },
  saleRightSection: {
    alignItems: "flex-end",
    gap: 4,
  },
});

export default Sell;