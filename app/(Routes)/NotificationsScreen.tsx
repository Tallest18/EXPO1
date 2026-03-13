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

// Helper function to group notifications by date
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

    if (isToday) {
      groups.Today.push(notification);
    } else if (isYesterday) {
      groups.Yesterday.push(notification);
    } else if (isThisWeek) {
      groups["This Week"].push(notification);
    } else {
      groups["Older"].push(notification);
    }
  });

  // Remove empty groups
  Object.keys(groups).forEach((key) => {
    if (groups[key].length === 0) {
      delete groups[key];
    }
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
      if (diff < hour) return `${Math.floor(diff / minute)}m ago`;
      if (diff < day) return `${Math.floor(diff / hour)}h ago`;
      return `${Math.floor(diff / day)}d ago`;
    };

    const loadNotifications = async () => {
      try {
        const response = await listNotifications();
        const fetchedNotifications: Notification[] = response.map((n) => ({
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

        setNotifications(fetchedNotifications);
        setError(null);
      } catch (loadError) {
        console.error("Notification load error:", loadError);
        setError("Failed to load notifications. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    loadNotifications();

    const interval = setInterval(() => {
      loadNotifications();
    }, 15000);

    return () => clearInterval(interval);
  }, []);

  const getNotificationIcon = (type: Notification["type"]) => {
    switch (type) {
      case "low_stock":
      case "out_of_stock":
        return (
          <View style={[styles.iconWrapper, { backgroundColor: "#E3F2FD" }]}>
            <Ionicons name="basket-outline" size={24} color="#2196F3" />
          </View>
        );
      case "high_selling":
        return (
          <View style={[styles.iconWrapper, { backgroundColor: "#E8F5E8" }]}>
            <Ionicons name="trending-up" size={24} color="#4CAF50" />
          </View>
        );
      case "zero_sales":
        return (
          <View style={[styles.iconWrapper, { backgroundColor: "#FFF3E0" }]}>
            <Ionicons name="alert-circle-outline" size={24} color="#FF9800" />
          </View>
        );
      case "expiry":
        return (
          <View style={[styles.iconWrapper, { backgroundColor: "#FFEBEE" }]}>
            <Ionicons name="calendar-outline" size={24} color="#F44336" />
          </View>
        );
      case "daily_summary":
      case "weekly_summary":
        return (
          <View style={[styles.iconWrapper, { backgroundColor: "#F3E5F5" }]}>
            <Ionicons name="stats-chart-outline" size={24} color="#9C27B0" />
          </View>
        );
      case "expense":
        return (
          <View style={[styles.iconWrapper, { backgroundColor: "#E8F5E8" }]}>
            <Ionicons name="cash-outline" size={24} color="#4CAF50" />
          </View>
        );
      case "backup":
        return (
          <View style={[styles.iconWrapper, { backgroundColor: "#E3F2FD" }]}>
            <Ionicons name="cloud-upload-outline" size={24} color="#2196F3" />
          </View>
        );
      case "app_update":
        return (
          <View style={[styles.iconWrapper, { backgroundColor: "#FFF3E0" }]}>
            <Ionicons name="refresh-outline" size={24} color="#FF9800" />
          </View>
        );
      default:
        return (
          <View style={[styles.iconWrapper, { backgroundColor: "#E3F2FD" }]}>
            <Ionicons name="notifications-outline" size={24} color="#2196F3" />
          </View>
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

  const handleNotificationPress = (notification: Notification) => {
    router.push({
      pathname: "/(Routes)/NotificationDetails",
      params: { notification: JSON.stringify(notification) },
    });
  };

  const renderNotificationItem = ({ item }: { item: Notification }) => {
    const actions = getActionText(item.type);

    return (
      <TouchableOpacity
        style={styles.notificationItem}
        onPress={() => handleNotificationPress(item)}
      >
        <View style={styles.iconContainer}>
          {getNotificationIcon(item.type)}
        </View>
        <View style={styles.textContainer}>
          <View style={styles.headerRow}>
            <Text style={styles.notificationTitle}>{item.title}</Text>
            <Text style={styles.notificationTime}>{item.time}</Text>
          </View>
          <Text style={styles.notificationMessage}>{item.message}</Text>
          {(actions.primary || actions.secondary) && (
            <View style={styles.actionsRow}>
              {actions.primary && (
                <Text style={styles.actionText}>{actions.primary}</Text>
              )}
              {actions.secondary && (
                <>
                  <Text style={styles.actionSeparator}> | </Text>
                  <Text style={styles.actionText}>{actions.secondary}</Text>
                </>
              )}
            </View>
          )}
        </View>
        {!item.isRead && <View style={styles.unreadDot} />}
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Ionicons name="notifications" size={24} color="#FACC15" />
            <Text style={styles.headerTitle}>Notifications</Text>
          </View>
          <TouchableOpacity onPress={() => router.back()}>
            <Feather name="x" size={24} color="#000" />
          </TouchableOpacity>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0056D2" />
          <Text style={styles.loadingText}>Loading notifications...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Ionicons name="notifications" size={24} color="#FACC15" />
            <Text style={styles.headerTitle}>Notifications</Text>
          </View>
          <TouchableOpacity onPress={() => router.back()}>
            <View style={styles.feather}>
              <Feather name="x" size={24} color="#000" />
            </View>
          </TouchableOpacity>
        </View>
        <View style={styles.emptyContainer}>
          <Feather name="alert-circle" size={64} color="#E0E0E0" />
          <Text style={styles.emptyText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => {
              setLoading(true);
              setError(null);
            }}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
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
          <Ionicons name="notifications" size={24} color="#FACC15" />
          <Text style={styles.headerTitle}>Notifications</Text>
        </View>
        <TouchableOpacity onPress={() => router.back()}>
          <View style={styles.feather}>
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
            {groupedNotifications[sectionTitle].map((notification) => (
              <View key={notification.id}>
                {renderNotificationItem({ item: notification })}
              </View>
            ))}
          </View>
        )}
        contentContainerStyle={styles.listContentContainer}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Feather name="inbox" size={64} color="#E0E0E0" />
            <Text style={styles.emptyText}>No notifications yet</Text>
            <Text style={styles.emptySubText}>
              All your updates and alerts will show up here.
            </Text>
          </View>
        }
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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: verticalScale(12),
    fontSize: moderateScale(16),
    color: "#666",
    fontFamily: "Poppins-Regular",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: scale(20),
    paddingVertical: verticalScale(16),
    backgroundColor: "#E7EEFA",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(12),
  },
  headerTitle: {
    fontSize: moderateScale(20),
    fontWeight: "600",
    fontFamily: "Poppins-Bold",
    color: "#333",
  },
  listContentContainer: {
    paddingHorizontal: scale(20),
    paddingBottom: verticalScale(20),
  },
  section: {
    marginBottom: verticalScale(20),
  },
  sectionHeader: {
    fontSize: moderateScale(16),
    color: "#666",
    fontFamily: "Poppins-Bold",
    marginBottom: verticalScale(12),
    marginTop: verticalScale(8),
  },
  notificationItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: scale(16),
    borderRadius: moderateScale(12),
    marginBottom: verticalScale(8),
    backgroundColor: "#FFFFFF",
    position: "relative",
  },
  iconContainer: {
    marginRight: 12,
  },
  iconWrapper: {
    width: scale(48),
    height: verticalScale(48),
    borderRadius: moderateScale(8),
    justifyContent: "center",
    alignItems: "center",
  },
  textContainer: {
    flex: 1,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: verticalScale(4),
  },
  notificationTitle: {
    fontSize: moderateScale(16),
    fontWeight: "600",
    color: "#333",
    fontFamily: "Poppins-Regular",
    flex: 1,
  },
  notificationMessage: {
    fontSize: moderateScale(14),
    color: "#666",
    fontFamily: "Poppins-Regular",
    marginBottom: verticalScale(8),
    lineHeight: 20,
  },
  notificationTime: {
    fontSize: moderateScale(12),
    color: "#999",
    fontFamily: "Poppins-Regular",
    marginLeft: 8,
  },
  actionsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: verticalScale(4),
  },
  actionText: {
    fontSize: moderateScale(12),
    color: "#0056D2",
    fontFamily: "Poppins-Regular",
  },
  actionSeparator: {
    fontSize: moderateScale(12),
    color: "#0056D2",
    marginHorizontal: scale(4),
  },
  unreadDot: {
    width: scale(8),
    height: verticalScale(8),
    borderRadius: moderateScale(4),
    backgroundColor: "#FACC15",
    position: "absolute",
    top: verticalScale(16),
    right: scale(16),
  },
  feather: {
    backgroundColor: "white",
    padding: scale(10),
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: verticalScale(60),
    paddingHorizontal: scale(40),
  },
  emptyText: {
    fontSize: moderateScale(18),
    fontWeight: "600",
    color: "#666",
    marginTop: verticalScale(16),
    fontFamily: "Poppins-Bold",
  },
  emptySubText: {
    fontSize: moderateScale(14),
    color: "#999",
    textAlign: "center",
    marginTop: verticalScale(8),
    fontFamily: "Poppins-Regular",
    lineHeight: 20,
  },
  retryButton: {
    marginTop: verticalScale(20),
    paddingVertical: verticalScale(12),
    paddingHorizontal: scale(32),
    backgroundColor: "#0056D2",
    borderRadius: moderateScale(8),
  },
  retryButtonText: {
    color: "#FFFFFF",
    fontSize: moderateScale(16),
    fontWeight: "600",
    fontFamily: "Poppins-Regular",
  },
});

export default NotificationsScreen;
