// app/(Routes)/NotificationsScreen.tsx
import { Feather, Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { listNotifications } from "@/src/api";
import { getFontSize } from "../(Main)/scaling";

const { width, height } = Dimensions.get("window");

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);
const scale = (size: number) =>
  clamp((width / 375) * size, size * 0.76, size * 1.3);
const verticalScale = (size: number) =>
  clamp((height / 812) * size, size * 0.62, size * 1.2);
const moderateScale = (size: number, factor = 0.5) =>
  size + (scale(size) - size) * factor;

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
    | "sale"
    | "product_added";
  title: string;
  message: string;
  time: string;
  isRead: boolean;
  productId?: string;
  dateAdded: number;
  userId?: string;
}

const groupNotificationsByDate = (notifications: Notification[]) => {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 7);

  const groups: { [key: string]: Notification[] } = {
    Today: [],
    Yesterday: [],
    "This Week": [],
    Older: [],
  };

  notifications.forEach((notification) => {
    const notifDate = new Date(notification.dateAdded);
    const isToday = notifDate.toDateString() === today.toDateString();
    const isYesterday = notifDate.toDateString() === yesterday.toDateString();
    const isThisWeek = notifDate > weekAgo && !isToday && !isYesterday;

    if (isToday) groups.Today.push(notification);
    else if (isYesterday) groups.Yesterday.push(notification);
    else if (isThisWeek) groups["This Week"].push(notification);
    else groups["Older"].push(notification);
  });

  Object.keys(groups).forEach((key) => {
    if (groups[key].length === 0) delete groups[key];
  });

  return groups;
};

