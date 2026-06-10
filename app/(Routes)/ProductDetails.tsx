import { apiClient } from "@/src/api/client";
import { Product } from "@/src/api/dummyData/dummyProducts";
import { PRODUCTS_USER_INVENTORY_ITEM } from "@/src/api/endpoints";
import { Feather, MaterialIcons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  SafeAreaView,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { formatCurrency } from "@/utils/formatters";
import AddProductFlow from "./AddProductFlow";
import ProductSummaryView from "./components/ProductSummaryView";
import { styles } from "./ProductDetails.styles";

const normalizeEndpoint = (endpoint: string) =>
  endpoint.startsWith("/api/") ? endpoint.replace(/^\/api/, "") : endpoint;

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatExpiryDate = (dateString: string): string => {
  if (!dateString) return "Not specified";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "Not specified";
  return date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
};

// ─── Delete modal ─────────────────────────────────────────────────────────────

interface DeleteModalProps {
  visible: boolean;
  productName: string;
  deleting: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

const DeleteModal: React.FC<DeleteModalProps> = ({
  visible,
  productName,
  deleting,
  onCancel,
  onConfirm,
}) => (
  <Modal
    visible={visible}
    transparent
    animationType="fade"
    onRequestClose={onCancel}
  >
    <View style={styles.modalOverlay}>
      <View style={styles.deleteModal}>
        <View style={styles.deleteModalHeader}>
          <MaterialIcons name="warning" size={32} color="#FF6B6B" />
          <Text style={styles.deleteModalTitle}>Delete Product</Text>
        </View>
        <Text style={styles.deleteModalMessage}>
          Are you sure you want to delete "{productName}"? This action cannot be
          undone.
        </Text>
        <View style={styles.deleteModalButtons}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={onCancel}
            disabled={deleting}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.deleteButton, deleting && styles.disabledButton]}
            onPress={onConfirm}
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

// ─── Main screen ──────────────────────────────────────────────────────────────

const ProductDetails: React.FC = () => {
  const router = useRouter();

  /**
   * BUG 4 (was): useLocalSearchParams<{ productId: string }> returns ALL
   * params as strings (expo-router stringifies everything).  The original
   * code used the value directly in Array.find(), which works fine for
   * string IDs.  However, if productId arrived as "undefined" (the string
   * literal) because the sender passed undefined, the find() would always
   * fail silently.
   *
   * Fix: trim and guard the param before using it so we get a clear console
   * warning instead of a silent "Product not found" render.
   */
  const params = useLocalSearchParams<{ productId?: string }>();

  // Normalise: expo-router may give us an array if the same key appears
  // multiple times — always take the first element.
  const rawId = Array.isArray(params.productId)
    ? params.productId[0]
    : params.productId;

  const productId = rawId?.trim();
  console.log("[ProductDetails] Normalized productId:", productId);

  const insets = useSafeAreaInsets();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  useEffect(() => {
    if (!productId) {
      // Param was missing or empty — warn so it is easy to spot during dev.
      console.warn(
        "[ProductDetails] productId param is missing or empty. " +
          "Check that the caller is passing params: { productId } correctly.",
      );
      setLoading(false);
      return;
    }

    const fetchProductDetails = async () => {
      try {
        const { data } = await apiClient.get(
          normalizeEndpoint(PRODUCTS_USER_INVENTORY_ITEM(productId)),
        );

        if (!data) {
          setProduct(null);
          return;
        }

        const costPrice = Number(data.cost_price || 0);
        const sellingPrice = Number(data.selling_price || 0);

        const mappedProduct: Product = {
          id: String(data.id),
          name: data.name,
          category: data.category || "",
          barcode: String(data.barcode || ""),
          image: data.image_url ? { uri: data.image_url } : null,
          quantityType: data.quantity_type || data.unit_type || "Single Items",
          unitsInStock: Number(data.units_in_stock || 0),
          profitPerUnit: sellingPrice - costPrice,
          costPrice,
          sellingPrice,
          lowStockThreshold: data.low_stock_threshold ?? 0,
          expiryDate: data.expiry_date || "",
          supplier: {
            name: data.supplier_name || "",
            phone: data.supplier_phone || "",
          },
          dateAdded:
            data.added_at || data.updated_at || new Date().toISOString(),
          userId: "api-user",
        };

        setProduct(mappedProduct);
      } catch (error) {
        console.warn(
          `[ProductDetails] Failed to fetch user inventory item id="${productId}"`,
          error,
        );
        setProduct(null);
      } finally {
        setLoading(false);
      }
    };

    fetchProductDetails();
  }, [productId]);

  // ─── Delete handler ────────────────────────────────────────────────────────

  const handleDeleteProduct = async () => {
    if (!product) return;
    setDeleting(true);
    try {
      // TODO: wire up real delete API
      await new Promise((resolve) => setTimeout(resolve, 800));
      Alert.alert("Success", "Product deleted successfully", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch {
      Alert.alert("Error", "Failed to delete product. Please try again.");
    } finally {
      setDeleting(false);
      setShowDeleteModal(false);
    }
  };

  // ─── Loading / error states ────────────────────────────────────────────────

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1A3CC8" />
          <Text style={styles.loadingText}>Loading product...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!product) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>
            {productId
              ? `Product "${productId}" not found`
              : "No product ID was provided"}
          </Text>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={{ color: "#1155CC", marginTop: 12 }}>Go back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Summary</Text>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={() => router.back()}
        >
          <MaterialIcons name="close" size={24} color="#000" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={{ paddingBottom: 32 + insets.bottom }}
        showsVerticalScrollIndicator={false}
      >
        <ProductSummaryView
          imageUri={product.image?.uri}
          sections={[
            {
              title: "Product Info",
              rows: [
                { label: "Name:", value: product.name },
                { label: "Category:", value: product.category },
                { label: "Barcode:", value: product.barcode },
              ],
            },
            {
              title: "Quantity & Pricing",
              rows: [
                {
                  label: "Units in Stock:",
                  value: String(product.unitsInStock),
                },
                { label: "Unit Type:", value: product.quantityType },
                {
                  label: "Cost Price:",
                  value: formatCurrency(product.costPrice ?? 0),
                },
                {
                  label: "Selling Price:",
                  value: formatCurrency(product.sellingPrice ?? 0),
                },
              ],
            },
            {
              title: "Stock Settings",
              rows: [
                {
                  label: "Low Stock Threshold:",
                  value: String(product.lowStockThreshold),
                },
                {
                  label: "Expiry Date:",
                  value: formatExpiryDate(product.expiryDate),
                },
              ],
            },
            {
              title: "Supplier Info",
              rows: [
                { label: "Name:", value: product.supplier.name },
                { label: "Phone no:", value: product.supplier.phone },
              ],
            },
          ]}
          footer={
            <TouchableOpacity
              style={styles.editButton}
              onPress={() => setShowEditModal(true)}
            >
              <Feather name="edit-2" size={18} color="#1155CC" />
              <Text style={styles.editButtonText}>Edit Product</Text>
            </TouchableOpacity>
          }
        />
      </ScrollView>

      <DeleteModal
        visible={showDeleteModal}
        productName={product.name}
        deleting={deleting}
        onCancel={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteProduct}
      />

      <AddProductFlow
        visible={showEditModal}
        onClose={() => setShowEditModal(false)}
        onSaveProduct={(updatedProduct) => {
          setProduct(updatedProduct);
          setShowEditModal(false);
          Alert.alert("Success", "Product updated!");
        }}
        initialProduct={product}
      />
    </SafeAreaView>
  );
};

export default ProductDetails;
