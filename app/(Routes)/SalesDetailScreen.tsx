// app/(Routes)/SalesDetailScreen.tsx
import { Feather, Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { deleteDoc, doc, getDoc } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Image,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { db } from "../config/firebaseConfig";

interface SaleDetail {
  id: string;
  name: string;
  image?: string;
  quantity: number;
  date: string;
  amount: number;
  profit: number;
  costPrice?: number;
  sellingPrice?: number;
  customerName?: string;
  customerPhone?: string;
  paymentMethod?: string;
  notes?: string;
  productId?: string;
}

const SalesDetailScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [sale, setSale] = useState<SaleDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadSaleDetail();
  }, []);

  const loadSaleDetail = async () => {
    try {
      setLoading(true);

      if (params.sale) {
        const saleData = JSON.parse(params.sale as string);

        // If we have a sale ID, try to fetch the latest data from Firestore
        if (saleData.id) {
          try {
            const saleDoc = await getDoc(doc(db, "sales", saleData.id));
            if (saleDoc.exists()) {
              setSale({ id: saleDoc.id, ...saleDoc.data() } as SaleDetail);
            } else {
              // If document doesn't exist in Firestore, use the passed data
              console.log(
                "Sale document not found in Firestore, using passed data",
              );
              setSale(saleData);
            }
          } catch (firestoreError) {
            // If Firestore fetch fails (e.g., permission denied), fall back to passed data
            console.log(
              "Firestore fetch failed, using passed data:",
              firestoreError,
            );
            setSale(saleData);
          }
        } else {
          setSale(saleData);
        }
      }
    } catch (error) {
      console.error("Error loading sale detail:", error);
      Alert.alert("Error", "Failed to load sale details");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSale = async () => {
    if (!sale?.id) {
      Alert.alert("Error", "Cannot delete this sale record");
      return;
    }

    Alert.alert(
      "Delete Sale",
      "Are you sure you want to delete this sale record? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              setDeleting(true);
              await deleteDoc(doc(db, "sales", sale.id));
              Alert.alert("Success", "Sale record deleted successfully");
              router.back();
            } catch (error) {
              console.error("Error deleting sale:", error);
              Alert.alert(
                "Error",
                "Failed to delete sale record. You may not have permission to delete this item.",
              );
            } finally {
              setDeleting(false);
            }
          },
        },
      ],
    );
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (error) {
      return "Invalid date";
    }
  };

  const formatCurrency = (amount: number) => {
    return `₦${(amount || 0).toFixed(2)}`;
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Sale Details</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.loadingContainer}>
          <Text>Loading sale details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!sale) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Sale Details</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.errorContainer}>
          <Feather name="alert-circle" size={48} color="#666" />
          <Text style={styles.errorText}>Sale details not found</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadSaleDetail}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#E7EEFA" barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Sale Details</Text>
        <TouchableOpacity onPress={handleDeleteSale} disabled={deleting}>
          <Ionicons
            name="trash-outline"
            size={24}
            color={deleting ? "#999" : "#FF3B30"}
          />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Product Info Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Feather name="package" size={20} color="#1155CC" />
            <Text style={styles.cardTitle}>Product Information</Text>
          </View>

          <View style={styles.productInfo}>
            <Image
              source={{
                uri: sale.image || "https://via.placeholder.com/60",
              }}
              style={styles.productImage}
            />
            <View style={styles.productDetails}>
              <Text style={styles.productName}>{sale.name}</Text>
              <Text style={styles.productQuantity}>
                Quantity: {sale.quantity}
              </Text>
              {sale.productId && (
                <Text style={styles.productId}>ID: {sale.productId}</Text>
              )}
            </View>
          </View>
        </View>

        {/* Sale Details Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Feather name="dollar-sign" size={20} color="#22C55E" />
            <Text style={styles.cardTitle}>Sale Details</Text>
          </View>

          <View style={styles.detailRow}>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Total Amount</Text>
              <Text style={[styles.detailValue, styles.amountText]}>
                {formatCurrency(sale.amount)}
              </Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Profit</Text>
              <Text style={[styles.detailValue, styles.profitText]}>
                {formatCurrency(sale.profit)}
              </Text>
            </View>
          </View>

          {sale.costPrice !== undefined && sale.sellingPrice !== undefined && (
            <View style={styles.detailRow}>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Cost Price (unit)</Text>
                <Text style={styles.detailValue}>
                  {formatCurrency(sale.costPrice)}
                </Text>
              </View>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Selling Price (unit)</Text>
                <Text style={styles.detailValue}>
                  {formatCurrency(sale.sellingPrice)}
                </Text>
              </View>
            </View>
          )}

          <View style={styles.detailRow}>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Date & Time</Text>
              <Text style={styles.detailValue}>{formatDate(sale.date)}</Text>
            </View>
          </View>
        </View>

        {/* Customer Information Card */}
        {(sale.customerName || sale.customerPhone) && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Feather name="user" size={20} color="#8B5CF6" />
              <Text style={styles.cardTitle}>Customer Information</Text>
            </View>

            {sale.customerName && (
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Customer Name</Text>
                <Text style={styles.detailValue}>{sale.customerName}</Text>
              </View>
            )}

            {sale.customerPhone && (
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Phone Number</Text>
                <Text style={styles.detailValue}>{sale.customerPhone}</Text>
              </View>
            )}
          </View>
        )}

        {/* Payment Information Card */}
        {sale.paymentMethod && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Feather name="credit-card" size={20} color="#F59E0B" />
              <Text style={styles.cardTitle}>Payment Information</Text>
            </View>

            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Payment Method</Text>
              <Text style={styles.detailValue}>
                {sale.paymentMethod.charAt(0).toUpperCase() +
                  sale.paymentMethod.slice(1)}
              </Text>
            </View>
          </View>
        )}

        {/* Notes Card */}
        {sale.notes && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Feather name="file-text" size={20} color="#6366F1" />
              <Text style={styles.cardTitle}>Additional Notes</Text>
            </View>

            <View style={styles.notesContainer}>
              <Text style={styles.notesText}>{sale.notes}</Text>
            </View>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.actionButton, styles.shareButton]}
            onPress={() => {
              // Implement share functionality
              Alert.alert("Share", "Share sale details functionality");
            }}
          >
            <Feather name="share-2" size={20} color="#1155CC" />
            <Text style={[styles.actionButtonText, styles.shareButtonText]}>
              Share Details
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.repeatButton]}
            onPress={() => {
              // Implement repeat sale functionality
              Alert.alert("Repeat Sale", "Repeat this sale functionality");
            }}
          >
            <Feather name="repeat" size={20} color="#fff" />
            <Text style={[styles.actionButtonText, styles.repeatButtonText]}>
              Repeat Sale
            </Text>
          </TouchableOpacity>
        </View>

        {/* Sale ID for reference */}
        <View style={styles.footer}>
          <Text style={styles.saleId}>Sale ID: {sale.id}</Text>
        </View>
      </ScrollView>
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
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#E7EEFA",
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    fontFamily: "Poppins-Bold",
    color: "#333",
  },
  placeholder: {
    width: 24,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: "#666",
    marginTop: 12,
    marginBottom: 20,
    fontFamily: "Poppins-Regular",
  },
  retryButton: {
    backgroundColor: "#1155CC",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    fontFamily: "Poppins-Regular",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
    fontFamily: "Poppins-Bold",
    marginLeft: 8,
    color: "#333",
  },
  productInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  productImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: "#f0f0f0",
  },
  productDetails: {
    flex: 1,
    marginLeft: 12,
  },
  productName: {
    fontSize: 16,
    fontWeight: "600",
    fontFamily: "Poppins-Bold",
    color: "#333",
    marginBottom: 4,
  },
  productQuantity: {
    fontSize: 14,
    color: "#666",
    fontFamily: "Poppins-Regular",
    marginBottom: 2,
  },
  productId: {
    fontSize: 12,
    color: "#999",
    fontFamily: "Poppins-Regular",
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  detailItem: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 14,
    color: "#666",
    fontFamily: "Poppins-Regular",
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: "600",
    fontFamily: "Poppins-Regular",
    color: "#333",
  },
  amountText: {
    color: "#1155CC",
    fontSize: 18,
  },
  profitText: {
    color: "#22C55E",
    fontSize: 18,
  },
  notesContainer: {
    backgroundColor: "#F8F9FA",
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: "#6366F1",
  },
  notesText: {
    fontSize: 14,
    color: "#666",
    fontFamily: "Poppins-Regular",
    lineHeight: 20,
  },
  actionButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
  },
  shareButton: {
    backgroundColor: "#fff",
    borderColor: "#1155CC",
  },
  repeatButton: {
    backgroundColor: "#1155CC",
    borderColor: "#1155CC",
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: "600",
    fontFamily: "Poppins-Regular",
    marginLeft: 8,
  },
  shareButtonText: {
    color: "#1155CC",
  },
  repeatButtonText: {
    color: "#fff",
  },
  footer: {
    alignItems: "center",
    paddingVertical: 16,
  },
  saleId: {
    fontSize: 12,
    color: "#999",
    fontFamily: "Poppins-Regular",
  },
});

export default SalesDetailScreen;
