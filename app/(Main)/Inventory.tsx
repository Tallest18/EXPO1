import { Feather } from "@expo/vector-icons";
import { useFonts } from "expo-font";
import { useRouter } from "expo-router";
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
import AddProductFlow from "../(Routes)/AddProductFlow";
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

  const [fontsLoaded] = useFonts({
    "Poppins-Regular": require("../../assets/fonts/Poppins-Regular.ttf"),
    "Poppins-Bold": require("../../assets/fonts/Poppins-Bold.ttf"),
    "Poppins-Light": require("../../assets/fonts/Poppins-Light.ttf"),
  });

  const [filterCounts, setFilterCounts] = useState<FilterCounts>({
    all: 0,
    inStock: 0,
    outOfStock: 0,
    expiring: 0,
  });

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

        productsData.sort((a, b) => {
          const dateA = new Date(a.dateAdded).getTime();
          const dateB = new Date(b.dateAdded).getTime();
          return dateB - dateA;
        });

        setProducts(productsData);
        calculateFilterCounts(productsData);
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

    return () => unsubscribe();
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
      if (product.unitsInStock > 0) {
        counts.inStock++;
      } else {
        counts.outOfStock++;
      }

      if (product.expiryDate) {
        const expiryDate = new Date(product.expiryDate);
        if (expiryDate <= tenDaysFromNow && expiryDate > now) {
          counts.expiring++;
        }
      }
    });

    setFilterCounts(counts);
  };

  const performSearch = (query: string): Product[] => {
    if (!query.trim()) {
      return products;
    }
    const searchTerm = query.toLowerCase().trim();
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
    let filtered = [...products];

    if (searchQuery.trim()) {
      filtered = performSearch(searchQuery);
    }

    if (activeFilter === "inStock") {
      filtered = filtered.filter((product) => product.unitsInStock > 0);
    } else if (activeFilter === "outOfStock") {
      filtered = filtered.filter((product) => product.unitsInStock === 0);
    } else if (activeFilter === "expiring") {
      const now = new Date();
      const tenDaysFromNow = new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000);
      filtered = filtered.filter((product) => {
        if (!product.expiryDate) return false;
        const expiryDate = new Date(product.expiryDate);
        return expiryDate <= tenDaysFromNow && expiryDate > now;
      });
    }
    setFilteredProducts(filtered);
  }, [products, activeFilter, searchQuery]);

  const handleSearchChange = (text: string): void => {
    setSearchQuery(text);
  };

  const clearSearch = (): void => {
    setSearchQuery("");
  };

  const handleAddProduct = async (productData: Product): Promise<void> => {
    Alert.alert("Success", "Product added to inventory!");
  };

  const renderFilterTabs = (): React.ReactElement => {
    const filters: FilterItem[] = [
      {
        key: "all",
        label: "All Products",
        count: filterCounts.all,
      },
      {
        key: "inStock",
        label: "In Stock",
        count: filterCounts.inStock,
      },
      {
        key: "outOfStock",
        label: "Out of Stock",
        count: filterCounts.outOfStock,
      },
      {
        key: "expiring",
        label: "Expiring",
        count: filterCounts.expiring,
      },
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

  const renderProductCard = (product: Product): React.ReactElement => {
    return (
      <TouchableOpacity
        key={product.id}
        style={styles.productCard}
        onPress={() => {
          router.push({
            pathname: "/(Routes)/ProductDetails" as any,
            params: { productId: product.id },
          });
        }}
        activeOpacity={0.8}
      >
        <View style={styles.cardContent}>
          {/* Product Name */}
          <Text style={styles.productName} numberOfLines={2}>
            {product.name}
          </Text>

          {/* Image and Info Boxes Row */}
          <View style={styles.imageAndInfoRow}>
            <Image
              source={
                product.image?.uri
                  ? { uri: product.image.uri }
                  : { uri: "https://via.placeholder.com/100" }
              }
              style={styles.productImage}
            />

            <View style={styles.infoBoxesContainer}>
              {/* Unit Price Box - Full Width */}
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

              {/* Stock and Cost Price Boxes - Side by Side */}
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

  if (loading || !fontsLoaded) {
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
        <Text style={styles.headerTitle}>Inventory</Text>
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
    paddingVertical: verticalScale(16),
    backgroundColor: "#E7EEFA",
  },
  headerTitle: {
    fontSize: getFontSize(moderateScale(28)),
    fontWeight: "700",
    color: "#000",
    fontFamily: "Poppins-Bold",
  },
  newProductButton: {
    backgroundColor: "#1155CC",
    borderRadius: moderateScale(8),
    paddingHorizontal: scale(16),
    paddingVertical: verticalScale(10),
    flexDirection: "row",
    alignItems: "center",
    gap: scale(6),
    shadowColor: "#1155CC",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  newProductButtonText: {
    color: "white",
    fontSize: getFontSize(moderateScale(14)),
    fontWeight: "600",
    fontFamily: "Poppins-Bold",
  },
  searchContainer: {
    flexDirection: "row",
    paddingHorizontal: scale(20),
    paddingBottom: verticalScale(12),
    backgroundColor: "#E7EEFA",
    alignItems: "center",
    gap: scale(10),
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: moderateScale(10),
    paddingHorizontal: scale(14),
    paddingVertical: verticalScale(isSmallDevice ? 8 : 10),
    gap: scale(8),
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  searchInput: {
    flex: 1,
    fontSize: getFontSize(moderateScale(15)),
    fontFamily: "Poppins-Regular",
    color: "#000",
    minHeight: verticalScale(20),
  },
  filterButton: {
    backgroundColor: "#FFFFFF",
    borderRadius: moderateScale(10),
    padding: scale(12),
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  filtersContainer: {
    backgroundColor: "#E7EEFA",
    paddingVertical: verticalScale(8),
    paddingBottom: verticalScale(12),
  },
  filtersContentContainer: {
    paddingHorizontal: scale(20),
    gap: scale(8),
  },
  filterTab: {
    paddingHorizontal: scale(isSmallDevice ? 12 : 16),
    paddingVertical: verticalScale(8),
    borderRadius: moderateScale(10),
    marginRight: scale(8),
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  activeFilterTab: {
    backgroundColor: "#1155CC",
    borderColor: "#1155CC",
  },
  filterText: {
    fontSize: getFontSize(moderateScale(14)),
    fontWeight: "500",
    color: "#1C1C1C",
    fontFamily: "Poppins-Regular",
  },
  activeFilterText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontFamily: "Poppins-Bold",
  },
  productsContainer: {
    flex: 1,
    backgroundColor: "#E7EEFA",
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: verticalScale(20),
  },
  productsGrid: {
    paddingHorizontal: scale(20),
    paddingTop: verticalScale(8),
  },
  productCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: moderateScale(12),
    marginBottom: verticalScale(16),
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  cardContent: {
    padding: scale(16),
  },
  productName: {
    fontSize: getFontSize(moderateScale(20)),
    fontWeight: "600",
    color: "#000",
    fontFamily: "Poppins-Bold",
    marginBottom: verticalScale(12),
    minHeight: verticalScale(isSmallDevice ? 40 : 50),
  },
  imageAndInfoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: scale(12),
  },
  productImage: {
    width: scale(100),
    height: scale(100),
    borderRadius: moderateScale(8),
    backgroundColor: "#F0F0F0",
  },
  infoBoxesContainer: {
    flex: 1,
    gap: verticalScale(8),
  },
  unitPriceBox: {
    backgroundColor: "#FFFFFF",
    borderRadius: moderateScale(8),
    padding: scale(8),
    borderWidth: 1,
    borderColor: "#B5CAEF",
    minHeight: verticalScale(isSmallDevice ? 45 : 50),
    justifyContent: "center",
  },
  boxLabel: {
    fontSize: getFontSize(moderateScale(11)),
    color: "#D2D2D2",
    marginBottom: verticalScale(4),
    fontFamily: "Poppins-Regular",
  },
  largePrice: {
    fontSize: getFontSize(moderateScale(isSmallDevice ? 20 : 24)),
    fontWeight: "700",
    color: "#000",
    fontFamily: "Poppins-Bold",
  },
  bottomBoxesRow: {
    flexDirection: "row",
    gap: scale(4),
  },
  smallInfoBox: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: moderateScale(8),
    padding: scale(isSmallDevice ? 8 : 12),
    borderWidth: 1,
    borderColor: "#B5CAEF",
    minHeight: verticalScale(isSmallDevice ? 45 : 50),
    justifyContent: "center",
  },
  infoBoxValue: {
    fontSize: getFontSize(moderateScale(isSmallDevice ? 14 : 18)),
    fontWeight: "700",
    color: "#000",
    fontFamily: "Poppins-Bold",
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: verticalScale(80),
    paddingHorizontal: scale(20),
  },
  emptyTitle: {
    fontSize: getFontSize(moderateScale(20)),
    fontWeight: "600",
    color: "#666",
    marginTop: verticalScale(16),
    marginBottom: verticalScale(8),
    fontFamily: "Poppins-Bold",
  },
  emptyDescription: {
    fontSize: getFontSize(moderateScale(14)),
    color: "#999",
    textAlign: "center",
    marginBottom: verticalScale(24),
    paddingHorizontal: scale(isSmallDevice ? 20 : 40),
    fontFamily: "Poppins-Regular",
    lineHeight: getFontSize(moderateScale(20)),
  },
  addFirstProductButton: {
    backgroundColor: "#1155CC",
    borderRadius: moderateScale(12),
    paddingHorizontal: scale(24),
    paddingVertical: verticalScale(12),
    shadowColor: "#1155CC",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  addFirstProductButtonText: {
    color: "#FFFFFF",
    fontSize: getFontSize(moderateScale(16)),
    fontWeight: "600",
    fontFamily: "Poppins-Bold",
  },
  clearSearchButton: {
    backgroundColor: "#F8F9FA",
    borderRadius: moderateScale(12),
    paddingHorizontal: scale(24),
    paddingVertical: verticalScale(12),
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  clearSearchText: {
    color: "#666",
    fontSize: getFontSize(moderateScale(16)),
    fontWeight: "500",
    fontFamily: "Poppins-Regular",
  },
  bottomPadding: {
    height: verticalScale(20),
  },
});

export default Inventory;