const NotificationsScreen = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const getTimeAgo = (dateString?: string): string => {
      if (!dateString) return "Just now";
      const date = new Date(dateString).getTime();
      const diff = Math.max(0, Date.now() - date);
      const minute = 60 * 1000;
      const hour = 60 * minute;
      const day = 24 * hour;
      if (diff < minute) return "Just now";
      if (diff < hour) return `${Math.floor(diff / minute)}min Ago`;
      if (diff < day) return `${Math.floor(diff / hour)}h Ago`;
      return `${Math.floor(diff / day)} Day${Math.floor(diff / day) > 1 ? "s" : ""} Ago`;
    };

    const loadNotifications = async () => {
      try {
        const response = await listNotifications();
        const fetched: Notification[] = response.map((n) => ({
          id: String(n.id),
          type: (n.type as Notification["type"]) || "daily_summary",
          title: n.title,
          message: n.message,
          time: getTimeAgo(n.created_at),
          isRead: n.is_read,
          productId: n.product ? String(n.product) : undefined,
          dateAdded: n.created_at
            ? new Date(n.created_at).getTime()
            : Date.now(),
          userId: "api-user",
        }));
        setNotifications(fetched);
        setError(null);
      } catch (err) {
        setError("Failed to load notifications. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    loadNotifications();
    const interval = setInterval(loadNotifications, 15000);
    return () => clearInterval(interval);
  }, []);

  const getNotificationIcon = (type: Notification["type"]) => {
    switch (type) {
      case "low_stock":
      case "out_of_stock":
      case "expiry":
        return (
          <Ionicons
            name="folder-open-outline"
            size={moderateScale(28)}
            color="#1155CC"
          />
        );
      case "high_selling":
      case "zero_sales":
      case "sale":
        return (
          <Ionicons
            name="cart-outline"
            size={moderateScale(28)}
            color="#1155CC"
          />
        );
      case "daily_summary":
      case "weekly_summary":
      case "expense":
        return (
          <Ionicons
            name="bar-chart-outline"
            size={moderateScale(28)}
            color="#1155CC"
          />
        );
      default:
        return (
          <Ionicons
            name="notifications-outline"
            size={moderateScale(28)}
            color="#1155CC"
          />
        );
    }
  };

  const getActionText = (type: Notification["type"]) => {
    switch (type) {
      case "low_stock":
      case "out_of_stock":
        return { primary: "Tap to restock", secondary: "View product page" };
      case "high_selling":
        return { primary: "Tap to see product trend", secondary: "" };
      case "zero_sales":
        return { primary: "Tap to open sales page", secondary: "" };
      case "daily_summary":
        return { primary: "Tap to open Daily Sales Summary", secondary: "" };
      case "weekly_summary":
        return {
          primary: "Tap to view weekly performance graph",
          secondary: "",
        };
      case "expense":
        return { primary: "Add Expense", secondary: "" };
      case "expiry":
        return { primary: "Tap to discount item", secondary: "" };
      case "backup":
        return { primary: "Tap to sync", secondary: "" };
      case "app_update":
        return { primary: "Tap to update", secondary: "" };
      default:
        return { primary: "", secondary: "" };
    }
  };

  const renderNotificationItem = (item: Notification) => {
    const actions = getActionText(item.type);

    return (
      <TouchableOpacity
        key={item.id}
        style={styles.notificationCard}
        onPress={() =>
          router.push({
            pathname: "/(Routes)/NotificationDetails",
            params: { notification: JSON.stringify(item) },
          })
        }
        activeOpacity={0.7}
      >
        {/* Icon */}
        <View style={styles.iconBox}>{getNotificationIcon(item.type)}</View>

        {/* Content */}
        <View style={styles.cardContent}>
          {/* Top row: small title + time */}
          <View style={styles.cardTopRow}>
            <Text style={styles.cardTitle} numberOfLines={1}>
              {item.title}
            </Text>
            <Text style={styles.cardTime}>{item.time}</Text>
          </View>

          {/* Bold message */}
          <Text style={styles.cardMessage} numberOfLines={2}>
            {item.message}
          </Text>

          {/* Action row: link(s) + New badge */}
          <View style={styles.cardActionRow}>
            <View style={styles.actionLinks}>
              {actions.primary ? (
                <Text style={styles.actionLink}>{actions.primary}</Text>
              ) : null}
              {actions.secondary ? (
                <>
                  <Text style={styles.actionSeparator}> | </Text>
                  <Text style={styles.actionLink}>{actions.secondary}</Text>
                </>
              ) : null}
            </View>
            {!item.isRead && (
              <View style={styles.newBadge}>
                <Text style={styles.newBadgeText}>New</Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      {/* Sleeping bell illustration */}
      <View style={styles.bellCircle}>
        <Text style={styles.zText}> Z</Text>
        <Text style={styles.zText}> Z</Text>
        <Text style={styles.zText}> z</Text>
        <Ionicons
          name="notifications"
          size={moderateScale(64)}
          color="#FACC15"
        />
      </View>

      <Text style={styles.emptyTitle}>All caught up!</Text>
      <Text style={styles.emptySubtitle}>
        You have no new notifications right now.
      </Text>
      <Text style={styles.emptyTip}>✅ Tips:</Text>
      <Text style={styles.emptyTipText}>
        You'll get low-stock alerts here, daily reports, payment reminders and
        expense tips show up too
      </Text>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Ionicons name="notifications" size={30} color="#FACC15" />
            <Text style={styles.headerTitle}>Notifications</Text>
          </View>
          <TouchableOpacity onPress={() => router.back()}>
            <View style={styles.closeButton}>
              <Feather name="x" size={24} color="#000" />
            </View>
          </TouchableOpacity>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0056D2" />
          <Text style={styles.loadingText}>Loading notifications...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const groupedNotifications = groupNotificationsByDate(notifications);
  const sections = Object.keys(groupedNotifications);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="notifications" size={30} color="#FACC15" />
          <Text style={styles.headerTitle}>Notifications</Text>
        </View>
        <TouchableOpacity onPress={() => router.back()}>
          <View style={styles.closeButton}>
            <Feather name="x" size={24} color="#000" />
          </View>
        </TouchableOpacity>
      </View>

      <FlatList
        data={sections}
        keyExtractor={(item) => item}
        renderItem={({ item: sectionTitle }) => (
          <View style={styles.section}>
            <Text style={styles.sectionHeader}>{sectionTitle}</Text>
            {groupedNotifications[sectionTitle].map((n) =>
              renderNotificationItem(n),
            )}
          </View>
        )}
        contentContainerStyle={[
          styles.listContent,
          sections.length === 0 && { flex: 1 },
        ]}
        ListEmptyComponent={renderEmptyState()}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#E7EEFA",
  },

  // Header
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: scale(20),
    paddingVertical: verticalScale(16),
    backgroundColor: "#E7EEFA",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(10),
  },
  headerTitle: {
    fontSize: getFontSize(moderateScale(24)),
    fontFamily: "DMSans_700Bold",
    color: "#1C1C1C",
  },
  closeButton: {
    backgroundColor: "#fff",
    padding: scale(10),
    borderRadius: moderateScale(10),
  },

  // List
  listContent: {
    paddingHorizontal: scale(16),
    paddingBottom: verticalScale(24),
  },
  section: {
    marginBottom: verticalScale(8),
  },
  sectionHeader: {
    fontSize: getFontSize(moderateScale(13)),
    color: "#888",
    fontFamily: "DMSans_400Regular",
    marginTop: verticalScale(16),
    marginBottom: verticalScale(8),
  },

  // Notification card — matches the UI screenshot
  notificationCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#FFFFFF",
    borderRadius: moderateScale(14),
    padding: scale(14),
    marginBottom: verticalScale(10),
    gap: scale(12),
  },
  iconBox: {
    borderRadius: moderateScale(10),
    justifyContent: "center",
    alignItems: "center",
    display: "flex",
    width: scale(40),
    height: scale(40),
  },
  cardContent: {
    flex: 1,
    gap: verticalScale(3),
  },
  cardTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardTitle: {
    fontSize: getFontSize(moderateScale(12)),
    color: "#888",
    fontFamily: "DMSans_400Regular",
    flex: 1,
  },
  cardTime: {
    fontSize: getFontSize(moderateScale(11)),
    color: "#888",
    fontFamily: "DMSans_400Regular",
    marginLeft: scale(8),
  },
  cardMessage: {
    fontSize: getFontSize(moderateScale(15)),
    fontFamily: "DMSans_700Bold",
    color: "#1C1C1C",
    lineHeight: getFontSize(moderateScale(22)),
  },
  cardActionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: verticalScale(2),
  },
  actionLinks: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    flexWrap: "wrap",
  },
  actionLink: {
    fontSize: getFontSize(moderateScale(12)),
    color: "#1155CC",
    fontFamily: "DMSans_400Regular",
  },
  actionSeparator: {
    fontSize: getFontSize(moderateScale(12)),
    color: "#1155CC",
    marginHorizontal: scale(2),
  },
  newBadge: {
    backgroundColor: "#fff",
    borderRadius: moderateScale(24),
    paddingHorizontal: scale(10),
    paddingVertical: scale(3),
    borderWidth: 1,
    borderColor: "#FACC15",
  },
  newBadgeText: {
    fontSize: getFontSize(moderateScale(10)),
    color: "#FACC15",
    fontFamily: "DMSans_700Bold",
  },

  // Empty state
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: scale(32),
    paddingTop: verticalScale(60),
  },
  bellCircle: {
    width: scale(160),
    height: scale(160),
    borderRadius: scale(80),
    backgroundColor: "#DDE6F5",
    justifyContent: "flex-end",
    alignItems: "center",
    paddingBottom: scale(20),
    marginBottom: verticalScale(24),
    overflow: "hidden",
  },
  zText: {
    fontSize: getFontSize(moderateScale(20)),
    fontFamily: "DMSans_700Bold",
    color: "#111",
    lineHeight: getFontSize(moderateScale(24)),
  },
  emptyTitle: {
    fontSize: getFontSize(moderateScale(20)),
    fontFamily: "DMSans_700Bold",
    color: "#111",
    marginBottom: verticalScale(8),
  },
  emptySubtitle: {
    fontSize: getFontSize(moderateScale(14)),
    fontFamily: "DMSans_400Regular",
    color: "#555",
    textAlign: "center",
    marginBottom: verticalScale(12),
  },
  emptyTip: {
    fontSize: getFontSize(moderateScale(14)),
    fontFamily: "DMSans_700Bold",
    color: "#111",
    marginBottom: verticalScale(6),
  },
  emptyTipText: {
    fontSize: getFontSize(moderateScale(13)),
    fontFamily: "DMSans_400Regular",
    color: "#555",
    textAlign: "center",
    lineHeight: getFontSize(moderateScale(20)),
  },

  // Loading
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: verticalScale(12),
    fontSize: getFontSize(moderateScale(16)),
    color: "#666",
    fontFamily: "DMSans_400Regular",
  },

  // Retry
  retryButton: {
    marginTop: verticalScale(20),
    paddingVertical: verticalScale(12),
    paddingHorizontal: scale(32),
    backgroundColor: "#0056D2",
    borderRadius: moderateScale(8),
  },
  retryButtonText: {
    color: "#fff",
    fontSize: getFontSize(moderateScale(16)),
    fontFamily: "DMSans_700Bold",
  },
});

export default NotificationsScreen;
