import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  SafeAreaView,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { styles } from "./Inventory.styles";

import { ApiProduct, listProducts } from "@/src/api";
import AddProductFlow from "../(Routes)/AddProductFlow";

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

// Horizontal padding that scales safely
const H_PAD = isTablet ? scale(32) : isSmallDevice ? scale(14) : scale(20);

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

type FilterType = "all" | "inStock" | "outOfStock" | "expiring";

interface FilterCounts {
  all: number;
  inStock: number;
  outOfStock: number;
  expiring: number;
}

interface FilterItem {
  key: string;
  label: string;
  count: number;
}

const Inventory: React.FC = () => {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [showAddProduct, setShowAddProduct] = useState<boolean>(false);

  const [filterCounts, setFilterCounts] = useState<FilterCounts>({
    all: 0,
    inStock: 0,
    outOfStock: 0,
    expiring: 0,
  });

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const response = await listProducts();
        const productsData = response
          .map(mapApiProduct)
          .sort(
            (a, b) =>
              new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime(),
          );

        setProducts(productsData);
        calculateFilterCounts(productsData);
      } catch (error: any) {
        Alert.alert(
          "Error Loading Products",
          error?.message || "Failed to load products",
          [{ text: "OK" }],
        );
      } finally {
        setLoading(false);
      }
    };

    loadProducts();

    const interval = setInterval(() => {
      loadProducts();
    }, 15000);

    return () => clearInterval(interval);
  }, []);

  const calculateFilterCounts = (productsData: Product[]): void => {
    const now = new Date();
    const tenDaysFromNow = new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000);
    const counts: FilterCounts = {
      all: productsData.length,
      inStock: 0,
      outOfStock: 0,
      expiring: 0,
    };

    productsData.forEach((product) => {
      if (product.unitsInStock > 0) counts.inStock++;
      else counts.outOfStock++;

      if (product.expiryDate) {
        const expiryDate = new Date(product.expiryDate);
        if (expiryDate <= tenDaysFromNow && expiryDate > now) counts.expiring++;
      }
    });

    setFilterCounts(counts);
  };

  const performSearch = (q: string): Product[] => {
    if (!q.trim()) return products;
    const searchTerm = q.toLowerCase().trim();
    return products.filter((product) => {
      const name = product.name?.toLowerCase() || "";
      const category = product.category?.toLowerCase() || "";
      const barcode = product.barcode?.toLowerCase() || "";
      const supplier = product.supplier?.name?.toLowerCase() || "";
      return (
        name.includes(searchTerm) ||
        category.includes(searchTerm) ||
        barcode.includes(searchTerm) ||
        supplier.includes(searchTerm)
      );
    });
  };

  useEffect(() => {
    let filtered = searchQuery.trim()
      ? performSearch(searchQuery)
      : [...products];

    if (activeFilter === "inStock") {
      filtered = filtered.filter((p) => p.unitsInStock > 0);
    } else if (activeFilter === "outOfStock") {
      filtered = filtered.filter((p) => p.unitsInStock === 0);
    } else if (activeFilter === "expiring") {
      const now = new Date();
      const tenDaysFromNow = new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000);
      filtered = filtered.filter((p) => {
        if (!p.expiryDate) return false;
        const expiryDate = new Date(p.expiryDate);
        return expiryDate <= tenDaysFromNow && expiryDate > now;
      });
    }

    setFilteredProducts(filtered);
  }, [products, activeFilter, searchQuery]);

  const handleSearchChange = (text: string): void => setSearchQuery(text);
  const clearSearch = (): void => setSearchQuery("");

  const handleAddProduct = async (): Promise<void> => {
    Alert.alert("Success", "Product added to inventory!");
  };

  const renderFilterTabs = (): React.ReactElement => {
    const filters: FilterItem[] = [
      { key: "all", label: "All Products", count: filterCounts.all },
      { key: "inStock", label: "In Stock", count: filterCounts.inStock },
      {
        key: "outOfStock",
        label: "Out of Stock",
        count: filterCounts.outOfStock,
      },
      { key: "expiring", label: "Expiring", count: filterCounts.expiring },
    ];

    return (
      <View style={styles.filtersContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersContentContainer}
        >
          {filters.map((filter) => (
            <TouchableOpacity
              key={filter.key}
              style={[
                styles.filterTab,
                activeFilter === filter.key && styles.activeFilterTab,
              ]}
              onPress={() => setActiveFilter(filter.key as FilterType)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.filterText,
                  activeFilter === filter.key && styles.activeFilterText,
                ]}
              >
                {filter.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  };

  // Tablet: 2 columns, phone: 1 column
  const cardWidth = isTablet ? (width - H_PAD * 2 - scale(16)) / 2 : "100%";

  const renderProductCard = (product: Product): React.ReactElement => {
    const imageSize = isTablet
      ? scale(110)
      : isSmallDevice
        ? scale(88)
        : scale(100);

    return (
      <TouchableOpacity
        key={product.id}
        style={[styles.productCard, { width: cardWidth as any }]}
        onPress={() =>
          router.push({
            pathname: "/(Routes)/ProductDetails" as any,
            params: { productId: product.id },
          })
        }
        activeOpacity={0.8}
      >
        <View style={styles.cardContent}>
          <Text style={styles.productName} numberOfLines={2}>
            {product.name}
          </Text>

          <View style={styles.imageAndInfoRow}>
            <Image
              source={
                product.image?.uri
                  ? { uri: product.image.uri }
                  : require("../../assets/images/noImg.jpg")
              }
              style={[styles.productImage]}
            />

            <View style={styles.infoBoxesContainer}>
              <View style={styles.unitPriceBox}>
                <Text style={styles.boxLabel}>Unit Price</Text>
                <Text
                  style={styles.largePrice}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                >
                  ₦{product.sellingPrice.toLocaleString()}
                </Text>
              </View>

              <View style={styles.bottomBoxesRow}>
                <View style={styles.smallInfoBox}>
                  <Text style={styles.boxLabel}>In Stock</Text>
                  <Text style={styles.infoBoxValue} numberOfLines={1}>
                    {product.unitsInStock}
                  </Text>
                </View>
                <View style={styles.smallInfoBox}>
                  <Text style={styles.boxLabel}>Cost Price</Text>
                  <Text
                    style={styles.infoBoxValue}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                  >
                    ₦{product.costPrice.toLocaleString()}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = (): React.ReactElement => (
    <View style={styles.emptyState}>
      <Feather name="package" size={moderateScale(80)} color="#E0E0E0" />
      <Text style={styles.emptyTitle}>No Products Yet</Text>
      <Text style={styles.emptyDescription}>
        Start building your inventory by adding your first product
      </Text>
      <TouchableOpacity
        style={styles.addFirstProductButton}
        onPress={() => setShowAddProduct(true)}
        activeOpacity={0.8}
      >
        <Text style={styles.addFirstProductButtonText}>
          Add Your First Product
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderSearchEmptyState = (): React.ReactElement => (
    <View style={styles.emptyState}>
      <Feather name="search" size={moderateScale(80)} color="#E0E0E0" />
      <Text style={styles.emptyTitle}>No Products Found</Text>
      <Text style={styles.emptyDescription}>
        Try adjusting your search or filter criteria
      </Text>
      <TouchableOpacity
        style={styles.clearSearchButton}
        onPress={clearSearch}
        activeOpacity={0.8}
      >
        <Text style={styles.clearSearchText}>Clear Search</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1155CC" />
          <Text style={styles.loadingText}>Loading inventory...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle} numberOfLines={1} adjustsFontSizeToFit>
          Inventory
        </Text>
        <TouchableOpacity
          style={styles.newProductButton}
          onPress={() => setShowAddProduct(true)}
          activeOpacity={0.8}
        >
          <Text style={styles.newProductButtonText}>New Product</Text>
          <Feather name="plus" size={moderateScale(16)} color="white" />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Feather name="search" size={moderateScale(18)} color="#999" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name, or category"
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

      {/* Filter Tabs */}
      {products.length > 0 && renderFilterTabs()}

      {/* Products Grid */}
      <ScrollView
        style={styles.productsContainer}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.productsGrid}>
          {products.length === 0 && !loading
            ? renderEmptyState()
            : filteredProducts.length === 0 && searchQuery.length > 0
              ? renderSearchEmptyState()
              : filteredProducts.map((product) => renderProductCard(product))}
        </View>
        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Add Product Modal */}
      <AddProductFlow
        visible={showAddProduct}
        onClose={() => setShowAddProduct(false)}
        onSaveProduct={handleAddProduct}
      />
    </SafeAreaView>
  );
};

export default Inventory;
