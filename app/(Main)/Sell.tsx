import { Feather } from "@expo/vector-icons";
import { useFonts } from "expo-font";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  collection,
  DocumentData,
  onSnapshot,
  query,
  QueryDocumentSnapshot,
  where,
} from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
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
      where("userId", "==", currentUser.uid),
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
          [{ text: "OK" }],
        );
        setLoading(false);
      },
    );

    // Fetch sales history
    const salesQuery = query(
      collection(db, "sales"),
      where("userId", "==", currentUser.uid),
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
      },
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
        (item) => item.productId === productId,
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
        `Only ${product.unitsInStock} units available in stock`,
      );
      return;
    }

    setCart((prevCart) =>
      prevCart.map((item) =>
        item.productId === productId
          ? { ...item, quantity: item.quantity + 1 }
          : item,
      ),
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
            : item,
        ),
      );
    } else {
      // Remove from cart if quantity would be 0
      setCart((prevCart) =>
        prevCart.filter((item) => item.productId !== productId),
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
        timestamp: Date.now().toString(), // Force refresh
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
              <Text
                style={styles.productPrice}
                numberOfLines={1}
                adjustsFontSizeToFit
              >
                ₦{(product.sellingPrice || 0).toLocaleString()}
              </Text>
              <TouchableOpacity
                style={[
                  styles.addToCartButton,
                  isOutOfStock && styles.addToCartButtonDisabled,
                ]}
                onPress={() => handleCartIconPress(product.id)}
                disabled={isOutOfStock}
                activeOpacity={0.8}
              >
                <Feather
                  name="shopping-cart"
                  size={moderateScale(20)}
                  color={isOutOfStock ? "#999" : "white"}
                />
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.quantityRow}>
              <TouchableOpacity
                style={styles.quantityButton}
                onPress={() => decrementQuantity(product.id)}
                activeOpacity={0.7}
              >
                <Feather
                  name="minus"
                  size={moderateScale(18)}
                  color="#007AFF"
                />
              </TouchableOpacity>

              <Text style={styles.quantityText}>{quantity}</Text>

              <TouchableOpacity
                style={styles.quantityButton}
                onPress={() => incrementQuantity(product.id)}
                activeOpacity={0.7}
              >
                <Feather name="plus" size={moderateScale(18)} color="#007AFF" />
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    );
  };

  const renderEmptyState = (): React.ReactElement => (
    <View style={styles.emptyState}>
      <Feather name="package" size={moderateScale(80)} color="#E0E0E0" />
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
      0,
    );

    return (
      <View key={sale.id} style={styles.saleCard}>
        <View style={styles.saleCardContent}>
          <View style={styles.saleProductInfo}>
            <View style={styles.productIconContainer}>
              <View style={styles.productIcon} />
            </View>
            <View style={styles.saleDetails}>
              <Text style={styles.saleProductName} numberOfLines={1}>
                {firstItem ? firstItem.productName : "Sale"}
              </Text>
              <Text style={styles.saleQuantity} numberOfLines={1}>
                Qty: {totalQuantity}, {sale.items.length} item
                {sale.items.length > 1 ? "s" : ""} • {sale.paymentMethod}
              </Text>
            </View>
          </View>
          <View style={styles.saleRightSection}>
            <Text
              style={styles.saleAmount}
              numberOfLines={1}
              adjustsFontSizeToFit
            >
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
          <Feather name="clock" size={moderateScale(80)} color="#E0E0E0" />
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
          <TouchableOpacity
            style={styles.cartButton}
            onPress={viewCart}
            activeOpacity={0.7}
          >
            <Feather
              name="shopping-cart"
              size={moderateScale(24)}
              color="#007AFF"
            />
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
          <Feather name="search" size={moderateScale(16)} color="#999" />
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
        <TouchableOpacity style={styles.filterButton} activeOpacity={0.7}>
          <Feather name="sliders" size={moderateScale(20)} color="#333" />
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "all" && styles.activeTab]}
          onPress={() => setActiveTab("all")}
          activeOpacity={0.7}
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
          activeOpacity={0.7}
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
          <TouchableOpacity
            style={styles.viewCartButton}
            onPress={viewCart}
            activeOpacity={0.8}
          >
            <Feather
              name="shopping-cart"
              size={moderateScale(20)}
              color="white"
            />
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
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#E7EEFA",
  },
  loadingText: {
    marginTop: verticalScale(10),
    fontSize: getFontSize(moderateScale(16)),
    color: "#666",
    fontFamily: "Poppins-Regular",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: scale(20),
    paddingVertical: verticalScale(15),
    backgroundColor: "#E7EEFA",
  },
  headerTitle: {
    fontSize: getFontSize(moderateScale(34)),
    color: "#000",
    fontFamily: "Poppins-Bold",
  },
  cartButton: {
    position: "relative",
    padding: scale(8),
  },
  cartBadge: {
    position: "absolute",
    top: verticalScale(0),
    right: scale(0),
    backgroundColor: "#FF3B30",
    borderRadius: moderateScale(10),
    minWidth: scale(20),
    height: verticalScale(20),
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: scale(5),
  },
  cartBadgeText: {
    color: "white",
    fontSize: getFontSize(moderateScale(12)),
    fontWeight: "bold",
    fontFamily: "Poppins-Bold",
  },
  cartContainer: {
    flexDirection: "row",
    borderRadius: moderateScale(20),
    borderWidth: 2,
    borderColor: "#B5CAEF",
    margin: scale(5),
    paddingHorizontal: scale(10),
    paddingVertical: verticalScale(1),
    alignItems: "center",
    gap: scale(5),
  },
  cartfont: {
    fontSize: getFontSize(moderateScale(16)),
    fontFamily: "Poppins-Regular",
  },
  searchContainer: {
    flexDirection: "row",
    paddingHorizontal: scale(20),
    paddingVertical: verticalScale(8),
    backgroundColor: "#E7EEFA",
    alignItems: "center",
    gap: scale(12),
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: moderateScale(12),
    paddingHorizontal: scale(16),
    paddingVertical: verticalScale(isSmallDevice ? 6 : 8),
    gap: scale(8),
  },
  searchInput: {
    flex: 1,
    fontSize: getFontSize(moderateScale(18)),
    fontFamily: "Poppins-Regular",
    color: "#000",
    minHeight: verticalScale(20),
  },
  filterButton: {
    backgroundColor: "#F8F9FA",
    borderRadius: moderateScale(12),
    padding: scale(15),
  },
  tabsContainer: {
    flexDirection: "row",
    paddingHorizontal: scale(20),
    paddingVertical: verticalScale(10),
    gap: scale(12),
    backgroundColor: "#E7EEFA",
  },
  tab: {
    paddingHorizontal: scale(20),
    paddingVertical: verticalScale(8),
    borderRadius: moderateScale(10),
    backgroundColor: "transparent",
  },
  activeTab: {
    backgroundColor: "#FFFFFF",
    borderColor: "#B5CAEF",
    borderWidth: 1,
  },
  tabText: {
    fontSize: getFontSize(moderateScale(16)),
    fontFamily: "Poppins-Regular",
    color: "#666",
  },
  activeTabText: {
    color: "#000",
    fontWeight: "600",
  },
  sectionHeader: {
    paddingHorizontal: scale(20),
    paddingVertical: verticalScale(10),
    backgroundColor: "#E7EEFA",
  },
  sectionTitle: {
    fontSize: getFontSize(moderateScale(16)),
    fontFamily: "Poppins-Regular",
    color: "#666",
  },
  productsContainer: {
    flex: 1,
    paddingHorizontal: scale(20),
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: verticalScale(100),
  },
  productsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    paddingTop: verticalScale(10),
  },
  productCard: {
    width: isTablet ? "48%" : "48%",
    backgroundColor: "#FFFFFF",
    borderRadius: moderateScale(12),
    padding: scale(12),
    marginBottom: verticalScale(16),
  },
  productImage: {
    width: "100%",
    height: verticalScale(120),
    borderRadius: moderateScale(8),
    backgroundColor: "#F0F0F0",
    marginBottom: verticalScale(8),
  },
  productDetails: {
    gap: scale(8),
  },
  productName: {
    fontSize: getFontSize(moderateScale(16)),
    fontFamily: "Poppins-Bold",
    color: "#000",
    minHeight: verticalScale(40),
  },
  priceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#EBEFFC",
    padding: scale(5),
    borderRadius: moderateScale(50),
  },
  productPrice: {
    fontSize: getFontSize(moderateScale(18)),
    fontFamily: "Poppins-Bold",
    color: "#000",
    flex: 1,
  },
  addToCartButton: {
    backgroundColor: "#007AFF",
    borderRadius: moderateScale(20),
    width: scale(40),
    height: verticalScale(40),
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
    paddingVertical: verticalScale(8),
    paddingHorizontal: scale(12),
    borderRadius: moderateScale(50),
    gap: scale(16),
  },
  quantityButton: {
    width: scale(32),
    height: verticalScale(32),
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: moderateScale(16),
  },
  quantityText: {
    fontSize: getFontSize(moderateScale(18)),
    fontFamily: "Poppins-Bold",
    color: "#000",
    minWidth: scale(24),
    textAlign: "center",
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: verticalScale(60),
    paddingHorizontal: scale(20),
  },
  emptyTitle: {
    fontSize: getFontSize(moderateScale(20)),
    fontWeight: "600",
    color: "#666",
    marginTop: verticalScale(16),
    marginBottom: verticalScale(8),
    fontFamily: "Poppins-Regular",
  },
  emptyDescription: {
    fontSize: getFontSize(moderateScale(14)),
    color: "#999",
    textAlign: "center",
    paddingHorizontal: scale(isSmallDevice ? 20 : 40),
    fontFamily: "Poppins-Regular",
    lineHeight: getFontSize(moderateScale(20)),
  },
  viewCartContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: scale(20),
    backgroundColor: "#E7EEFA",
    borderTopWidth: 1,
    borderTopColor: "#D0D0D0",
  },
  viewCartButton: {
    backgroundColor: "#007AFF",
    borderRadius: moderateScale(12),
    paddingVertical: verticalScale(16),
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: scale(8),
  },
  viewCartButtonText: {
    color: "white",
    fontSize: getFontSize(moderateScale(16)),
    fontWeight: "600",
    fontFamily: "Poppins-Regular",
  },
  bottomPadding: {
    height: verticalScale(20),
  },
  // Sales History Styles
  historyContainer: {
    paddingTop: verticalScale(10),
  },
  dateGroup: {
    marginBottom: verticalScale(20),
  },
  dateHeader: {
    fontSize: getFontSize(moderateScale(12)),
    fontFamily: "Poppins-Regular",
    color: "#666",
    marginBottom: verticalScale(10),
  },
  saleCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: moderateScale(12),
    padding: scale(14),
    marginBottom: verticalScale(10),
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
    marginRight: scale(8),
  },
  productIconContainer: {
    width: scale(40),
    height: verticalScale(40),
    borderRadius: moderateScale(8),
    backgroundColor: "#F5F7FA",
    justifyContent: "center",
    alignItems: "center",
    marginRight: scale(12),
  },
  productIcon: {
    width: scale(24),
    height: verticalScale(24),
    borderRadius: moderateScale(4),
    backgroundColor: "#C77D4A",
  },
  saleDetails: {
    flex: 1,
  },
  saleProductName: {
    fontSize: getFontSize(moderateScale(15)),
    fontFamily: "Poppins-Regular",
    color: "#000",
    marginBottom: verticalScale(2),
  },
  saleQuantity: {
    fontSize: getFontSize(moderateScale(12)),
    fontFamily: "Poppins-Regular",
    color: "#999",
  },
  saleAmount: {
    fontSize: getFontSize(moderateScale(16)),
    fontFamily: "Poppins-Bold",
    color: "#000",
    marginBottom: verticalScale(4),
  },
  saleRightSection: {
    alignItems: "flex-end",
    gap: scale(4),
    minWidth: scale(80),
  },
});

export default Sell;
