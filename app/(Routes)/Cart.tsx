import { Feather } from "@expo/vector-icons";
import { useFonts } from "expo-font";
import { useLocalSearchParams, useRouter } from "expo-router";
import { doc, getDoc } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { db } from "../config/firebaseConfig";

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
  product?: Product;
}

const Cart: React.FC = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [loading, setLoading] = useState<boolean>(true);
  const [cart, setCart] = useState<CartItem[]>([]);

  const [fontsLoaded] = useFonts({
    "Poppins-Regular": require("../../assets/fonts/Poppins-Regular.ttf"),
    "Poppins-Bold": require("../../assets/fonts/Poppins-Bold.ttf"),
    "Poppins-Light": require("../../assets/fonts/Poppins-Light.ttf"),
  });

  useEffect(() => {
    loadCartProducts();
  }, [params.cartData]);

  const loadCartProducts = async (): Promise<void> => {
    setLoading(true);
    try {
      // Parse cart items from route params
      let cartItems: CartItem[] = [];

      if (params.cartData) {
        try {
          cartItems = JSON.parse(params.cartData as string);
          console.log("Cart items received:", cartItems);
        } catch (parseError) {
          console.error("Error parsing cart data:", parseError);
          Alert.alert("Error", "Failed to load cart data");
          setCart([]);
          setLoading(false);
          return;
        }
      }

      if (cartItems.length === 0) {
        console.log("No items in cart");
        setCart([]);
        setLoading(false);
        return;
      }

      // Load product details for each cart item
      const cartWithProducts = await Promise.all(
        cartItems.map(async (item) => {
          try {
            console.log("Loading product:", item.productId);
            const productDoc = await getDoc(
              doc(db, "products", item.productId)
            );
            if (productDoc.exists()) {
              const productData = productDoc.data();
              console.log("Product loaded:", productData.name);
              return {
                ...item,
                product: { id: productDoc.id, ...productData } as Product,
              };
            } else {
              console.warn("Product not found:", item.productId);
              return item;
            }
          } catch (error) {
            console.error("Error loading product:", error);
            return item;
          }
        })
      );

      console.log("Cart with products:", cartWithProducts);
      setCart(cartWithProducts);
    } catch (error) {
      console.error("Error loading cart:", error);
      Alert.alert("Error", "Failed to load cart items");
      setCart([]);
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = (productId: string, newQuantity: number): void => {
    if (newQuantity < 1) {
      removeFromCart(productId);
      return;
    }

    const updatedCart = cart.map((item) =>
      item.productId === productId ? { ...item, quantity: newQuantity } : item
    );
    setCart(updatedCart);
  };

  const incrementQuantity = (productId: string): void => {
    const item = cart.find((i) => i.productId === productId);
    if (item && item.product) {
      if (item.quantity >= item.product.unitsInStock) {
        Alert.alert(
          "Stock Limit",
          `Only ${item.product.unitsInStock} units available in stock`
        );
        return;
      }
      updateQuantity(productId, item.quantity + 1);
    }
  };

  const decrementQuantity = (productId: string): void => {
    const item = cart.find((i) => i.productId === productId);
    if (item) {
      updateQuantity(productId, item.quantity - 1);
    }
  };

  const removeFromCart = (productId: string): void => {
    const updatedCart = cart.filter((item) => item.productId !== productId);
    setCart(updatedCart);

    // If cart is empty after removal, go back
    if (updatedCart.length === 0) {
      Alert.alert("Cart Empty", "Your cart is now empty", [
        { text: "OK", onPress: () => router.back() },
      ]);
    }
  };

  const calculateTotal = (): number => {
    return cart.reduce((total, item) => {
      if (item.product) {
        return total + item.product.sellingPrice * item.quantity;
      }
      return total;
    }, 0);
  };

  const proceedToCheckout = (): void => {
    if (cart.length === 0) {
      Alert.alert("Empty Cart", "Please add items to your cart first");
      return;
    }
    router.push({
      pathname: "/(Routes)/Checkout" as any,
      params: { cartData: JSON.stringify(cart) },
    });
  };

  const renderCartItem = (
    item: CartItem,
    index: number
  ): React.ReactElement | null => {
    if (!item.product) {
      console.warn("Cart item missing product data:", item);
      return null;
    }

    return (
      <View key={`${item.productId}-${index}`} style={styles.cartItem}>
        <Image
          source={
            item.product.image?.uri
              ? { uri: item.product.image.uri }
              : { uri: "https://via.placeholder.com/60" }
          }
          style={styles.productImage}
        />

        <View style={styles.productInfo}>
          <View style={styles.productHeader}>
            <Text style={styles.productName} numberOfLines={1}>
              {item.product.name}
            </Text>
            <TouchableOpacity
              onPress={() => removeFromCart(item.productId)}
              style={styles.removeButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Feather name="x" size={18} color="#666" />
            </TouchableOpacity>
          </View>

          <Text style={styles.productPrice}>
            ₦{item.product.sellingPrice.toLocaleString()}
          </Text>

          <View style={styles.quantityControl}>
            <TouchableOpacity
              onPress={() => decrementQuantity(item.productId)}
              style={styles.quantityButton}
            >
              <Text style={styles.quantityButtonText}>−</Text>
            </TouchableOpacity>

            <Text style={styles.quantityText}>{item.quantity}</Text>

            <TouchableOpacity
              onPress={() => incrementQuantity(item.productId)}
              style={styles.quantityButton}
            >
              <Text style={styles.quantityButtonText}>+</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  const renderEmptyCart = (): React.ReactElement => (
    <View style={styles.emptyState}>
      <Feather name="shopping-cart" size={80} color="#E0E0E0" />
      <Text style={styles.emptyTitle}>Your Cart is Empty</Text>
      <Text style={styles.emptyDescription}>
        Add products from the sell page to get started
      </Text>
      <TouchableOpacity style={styles.shopButton} onPress={() => router.back()}>
        <Text style={styles.shopButtonText}>Continue Shopping</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading || !fontsLoaded) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading cart...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Shopping Cart</Text>
        <View style={styles.back}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Feather name="arrow-left" size={24} color="#000" />
          </TouchableOpacity>
        </View>
      </View>

      {cart.length === 0 ? (
        renderEmptyCart()
      ) : (
        <>
          {/* Cart Items */}
          <ScrollView
            style={styles.cartContainer}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.cartContentContainer}
          >
            {cart.map((item, index) => renderCartItem(item, index))}
          </ScrollView>

          {/* Total and Checkout */}
          <View style={styles.footer}>
            <View style={styles.totalContainer}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalAmount}>
                ₦{calculateTotal().toLocaleString()}
              </Text>
            </View>

            <TouchableOpacity
              style={styles.checkoutButton}
              onPress={proceedToCheckout}
            >
              <Text style={styles.checkoutButtonText}>Proceed to Checkout</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 30,
    backgroundColor: "#D6E4F5",
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
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 15,
    backgroundColor: "#D6E4F5",
  },
  back: {
    backgroundColor: "#fff",
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: "Poppins-Bold",
    color: "#000",
  },
  backButton: {
    padding: 8,
  },
  cartContainer: {
    flex: 1,
  },
  cartContentContainer: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
  },
  cartItem: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    flexDirection: "row",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderStyle: "dashed",
  },
  productImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: "#F5F5F5",
    marginRight: 12,
  },
  productInfo: {
    flex: 1,
    justifyContent: "space-between",
  },
  productHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  productName: {
    fontSize: 16,
    fontFamily: "Poppins-Bold",
    color: "#000",
    flex: 1,
    marginRight: 8,
  },
  removeButton: {
    padding: 2,
  },
  productPrice: {
    fontSize: 15,
    fontFamily: "Poppins-Bold",
    color: "#000",
    marginBottom: 8,
  },
  quantityControl: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
  },
  quantityButton: {
    width: 28,
    height: 28,
    backgroundColor: "#F0F0F0",
    borderRadius: 6,
    justifyContent: "center",
    alignItems: "center",
  },
  quantityButtonText: {
    fontSize: 18,
    fontFamily: "Poppins-Regular",
    color: "#000",
    lineHeight: 20,
  },
  quantityText: {
    fontSize: 16,
    fontFamily: "Poppins-Bold",
    color: "#000",
    marginHorizontal: 16,
    minWidth: 20,
    textAlign: "center",
  },
  footer: {
    backgroundColor: "#D6E4F5",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
  },
  totalContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  totalLabel: {
    fontSize: 18,
    fontFamily: "Poppins-Bold",
    color: "#000",
  },
  totalAmount: {
    fontSize: 20,
    fontFamily: "Poppins-Bold",
    color: "#000",
  },
  checkoutButton: {
    backgroundColor: "#2563EB",
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
  },
  checkoutButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
    fontFamily: "Poppins-Regular",
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
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
    marginBottom: 24,
    fontFamily: "Poppins-Regular",
  },
  shopButton: {
    backgroundColor: "#2563EB",
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  shopButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "600",
    fontFamily: "Poppins-Regular",
  },
});

export default Cart;
