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
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { formatCurrency } from "@/utils/formatters";
import { styles } from "./components/Cart.styles";

// Manual dashed separator: RN's `borderStyle: "dashed"` renders solid on iOS
// unless borderRadius > 0 (which curves the edges), so we draw the line from
// small segments instead — always straight and dashed across platforms.
const DASH_COUNT = Math.ceil(Dimensions.get("window").width / 10);
const DashedSeparator: React.FC = () => (
  <View style={styles.dashedSeparator}>
    {Array.from({ length: DASH_COUNT }).map((_, i) => (
      <View key={i} style={styles.dash} />
    ))}
  </View>
);

import { apiClient } from "@/src/api";
import { PRODUCTS_ITEM } from "@/src/api/endpoints";
import { scale, verticalScale } from "../../utils/scaling";

const normalizeEndpoint = (endpoint: string) =>
  endpoint.startsWith("/api/") ? endpoint.replace(/^\/api/, "") : endpoint;

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
  id: string;
  quantity: number;
  product?: Product;
}

const Cart: React.FC = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [loading, setLoading] = useState<boolean>(true);
  const [cart, setCart] = useState<CartItem[]>([]);

  useEffect(() => {
    let cartItems: CartItem[] = [];
    if (params.cartData) {
      try {
        const parsed = JSON.parse(params.cartData as string) as Array<
          CartItem & { productId?: string }
        >;
        cartItems = parsed
          .map((item) => ({ ...item, id: item.id || item.productId || "" }))
          .filter((item) => !!item.id);
      } catch (parseError) {
        Alert.alert("Error", "Failed to load cart data");
        setCart([]);
        setLoading(false);
        return;
      }
    }
    if (cartItems.length === 0) {
      setCart([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    Promise.all(
      cartItems.map(async (item) => {
        if (item.product) {
          return item;
        }

        try {
          const { data: productData } = await apiClient.get(
            normalizeEndpoint(PRODUCTS_ITEM(item.id)),
          );
          if (productData) {
            return {
              ...item,
              product: {
                id: String(productData.id),
                name: productData.name,
                category: productData.category_name || "",
                barcode: productData.barcode || "",
                image: productData.image ? { uri: productData.image } : null,
                quantityType: productData.quantity_type || "Single Items",
                unitsInStock: productData.quantity_left ?? productData.quantity,
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
        } catch (error) {
          // fallback: skip product
        }
        return item;
      }),
    ).then((cartWithProducts) => {
      setCart(cartWithProducts);
      setLoading(false);
    });
  }, [params.cartData, params.timestamp]);

  const updateQuantity = (id: string, newQuantity: number): void => {
    if (newQuantity < 1) {
      removeFromCart(id);
      return;
    }

    const updatedCart = cart.map((item) =>
      item.id === id ? { ...item, quantity: newQuantity } : item,
    );
    setCart(updatedCart);
  };

  const incrementQuantity = (id: string): void => {
    const item = cart.find((i) => i.id === id);
    if (item && item.product) {
      if (item.quantity >= item.product.unitsInStock) {
        Alert.alert(
          "Stock Limit",
          `Only ${item.product.unitsInStock} units available in stock`,
        );
        return;
      }
      updateQuantity(id, item.quantity + 1);
    }
  };

  const decrementQuantity = (id: string): void => {
    const item = cart.find((i) => i.id === id);
    if (item) {
      updateQuantity(id, item.quantity - 1);
    }
  };

  const removeFromCart = (id: string): void => {
    const updatedCart = cart.filter((item) => item.id !== id);
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
      <View key={`${item.id}-${index}`} style={styles.cartItem}>
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
              onPress={() => removeFromCart(item.id)}
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
              {formatCurrency(item.product.sellingPrice ?? 0)}
            </Text>
          </View>

          <View style={styles.bottomRow}>
            <View style={styles.quantityControl}>
              <TouchableOpacity
                onPress={() => decrementQuantity(item.id)}
                style={styles.quantityButton}
              >
                <Text style={styles.quantityButtonText}>-</Text>
              </TouchableOpacity>

              <Text style={styles.quantityText}>{item.quantity}</Text>

              <TouchableOpacity
                onPress={() => incrementQuantity(item.id)}
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
            {cart.map((item, index) => (
              <React.Fragment key={`${item.id}-${index}`}>
                {renderCartItem(item, index)}
                <DashedSeparator />
              </React.Fragment>
            ))}
          </ScrollView>

          {/* Total and Checkout */}
          <View style={styles.footer}>
            <View style={styles.totalContainer}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalAmount}>
                {formatCurrency(calculateTotal() ?? 0)}
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
