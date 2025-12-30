// app/(Routes)/NotificationsScreen.tsx
import { Feather, Ionicons } from "@expo/vector-icons";
import { useFonts } from "expo-font";
import { router } from "expo-router";
import {
  collection,
  DocumentData,
  onSnapshot,
  orderBy,
  query,
  QueryDocumentSnapshot,
} from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { auth, db } from "../config/firebaseConfig";

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
    | "app_update";
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

  const [fontsLoaded] = useFonts({
    "Poppins-Regular": require("../../assets/fonts/Poppins-Regular.ttf"),
    "Poppins-Bold": require("../../assets/fonts/Poppins-Bold.ttf"),
    "Poppins-Light": require("../../assets/fonts/Poppins-Light.ttf"),
  });

  useEffect(() => {
    // Check if user is authenticated
    const user = auth.currentUser;
    
    if (!user) {
      console.log("No authenticated user");
      setError("Please log in to view notifications");
      setLoading(false);
      return;
    }

    console.log("Setting up notification listener for user:", user.uid);

    try {
      const notificationsCollection = collection(db, "notifications");
      const notificationsQuery = query(
        notificationsCollection,
        orderBy("dateAdded", "desc")
      );

      const unsubscribe = onSnapshot(
        notificationsQuery,
        (snapshot) => {
          const fetchedNotifications: Notification[] = [];
          snapshot.forEach((doc: QueryDocumentSnapshot<DocumentData>) => {
            const data = doc.data();
            fetchedNotifications.push({
              id: doc.id,
              ...data,
            } as Notification);
          });
          console.log("Fetched notifications:", fetchedNotifications.length);
          setNotifications(fetchedNotifications);
          setLoading(false);
          setError(null);
        },
        (error) => {
          console.error("Firestore error:", error);
          setError("Failed to load notifications. Please try again.");
          setLoading(false);
        }
      );

      return () => {
        console.log("Cleaning up notification listener");
        unsubscribe();
      };
    } catch (error) {
      console.error("Error setting up notification listener:", error);
      setError("Failed to initialize notifications");
      setLoading(false);
    }
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

  if (loading || !fontsLoaded) {
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
    marginTop: 12,
    fontSize: 16,
    color: "#666",
    fontFamily: "Poppins-Regular",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#E7EEFA",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "600",
    fontFamily: "Poppins-Bold",
    color: "#333",
  },
  listContentContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  section: {
    marginBottom: 20,
  },
  sectionHeader: {
    fontSize: 16,
    color: "#666",
    fontFamily: "Poppins-Bold",
    marginBottom: 12,
    marginTop: 8,
  },
  notificationItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
    position: "relative",
  },
  iconContainer: {
    marginRight: 12,
  },
  iconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 8,
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
    marginBottom: 4,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    fontFamily: "Poppins-Regular",
    flex: 1,
  },
  notificationMessage: {
    fontSize: 14,
    color: "#666",
    fontFamily: "Poppins-Regular",
    marginBottom: 8,
    lineHeight: 20,
  },
  notificationTime: {
    fontSize: 12,
    color: "#999",
    fontFamily: "Poppins-Regular",
    marginLeft: 8,
  },
  actionsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  actionText: {
    fontSize: 12,
    color: "#0056D2",
    fontFamily: "Poppins-Regular",
  },
  actionSeparator: {
    fontSize: 12,
    color: "#0056D2",
    marginHorizontal: 4,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#FACC15",
    position: "absolute",
    top: 16,
    right: 16,
  },
  feather: {
    backgroundColor: "white",
    padding: 10,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#666",
    marginTop: 16,
    fontFamily: "Poppins-Bold",
  },
  emptySubText: {
    fontSize: 14,
    color: "#999",
    textAlign: "center",
    marginTop: 8,
    fontFamily: "Poppins-Regular",
    lineHeight: 20,
  },
  retryButton: {
    marginTop: 20,
    paddingVertical: 12,
    paddingHorizontal: 32,
    backgroundColor: "#0056D2",
    borderRadius: 8,
  },
  retryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
    fontFamily: "Poppins-Regular",
  },
});

export default NotificationsScreen;