// screens/NotificationsScreen.tsx
import { Feather, Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useFonts } from "expo-font";
import {
  collection,
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
import { db } from "../config/firebaseConfig";

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
  actionText?: string; // New field for action text
  secondaryActionText?: string; // New field for secondary action
}

type RootStackParamList = {
  notifications: undefined;
  notificationDetails: { notification: Notification };
  inventory: undefined;
};

type NotificationsScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "notifications"
>;

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
    }
  });

  return groups;
};

const NotificationsScreen = () => {
  const navigation = useNavigation<NotificationsScreenNavigationProp>();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const [fontsLoaded] = useFonts({
    "Poppins-Regular": require("../../assets/fonts/Poppins-Regular.ttf"),
    "Poppins-Bold": require("../../assets/fonts/Poppins-Bold.ttf"),
    "Poppins-Light": require("../../assets/fonts/Poppins-Light.ttf"),
  });

  useEffect(() => {
    const notificationsCollection = collection(db, "notifications");
    const notificationsQuery = query(
      notificationsCollection,
      orderBy("dateAdded", "desc")
    );

    const unsubscribe = onSnapshot(
      notificationsQuery,
      (snapshot) => {
        const fetchedNotifications: Notification[] = [];
        snapshot.forEach((doc: QueryDocumentSnapshot) => {
          const data = doc.data();
          fetchedNotifications.push({
            id: doc.id,
            ...data,
          } as Notification);
        });
        setNotifications(fetchedNotifications);
        setLoading(false);
      },
      (error) => {
        console.error("Firestore error:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
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
          <View style={[styles.iconWrapper, { backgroundColor: "#E3F2FD" }]}>
            <Ionicons name="cart-outline" size={24} color="#2196F3" />
          </View>
        );
      case "zero_sales":
        return (
          <View style={[styles.iconWrapper, { backgroundColor: "#E3F2FD" }]}>
            <Ionicons name="cart-outline" size={24} color="#2196F3" />
          </View>
        );
      case "expiry":
        return (
          <View style={[styles.iconWrapper, { backgroundColor: "#E3F2FD" }]}>
            <Ionicons name="basket-outline" size={24} color="#2196F3" />
          </View>
        );
      case "daily_summary":
      case "weekly_summary":
        return (
          <View style={[styles.iconWrapper, { backgroundColor: "#E3F2FD" }]}>
            <Ionicons name="stats-chart-outline" size={24} color="#2196F3" />
          </View>
        );
      case "expense":
        return (
          <View style={[styles.iconWrapper, { backgroundColor: "#E3F2FD" }]}>
            <Ionicons name="stats-chart-outline" size={24} color="#2196F3" />
          </View>
        );
      case "backup":
        return (
          <View style={[styles.iconWrapper, { backgroundColor: "#E8EAF6" }]}>
            <Ionicons name="settings-outline" size={24} color="#5C6BC0" />
          </View>
        );
      case "app_update":
        return (
          <View style={[styles.iconWrapper, { backgroundColor: "#E3F2FD" }]}>
            <Ionicons name="basket-outline" size={24} color="#2196F3" />
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

  const renderNotificationItem = ({ item }: { item: Notification }) => {
    const actions = getActionText(item.type);

    return (
      <TouchableOpacity
        style={styles.notificationItem}
        onPress={() =>
          navigation.navigate("notificationDetails", { notification: item })
        }
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
        {!item.isRead && (
          <View style={styles.newBadge}>
            <Text style={styles.newBadgeText}>New</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  if (loading || !fontsLoaded) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading notifications...</Text>
      </SafeAreaView>
    );
  }

  const groupedNotifications = groupNotificationsByDate(notifications);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="notifications" size={32} color="#FFA500" />
          <Text style={styles.headerTitle}>Notifications</Text>
        </View>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <View style={styles.closeButton}>
            <Feather name="x" size={28} color="#000" />
          </View>
        </TouchableOpacity>
      </View>

      <FlatList
        data={Object.keys(groupedNotifications).filter(
          (key) => groupedNotifications[key].length > 0
        )}
        keyExtractor={(item) => item}
        renderItem={({ item: sectionTitle }) => (
          <View>
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
            <Feather name="inbox" size={80} color="#E0E0E0" />
            <Text style={styles.emptyText}>No notifications yet</Text>
            <Text style={styles.emptySubText}>
              All your updates and alerts will show up here.
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#E8EEF7",
    paddingTop: 50,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F4F7FC",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#666",
    fontFamily: "Poppins-Regular",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 15,
    marginBottom: 10,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  headerTitle: {
    fontSize: 28,
    color: "#000",
    fontFamily: "Poppins-Bold",
  },
  closeButton: {
    backgroundColor: "white",
    borderRadius: 8,
    padding: 8,
  },
  listContentContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  sectionHeader: {
    fontSize: 14,
    color: "#9CA3AF",
    fontFamily: "Poppins-Regular",
    marginTop: 10,
    marginBottom: 12,
  },
  notificationItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
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
    fontSize: 13,
    color: "#9CA3AF",
    fontFamily: "Poppins-Regular",
    flex: 1,
  },
  notificationMessage: {
    fontSize: 15,
    color: "#1F2937",
    fontFamily: "Poppins-Regular",
    marginBottom: 8,
    lineHeight: 20,
  },
  notificationTime: {
    fontSize: 12,
    color: "#D1D5DB",
    fontFamily: "Poppins-Regular",
    marginLeft: 8,
  },
  actionsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  actionText: {
    fontSize: 13,
    color: "#3B82F6",
    fontFamily: "Poppins-Regular",
  },
  actionSeparator: {
    fontSize: 13,
    color: "#3B82F6",
    marginHorizontal: 4,
  },
  newBadge: {
    backgroundColor: "#FEF3C7",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    position: "absolute",
    right: 12,
    top: 16,
  },
  newBadgeText: {
    fontSize: 11,
    color: "#D97706",
    fontFamily: "Poppins-Regular",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 50,
    paddingHorizontal: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#666",
    marginTop: 16,
    fontFamily: "Poppins-Regular",
  },
  emptySubText: {
    fontSize: 14,
    color: "#999",
    textAlign: "center",
    marginTop: 8,
    fontFamily: "Poppins-Regular",
  },
});

export default NotificationsScreen;
