import { Feather, Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  SafeAreaView,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { styles } from "./ProductDetails.styles";

import { deleteProduct, getProduct } from "@/src/api";

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

interface StockStatus {
  text: string;
  color: string;
  bgColor: string;
}

const ProductDetails: React.FC = () => {
  const router = useRouter();
  const { productId } = useLocalSearchParams();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [deleting, setDeleting] = useState<boolean>(false);
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);

  // Fetch product details
  useEffect(() => {
    const fetchProduct = async () => {
      if (!productId || typeof productId !== "string") {
        console.error("Invalid product ID");
        setLoading(false);
        return;
      }

      try {
        const response = await getProduct(productId);

        if (response) {
          const productData = {
            id: String(response.id),
            name: response.name,
            category: response.category_name || "",
            barcode: response.barcode || "",
            image: response.image ? { uri: response.image } : null,
            quantityType: response.quantity_type || "Single Items",
            unitsInStock: response.quantity_left ?? response.quantity,
            costPrice: Number(response.buying_price || 0),
            sellingPrice: Number(response.selling_price || 0),
            lowStockThreshold: response.low_stock_threshold ?? 0,
            expiryDate: response.expiry_date || "",
            supplier: {
              name: response.supplier_name || response.supplier_obj_name || "",
              phone: response.supplier_phone || "",
            },
            dateAdded: response.created_at || new Date().toISOString(),
            userId: "api-user",
          } as Product;

          setProduct(productData);
        } else {
          Alert.alert("Error", "Product not found", [
            { text: "OK", onPress: () => router.back() },
          ]);
        }
      } catch (error) {
        console.error("Error fetching product:", error);
        Alert.alert("Error", "Failed to load product details", [
          { text: "OK", onPress: () => router.back() },
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [productId]);

  // Delete product function
  const handleDeleteProduct = async () => {
    if (!product) return;

    setDeleting(true);

    try {
      await deleteProduct(product.id);

      Alert.alert("Success", "Product deleted successfully", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (error) {
      console.error("Error deleting product:", error);
      Alert.alert("Error", "Failed to delete product. Please try again.");
    } finally {
      setDeleting(false);
      setShowDeleteModal(false);
    }
  };

  // Confirm delete function
  const confirmDelete = () => {
    setShowDeleteModal(true);
  };

  // Get stock status
  const getStockStatus = (product: Product): StockStatus => {
    if (product.unitsInStock === 0) {
      return { text: "Out of Stock", color: "#FF6B6B", bgColor: "#FFE5E5" };
    } else if (product.unitsInStock <= product.lowStockThreshold) {
      return { text: "Low Stock", color: "#FF8C42", bgColor: "#FFF2E5" };
    } else {
      return { text: "In Stock", color: "#4CAF50", bgColor: "#E8F5E8" };
    }
  };

  // Check if product is expiring soon
  const isExpiringSoon = (expiryDate: string): boolean => {
    if (!expiryDate) return false;
    const now = new Date();
    const expiry = new Date(expiryDate);
    const daysUntilExpiry = Math.ceil(
      (expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
    );
    return daysUntilExpiry <= 30 && daysUntilExpiry > 0;
  };

  // Calculate days until expiry
  const getDaysUntilExpiry = (expiryDate: string): number => {
    if (!expiryDate) return 0;
    const now = new Date();
    const expiry = new Date(expiryDate);
    return Math.ceil(
      (expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
    );
  };

  // Format date
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Render delete confirmation modal
  const renderDeleteModal = () => (
    <Modal
      visible={showDeleteModal}
      transparent
      animationType="fade"
      onRequestClose={() => setShowDeleteModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.deleteModal}>
          <View style={styles.deleteModalHeader}>
            <MaterialIcons name="warning" size={32} color="#FF6B6B" />
            <Text style={styles.deleteModalTitle}>Delete Product</Text>
          </View>

          <Text style={styles.deleteModalMessage}>
            Are you sure you want to delete &quot;{product?.name}&quot;? This
            action cannot be undone.
          </Text>

          <View style={styles.deleteModalButtons}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setShowDeleteModal(false)}
              disabled={deleting}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.deleteButton, deleting && styles.disabledButton]}
              onPress={handleDeleteProduct}
              disabled={deleting}
            >
              {deleting ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <>
                  <MaterialIcons name="delete" size={16} color="#FFF" />
                  <Text style={styles.deleteButtonText}>Delete</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Product Details</Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1155CC" />
          <Text style={styles.loadingText}>Loading product details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!product) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Product Details</Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Product not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const stockStatus = getStockStatus(product);
  const expiringSoon = isExpiringSoon(product.expiryDate);
  const daysUntilExpiry = getDaysUntilExpiry(product.expiryDate);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Product Details</Text>
        <TouchableOpacity
          style={styles.deleteHeaderButton}
          onPress={confirmDelete}
        >
          <MaterialIcons name="delete" size={24} color="#FF6B6B" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Product Image and Basic Info */}
        <View style={styles.productImageSection}>
          <View style={styles.imageContainer}>
            <Image
              source={
                product.image?.uri
                  ? { uri: product.image.uri }
                  : require("../../assets/images/noImg.jpg")
              }
              style={styles.productImage}
            />
            {expiringSoon && (
              <View style={styles.expiringBadge}>
                <Ionicons name="warning" size={16} color="#FF8C42" />
                <Text style={styles.expiringText}>
                  Expires in {daysUntilExpiry} day
                  {daysUntilExpiry !== 1 ? "s" : ""}
                </Text>
              </View>
            )}
          </View>

          <View style={styles.basicInfo}>
            <Text style={styles.productName}>{product.name}</Text>
            <Text style={styles.productCategory}>{product.category}</Text>

            <View style={styles.stockStatusContainer}>
              <View
                style={[
                  styles.stockBadge,
                  { backgroundColor: stockStatus.bgColor },
                ]}
              >
                <Text
                  style={[styles.stockBadgeText, { color: stockStatus.color }]}
                >
                  {stockStatus.text}
                </Text>
              </View>
              <Text style={styles.stockCount}>
                {product.unitsInStock} {product.quantityType}
              </Text>
            </View>
          </View>
        </View>

        {/* Pricing Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pricing Information</Text>
          <View style={styles.pricingGrid}>
            <View style={styles.priceItem}>
              <Text style={styles.priceLabel}>Cost Price</Text>
              <Text style={styles.priceValue}>
                ₦{product.costPrice.toLocaleString()}
              </Text>
            </View>
            <View style={styles.priceItem}>
              <Text style={styles.priceLabel}>Selling Price</Text>
              <Text style={styles.priceValue}>
                ₦{product.sellingPrice.toLocaleString()}
              </Text>
            </View>
            <View style={styles.priceItem}>
              <Text style={styles.priceLabel}>Profit per Unit</Text>
              <Text style={[styles.priceValue, styles.profitValue]}>
                ₦{(product.sellingPrice - product.costPrice).toLocaleString()}
              </Text>
            </View>
            <View style={styles.priceItem}>
              <Text style={styles.priceLabel}>Total Value</Text>
              <Text style={styles.priceValue}>
                ₦
                {(product.sellingPrice * product.unitsInStock).toLocaleString()}
              </Text>
            </View>
          </View>
        </View>

        {/* Stock Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Stock Information</Text>
          <View style={styles.stockGrid}>
            <View style={styles.stockItem}>
              <Text style={styles.stockLabel}>Current Stock</Text>
              <Text style={styles.stockValue}>
                {product.unitsInStock} {product.quantityType}
              </Text>
            </View>
            <View style={styles.stockItem}>
              <Text style={styles.stockLabel}>Low Stock Alert</Text>
              <Text style={styles.stockValue}>
                {product.lowStockThreshold} {product.quantityType}
              </Text>
            </View>
          </View>

          {product.unitsInStock <= product.lowStockThreshold && (
            <View style={styles.lowStockAlert}>
              <Ionicons name="warning-outline" size={20} color="#FF8C42" />
              <Text style={styles.lowStockText}>
                Stock is running low! Consider restocking soon.
              </Text>
            </View>
          )}
        </View>

        {/* Product Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Product Details</Text>
          <View style={styles.detailsGrid}>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Barcode</Text>
              <Text style={styles.detailValue}>{product.barcode}</Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Quantity Type</Text>
              <Text style={styles.detailValue}>{product.quantityType}</Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Expiry Date</Text>
              <Text
                style={[
                  styles.detailValue,
                  expiringSoon && styles.expiringDate,
                ]}
              >
                {product.expiryDate
                  ? formatDate(product.expiryDate)
                  : "Not specified"}
              </Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Date Added</Text>
              <Text style={styles.detailValue}>
                {formatDate(product.dateAdded)}
              </Text>
            </View>
          </View>
        </View>

        {/* Supplier Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Supplier Information</Text>
          <View style={styles.supplierInfo}>
            <View style={styles.supplierItem}>
              <Ionicons name="person-outline" size={20} color="#666" />
              <View style={styles.supplierTextContainer}>
                <Text style={styles.supplierLabel}>Supplier Name</Text>
                <Text style={styles.supplierValue}>
                  {product.supplier.name}
                </Text>
              </View>
            </View>
            <View style={styles.supplierItem}>
              <Ionicons name="call-outline" size={20} color="#666" />
              <View style={styles.supplierTextContainer}>
                <Text style={styles.supplierLabel}>Phone Number</Text>
                <Text style={styles.supplierValue}>
                  {product.supplier.phone}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionSection}>
          <TouchableOpacity style={styles.editButton}>
            <Feather name="edit-2" size={18} color="#1155CC" />
            <Text style={styles.editButtonText}>Edit Product</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.deleteActionButton}
            onPress={confirmDelete}
          >
            <MaterialIcons name="delete" size={18} color="#FF6B6B" />
            <Text style={styles.deleteActionButtonText}>Delete Product</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Delete Confirmation Modal */}
      {renderDeleteModal()}
    </SafeAreaView>
  );
};

export default ProductDetails;
