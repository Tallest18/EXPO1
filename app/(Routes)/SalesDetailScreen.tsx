// app/(Routes)/SalesDetailScreen.tsx
import { Feather } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    Alert,
    Dimensions,
    Image,
    Linking,
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

import { getSale } from "@/src/api";

const { width, height } = Dimensions.get("window");

// Responsive sizing functions
const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);
const scale = (size: number) =>
  clamp((width / 375) * size, size * 0.76, size * 1.3);
const verticalScale = (size: number) =>
  clamp((height / 812) * size, size * 0.62, size * 1.2);
const moderateScale = (size: number, factor = 0.5) =>
  size + (scale(size) - size) * factor;

interface SaleLineItem {
  name: string;
  quantity: number;
  subtotal: number;
  productId?: string;
}

interface SaleDetail {
  id: string;
  transactionId: string;
  date: string;
  total: number;
  paymentMethod: string;
  customerName?: string;
  customerPhone?: string;
  image?: string;
  items: SaleLineItem[];
}

// ─── Helpers ────────────────────────────────────────────────────────────────

const capitalize = (s?: string) =>
  s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : "";

const ordinalSuffix = (day: number) => {
  if (day % 10 === 1 && day !== 11) return "st";
  if (day % 10 === 2 && day !== 12) return "nd";
  if (day % 10 === 3 && day !== 13) return "rd";
  return "th";
};

// "May 19th, 11:30:23"
const formatSaleMeta = (dateString: string): string => {
  try {
    const d = new Date(dateString);
    const day = d.getDate();
    const month = d.toLocaleDateString("en-US", { month: "long" });
    const time = d.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });
    return `${month} ${day}${ordinalSuffix(day)}, ${time}`;
  } catch {
    return "";
  }
};

const formatCurrency = (amount: number) =>
  `₦${(amount || 0).toLocaleString()}`;

const mapItems = (rawItems: any[], fallback: SaleLineItem[]): SaleLineItem[] => {
  if (Array.isArray(rawItems) && rawItems.length > 0) {
    return rawItems.map((it) => ({
      name: it.product_name || it.product_code || it.name || "Item",
      quantity: Number(it.quantity || 0),
      subtotal: Number(
        it.subtotal ?? Number(it.unit_price || 0) * Number(it.quantity || 0),
      ),
      productId:
        it.product != null
          ? String(it.product)
          : it.inventory != null
            ? String(it.inventory)
            : it.productId,
    }));
  }
  return fallback;
};

// Build a normalized SaleDetail from the raw object passed via navigation params
const normalizeFromSaleData = (saleData: any): SaleDetail => ({
  id: String(saleData.id ?? ""),
  transactionId:
    saleData.transactionId ||
    (saleData.id ? `TXN-${String(saleData.id).padStart(4, "0")}` : ""),
  date: saleData.date || new Date().toISOString(),
  total: Number(saleData.amount ?? saleData.total ?? 0),
  paymentMethod: saleData.paymentMethod || "",
  customerName: saleData.customerName,
  customerPhone: saleData.customerPhone,
  image: saleData.image,
  items: mapItems(saleData.items, [
    {
      name: saleData.name || "Sale",
      quantity: Number(saleData.quantity || 1),
      subtotal: Number(saleData.amount || 0),
      productId: saleData.productId,
    },
  ]),
});

const SalesDetailScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [sale, setSale] = useState<SaleDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSaleDetail();
  }, []);

  const loadSaleDetail = async () => {
    try {
      setLoading(true);

      if (params.sale) {
        const saleData = JSON.parse(params.sale as string);

        // If we have a sale ID, try to fetch the latest data from backend
        if (saleData.id) {
          try {
            const apiSale = await getSale(saleData.id);
            if (apiSale) {
              setSale({
                id: String(apiSale.id),
                transactionId:
                  apiSale.transaction_ref ||
                  `TXN-${String(apiSale.id).padStart(4, "0")}`,
                date:
                  apiSale.sale_date ||
                  apiSale.created_at ||
                  saleData.date ||
                  new Date().toISOString(),
                total: Number(apiSale.total_amount || saleData.amount || 0),
                paymentMethod:
                  apiSale.payment_method || saleData.paymentMethod || "",
                customerName: apiSale.customer_name || saleData.customerName,
                customerPhone: apiSale.customer_phone || saleData.customerPhone,
                image: saleData.image,
                items: mapItems(apiSale.items as any[], [
                  {
                    name: saleData.name || "Sale",
                    quantity: Number(saleData.quantity || 1),
                    subtotal: Number(saleData.amount || 0),
                    productId: saleData.productId,
                  },
                ]),
              });
            } else {
              setSale(normalizeFromSaleData(saleData));
            }
          } catch (apiError) {
            console.log("API fetch failed, using passed data:", apiError);
            setSale(normalizeFromSaleData(saleData));
          }
        } else {
          setSale(normalizeFromSaleData(saleData));
        }
      }
    } catch (error) {
      console.error("Error loading sale detail:", error);
      Alert.alert("Error", "Failed to load sale details");
    } finally {
      setLoading(false);
    }
  };

  const handleContactDebtor = () => {
    if (sale?.customerPhone) {
      Linking.openURL(`tel:${sale.customerPhone}`).catch(() =>
        Alert.alert("Error", "Unable to open the phone dialer."),
      );
    } else {
      Alert.alert(
        "No Contact",
        "No customer phone number is attached to this sale.",
      );
    }
  };

  const handleSellAgain = () => {
    if (!sale) return;
    const cartData = sale.items
      .filter((i) => i.productId)
      .map((i) => ({ id: i.productId, quantity: i.quantity }));

    if (cartData.length === 0) {
      router.push("/(Main)/Sell" as any);
      return;
    }

    router.push({
      pathname: "/(Routes)/Cart" as any,
      params: {
        cartData: JSON.stringify(cartData),
        timestamp: Date.now().toString(),
      },
    });
  };

  // ─── Header (shared) ──────────────────────────────────────────────────────
  const renderHeader = () => (
    <View style={styles.header}>
      <Text style={styles.headerTitle}>Sales Details</Text>
      <TouchableOpacity
        onPress={() => router.back()}
        style={styles.backButton}
        activeOpacity={0.8}
      >
        <Feather name="arrow-left" size={22} color="#0A0A0A" />
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        {renderHeader()}
        <View style={styles.centerContainer}>
          <Text style={styles.mutedText}>Loading sale details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!sale) {
    return (
      <SafeAreaView style={styles.container}>
        {renderHeader()}
        <View style={styles.centerContainer}>
          <Feather name="alert-circle" size={48} color="#666" />
          <Text style={styles.errorText}>Sale details not found</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadSaleDetail}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const headline = sale.items[0];
  const metaText = [
    formatSaleMeta(sale.date),
    sale.transactionId,
    capitalize(sale.paymentMethod),
  ]
    .filter(Boolean)
    .join("   |   ");

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#E7EEFA" barStyle="dark-content" />

      {renderHeader()}

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Blue summary card */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryImageWrap}>
            <Image
              source={
                sale.image
                  ? { uri: sale.image }
                  : require("../../assets/images/noImg.jpg")
              }
              style={styles.summaryImage}
              resizeMode="contain"
            />
          </View>

          <View style={styles.summaryTextWrap}>
            <Text style={styles.summaryMeta} numberOfLines={1}>
              {metaText}
            </Text>
            <Text style={styles.summaryTitle} numberOfLines={1}>
              {headline?.name}
              {headline?.quantity ? (
                <Text style={styles.summaryQty}>  X {headline.quantity}</Text>
              ) : null}
            </Text>
          </View>
        </View>

        {/* Details list */}
        <Text style={styles.sectionLabel}>Details</Text>
        <View style={styles.detailsCard}>
          <View style={styles.detailsHeaderRow}>
            <Text style={styles.detailsHeaderText}>Product:</Text>
            <Text style={styles.detailsHeaderText}>Price</Text>
          </View>

          {sale.items.map((item, index) => (
            <View
              key={`${item.productId ?? item.name}-${index}`}
              style={[
                styles.itemRow,
                index === sale.items.length - 1 && styles.itemRowLast,
              ]}
            >
              <Text style={styles.itemName} numberOfLines={1}>
                {item.name}
                {item.quantity ? (
                  <Text style={styles.itemQty}> X{item.quantity}</Text>
                ) : null}
              </Text>
              <Text style={styles.itemPrice}>
                {formatCurrency(item.subtotal)}
              </Text>
            </View>
          ))}
        </View>

        {/* Grand total */}
        <View style={styles.grandTotalCard}>
          <View style={styles.grandTotalAccent} />
          <Text style={styles.grandTotalLabel}>Grand Total</Text>
          <Text style={styles.grandTotalValue}>
            {formatCurrency(sale.total)}
          </Text>
        </View>
      </ScrollView>

      {/* Bottom action buttons */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.footerButton, styles.contactButton]}
          onPress={handleContactDebtor}
          activeOpacity={0.85}
        >
          <Text style={styles.footerButtonText}>Contact Debtor</Text>
          <Feather name="phone" size={18} color="#fff" />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.footerButton, styles.sellAgainButton]}
          onPress={handleSellAgain}
          activeOpacity={0.85}
        >
          <Text style={styles.footerButtonText}>Sell Again</Text>
          <Feather name="shopping-cart" size={18} color="#fff" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#E7EEFA",
  },

  // ── Header ──────────────────────────────────────────────────────────────
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: scale(20),
    paddingTop: verticalScale(20),
    paddingBottom: verticalScale(14),
  },
  headerTitle: {
    fontSize: moderateScale(26),
    fontFamily: "DMSans_700Bold",
    color: "#0A0A0A",
  },
  backButton: {
    width: scale(46),
    height: scale(46),
    borderRadius: moderateScale(12),
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
  },

  // ── States ──────────────────────────────────────────────────────────────
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: scale(20),
  },
  mutedText: {
    fontSize: moderateScale(15),
    color: "#666",
    fontFamily: "DMSans_400Regular",
  },
  errorText: {
    fontSize: moderateScale(16),
    color: "#666",
    marginTop: verticalScale(12),
    marginBottom: verticalScale(20),
    fontFamily: "DMSans_400Regular",
  },
  retryButton: {
    backgroundColor: "#1155CC",
    paddingHorizontal: scale(24),
    paddingVertical: verticalScale(12),
    borderRadius: moderateScale(8),
  },
  retryButtonText: {
    color: "#fff",
    fontSize: moderateScale(16),
    fontFamily: "DMSans_400Regular",
  },

  // ── Content ─────────────────────────────────────────────────────────────
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: scale(20),
    paddingTop: verticalScale(6),
    paddingBottom: verticalScale(140),
  },

  // ── Blue summary card ───────────────────────────────────────────────────
  summaryCard: {
    backgroundColor: "#1155CC",
    borderRadius: moderateScale(16),
    padding: scale(14),
    flexDirection: "row",
    alignItems: "center",
    gap: scale(14),
  },
  summaryImageWrap: {
    width: scale(56),
    height: scale(56),
    borderRadius: moderateScale(12),
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    padding: scale(6),
    overflow: "hidden",
  },
  summaryImage: {
    width: "100%",
    height: "100%",
  },
  summaryTextWrap: {
    flex: 1,
  },
  summaryMeta: {
    fontSize: moderateScale(12),
    color: "rgba(255,255,255,0.82)",
    fontFamily: "DMSans_500Medium",
    marginBottom: verticalScale(6),
  },
  summaryTitle: {
    fontSize: moderateScale(20),
    color: "#fff",
    fontFamily: "DMSans_700Bold",
  },
  summaryQty: {
    color: "#F59E0B",
    fontFamily: "DMSans_700Bold",
  },

  // ── Section label ───────────────────────────────────────────────────────
  sectionLabel: {
    fontSize: moderateScale(13),
    color: "#5A6573",
    fontFamily: "DMSans_400Regular",
    marginTop: verticalScale(18),
    marginBottom: verticalScale(8),
  },

  // ── Details card ────────────────────────────────────────────────────────
  detailsCard: {
    backgroundColor: "#fff",
    borderRadius: moderateScale(16),
    paddingHorizontal: scale(18),
    paddingVertical: verticalScale(18),
  },
  detailsHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: verticalScale(16),
  },
  detailsHeaderText: {
    fontSize: moderateScale(15),
    color: "#9AA0A6",
    fontFamily: "DMSans_400Regular",
  },
  itemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: verticalScale(16),
  },
  itemRowLast: {
    marginBottom: 0,
  },
  itemName: {
    flex: 1,
    fontSize: moderateScale(15),
    color: "#3C4043",
    fontFamily: "DMSans_400Regular",
    marginRight: scale(12),
  },
  itemQty: {
    color: "#F59E0B",
    fontFamily: "DMSans_600SemiBold",
  },
  itemPrice: {
    fontSize: moderateScale(15),
    color: "#1C1C1C",
    fontFamily: "DMSans_700Bold",
  },

  // ── Grand total ─────────────────────────────────────────────────────────
  grandTotalCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: moderateScale(12),
    paddingVertical: verticalScale(18),
    paddingHorizontal: scale(18),
    marginTop: verticalScale(16),
    overflow: "hidden",
  },
  grandTotalAccent: {
    position: "absolute",
    left: 0,
    top: "22%",
    bottom: "22%",
    width: scale(5),
    borderTopRightRadius: moderateScale(4),
    borderBottomRightRadius: moderateScale(4),
    backgroundColor: "#F5A623",
  },
  grandTotalLabel: {
    flex: 1,
    fontSize: moderateScale(17),
    color: "#0A0A0A",
    fontFamily: "DMSans_700Bold",
  },
  grandTotalValue: {
    fontSize: moderateScale(20),
    color: "#0A0A0A",
    fontFamily: "DMSans_700Bold",
  },

  // ── Footer buttons ──────────────────────────────────────────────────────
  footer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: "row",
    gap: scale(12),
    paddingHorizontal: scale(20),
    paddingTop: verticalScale(12),
    paddingBottom: verticalScale(24),
    backgroundColor: "#E7EEFA",
  },
  footerButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: scale(8),
    paddingVertical: verticalScale(18),
    borderRadius: moderateScale(14),
  },
  contactButton: {
    backgroundColor: "#0A1F44",
  },
  sellAgainButton: {
    backgroundColor: "#1155CC",
  },
  footerButtonText: {
    color: "#fff",
    fontSize: moderateScale(15),
    fontFamily: "DMSans_500Medium",
  },
});

export default SalesDetailScreen;
