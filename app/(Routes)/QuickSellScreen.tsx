// screens/QuickSellScreen.tsx
import { Feather, Ionicons } from "@expo/vector-icons";
import { useFonts } from "expo-font";
import { useRouter } from "expo-router";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
  Alert,
  FlatList,
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
import {
  checkHighSelling,
  checkLowStock,
  notifySaleCompleted,
} from "../notificationHelpers";

interface Product {
  id: string;
  name: string;
  category: string;
  image?: {
    uri: string;
  } | null;
  unitsInStock: number;
  costPrice: number;
  sellingPrice: number;
  lowStockThreshold: number;
  barcode?: string;
}

interface CartItem extends Product {
  quantity: number;
  totalPrice: number;
}

const QuickSellScreen = () => {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [showProductList, setShowProductList] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const [fontsLoaded] = useFonts({
    "Poppins-Regular": require("../../assets/fonts/Poppins-Regular.ttf"),
    "Poppins-Bold": require("../../assets/fonts/Poppins-Bold.ttf"),
  });

  // Fetch products
  useEffect(() => {
    const fetchProducts = async () => {
      const currentUser = auth.currentUser;
      if (!currentUser) return;

      try {
        const productsQuery = query(
          collection(db, "products"),
          where("userId", "==", currentUser.uid),
        );
        const snapshot = await getDocs(productsQuery);
        const fetchedProducts: Product[] = [];

        snapshot.forEach((doc) => {
          fetchedProducts.push({ id: doc.id, ...doc.data() } as Product);
        });

        setProducts(fetchedProducts);
        setFilteredProducts(fetchedProducts);
      } catch (error) {
        console.error("Error fetching products:", error);
      }
    };

    fetchProducts();
  }, []);

  // Filter products based on search
  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredProducts(products);
      setShowProductList(false);
    } else {
      const filtered = products.filter((product) =>
        product.name.toLowerCase().includes(searchQuery.toLowerCase()),
      );
      setFilteredProducts(filtered);
      setShowProductList(true);
    }
  }, [searchQuery, products]);

  // Add product to cart
  const addToCart = (product: Product) => {
    const existingItem = cartItems.find((item) => item.id === product.id);

    if (existingItem) {
      // Increment quantity
      setCartItems(
        cartItems.map((item) =>
          item.id === product.id
            ? {
                ...item,
                quantity: item.quantity + 1,
                totalPrice: (item.quantity + 1) * product.sellingPrice,
              }
            : item,
        ),
      );
    } else {
      // Add new item
      setCartItems([
        ...cartItems,
        {
          ...product,
          quantity: 1,
          totalPrice: product.sellingPrice,
        },
      ]);
    }

    setSearchQuery("");
    setShowProductList(false);
  };

  // Update cart item quantity
  const updateQuantity = (productId: string, newQuantity: number) => {
    if (newQuantity === 0) {
      removeFromCart(productId);
      return;
    }

    const product = products.find((p) => p.id === productId);
    if (!product) return;

    if (newQuantity > product.unitsInStock) {
      Alert.alert("Error", `Only ${product.unitsInStock} units available`);
      return;
    }

    setCartItems(
      cartItems.map((item) =>
        item.id === productId
          ? {
              ...item,
              quantity: newQuantity,
              totalPrice: newQuantity * product.sellingPrice,
            }
          : item,
      ),
    );
  };

  // Remove item from cart
  const removeFromCart = (productId: string) => {
    setCartItems(cartItems.filter((item) => item.id !== productId));
  };

  // Calculate totals
  const calculateTotal = () => {
    return cartItems.reduce((sum, item) => sum + item.totalPrice, 0);
  };

  const calculateProfit = () => {
    return cartItems.reduce(
      (sum, item) => sum + (item.sellingPrice - item.costPrice) * item.quantity,
      0,
    );
  };

  // Complete sale
  const handleCompleteSale = async () => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        Alert.alert("Error", "Please log in to complete sale");
        return;
      }

      if (cartItems.length === 0) {
        Alert.alert("Error", "Cart is empty");
        return;
      }

      setIsProcessing(true);

      let totalAmount = 0;
      let totalProfit = 0;

      // Process each item in the cart
      for (const item of cartItems) {
        const productRef = doc(db, "products", item.id);
        const productDoc = await getDoc(productRef);

        if (!productDoc.exists()) {
          console.error(`Product ${item.id} not found`);
          continue;
        }

        const productData = productDoc.data();
        const newStock = productData.unitsInStock - item.quantity;

        // Calculate amounts
        const saleAmount = item.sellingPrice * item.quantity;
        const profit = (item.sellingPrice - item.costPrice) * item.quantity;
        totalAmount += saleAmount;
        totalProfit += profit;

        // Update product stock in Firestore
        await updateDoc(productRef, {
          unitsInStock: newStock,
        });

        // Record the sale
        await addDoc(collection(db, "sales"), {
          userId: currentUser.uid,
          productId: item.id,
          name: item.name,
          image: item.image?.uri || null,
          quantity: item.quantity,
          amount: saleAmount,
          profit: profit,
          date: new Date().toLocaleDateString(),
          createdAt: new Date(),
        });

        // Check for low stock notification
        await checkLowStock(
          currentUser.uid,
          item.id,
          item.name,
          newStock,
          productData.lowStockThreshold,
        );

        // Check if this product is high-selling
        await checkHighSelling(currentUser.uid, item.id, item.name);
      }

      // Notify sale completion
      await notifySaleCompleted(currentUser.uid, totalAmount, cartItems.length);

      // Clear cart and show success
      setCartItems([]);
      setIsProcessing(false);

      Alert.alert(
        "Success! 🎉",
        `Sale completed!\nTotal: ₦${totalAmount.toFixed(
          0,
        )}\nProfit: ₦${totalProfit.toFixed(0)}`,
        [
          {
            text: "OK",
            onPress: () => router.back(),
          },
        ],
      );
    } catch (error) {
      console.error("Error completing sale:", error);
      setIsProcessing(false);
      Alert.alert("Error", "Failed to complete sale. Please try again.");
    }
  };

  const renderCartItem = ({ item }: { item: CartItem }) => (
    <View style={styles.cartItem}>
      <Image
        source={{
          uri: item.image?.uri || "https://via.placeholder.com/60",
        }}
        style={styles.cartItemImage}
      />
      <View style={styles.cartItemInfo}>
        <Text style={styles.cartItemName}>{item.name}</Text>
        <Text style={styles.cartItemPrice}>
          ₦{item.sellingPrice.toFixed(0)}
        </Text>
      </View>
      <View style={styles.quantityControls}>
        <TouchableOpacity
          style={styles.quantityButton}
          onPress={() => updateQuantity(item.id, item.quantity - 1)}
        >
          <Feather name="minus" size={18} color="#666" />
        </TouchableOpacity>
        <Text style={styles.quantityText}>{item.quantity}</Text>
        <TouchableOpacity
          style={styles.quantityButton}
          onPress={() => updateQuantity(item.id, item.quantity + 1)}
        >
          <Feather name="plus" size={18} color="#666" />
        </TouchableOpacity>
      </View>
      <TouchableOpacity
        style={styles.removeButton}
        onPress={() => removeFromCart(item.id)}
      >
        <Feather name="trash-2" size={20} color="#EF4444" />
      </TouchableOpacity>
    </View>
  );

  const renderProductItem = ({ item }: { item: Product }) => (
    <TouchableOpacity
      style={styles.productItem}
      onPress={() => addToCart(item)}
    >
      <Image
        source={{
          uri: item.image?.uri || "https://via.placeholder.com/50",
        }}
        style={styles.productImage}
      />
      <View style={styles.productInfo}>
        <Text style={styles.productName}>{item.name}</Text>
        <Text style={styles.productStock}>Stock: {item.unitsInStock}</Text>
      </View>
      <Text style={styles.productPrice}>₦{item.sellingPrice.toFixed(0)}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Quick Sell</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Feather name="search" size={20} color="#9CA3AF" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search products..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#9CA3AF"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <Feather name="x" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          )}
        </View>

        {/* Product Search Results */}
        {showProductList && (
          <View style={styles.productListContainer}>
            <FlatList
              data={filteredProducts}
              keyExtractor={(item) => item.id}
              renderItem={renderProductItem}
              ListEmptyComponent={
                <Text style={styles.emptyText}>No products found</Text>
              }
              scrollEnabled={false}
            />
          </View>
        )}

        {/* Cart */}
        <View style={styles.cartContainer}>
          <View style={styles.cartHeader}>
            <Text style={styles.cartTitle}>Cart Items</Text>
            <Text style={styles.cartCount}>{cartItems.length} items</Text>
          </View>

          {cartItems.length === 0 ? (
            <View style={styles.emptyCart}>
              <Feather name="shopping-cart" size={60} color="#E0E0E0" />
              <Text style={styles.emptyCartText}>Your cart is empty</Text>
              <Text style={styles.emptyCartSubtext}>
                Search and add products to sell
              </Text>
            </View>
          ) : (
            <FlatList
              data={cartItems}
              keyExtractor={(item) => item.id}
              renderItem={renderCartItem}
              scrollEnabled={false}
            />
          )}
        </View>
      </ScrollView>

      {/* Bottom Summary */}
      {cartItems.length > 0 && (
        <View style={styles.bottomContainer}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal</Text>
            <Text style={styles.summaryValue}>
              ₦{calculateTotal().toFixed(0)}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Profit</Text>
            <Text style={[styles.summaryValue, styles.profitText]}>
              ₦{calculateProfit().toFixed(0)}
            </Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.summaryRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>
              ₦{calculateTotal().toFixed(0)}
            </Text>
          </View>
          <TouchableOpacity
            style={[
              styles.completeButton,
              isProcessing && styles.completeButtonDisabled,
            ]}
            onPress={handleCompleteSale}
            disabled={isProcessing}
          >
            <Text style={styles.completeButtonText}>
              {isProcessing ? "Processing..." : "Complete Sale"}
            </Text>
            <Ionicons name="checkmark-circle" size={24} color="#fff" />
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
    paddingTop: 10,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#111827",
    fontFamily: "Poppins-Bold",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    marginHorizontal: 20,
    marginTop: 10,
    marginBottom: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: "#111827",
    fontFamily: "Poppins-Regular",
  },
  productListContainer: {
    backgroundColor: "#fff",
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 12,
    maxHeight: 300,
    elevation: 2,
  },
  productItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  productImage: {
    width: 50,
    height: 50,
    borderRadius: 8,
    backgroundColor: "#F3F4F6",
  },
  productInfo: {
    flex: 1,
    marginLeft: 12,
  },
  productName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111827",
    fontFamily: "Poppins-Regular",
  },
  productStock: {
    fontSize: 13,
    color: "#6B7280",
    marginTop: 2,
    fontFamily: "Poppins-Regular",
  },
  productPrice: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1155CC",
    fontFamily: "Poppins-Regular",
  },
  cartContainer: {
    backgroundColor: "#fff",
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 12,
    padding: 16,
    elevation: 2,
  },
  cartHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  cartTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
    fontFamily: "Poppins-Bold",
  },
  cartCount: {
    fontSize: 14,
    color: "#6B7280",
    fontFamily: "Poppins-Regular",
  },
  emptyCart: {
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyCartText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#6B7280",
    marginTop: 16,
    fontFamily: "Poppins-Regular",
  },
  emptyCartSubtext: {
    fontSize: 14,
    color: "#9CA3AF",
    marginTop: 4,
    fontFamily: "Poppins-Regular",
  },
  cartItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  cartItemImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: "#F3F4F6",
  },
  cartItemInfo: {
    flex: 1,
    marginLeft: 12,
  },
  cartItemName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111827",
    fontFamily: "Poppins-Regular",
  },
  cartItemPrice: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 4,
    fontFamily: "Poppins-Regular",
  },
  quantityControls: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    borderRadius: 8,
    padding: 4,
    marginRight: 12,
  },
  quantityButton: {
    padding: 6,
  },
  quantityText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    marginHorizontal: 12,
    fontFamily: "Poppins-Regular",
    minWidth: 24,
    textAlign: "center",
  },
  removeButton: {
    padding: 8,
  },
  emptyText: {
    textAlign: "center",
    padding: 20,
    color: "#9CA3AF",
    fontFamily: "Poppins-Regular",
  },
  bottomContainer: {
    backgroundColor: "#fff",
    padding: 20,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 15,
    color: "#6B7280",
    fontFamily: "Poppins-Regular",
  },
  summaryValue: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111827",
    fontFamily: "Poppins-Regular",
  },
  profitText: {
    color: "#10B981",
  },
  divider: {
    height: 1,
    backgroundColor: "#E5E7EB",
    marginVertical: 12,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
    fontFamily: "Poppins-Bold",
  },
  totalValue: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#1155CC",
    fontFamily: "Poppins-Bold",
  },
  completeButton: {
    backgroundColor: "#1155CC",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 16,
    gap: 8,
  },
  completeButtonDisabled: {
    backgroundColor: "#9CA3AF",
  },
  completeButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
    fontFamily: "Poppins-Bold",
  },
});

export default QuickSellScreen;
