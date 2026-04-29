import { Product } from "@/app/(Main)/Sell";
import { styles } from "@/app/(Main)/Sell.styles";
import Feather from "@expo/vector-icons/Feather";
import React from "react";
import { Image, ScrollView, Text, TouchableOpacity, View } from "react-native";

interface CartItem {
  productId: string;
  quantity: number;
}

interface AllProductsProps {
  products: Product[];
  filteredProducts: Product[];
  cart: CartItem[];
  onAddToCart: (productId: string) => void;
  onIncrement: (productId: string) => void;
  onDecrement: (productId: string) => void;
}

const AllProducts: React.FC<AllProductsProps> = ({
  products,
  filteredProducts,
  cart,
  onAddToCart,
  onIncrement,
  onDecrement,
}) => {
  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Feather name="package" size={64} color="#E0E0E0" />
      <Text style={styles.emptyTitle}>No Products Available</Text>
      <Text style={styles.emptyDescription}>
        Add products to your inventory to start selling
      </Text>
    </View>
  );

  const renderProductCard = (product: Product) => {
    if (!product?.id) return null;

    const isOutOfStock = product.unitsInStock <= 0;
    const cartItem = cart.find((item) => item.productId === product.id);
    const isInCart = !!cartItem;

    const source =
      product.image?.uri?.startsWith("http") ||
      product.image?.uri?.startsWith("file")
        ? { uri: product.image.uri }
        : require("../../assets/images/noImg.jpg");

    return (
      <View key={product.id} style={styles.productCard}>
        <Image source={source} style={styles.productImage} resizeMode="cover" />
        <View style={styles.productDetails}>
          <Text style={styles.productName} numberOfLines={2}>
            {product.name}
          </Text>

          <View style={styles.priceRow}>
            {!isInCart && (
              <Text
                style={styles.productPrice}
                numberOfLines={1}
                adjustsFontSizeToFit
              >
                ₦{(product.sellingPrice ?? 0).toLocaleString()}
              </Text>
            )}

            {isInCart ? (
              <View style={styles.quantityControls}>
                <TouchableOpacity
                  style={styles.quantityButton}
                  onPress={() => onDecrement(product.id)}
                  activeOpacity={0.7}
                >
                  <Feather name="minus" size={20} color="black" />
                </TouchableOpacity>
                <Text style={styles.quantityText}>{cartItem.quantity}</Text>
                <TouchableOpacity
                  style={styles.quantityButton}
                  onPress={() => onIncrement(product.id)}
                  activeOpacity={0.7}
                >
                  <Feather name="plus" size={20} color="black" />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={[
                  styles.addToCartButton,
                  isOutOfStock && styles.addToCartButtonDisabled,
                ]}
                onPress={() => onAddToCart(product.id)}
                disabled={isOutOfStock}
                activeOpacity={0.8}
              >
                <Feather
                  name="shopping-cart"
                  size={16}
                  color={isOutOfStock ? "#999" : "#fff"}
                />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    );
  };

  return (
    <ScrollView
      style={styles.productsContainer}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.scrollContent}
    >
      {filteredProducts.length === 0 ? (
        renderEmptyState()
      ) : (
        <>
          {products.length > 0 && (
            <Text style={styles.sectionTitle}>Frequently sold products</Text>
          )}
          <View style={styles.productsGrid}>
            {filteredProducts.map((product) => renderProductCard(product))}
          </View>
        </>
      )}
      <View style={styles.bottomPadding} />
    </ScrollView>
  );
};

export default AllProducts;
