import { Feather } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  SafeAreaView,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { styles } from "./components/Cart.styles";

import { getProduct } from "@/src/api";
import { scale, verticalScale } from "../(Main)/scaling";

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

  useEffect(() => {
    loadCartProducts();
  }, [params.cartData, params.timestamp]);

  const loadCartProducts = async (): Promise<void> => {
    setLoading(true);
    try {
      // Parse cart items from route params
      let cartItems: CartItem[] = [];

      if (params.cartData) {
        try {
          cartItems = JSON.parse(params.cartData as string);
          console.log("Cart items received:", cartItems);
          console.log("Number of unique items:", cartItems.length);
          console.log(
            "Total quantity:",
            cartItems.reduce((sum, item) => sum + item.quantity, 0),
          );
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
            console.log(
              `Loading product ${item.productId} with quantity ${item.quantity}`,
            );
            const productData = await getProduct(item.productId);
            if (productData) {
              console.log("Product loaded:", productData.name);
              return {
                ...item,
                product: {
                  id: String(productData.id),
                  name: productData.name,
                  category: productData.category_name || "",
                  barcode: productData.barcode || "",
                  image: productData.image ? { uri: productData.image } : null,
                  quantityType: productData.quantity_type || "Single Items",
                  unitsInStock:
                    productData.quantity_left ?? productData.quantity,
                  costPrice: Number(productData.buying_price || 0),
                  sellingPrice: Number(productData.selling_price || 0),
                  lowStockThreshold: productData.low_stock_threshold ?? 0,
                  expiryDate: productData.expiry_date || "",
                  supplier: {
                    name:
                      productData.supplier_name ||
                      productData.supplier_obj_name ||
                      "",
                    phone: productData.supplier_phone || "",
                  },
                  dateAdded: productData.created_at || new Date().toISOString(),
                  userId: "api-user",
                } as Product,
              };
            }

            console.warn("Product not found:", item.productId);
            return item;
          } catch (error) {
            console.error("Error loading product:", error);
            return item;
          }
        }),
      );

      console.log("Cart with products loaded:", cartWithProducts);
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
      item.productId === productId ? { ...item, quantity: newQuantity } : item,
    );
    setCart(updatedCart);
  };

  const incrementQuantity = (productId: string): void => {
    const item = cart.find((i) => i.productId === productId);
    if (item && item.product) {
      if (item.quantity >= item.product.unitsInStock) {
        Alert.alert(
          "Stock Limit",
          `Only ${item.product.unitsInStock} units available in stock`,
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

  const getTotalItems = (): number => {
    return cart.reduce((total, item) => total + item.quantity, 0);
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
    index: number,
  ): React.ReactElement | null => {
    if (!item.product) {
      console.warn("Cart item missing product data:", item);
      return null;
    }

    const itemTotal = item.product.sellingPrice * item.quantity;

    return (
      <View key={`${item.productId}-${index}`} style={styles.cartItem}>
        <View style={styles.productImageContainer}>
          <Image
            source={
              item.product.image?.uri
                ? { uri: item.product.image.uri }
                : require("../../assets/images/noImg.jpg")
            }
            style={styles.productImage}
          />
        </View>

        <View style={styles.productInfo}>
          <View style={styles.productHeader}>
            <Text style={styles.productName} numberOfLines={1}>
              {item.product.name}
            </Text>
            <TouchableOpacity
              onPress={() => removeFromCart(item.productId)}
              style={styles.removeButton}
              hitSlop={{
                top: verticalScale(10),
                bottom: verticalScale(10),
                left: scale(10),
                right: scale(10),
              }}
            >
              <Feather name="x" size={18} color="#666" />
            </TouchableOpacity>
          </View>

          <View style={styles.priceQuantityRow}>
            <Text style={styles.productPrice}>
              ₦{item.product.sellingPrice.toLocaleString()}
            </Text>
          </View>

          <View style={styles.bottomRow}>
            <View style={styles.quantityControl}>
              <TouchableOpacity
                onPress={() => decrementQuantity(item.productId)}
                style={styles.quantityButton}
              >
                <Text style={styles.quantityButtonText}>-</Text>
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

  if (loading) {
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
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Feather name="arrow-left" size={24} color="#000" />
        </TouchableOpacity>
        {/* <View style={styles.headerRight}>
          <Text style={styles.itemCount}>
            {getTotalItems()} {getTotalItems() === 1 ? "item" : "items"}
          </Text>
        </View> */}
      </View>

      {cart.length === 0 ? (
        renderEmptyCart()
      ) : (
        <>
          {/* Cart Items */}
          <ScrollView
            style={styles.cartContainer}
            showsVerticalScrollIndicator={false}
            // contentContainerStyle={styles.cartContentContainer}
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

export default Cart;
