import { styles } from "@/app/(Main)/Sell.styles";
import Feather from "@expo/vector-icons/Feather";
import React from "react";
import { Image, ScrollView, Text, View } from "react-native";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SaleItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  productImage?: string | null;
}

export interface Sale {
  id: string;
  transactionId?: string;
  items: SaleItem[];
  totalAmount: number;
  paymentMethod: string;
  date: string;
  timestamp: any;
}

interface SalesHistoryProps {
  sales: Sale[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const getPaymentColor = (method: string): string => {
  const m = method?.toLowerCase() || "";
  if (m === "cash") return "#1BC47D";
  if (m === "transfer") return "#1155CC";
  if (m === "pos") return "#7C3AED";
  if (m === "mixed") return "#F59E0B";
  return "#666";
};

const capitalise = (s: string) => {
  if (!s) return "";
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
};

const getDateHeader = (dateString: string): string => {
  const date = new Date(dateString);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  const isSameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

  if (isSameDay(date, today)) return "Today";
  if (isSameDay(date, yesterday)) return "Yesterday";

  return date.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

const getDateKey = (dateString: string): string => {
  const d = new Date(dateString);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
};

const formatSaleTime = (dateString: string): string => {
  const date = new Date(dateString);
  const day = date.getDate();
  const suffix =
    day % 10 === 1 && day !== 11
      ? "st"
      : day % 10 === 2 && day !== 12
        ? "nd"
        : day % 10 === 3 && day !== 13
          ? "rd"
          : "th";
  const month = date.toLocaleDateString("en-US", { month: "long" });
  const time = date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  return `${month} ${day}${suffix}, ${time}`;
};

// ─── Sub-components ───────────────────────────────────────────────────────────

const SaleCard: React.FC<{ sale: Sale }> = ({ sale }) => {
  const paymentColor = getPaymentColor(sale.paymentMethod);
  const firstItem = sale.items[0];
  const initial = firstItem?.productName?.charAt(0)?.toUpperCase() || "?";

  return (
    <View style={styles.saleCard}>
      {/* Thumbnail */}
      {firstItem?.productImage ? (
        <Image
          source={{ uri: firstItem.productImage }}
          style={styles.saleThumb}
          resizeMode="cover"
        />
      ) : (
        <View
          style={[styles.saleThumbPlaceholder, { backgroundColor: "#1155CC" }]}
        >
          <Text style={styles.saleThumbInitial}>{initial}</Text>
        </View>
      )}

      {/* Info */}
      <View style={styles.saleInfo}>
        {/* Product names with amber quantities */}
        <Text style={styles.saleProductName} numberOfLines={1}>
          {sale.items.map((item, idx) => (
            <React.Fragment key={item.productId + idx}>
              {idx > 0 && <Text style={styles.saleItemSeparator}>, </Text>}
              {item.productName}{" "}
              <Text style={styles.saleItemQty}>x{item.quantity}</Text>
            </React.Fragment>
          ))}
        </Text>

        {/* Meta: time | TXN ID | payment method */}
        <Text style={styles.saleMeta} numberOfLines={1}>
          {formatSaleTime(sale.date)}
          {sale.transactionId ? ` | ${sale.transactionId}` : ""}
          {" | "}
          <Text style={[styles.saleMetaPayment, { color: paymentColor }]}>
            {capitalise(sale.paymentMethod)}
          </Text>
        </Text>
      </View>

      {/* Amount + payment label */}
      <View style={styles.saleRight}>
        <Text style={styles.saleAmount} numberOfLines={1} adjustsFontSizeToFit>
          ₦{sale.totalAmount.toLocaleString()}
        </Text>
        <Text style={[styles.salePaymentLabel, { color: paymentColor }]}>
          {capitalise(sale.paymentMethod)}
        </Text>
      </View>
    </View>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

const SalesHistory: React.FC<SalesHistoryProps> = ({ sales }) => {
  if (sales.length === 0) {
    return (
      <ScrollView
        style={styles.productsContainer}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { justifyContent: "center" },
        ]}
      >
        <View style={styles.emptyState}>
          <Feather name="clock" size={64} color="#E0E0E0" />
          <Text style={styles.emptyTitle}>No Sales Yet</Text>
          <Text style={styles.emptyDescription}>
            Your sales history will appear here
          </Text>
        </View>
      </ScrollView>
    );
  }

  // Group sales by date, preserving chronological order
  const groupMap = new Map<string, { header: string; sales: Sale[] }>();
  sales.forEach((sale) => {
    const key = getDateKey(sale.date);
    if (!groupMap.has(key)) {
      groupMap.set(key, { header: getDateHeader(sale.date), sales: [] });
    }
    groupMap.get(key)!.sales.push(sale);
  });

  return (
    <ScrollView
      style={styles.productsContainer}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.scrollContent}
    >
      <View style={styles.historyContainer}>
        {Array.from(groupMap.values()).map(
          ({ header, sales: salesForDate }) => (
            <View key={header} style={styles.dateGroup}>
              <Text style={styles.dateHeader}>{header}</Text>
              {salesForDate.map((sale) => (
                <SaleCard key={sale.id} sale={sale} />
              ))}
            </View>
          ),
        )}
      </View>
      <View style={styles.bottomPadding} />
    </ScrollView>
  );
};

export default SalesHistory;
