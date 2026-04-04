import { DUMMY_PRODUCTS, Product } from "@/src/api/dummyData/dummyProducts";
import { Feather, MaterialIcons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
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
import AddProductFlow from "./AddProductFlow";
import { styles } from "./ProductDetails.styles";

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

    const found = DUMMY_PRODUCTS.find((p) => p.id === productId) ?? null;

    if (!found) {
      console.warn(
        `[ProductDetails] No product found for id="${productId}". ` +
          `Available ids: ${DUMMY_PRODUCTS.map((p) => p.id).join(", ")}`,
      );
    }

    setProduct(found);
    setLoading(false);
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

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Product image */}
        <View style={styles.imageContainer}>
          <Image
            source={
              product.image?.uri
                ? { uri: product.image.uri }
                : require("../../assets/images/noImg.jpg")
            }
            style={styles.productImage}
          />
        </View>

        {/* Product info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Product Info</Text>
          {[
            { label: "Name", value: product.name },
            { label: "Category", value: product.category },
            { label: "Barcode", value: product.barcode },
          ].map(({ label, value }) => (
            <View key={label} style={styles.row}>
              <Text style={styles.rowLabel}>{label}:</Text>
              <Text style={styles.rowValue}>{value}</Text>
            </View>
          ))}
        </View>

        {/* Quantity & pricing */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quantity & Pricing</Text>
          {[
            { label: "Units in Stock", value: String(product.unitsInStock) },
            { label: "Unit Type", value: product.quantityType },
            {
              label: "Cost Price",
              value: `₦${product.costPrice.toLocaleString()}`,
            },
            {
              label: "Selling Price",
              value: `₦${product.sellingPrice.toLocaleString()}`,
            },
          ].map(({ label, value }) => (
            <View key={label} style={styles.row}>
              <Text style={styles.rowLabel}>{label}:</Text>
              <Text style={styles.rowValue}>{value}</Text>
            </View>
          ))}
        </View>

        {/* Stock settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Stock Settings</Text>
          {[
            {
              label: "Low Stock Threshold",
              value: String(product.lowStockThreshold),
            },
            {
              label: "Expiry Date",
              value: formatExpiryDate(product.expiryDate),
            },
          ].map(({ label, value }) => (
            <View key={label} style={styles.row}>
              <Text style={styles.rowLabel}>{label}:</Text>
              <Text style={styles.rowValue}>{value}</Text>
            </View>
          ))}
        </View>

        {/* Supplier info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Supplier Info</Text>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Name:</Text>
            <Text style={styles.rowValue}>{product.supplier.name}</Text>
          </View>
          <View style={[styles.row, { borderBottomWidth: 0 }]}>
            <Text style={styles.rowLabel}>Phone no:</Text>
            <Text style={styles.rowValue}>{product.supplier.phone}</Text>
          </View>
        </View>

        {/* Edit button */}
        <View style={styles.bottomContainer}>
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => setShowEditModal(true)}
          >
            <Feather name="edit-2" size={18} color="#1155CC" />
            <Text style={styles.editButtonText}>Edit Product</Text>
          </TouchableOpacity>
        </View>
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
