import { DUMMY_NOTIFICATIONS } from "@/components/NotificationFeed";
import { DUMMY_PRODUCTS } from "@/src/api/dummyData/dummyProducts";
import { Feather, Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useMemo, useState } from "react";

import {
  Image,
  SafeAreaView,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { moderateScale } from "../(Main)/scaling";
import AddProductFlow from "./AddProductFlow";
import { styles } from "./RestockDetails.styles";

// Notification and Product interfaces (import if you have them elsewhere)
interface Notification {
  id: string;
  type:
    | "low_stock"
    | "out_of_stock"
    | "high_selling"
    | "zero_sales"
    | "daily_summary"
    | "weekly_summary"
    | "expense"
    | "expiry"
    | "backup"
    | "app_update"
    | "product_added"
    | "sale"
    | "general";
  title: string;
  message: string;
  time: string;
  isRead: boolean;
  productId?: string;
  dateAdded: number | string;
  actions?: { label: string; type: string; productId?: string }[];
}

interface Product {
  id: string;
  name: string;
  image?: { uri: string } | null;
  unitsInStock: number;
  lastRestocked?: string;
  // ...other fields as needed
}

const RestockDetails: React.FC = () => {
  const router = useRouter();
  const { productId } = useLocalSearchParams<{ productId?: string }>();
  const [showRestockModal, setShowRestockModal] = useState(false);

  // Find the notification that references this productId
  const notification = useMemo(() => {
    if (!productId) return undefined;
    return DUMMY_NOTIFICATIONS.find(
      (n) =>
        n.productId === productId ||
        n.actions?.some((a) => a.productId === productId),
    );
  }, [productId]);

  // Find the product
  const productData = useMemo(() => {
    if (!productId) return undefined;
    return DUMMY_PRODUCTS.find((p) => p.id === productId);
  }, [productId]);

  // Fallback UI for invalid notification or product
  if (!productId || !notification || !productData) {
    return (
      <SafeAreaView style={styles.container}>
        <View
          style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
        >
          <Text style={{ color: "#B91C1C", fontSize: 18, marginBottom: 12 }}>
            {!productId
              ? "No product specified."
              : !notification
                ? "Notification not found."
                : "Product not found."}
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

  // Format date
  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return "N/A";
    }
  };

  // Format time
  const formatTime = (dateString?: string) => {
    if (!dateString && notification) return notification.time;
    try {
      const date = new Date(dateString!);
      return date.toLocaleString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
        month: "short",
        day: "numeric",
      });
    } catch {
      return notification?.time || "";
    }
  };

  // Get tip message based on notification type
  const getTipMessage = () => {
    switch (notification?.type) {
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

  const handleRestockNow = () => {
    setShowRestockModal(true);
  };

  const handleViewProduct = () => {
    router.push({
      pathname: "/(Routes)/ProductDetails",
      params: { productId: productData.id },
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Restock Details</Text>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Main Card with Product Info */}
        <View style={styles.mainCard}>
          <View style={styles.productHeader}>
            {
              <Image
                source={
                  productData?.image?.uri
                    ? { uri: productData.image.uri }
                    : require("../../assets/images/noImg.jpg")
                }
                style={styles.productImage}
              />
            }
            <View style={styles.productInfo}>
              <Text style={styles.notificationType}>{notification.title}</Text>
              <Text
                style={[styles.productName, { fontSize: moderateScale(20) }]}
              >
                {productData?.name || notification.message}
              </Text>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        {(notification.type === "low_stock" ||
          notification.type === "out_of_stock") && (
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.actionButton, styles.restockButton]}
              onPress={handleRestockNow}
            >
              <Text style={styles.actionButtonText}>Restock Now</Text>
              <Ionicons name="add" size={28} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.viewProductButton]}
              onPress={handleViewProduct}
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
              <Text style={styles.detailValue}>{productData.name}</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Remaining Stock:</Text>
              <Text style={[styles.detailValue, styles.stockValue]}>
                {productData?.unitsInStock || 0} Units
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Last Restocked:</Text>
              <Text style={styles.detailValue}>
                {formatDate(productData?.dateAdded)}
              </Text>
            </View>

            <View style={[styles.detailRow, { borderBottomWidth: 0 }]}>
              <Text style={styles.detailLabel}>Notification Time:</Text>
              <Text style={styles.detailValue}>
                {formatTime(productData?.dateAdded)}
              </Text>
            </View>
          </View>
        </View>

        {/* Tip Card */}
        <View style={styles.tipCard}>
          <Text style={styles.tipTitle}>Tip</Text>
          <Text style={styles.tipMessage}>{getTipMessage()}</Text>
        </View>
      </ScrollView>
      <AddProductFlow
        visible={showRestockModal}
        onClose={() => setShowRestockModal(false)}
        onSaveProduct={() => setShowRestockModal(false)}
        initialProduct={productData}
      />
    </SafeAreaView>
  );
};

export default RestockDetails;
