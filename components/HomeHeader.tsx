import { Ionicons } from "@expo/vector-icons";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useRouter } from "expo-router";
import React from "react";
import { Image, Text, TouchableOpacity, View } from "react-native";
import { moderateScale, scale, homeStyles as styles } from "./homeStyles";

interface HomeHeaderProps {
  name: string;
  profileImage: string;
}

const HomeHeader: React.FC<HomeHeaderProps> = ({ name, profileImage }) => {
  const router = useRouter();

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
            <Ionicons
              name="notifications-outline"
              size={moderateScale(24)}
              color="black"
            />
          </TouchableOpacity>

          <TouchableOpacity
            // onPress={() => router.push("/(Routes)/MessagesScreen")}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons
              name="comment-question-outline"
              size={28}
              color="black"
            />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push("/(Routes)/Profile")}
            activeOpacity={0.7}
          >
            <Image
              source={
                profileImage
                  ? { uri: profileImage }
                  : require("/assets/images/noImg.jpg")
              }
              style={styles.avatar}
            />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

export default HomeHeader;
