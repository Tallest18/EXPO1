import { clearTokens, getProfile, logout } from "@/src/api";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";

import {
    ActivityIndicator,
    Alert,
    Dimensions,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

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

// Define a type for the options to ensure type safety for icon names
type Option = {
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  action: () => void;
};

const More = () => {
  const [userName, setUserName] = useState<string>("Guest User");
  const [userPhone, setUserPhone] = useState<string>("");
  const [loading, setLoading] = useState(true);

  // Fetch user data when component mounts
  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const userData = await getProfile();
      setUserName(userData.name || "Guest User");
      setUserPhone(userData.phone || "");
    } catch (error) {
      console.error("Error fetching user data:", error);
      setUserName("Guest User");
      setUserPhone("");
    } finally {
      setLoading(false);
    }
  };

  const businessOptions: Option[] = [
    {
      title: "Business Information",
      icon: "briefcase-outline",
      action: () => {
        router.push("/(Routes)/Profile");
      },
    },
    {
      title: "Change Profile Photo",
      icon: "camera-outline",
      action: () => {
        router.push("/(Routes)/Profile");
      },
    },
  ];

  const supportOptions: Option[] = [
    {
      title: "Help & Support",
      icon: "help-circle-outline",
      action: () => {
        router.push("/(Routes)/HelpCenterScreen");
      },
    },
    {
      title: "Privacy Policy",
      icon: "document-text-outline",
      action: () => {
        router.push("/(Routes)/PrivacyPolicy");
      },
    },
  ];

  const proceedLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Remote logout failed, clearing local session:", error);
    } finally {
      await clearTokens();
      router.replace("/(Auth)/WelcomeScreen");
    }
  };

  const handleLogout = () => {
    if (Platform.OS === "web") {
      const confirmed =
        typeof window !== "undefined"
          ? window.confirm("Do you want to log out?")
          : true;
      if (confirmed) {
        void proceedLogout();
      }
      return;
    }

    Alert.alert("Log out", "Do you want to log out?", [
      {
        text: "No",
        style: "cancel",
      },
      {
        text: "Yes",
        style: "destructive",
        onPress: () => {
          void proceedLogout();
        },
      },
    ]);
  };

  const renderOption = (option: Option) => (
    <TouchableOpacity
      key={option.title}
      style={styles.optionItem}
      onPress={option.action}
    >
      <View style={styles.iconContainer}>
        <Ionicons name={option.icon} size={20} color="#2046AE" />
      </View>
      <Text style={styles.optionText}>{option.title}</Text>
      <Ionicons name="chevron-forward-outline" size={20} color="#C0C0C0" />
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={[styles.safeArea, styles.centered]}>
        <ActivityIndicator size="large" color="#2046AE" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>More</Text>
          <Text style={styles.headerSubtitle}>Account and app settings</Text>
        </View>

        {/* User Profile Card */}
        <TouchableOpacity
          style={styles.profileCard}
          onPress={() => router.push("/(Routes)/Profile")}
        >
          <View style={styles.profileIcon}>
            <Ionicons name="person" size={28} color="#fff" />
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{userName}</Text>
            {userPhone && <Text style={styles.profilePhone}>{userPhone}</Text>}
          </View>
        </TouchableOpacity>

        {/* Business Profile Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>MY BUSINESS PROFILE</Text>
          {businessOptions.map(renderOption)}
        </View>

        {/* Support Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>SUPPORT</Text>
          {supportOptions.map(renderOption)}
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color="#E74C3C" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerBrand}>Inventra</Text>
          <Text style={styles.footerTagline}>Version 1.0.1</Text>
          <Text style={styles.footerCredit}>
            Made with ❤️ by Nigeria traders
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    paddingTop: verticalScale(0),
    backgroundColor: "#E7EEFA",
  },
  centered: {
    justifyContent: "center",
    alignItems: "center",
  },
  container: {
    flex: 1,
    backgroundColor: "#E7EEFA",
  },
  header: {
    paddingHorizontal: scale(20),
    paddingTop: verticalScale(30),
    paddingBottom: verticalScale(20),
  },
  headerTitle: {
    fontSize: moderateScale(28),
    fontWeight: "700",
    color: "#1a1a1a",
    marginBottom: verticalScale(4),
    fontFamily: "Poppins-Bold",
  },
  headerSubtitle: {
    fontSize: moderateScale(15),
    color: "#8E8E93",
    fontFamily: "Poppins-Regular",
  },
  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#2046AE",
    borderRadius: moderateScale(12),
    padding: scale(16),
    marginHorizontal: scale(20),
    marginBottom: verticalScale(24),
  },
  profileIcon: {
    width: scale(48),
    height: verticalScale(48),
    borderRadius: moderateScale(24),
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  profileInfo: {
    marginLeft: 12,
    flex: 1,
  },
  profileName: {
    fontSize: moderateScale(16),
    fontWeight: "600",
    color: "#fff",
    marginBottom: verticalScale(4),
    fontFamily: "Poppins-SemiBold",
  },
  profilePhone: {
    fontSize: moderateScale(14),
    color: "rgba(255, 255, 255, 0.8)",
    fontFamily: "Poppins-Regular",
  },
  section: {
    marginBottom: verticalScale(24),
  },
  sectionTitle: {
    fontSize: moderateScale(12),
    fontWeight: "600",
    color: "#8E8E93",
    paddingHorizontal: scale(20),
    marginBottom: verticalScale(8),
    letterSpacing: 0.5,
    fontFamily: "Poppins-SemiBold",
  },
  optionItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    paddingVertical: verticalScale(16),
    paddingHorizontal: scale(20),
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
    marginLeft: 20,
    marginRight: 20,
    borderRadius: moderateScale(12),
  },
  iconContainer: {
    width: scale(24),
    alignItems: "center",
  },
  optionText: {
    flex: 1,
    marginLeft: 16,
    fontSize: moderateScale(16),
    color: "#1a1a1a",
    fontFamily: "Poppins-Regular",
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    borderRadius: moderateScale(50),
    borderWidth: 1,
    borderColor: "#E74C3C",
    paddingVertical: verticalScale(14),
    marginHorizontal: scale(20),
    marginBottom: verticalScale(24),
  },
  logoutText: {
    fontSize: moderateScale(16),
    fontWeight: "600",
    color: "#E74C3C",
    marginLeft: 8,
    fontFamily: "Poppins-SemiBold",
  },
  footer: {
    alignItems: "center",
    paddingVertical: verticalScale(24),
    paddingBottom: verticalScale(40),
  },
  footerBrand: {
    fontSize: moderateScale(18),
    fontWeight: "700",
    color: "#2046AE",
    marginBottom: verticalScale(4),
    fontFamily: "Poppins-Bold",
  },
  footerTagline: {
    fontSize: moderateScale(13),
    color: "#8E8E93",
    marginBottom: verticalScale(4),
    fontFamily: "Poppins-Regular",
  },
  footerCredit: {
    fontSize: moderateScale(13),
    color: "#8E8E93",
    fontFamily: "Poppins-Regular",
  },
});

export default More;
