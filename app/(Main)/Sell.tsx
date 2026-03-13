import { Feather } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
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

import { ApiProduct, ApiSale, listProducts, listSales } from "@/src/api";

const { width, height } = Dimensions.get("window");

// Device detection
const isSmallDevice = width < 375;
const isTablet = width >= 768;

// Responsive sizing
const scale = (size: number) => {
  const baseWidth = 375;
  const ratio = width / baseWidth;
  if (isTablet) return size * Math.min(ratio, 1.4);
  return size * ratio;
};

const verticalScale = (size: number) => {
  const baseHeight = 812;
  const ratio = height / baseHeight;
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

// Horizontal padding that scales safely — never hugs the edge
const H_PAD = isTablet ? scale(32) : isSmallDevice ? scale(14) : scale(20);

// Product card: 3 columns on tablet, 2 on phone
const NUM_COLS = isTablet ? 3 : 2;
const CARD_GAP = scale(12);
const CARD_WIDTH = (width - H_PAD * 2 - CARD_GAP * (NUM_COLS - 1)) / NUM_COLS;

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
  supplier: { name: string; phone: string };
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

const mapApiSale = (sale: ApiSale): Sale => ({
  id: String(sale.id),
  items: (sale.items || []).map((item) => ({
    productId: String(item.product),
    productName: item.product_name || "Unknown Product",
    quantity: Number(item.quantity || 0),
    unitPrice: Number(item.unit_price || 0),
    totalPrice: Number(item.subtotal || 0),
  })),
  totalAmount: Number(sale.total_amount || 0),
  paymentMethod: sale.payment_method || "cash",
  date: sale.sale_date || sale.created_at || new Date().toISOString(),
  timestamp: sale.sale_date || sale.created_at || new Date().toISOString(),
});

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

  useEffect(() => {
    if (params.tab === "history") setActiveTab("history");
  }, [params]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [productsResponse, salesResponse] = await Promise.all([
          listProducts(),
          listSales(),
        ]);

        const productsData = productsResponse
          .map(mapApiProduct)
          .sort(
            (a, b) =>
              new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime(),
          );

        const salesData = salesResponse
          .map(mapApiSale)
          .sort(
            (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
          );

        setProducts(productsData);
        setFilteredProducts(productsData);
        setSales(salesData);
      } catch (error: any) {
        Alert.alert(
          "Error Loading Data",
          error?.message || "Failed to load data",
          [{ text: "OK" }],
        );
      } finally {
        setLoading(false);
      }
    };

    loadData();

    const interval = setInterval(() => {
      loadData();
    }, 15000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (searchQuery.trim()) {
      const searchTerm = searchQuery.toLowerCase().trim();
      setFilteredProducts(
        products.filter((product) => {
          const name = product.name?.toLowerCase() || "";
          const category = product.category?.toLowerCase() || "";
          return name.includes(searchTerm) || category.includes(searchTerm);
        }),
      );
    } else {
      setFilteredProducts(products);
    }
  }, [searchQuery, products]);

  const handleSearchChange = (text: string): void => setSearchQuery(text);

  const handleCartIconPress = (productId: string): void => {
    const product = products.find((p) => p.id === productId);
    if (!product) return;

    if (product.unitsInStock <= 0) {
      Alert.alert("Out of Stock", "This product is currently out of stock.");
      return;
    }

    setCart((prevCart) => {
      const existing = prevCart.find((item) => item.productId === productId);
      if (existing) return prevCart;
      return [...prevCart, { productId, quantity: 1 }];
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

    setCart((prev) =>
      prev.map((item) =>
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
      setCart((prev) =>
        prev.map((item) =>
          item.productId === productId
            ? { ...item, quantity: item.quantity - 1 }
            : item,
        ),
      );
    } else {
      setCart((prev) => prev.filter((item) => item.productId !== productId));
    }
  };

  const getTotalCartItems = (): number =>
    cart.reduce((total, item) => total + item.quantity, 0);

  const viewCart = (): void => {
    if (cart.length === 0) {
      Alert.alert("Empty Cart", "Your cart is empty. Add some products first!");
      return;
    }
    router.push({
      pathname: "/(Routes)/Cart" as any,
      params: {
        cartData: JSON.stringify(cart),
        timestamp: Date.now().toString(),
      },
    });
  };

  const renderProductCard = (product: Product): React.ReactElement | null => {
    if (!product?.id) return null;

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
              : require("../../assets/images/icon.png")
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
                  size={moderateScale(18)}
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
                  size={moderateScale(16)}
                  color="#007AFF"
                />
              </TouchableOpacity>
              <Text style={styles.quantityText}>{quantity}</Text>
              <TouchableOpacity
                style={styles.quantityButton}
                onPress={() => incrementQuantity(product.id)}
                activeOpacity={0.7}
              >
                <Feather name="plus" size={moderateScale(16)} color="#007AFF" />
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
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const groupSalesByDate = (): { [key: string]: Sale[] } => {
    const grouped: { [key: string]: Sale[] } = {};
    sales.forEach((sale) => {
      const dateKey = formatDate(sale.date);
      if (!grouped[dateKey]) grouped[dateKey] = [];
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

  if (loading) {
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
        <Text style={styles.headerTitle} numberOfLines={1} adjustsFontSizeToFit>
          Sell
        </Text>

        {/* Cart button — never hugs the right edge */}
        <View style={styles.cartContainer}>
          <Text style={styles.cartLabel}>Cart</Text>
          <TouchableOpacity
            style={styles.cartButton}
            onPress={viewCart}
            activeOpacity={0.7}
          >
            <Feather
              name="shopping-cart"
              size={moderateScale(22)}
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

      {/* Products Grid / History */}
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
        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* View Cart FAB */}
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

  // ── Header ────────────────────────────────────────────────────────────────
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    // Consistent safe padding on every device — never clips the edge
    paddingHorizontal: H_PAD,
    paddingTop: verticalScale(isTablet ? 20 : 14),
    paddingBottom: verticalScale(isTablet ? 14 : 10),
    backgroundColor: "#E7EEFA",
  },
  headerTitle: {
    // Controlled size: large enough to look good, small enough to never overflow
    fontSize: getFontSize(
      moderateScale(isSmallDevice ? 24 : isTablet ? 34 : 28),
    ),
    color: "#000",
    fontFamily: "Poppins-Bold",
    // Shrinks before pushing cart off screen
    flexShrink: 1,
    marginRight: scale(10),
  },

  // ── Cart ──────────────────────────────────────────────────────────────────
  cartContainer: {
    flexDirection: "row",
    borderRadius: moderateScale(20),
    borderWidth: 1.5,
    borderColor: "#B5CAEF",
    paddingHorizontal: isSmallDevice ? scale(8) : scale(12),
    paddingVertical: verticalScale(4),
    alignItems: "center",
    gap: scale(4),
    // Never shrinks — always readable
    flexShrink: 0,
  },
  cartLabel: {
    fontSize: getFontSize(moderateScale(isSmallDevice ? 13 : 15)),
    fontFamily: "Poppins-Regular",
    color: "#333",
  },
  cartButton: {
    position: "relative",
    padding: scale(6),
  },
  cartBadge: {
    position: "absolute",
    // Positioned inside the button, not floating into the title
    top: verticalScale(-2),
    right: scale(-2),
    backgroundColor: "#FF3B30",
    borderRadius: moderateScale(10),
    minWidth: scale(18),
    height: verticalScale(18),
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: scale(3),
  },
  cartBadgeText: {
    color: "white",
    fontSize: getFontSize(moderateScale(10)),
    fontFamily: "Poppins-Bold",
  },

  // ── Search ────────────────────────────────────────────────────────────────
  searchContainer: {
    flexDirection: "row",
    paddingHorizontal: H_PAD,
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
    paddingHorizontal: scale(14),
    paddingVertical: verticalScale(isSmallDevice ? 6 : 9),
    gap: scale(8),
  },
  searchInput: {
    flex: 1,
    fontSize: getFontSize(moderateScale(15)),
    fontFamily: "Poppins-Regular",
    color: "#000",
    minHeight: verticalScale(20),
  },
  filterButton: {
    backgroundColor: "#F8F9FA",
    borderRadius: moderateScale(12),
    padding: scale(13),
  },

  // ── Tabs ──────────────────────────────────────────────────────────────────
  tabsContainer: {
    flexDirection: "row",
    paddingHorizontal: H_PAD,
    paddingVertical: verticalScale(8),
    gap: scale(12),
    backgroundColor: "#E7EEFA",
  },
  tab: {
    paddingHorizontal: scale(isSmallDevice ? 14 : 20),
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
    fontSize: getFontSize(moderateScale(15)),
    fontFamily: "Poppins-Regular",
    color: "#666",
  },
  // Fixed: now has explicit fontFamily so it never falls back to system font
  activeTabText: {
    color: "#000",
    fontFamily: "Poppins-SemiBold",
  },
  sectionHeader: {
    paddingHorizontal: H_PAD,
    paddingVertical: verticalScale(8),
    backgroundColor: "#E7EEFA",
  },
  sectionTitle: {
    fontSize: getFontSize(moderateScale(15)),
    fontFamily: "Poppins-Regular",
    color: "#666",
  },

  // ── Products Grid ─────────────────────────────────────────────────────────
  productsContainer: {
    flex: 1,
    paddingHorizontal: H_PAD,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: verticalScale(110),
  },
  productsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingTop: verticalScale(10),
    // Even gap between all cards
    gap: CARD_GAP,
  },
  productCard: {
    // Exact computed width — same formula as CARD_WIDTH above
    width: CARD_WIDTH,
    backgroundColor: "#FFFFFF",
    borderRadius: moderateScale(12),
    padding: scale(isSmallDevice ? 8 : 12),
  },
  productImage: {
    width: "100%",
    // Height proportional to card width so it looks right on every screen
    height: CARD_WIDTH * 0.75,
    borderRadius: moderateScale(8),
    backgroundColor: "#F0F0F0",
    marginBottom: verticalScale(8),
  },
  productDetails: {
    gap: scale(6),
  },
  productName: {
    fontSize: getFontSize(moderateScale(isSmallDevice ? 13 : 15)),
    fontFamily: "Poppins-Bold",
    color: "#000",
    minHeight: verticalScale(36),
  },
  priceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#EBEFFC",
    paddingVertical: scale(4),
    paddingHorizontal: scale(6),
    borderRadius: moderateScale(50),
  },
  productPrice: {
    fontSize: getFontSize(moderateScale(isSmallDevice ? 13 : 15)),
    fontFamily: "Poppins-Bold",
    color: "#000",
    flex: 1,
  },
  addToCartButton: {
    backgroundColor: "#007AFF",
    borderRadius: moderateScale(18),
    width: scale(34),
    height: scale(34),
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
    paddingVertical: verticalScale(6),
    paddingHorizontal: scale(8),
    borderRadius: moderateScale(50),
    gap: scale(10),
  },
  quantityButton: {
    width: scale(28),
    height: scale(28),
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: moderateScale(14),
  },
  quantityText: {
    fontSize: getFontSize(moderateScale(15)),
    fontFamily: "Poppins-Bold",
    color: "#000",
    minWidth: scale(20),
    textAlign: "center",
  },

  // ── Empty States ──────────────────────────────────────────────────────────
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: verticalScale(60),
    paddingHorizontal: H_PAD,
  },
  emptyTitle: {
    fontSize: getFontSize(moderateScale(20)),
    color: "#666",
    marginTop: verticalScale(16),
    marginBottom: verticalScale(8),
    fontFamily: "Poppins-SemiBold",
  },
  emptyDescription: {
    fontSize: getFontSize(moderateScale(14)),
    color: "#999",
    textAlign: "center",
    paddingHorizontal: scale(isSmallDevice ? 10 : 30),
    fontFamily: "Poppins-Regular",
    lineHeight: getFontSize(moderateScale(22)),
  },

  // ── View Cart FAB ─────────────────────────────────────────────────────────
  viewCartContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: H_PAD,
    paddingBottom: verticalScale(isTablet ? 24 : 16),
    backgroundColor: "#E7EEFA",
    borderTopWidth: 1,
    borderTopColor: "#D0D0D0",
  },
  viewCartButton: {
    backgroundColor: "#007AFF",
    borderRadius: moderateScale(12),
    paddingVertical: verticalScale(14),
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: scale(8),
  },
  // Fixed: was Poppins-Regular with fontWeight 600 — now uses SemiBold correctly
  viewCartButtonText: {
    color: "white",
    fontSize: getFontSize(moderateScale(16)),
    fontFamily: "Poppins-SemiBold",
  },
  bottomPadding: {
    height: verticalScale(20),
  },

  // ── Sales History ─────────────────────────────────────────────────────────
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
    height: scale(40),
    borderRadius: moderateScale(8),
    backgroundColor: "#F5F7FA",
    justifyContent: "center",
    alignItems: "center",
    marginRight: scale(12),
  },
  productIcon: {
    width: scale(24),
    height: scale(24),
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
  saleRightSection: {
    alignItems: "flex-end",
    minWidth: scale(80),
  },
  saleAmount: {
    fontSize: getFontSize(moderateScale(15)),
    fontFamily: "Poppins-Bold",
    color: "#000",
  },
});

export default Sell;
