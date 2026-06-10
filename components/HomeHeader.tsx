import { useUnreadNotificationsCount } from "@/hooks/useNotifications";
import { useRouter } from "expo-router";
import { Bell, MessageCircleQuestionMark } from "lucide-react-native";
import React, { useState } from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import ProfileSheet from "./ProfileSheet";
import { moderateScale, scale, homeStyles as styles } from "./homeStyles";

interface HomeHeaderProps {
  name: string;
  profileImage: string;
}

const HomeHeader: React.FC<HomeHeaderProps> = ({ name, profileImage }) => {
  const router = useRouter();
  const [showProfileSheet, setShowProfileSheet] = useState(false);
  const unreadCount = useUnreadNotificationsCount();

  return (
    <View style={styles.header}>
      <View
        style={{
          display: "flex",
          width: "100%",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          gap: scale(12),
        }}
      >
        <View>
          <Text style={styles.hello}>Hello,</Text>
          <Text style={styles.username} numberOfLines={1}>
            {" "}
            {name}{" "}
          </Text>
        </View>

        <View style={styles.headerIcons}>
          <TouchableOpacity
            onPress={() => router.push("/(Routes)/NotificationsScreen")}
            activeOpacity={0.7}
          >
            <View>
              <Bell size={moderateScale(24)} color="black" />
              {unreadCount > 0 && (
                <View style={badgeStyles.badge}>
                  <Text style={badgeStyles.badgeText}>
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </Text>
                </View>
              )}
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            // onPress={() => router.push("/(Routes)/MessagesScreen")}
            activeOpacity={0.7}
          >
            <MessageCircleQuestionMark size={moderateScale(24)} color="black" />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setShowProfileSheet(true)}
            activeOpacity={0.7}
          >
            <Image
              source={
                profileImage
                  ? { uri: profileImage }
                  : require("../assets/images/noImg.jpg")
              }
              style={styles.avatar}
            />
          </TouchableOpacity>
        </View>
      </View>

      <ProfileSheet
        visible={showProfileSheet}
        onClose={() => setShowProfileSheet(false)}
      />
    </View>
  );
};

const badgeStyles = StyleSheet.create({
  badge: {
    position: "absolute",
    top: -scale(6),
    right: -scale(7),
    minWidth: scale(16),
    height: scale(16),
    paddingHorizontal: scale(3),
    borderRadius: scale(8),
    backgroundColor: "#EF4444",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "#FFFFFF",
  },
  badgeText: {
    color: "#FFFFFF",
    fontSize: moderateScale(9),
    fontFamily: "DMSans_700Bold",
    lineHeight: moderateScale(12),
  },
});

export default HomeHeader;
