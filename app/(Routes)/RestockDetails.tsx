import { getNotification, getUserInventoryItem } from "@/src/api";
import { Product as AddProductModel } from "@/hooks/useAddProductForm";
import { Feather, Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";

import {
    ActivityIndicator,
    Image,
    SafeAreaView,
    ScrollView,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { moderateScale } from "../../utils/scaling";
import AddProductFlow from "./AddProductFlow";
import { styles } from "./RestockDetails.styles";

// Friendly label shown above the product name in the blue card.
const TYPE_LABELS: Record<string, string> = {
  low_stock: "Low Stock Alert",
  out_of_stock: "Out of Stock Alert",
  high_selling: "High Selling Product",
  zero_sales: "Zero Sales Alert",
  expiry: "Expiry Alert",
  daily_summary: "Daily Summary",
  weekly_summary: "Weekly Summary",
  expense: "Expense Alert",
  sale: "New Sale",
  product_added: "Product Added",
};

const getTipMessage = (type?: string) => {
  switch (type) {
    case "low_stock":
      return "This item sells fast. Consider restocking soon.";
    case "out_of_stock":
      return "Out of stock items can lead to lost sales. Restock immediately.";
    case "high_selling":
      return "This product is performing well. Keep it in stock!";
    case "expiry":
      return "Check expiry dates regularly to avoid losses.";
    default:
      return "Stay on top of your inventory for better sales.";
  }
};

const formatDate = (dateString?: string | null) => {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "N/A";
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const formatTime = (dateString?: string | null) => {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "N/A";
  return date.toLocaleString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    month: "short",
    day: "numeric",
  });
};

const RestockDetails: React.FC = () => {
  const router = useRouter();
  // Primary param is the notification id; productId kept for backwards links.
  const { notificationId, productId } = useLocalSearchParams<{
    notificationId?: string;
    productId?: string;
  }>();
  const [showRestockModal, setShowRestockModal] = useState(false);

  // ─── Fetch the notification ──────────────────────────────────────────────
  const {
    data: notification,
    isLoading: loadingNotification,
    isError,
  } = useQuery({
    queryKey: ["notification", notificationId],
    queryFn: () => getNotification(notificationId as string),
    enabled: !!notificationId,
  });

  // The inventory item this notification points to (for stock + restock).
  const inventoryId =
    notification?.inventoryId != null
      ? String(notification.inventoryId)
      : notification?.product != null
        ? String(notification.product)
        : productId;

  const { data: inventoryItem, isLoading: loadingInventory } = useQuery({
    queryKey: ["inventory-item", inventoryId],
    queryFn: () => getUserInventoryItem(inventoryId as string),
    enabled: !!inventoryId,
  });

  const loading =
    (!!notificationId && loadingNotification) ||
    (!!inventoryId && loadingInventory);

  // ─── Loading / error states ──────────────────────────────────────────────
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View
          style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
        >
          <ActivityIndicator size="large" color="#1155CC" />
        </View>
      </SafeAreaView>
    );
  }

  if (!notificationId || isError || !notification) {
    return (
      <SafeAreaView style={styles.container}>
        <View
          style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
        >
          <Text style={{ color: "#B91C1C", fontSize: 18, marginBottom: 12 }}>
            {!notificationId
              ? "No notification specified."
              : "Notification not found."}
          </Text>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Text style={{ color: "#1155CC", fontSize: 16 }}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ─── Derived display values ──────────────────────────────────────────────
  const typeLabel =
    TYPE_LABELS[notification.type] || notification.title || "Notification";
  const productName =
    inventoryItem?.name ||
    notification.inventory_name ||
    notification.product_name ||
    notification.title ||
    "Product";
  const tipMessage = notification.description || getTipMessage(notification.type);
  const imageUri = inventoryItem?.image_url || null;

  // Remaining stock now comes straight from the notification payload;
  // fall back to the inventory item only if it's missing.
  const remainingStock =
    notification.remainingStock != null && notification.remainingStock !== ""
      ? notification.remainingStock
      : inventoryItem?.units_in_stock;

  const showActions =
    notification.type === "low_stock" ||
    notification.type === "out_of_stock";

  // Map the inventory item to the model AddProductFlow / ProductDetails expect.
  const productModel: AddProductModel | undefined = inventoryItem
    ? {
        id: String(inventoryItem.id),
        name: inventoryItem.name,
        category: inventoryItem.category || "",
        barcode: inventoryItem.barcode || "",
        image: inventoryItem.image_url ? { uri: inventoryItem.image_url } : null,
        quantityType:
          inventoryItem.quantity_type ||
          inventoryItem.unit_type ||
          "Single Items",
        unitsInStock: Number(inventoryItem.units_in_stock || 0),
        costPrice: Number(inventoryItem.cost_price || 0),
        sellingPrice: Number(inventoryItem.selling_price || 0),
        lowStockThreshold: Number(inventoryItem.low_stock_threshold || 0),
        expiryDate: inventoryItem.expiry_date || "",
        supplier: {
          name: inventoryItem.supplier_name || "",
          phone: inventoryItem.supplier_phone || "",
        },
        dateAdded:
          inventoryItem.added_at ||
          inventoryItem.updated_at ||
          new Date().toISOString(),
        userId: "api-user",
      }
    : undefined;

  const handleViewProduct = () => {
    if (!inventoryId) return;
    router.push({
      pathname: "/(Routes)/ProductDetails",
      params: { productId: inventoryId },
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Notification Details</Text>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={{ paddingBottom: moderateScale(40) }}
        showsVerticalScrollIndicator={false}
      >
        {/* Main Card with Product Info */}
        <View style={styles.mainCard}>
          <View style={styles.productHeader}>
            <Image
              source={
                imageUri
                  ? { uri: imageUri }
                  : require("../../assets/images/noImg.jpg")
              }
              style={styles.productImage}
            />
            <View style={styles.productInfo}>
              <Text style={styles.notificationType}>{typeLabel}</Text>
              <Text
                style={[styles.productName, { fontSize: moderateScale(20) }]}
              >
                {productName}
              </Text>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        {showActions && (
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.actionButton, styles.restockButton]}
              onPress={() => setShowRestockModal(true)}
              disabled={!productModel}
            >
              <Text style={styles.actionButtonText}>Restock Now</Text>
              <Ionicons name="add" size={28} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.viewProductButton]}
              onPress={handleViewProduct}
              disabled={!inventoryId}
            >
              <Text style={styles.actionButtonText}>View Product</Text>
              <Feather name="folder" size={22} color="#fff" />
            </TouchableOpacity>
          </View>
        )}

        {/* Details Section */}
        <View style={styles.detailsSection}>
          <Text style={styles.detailsTitle}>Details</Text>

          <View style={styles.detailsCard}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Product:</Text>
              <Text style={styles.detailValue}>{productName}</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Remaining Stock:</Text>
              <Text style={[styles.detailValue, styles.stockValue]}>
                {remainingStock != null ? `${remainingStock} Units` : "N/A"}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Last Restocked:</Text>
              <Text style={styles.detailValue}>
                {formatDate(inventoryItem?.updated_at || inventoryItem?.added_at)}
              </Text>
            </View>

            <View style={[styles.detailRow, { borderBottomWidth: 0 }]}>
              <Text style={styles.detailLabel}>Notification Time:</Text>
              <Text style={styles.detailValue}>
                {formatTime(notification.created_at)}
              </Text>
            </View>
          </View>
        </View>

        {/* Tip Card */}
        <View style={styles.tipCard}>
          <Text style={styles.tipTitle}>Tip</Text>
          <Text style={styles.tipMessage}>{tipMessage}</Text>
        </View>
      </ScrollView>

      {productModel && (
        <AddProductFlow
          visible={showRestockModal}
          onClose={() => setShowRestockModal(false)}
          onSaveProduct={() => setShowRestockModal(false)}
          initialProduct={productModel}
          startStep={1}
        />
      )}
    </SafeAreaView>
  );
};

export default RestockDetails;
