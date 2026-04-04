import { Feather, Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { FlatList, Text, TouchableOpacity, View } from "react-native";
import { moderateScale, scale, homeStyles as styles } from "./homeStyles";
import { Notification } from "./homeTypes";

// ─── Dummy data ───────────────────────────────────────────────────────────────

export const DUMMY_NOTIFICATIONS: Notification[] = [
  {
    id: "1",
    type: "low_stock",
    title: "Low Stock Alert",
    message: "Coca-Cola 50cl",
    time: "23min Ago",
    status: "New",
    isNew: true,
    isRead: false,
    dateAdded: new Date().toISOString(),
    actions: [
      { label: "Tap to restock", type: "restock", productId: "1" },
      { label: "View product page", type: "view_product", productId: "1" },
    ],
  },
  {
    id: "2",
    type: "daily_summary",
    title: "Profit Summary",
    message: "You made ₦6,300 in profit today. Tap...",
    time: "30min Ago",
    status: "New",
    isNew: true,
    isRead: false,
    dateAdded: new Date().toISOString(),
    actions: [
      { label: "Tap to open Daily Sales Summary", type: "view_summary" },
    ],
  },
  {
    id: "3",
    type: "out_of_stock",
    title: "Out of Stock Alert",
    message: "Premier Soap is out of stock!",
    time: "23min Ago",
    status: "New",
    isNew: true,
    isRead: true,
    dateAdded: new Date().toISOString(),
    actions: [
      { label: "Tap to restock", type: "restock", productId: "3" },
      { label: "View product page", type: "view_product", productId: "3" },
    ],
  },
];

// ─── Icon resolver ────────────────────────────────────────────────────────────

const getNotificationIcon = (type: Notification["type"]) => {
  switch (type) {
    case "low_stock":
    case "out_of_stock":
      return (
        <Ionicons
          name="folder-open-outline"
          size={moderateScale(24)}
          color="#1155CC"
        />
      );
    case "daily_summary":
    case "weekly_summary":
      return (
        <Ionicons
          name="bar-chart-outline"
          size={moderateScale(24)}
          color="#1155CC"
        />
      );
    case "high_selling":
      return (
        <Feather name="trending-up" size={moderateScale(24)} color="#1155CC" />
      );
    case "expiry":
      return (
        <Feather name="calendar" size={moderateScale(24)} color="#1155CC" />
      );
    default:
      return (
        <Ionicons
          name="notifications-outline"
          size={moderateScale(24)}
          color="#1155CC"
        />
      );
  }
};

// ─── Component ────────────────────────────────────────────────────────────────

const NotificationFeed: React.FC = () => {
  const router = useRouter();

  const handleNotificationAction = (
    action: Exclude<Notification["actions"], undefined>[number],
    notification: Notification,
  ) => {
    switch (action.type) {
      case "restock":
        router.push({
          pathname: "/(Routes)/RestockDetails",
          params: { productId: action.productId ?? notification.id },
        });
        break;

      case "view_product": {
        const productId = action.productId ?? notification.id;
        router.push({
          pathname: "/(Routes)/ProductDetails",
          params: { productId },
        });
        break;
      }

      default:
        break;
    }
  };

  // ─── Item renderer ──────────────────────────────────────────────────────────

  const renderItem = ({ item }: { item: Notification }) => (
    <TouchableOpacity style={styles.notificationCard} activeOpacity={0.7}>
      <View style={styles.notifLeftSection}>
        <View style={styles.notifIconBox}>
          {getNotificationIcon(item.type)}
        </View>

        <View style={styles.notifContent}>
          <View style={styles.notifTitleRow}>
            <Text style={styles.notifTitle} numberOfLines={1}>
              {item.title}
            </Text>
            <Text style={styles.notifTime}>{item.time}</Text>
          </View>

          <Text style={styles.notifMessage} numberOfLines={1}>
            {item.message}
          </Text>

          {item.actions && item.actions.length > 0 && (
            <View style={{ flexDirection: "row", gap: scale(8) }}>
              {item.actions.map((action, idx) => (
                <TouchableOpacity
                  key={idx}
                  onPress={() => handleNotificationAction(action, item)}
                  style={{
                    paddingHorizontal: scale(8),
                    paddingVertical: scale(3),
                    backgroundColor: "#FFF",
                    borderRadius: 24,
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={{ color: "#1155CC", fontSize: 12 }}>
                    {action.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <View style={styles.notificationSection}>
      <View style={styles.notificationHeader}>
        <View
          style={{ flexDirection: "row", alignItems: "center", gap: scale(8) }}
        >
          <Ionicons
            name="notifications"
            size={moderateScale(30)}
            color="#FFBA00"
          />
          <Text style={styles.notificationHeaderTitle}>Notifications</Text>
        </View>
        <TouchableOpacity
          style={styles.arrowIconCircle}
          onPress={() => {
            router.push("/(Routes)/NotificationsScreen");
          }}
          activeOpacity={0.7}
        >
          <Feather
            name="arrow-up-right"
            size={moderateScale(20)}
            color="#fff"
          />
        </TouchableOpacity>
      </View>

      <FlatList
        data={DUMMY_NOTIFICATIONS.slice(0, 3)}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No recent updates</Text>
        }
        scrollEnabled={false}
      />
    </View>
  );
};

export default NotificationFeed;
