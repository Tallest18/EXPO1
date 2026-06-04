import AllProducts from "@/components/sell/allProducts";
import SalesHistory, { Sale } from "@/components/sell/saleHistory";
import ConfirmModal from "@/components/ui/ConfirmModal";
import { useSales } from "@/hooks/useSales";
import { ApiUserInventoryItem, listUserInventory } from "@/src/api";
import type { ApiSale } from "@/src/api/sales";
import AntDesign from "@expo/vector-icons/AntDesign";
import Feather from "@expo/vector-icons/Feather";
import { useQuery } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  SafeAreaView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { styles } from "../../src/styles/Sell.styles";
import { moderateScale } from "../../utils/scaling";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Product {
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

export interface CartItem {
  id: string;
  quantity: number;
  product?: Product;
}

type TabType = "all" | "history";

// ─── Mappers ──────────────────────────────────────────────────────────────────

const mapApiProduct = (p: ApiUserInventoryItem): Product => ({
  id: String(p.id),
  name: p.name,
  category: p.category || "",
  barcode: p.barcode || "",
  image: p.image_url ? { uri: p.image_url } : null,
  quantityType: p.quantity_type || p.unit_type || "Single Items",
  unitsInStock: Number(p.units_in_stock || 0),
  costPrice: Number(p.cost_price || 0),
  sellingPrice: Number(p.selling_price || 0),
  lowStockThreshold: p.low_stock_threshold ?? 0,
  expiryDate: p.expiry_date || "",
  supplier: {
    name: p.supplier_name || "",
    phone: p.supplier_phone || "",
  },
  dateAdded: p.added_at || p.updated_at || new Date().toISOString(),
  userId: "api-user",
});

const mapApiSale = (sale: ApiSale): Sale => ({
  id: String(sale.id),
  transactionId:
    sale.transaction_ref || `TXN-${String(sale.id).padStart(4, "0")}`,
  items: (sale.items || []).map((item: any) => ({
    productId: String(item.inventory ?? item.product ?? item.id),
    productName: item.product_name || item.product_code || "Unknown Product",
    quantity: Number(item.quantity || 0),
    unitPrice: Number(item.unit_price || 0),
    totalPrice: Number(item.unit_price || 0) * Number(item.quantity || 0),
    productImage: item.product_image || undefined,
  })),
  totalAmount: Number(sale.total_amount || 0),
  paymentMethod: sale.payment_method || "cash",
  date: sale.sale_date || sale.created_at || new Date().toISOString(),
  timestamp: sale.sale_date || sale.created_at || new Date().toISOString(),
});

// ─── Component ────────────────────────────────────────────────────────────────

const Sell: React.FC = () => {
  const router = useRouter();
  const params = useLocalSearchParams();

  const [activeTab, setActiveTab] = useState<TabType>("all");
  const [searchQuery, setSearchQuery] = useState("");
  // "recent" = newest first (default), "name" = alphabetical A-Z
  const [sortOrder, setSortOrder] = useState<"recent" | "name">("recent");
  const { data: salesData, isLoading: salesLoading } = useSales({
    search: searchQuery.trim() || undefined,
    page: 0,
    page_size: 25,
  });
  const [cart, setCart] = useState<CartItem[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalTitle, setModalTitle] = useState("");
  const [modalSubtitle, setModalSubtitle] = useState("");

  const showModal = (title: string, subtitle = "") => {
    setModalTitle(title);
    setModalSubtitle(subtitle);
    setModalVisible(true);
  };

  useEffect(() => {
    if (params.tab === "history") setActiveTab("history");
  }, [params.tab]);

  const { data: inventoryData, isLoading: productsLoading } = useQuery({
    queryKey: ["user-inventory", searchQuery.trim() || undefined, undefined, 0, 50, sortOrder],
    queryFn: () =>
      listUserInventory({
        search: searchQuery.trim() || undefined,
        page: 0,
        page_size: 50,
        sort: sortOrder,
      }),
  });

  const products = useMemo<Product[]>(() => {
    const results = (inventoryData?.results ?? []).map(mapApiProduct);
    // Mirror the API ordering client-side so the list stays correct even when
    // results are served from cache or an unsorted source.
    if (sortOrder === "name") {
      return results.sort((a, b) =>
        a.name.localeCompare(b.name, undefined, { sensitivity: "base" }),
      );
    }
    return results.sort(
      (a, b) => new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime(),
    );
  }, [inventoryData, sortOrder]);

  const filteredProducts = useMemo(() => {
    const term = searchQuery.toLowerCase().trim();
    if (!term) return products;
    return products.filter((p: Product) => {
      const name = p.name?.toLowerCase() || "";
      const category = p.category?.toLowerCase() || "";
      return name.includes(term) || category.includes(term);
    });
  }, [searchQuery, products]);

  // ─── Cart handlers ───────────────────────────────────────────────────────

  const handleAddToCart = (id: string) => {
    const product = products.find((p) => p.id === id);
    if (!product) return;
    if (product.unitsInStock <= 0) {
      showModal("Out of Stock", "This product is currently out of stock.");
      return;
    }
    setCart((prev) => {
      if (prev.find((item) => item.id === id)) return prev;
      return [...prev, { id, quantity: 1, product }];
    });
  };

  const handleIncrement = (id: string) => {
    const product = products.find((p) => p.id === id);
    if (!product) return;
    const cartItem = cart.find((item) => item.id === id);
    if ((cartItem?.quantity ?? 0) >= product.unitsInStock) {
      showModal(
        "Stock Limit",
        `Only ${product.unitsInStock} units available in stock.`,
      );
      return;
    }
    setCart((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, quantity: item.quantity + 1 } : item,
      ),
    );
  };

  const handleDecrement = (id: string) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === id);
      if (existing && existing.quantity > 1) {
        return prev.map((item) =>
          item.id === id ? { ...item, quantity: item.quantity - 1 } : item,
        );
      }
      return prev.filter((item) => item.id !== id);
    });
  };

  const totalCartItems = cart.reduce((t, item) => t + item.quantity, 0);

  const viewCart = () => {
    router.push({
      pathname: "/(Routes)/Cart" as any,
      params: {
        cartData: JSON.stringify(cart),
        timestamp: Date.now().toString(),
      },
    });
  };

  // ─── Loading ─────────────────────────────────────────────────────────────

  if (productsLoading || salesLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1155CC" />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Sell</Text>
        <TouchableOpacity
          style={styles.cartPill}
          onPress={viewCart}
          activeOpacity={0.8}
        >
          <Text style={styles.cartPillLabel}>Cart</Text>
          <View style={styles.cartIconWrap}>
            <Feather name="shopping-cart" size={20} color="#1A1A1A" />
            {totalCartItems > 0 && (
              <View style={styles.cartBadge}>
                <Text style={styles.cartBadgeText}>{totalCartItems}</Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
      </View>

      {/* Search + Filter */}
      <View style={styles.searchRow}>
        <View style={styles.searchInputContainer}>
          <Feather name="search" size={16} color="#999" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name, or category"
            placeholderTextColor="#999"
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
          />
        </View>

        <TouchableOpacity
          style={styles.filterButton}
          activeOpacity={0.7}
          onPress={() =>
            setSortOrder((prev) => (prev === "recent" ? "name" : "recent"))
          }
        >
          <AntDesign
            name={sortOrder === "name" ? "sort-ascending" : "sort-descending"}
            size={moderateScale(20)}
            color="#333"
          />
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === "all" ? styles.activeTabBlue : styles.tabViewNormal,
          ]}
          onPress={() => setActiveTab("all")}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "all" ? styles.activeTabTextWhite : undefined,
            ]}
          >
            All Products
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === "history"
              ? styles.activeTabBlue
              : styles.tabViewNormal,
          ]}
          onPress={() => setActiveTab("history")}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "history" ? styles.activeTabTextWhite : undefined,
            ]}
          >
            History
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tab content — each component owns its own rendering */}
      {activeTab === "all" ? (
        <AllProducts
          products={products}
          filteredProducts={filteredProducts}
          cart={cart}
          onAddToCart={handleAddToCart}
          onIncrement={handleIncrement}
          onDecrement={handleDecrement}
        />
      ) : (
        <SalesHistory sales={(salesData?.results ?? []).map(mapApiSale)} />
      )}

      {/* View Cart FAB */}
      {totalCartItems > 0 && activeTab === "all" && (
        <View style={styles.viewCartContainer}>
          <TouchableOpacity
            style={styles.viewCartButton}
            onPress={viewCart}
            activeOpacity={0.8}
          >
            <Feather name="shopping-cart" size={20} color="#fff" />
            <Text style={styles.viewCartButtonText}>
              Click to view cart ({totalCartItems})
            </Text>
          </TouchableOpacity>
        </View>
      )}

      <ConfirmModal
        visible={modalVisible}
        title={modalTitle}
        subtitle={modalSubtitle}
        confirmText="OK"
        singleButton
        onConfirm={() => setModalVisible(false)}
        onCancel={() => setModalVisible(false)}
      />
    </SafeAreaView>
  );
};

export default Sell;
