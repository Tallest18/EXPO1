import { Feather, Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { FlatList, Text, TouchableOpacity, View } from "react-native";

import { moderateScale, scale, homeStyles as styles } from "./homeStyles";
import { Notification } from "./homeTypes";

interface NotificationFeedProps {
  notifications: Notification[];
}

const getNotificationIcon = (type: Notification["type"]) => {
  // Matching the icons from your provided image
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

const NotificationFeed: React.FC<NotificationFeedProps> = ({
  notifications, // You can swap dummy_notifications with this prop when ready
}) => {
  const router = useRouter();

  const dummy_notifications: Notification[] = [
    {
      id: "1",
      type: "low_stock",
      title: "Low Stock Alert",
      message: "Coca-Cola 50cl, Peak Milk, Indomie,...",
      time: "23min Ago",
      actions: "Tap to restock | View product page",
      status: "New",
      isNew: true,
      isRead: false,
      dateAdded: new Date().toISOString(),
    },
    {
      id: "2",
      type: "daily_summary",
      title: "Profit Summary",
      message: "You made ₦6,300 in profit today. Tap...",
      time: "30min Ago",
      actions: "Tap to open Daily Sales Summary",
      status: "New",
      isNew: true,
      isRead: false,
      dateAdded: new Date().toISOString(),
    },
    {
      id: "3",
      type: "out_of_stock",
      title: "Out of Stock Alert",
      message: "Premier Soap is out of stock!",
      time: "23min Ago",
      actions: "Tap to restock | View product page",
      status: "New",
      isNew: true,
      isRead: true,
      dateAdded: new Date().toISOString(),
    },
  ];

  const renderItem = ({ item }: { item: Notification }) => (
    <TouchableOpacity
      style={styles.notificationCard}
      onPress={() =>
        router.push({
          pathname: "/(Routes)/NotificationDetails" as any,
          params: { notification: JSON.stringify(item) },
        })
      }
      activeOpacity={0.7}
    >
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
          <View
            style={{
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              gap: scale(8),
              justifyContent: "space-between",
            }}
          >
            {item.actions && (
              <Text style={styles.notifActions} numberOfLines={1}>
                {item.actions}
              </Text>
            )}
            <Text
              style={{
                borderRadius: 24,
                fontFamily: "DMSans_400Regular",
                backgroundColor: "white",
                paddingHorizontal: scale(8),
                padding: scale(3),
                fontSize: 8,
                color: "#FFBA00",
              }}
            >
              {item.status}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

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
          onPress={() => router.push("/(Routes)/NotificationsScreen")}
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
        data={dummy_notifications.slice(0, 3)}
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
