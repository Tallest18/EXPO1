import { Feather, Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { db } from "../config/firebaseConfig";

// Notification type
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
  dateAdded: number;
}

// Product interface
interface Product {
  id: string;
  name: string;
  image?: {
    uri: string;
  } | null;
  unitsInStock: number;
  lastRestocked?: string;
}

const NotificationDetails = () => {
  const router = useRouter();
  const { notification } = useLocalSearchParams();
  const parsedNotification: Notification = JSON.parse(notification as string);

  const [productData, setProductData] = useState<Product | null>(null);
  const [loading, setLoading] = useState(false);

  // Fetch product data if productId exists
  useEffect(() => {
    const fetchProductData = async () => {
      if (parsedNotification.productId) {
        setLoading(true);
        try {
          const productDoc = await getDoc(
            doc(db, "products", parsedNotification.productId),
          );
          if (productDoc.exists()) {
            setProductData({
              id: productDoc.id,
              ...productDoc.data(),
            } as Product);
          }
        } catch (error) {
          console.error("Error fetching product:", error);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchProductData();
  }, [parsedNotification.productId]);

  // Mark notification as read when opened
  useEffect(() => {
    const markAsRead = async () => {
      try {
        if (!parsedNotification.isRead) {
          await updateDoc(doc(db, "notifications", parsedNotification.id), {
            isRead: true,
          });
        }
      } catch (error) {
        console.error("Failed to mark notification as read:", error);
      }
    };

    markAsRead();
  }, []);

  const handleRestockNow = () => {
    // Navigate to restock screen or show restock modal
    if (parsedNotification.productId) {
      router.push({
        pathname: "/(Routes)/AddProductFlow" as any,
        params: { productId: parsedNotification.productId },
      });
    }
  };

  const handleViewProduct = () => {
    // Navigate to product details
    if (parsedNotification.productId) {
      router.push({
        pathname: "/(Main)/Inventory" as any,
        params: { productId: parsedNotification.productId },
      });
    }
  };

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
    if (!dateString) return parsedNotification.time;
    try {
      const date = new Date(dateString);
      return date.toLocaleString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
        month: "short",
        day: "numeric",
      });
    } catch {
      return parsedNotification.time;
    }
  };

  // Get tip message based on notification type
  const getTipMessage = () => {
    switch (parsedNotification.type) {
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

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Main Card with Product Info */}
        <View style={styles.mainCard}>
          <View style={styles.productHeader}>
            {productData?.image?.uri ? (
              <Image
                source={{ uri: productData.image.uri }}
                style={styles.productImage}
              />
            ) : (
              <View style={[styles.productImage, styles.placeholderImage]}>
                <Feather name="package" size={32} color="#fff" />
              </View>
            )}
            <View style={styles.productInfo}>
              <Text style={styles.notificationType}>
                {parsedNotification.title}
              </Text>
              <Text style={styles.productName}>
                {productData?.name || parsedNotification.message}
              </Text>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        {(parsedNotification.type === "low_stock" ||
          parsedNotification.type === "out_of_stock") && (
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.actionButton, styles.restockButton]}
              onPress={() => router.push("/(Routes)/AddProductFlow")}
            >
              <Text style={styles.actionButtonText}>Restock Now</Text>
              <Ionicons name="add" size={28} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.viewProductButton]}
              onPress={() => router.push("/(Main)/Inventory")}
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
            {productData && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Product:</Text>
                <Text style={styles.detailValue}>{productData.name}</Text>
              </View>
            )}

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Remaining Stock:</Text>
              <Text style={[styles.detailValue, styles.stockValue]}>
                {productData?.unitsInStock || 0} Units
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Last Restocked:</Text>
              <Text style={styles.detailValue}>
                {formatDate(productData?.lastRestocked)}
              </Text>
            </View>

            <View style={[styles.detailRow, { borderBottomWidth: 0 }]}>
              <Text style={styles.detailLabel}>Notification Time:</Text>
              <Text style={styles.detailValue}>
                {formatTime(productData?.lastRestocked)}
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

      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#0056D2" />
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#E7EEFA",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#E7EEFA",
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#111827",
    fontFamily: "Poppins-Bold",
  },
  backButton: {
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  mainCard: {
    backgroundColor: "#1155CC",
    borderRadius: 16,
    padding: 20,
    marginTop: 20,
  },
  productHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  productImage: {
    width: 60,
    height: 60,
    borderRadius: 12,
    backgroundColor: "#fff",
  },
  placeholderImage: {
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.3)",
  },
  productInfo: {
    flex: 1,
  },
  notificationType: {
    fontSize: 14,
    color: "rgba(255,255,255,0.8)",
    marginBottom: 4,
    fontFamily: "Poppins-Regular",
  },
  productName: {
    fontSize: 22,
    fontWeight: "600",
    color: "#fff",
    fontFamily: "Poppins-Bold",
  },
  actionButtons: {
    flexDirection: "row",
    gap: 12,
    marginTop: 20,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 18,
    borderRadius: 12,
    gap: 8,
  },
  restockButton: {
    backgroundColor: "#001F54",
  },
  viewProductButton: {
    backgroundColor: "#1155CC",
  },
  actionButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    fontFamily: "Poppins-Regular",
  },
  detailsSection: {
    marginTop: 20,
  },
  detailsTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 12,
    fontFamily: "Poppins-Bold",
  },
  detailsCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  detailLabel: {
    fontSize: 15,
    color: "#9CA3AF",
    fontFamily: "Poppins-Regular",
  },
  detailValue: {
    fontSize: 15,
    color: "#111827",
    fontWeight: "500",
    fontFamily: "Poppins-Regular",
    textAlign: "right",
    maxWidth: "60%",
  },
  stockValue: {
    color: "#F59E0B",
    fontWeight: "600",
  },
  tipCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    marginTop: 20,
    marginBottom: 40,
    borderLeftWidth: 5,
    borderLeftColor: "#FACC15",
  },
  tipTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 8,
    fontFamily: "Poppins-Bold",
  },
  tipMessage: {
    fontSize: 15,
    color: "#6B7280",
    lineHeight: 22,
    fontFamily: "Poppins-Regular",
  },
  loadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
});

export default NotificationDetails;
