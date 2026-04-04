import { clearTokens, getProfile, logout } from "@/src/api";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import { styles } from "./More.styles";

import {
  ActivityIndicator,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import ConfirmModal from "../../components/ui/ConfirmModal";
import SuccessModal from "../../components/ui/SuccessModal";

// ─── Types ────────────────────────────────────────────────────────────────────

type Option = {
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  action: () => void;
  badge?: number;
};

type SectionConfig = {
  title: string;
  options: Option[];
};

// ─── Component ────────────────────────────────────────────────────────────────

const More = () => {
  const [userName, setUserName] = useState<string>("Guest User");
  const [userPhone, setUserPhone] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [notificationCount] = useState(3); // replace with real count when available

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

  // ─── Section data ──────────────────────────────────────────────────────────

  const SECTIONS: SectionConfig[] = [
    {
      title: "ACCOUNT",
      options: [
        {
          title: "Profile",
          icon: "person-outline",
          action: () => router.push("/(Routes)/Profile"),
        },
        {
          title: "Settings",
          icon: "settings-outline",
          action: () => {}, //router.push("/(Routes)/Settings"),
        },
        {
          title: "Notifications",
          icon: "notifications-outline",
          action: () => {}, //router.push("/(Routes)/Notifications"),
          badge: notificationCount,
        },
      ],
    },
    {
      title: "MY BUSINESS PROFILE",
      options: [
        {
          title: "Business Information",
          icon: "storefront-outline",
          action: () => router.push("/(Routes)/Profile"),
        },
        {
          title: "Change Profile Photo",
          icon: "camera-outline",
          action: () => router.push("/(Routes)/Profile"),
        },
      ],
    },
    {
      title: "SUPPORT",
      options: [
        {
          title: "Help & Support",
          icon: "help-circle-outline",
          action: () => {}, //router.push("/(Routes)/HelpCenterScreen"),
        },
        {
          title: "Privacy Policy",
          icon: "document-text-outline",
          action: () => {}, //router.push("/(Routes)/PrivacyPolicy"),
        },
      ],
    },
  ];

  // ─── Logout handlers ───────────────────────────────────────────────────────

  const proceedLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Remote logout failed, clearing local session:", error);
    } finally {
      await clearTokens();
      setShowSuccessModal(true);
    }
  };

  const handleConfirmLogout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await proceedLogout();
    } finally {
      setLoggingOut(false);
      setShowLogoutModal(false);
    }
  };

  const handleSuccessClose = () => {
    setShowSuccessModal(false);
    router.replace("/(Auth)/WelcomeScreen");
  };

  // ─── Render helpers ────────────────────────────────────────────────────────

  const renderOption = (option: Option, index: number, total: number) => (
    <TouchableOpacity
      key={option.title}
      style={[
        styles.optionItem,
        index === 0 && styles.optionItemFirst,
        index === total - 1 && styles.optionItemLast,
      ]}
      onPress={option.action}
      activeOpacity={0.7}
    >
      <View style={styles.iconContainer}>
        <Ionicons name={option.icon} size={20} color="#1155CC" />
      </View>
      <Text style={styles.optionText}>{option.title}</Text>

      {/* Notification badge — only shown when badge count > 0 */}
      {option.badge != null && option.badge > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{option.badge}</Text>
        </View>
      )}

      <Ionicons name="chevron-forward-outline" size={20} color="#C0C0C0" />
    </TouchableOpacity>
  );

  // ─── Loading state ─────────────────────────────────────────────────────────

  if (loading) {
    return (
      <SafeAreaView style={[styles.safeArea, styles.centered]}>
        <ActivityIndicator size="large" color="#1155CC" />
      </SafeAreaView>
    );
  }

  // ─── Main render ───────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>More</Text>
          <Text style={styles.headerSubtitle}>Account and app settings</Text>
        </View>

        {/* Profile card */}
        <TouchableOpacity
          style={styles.profileCard}
          onPress={() => router.push("/(Routes)/Profile")}
          activeOpacity={0.85}
        >
          <View style={styles.profileIcon}>
            <Ionicons name="person" size={28} color="#fff" />
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{userName}</Text>
            {userPhone ? (
              <Text style={styles.profilePhone}>{userPhone}</Text>
            ) : null}
          </View>
        </TouchableOpacity>

        {/* Sections */}
        {SECTIONS.map((section) => (
          <View key={section.title} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <View style={styles.sectionCard}>
              {section.options.map((option, i) =>
                renderOption(option, i, section.options.length),
              )}
            </View>
          </View>
        ))}

        {/* Logout */}
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={() => setShowLogoutModal(true)}
          activeOpacity={0.7}
        >
          <Ionicons name="log-out-outline" size={20} color="#E74C3C" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>

        {/* Footer */}
        <View style={styles.footer}>
          <View style={styles.footerCard}>
            <Text style={styles.footerBrand}>Inventra</Text>
            <Text style={styles.footerTagline}>Version 1.0.0</Text>
            <Text style={styles.footerCredit}>
              Made with ❤️ for Nigerian retailers
            </Text>
          </View>
        </View>
      </ScrollView>

      <ConfirmModal
        visible={showLogoutModal}
        title="Log out of Inventra?"
        subtitle="You will be signed out from this device and redirected to the welcome screen."
        iconName="log-out-outline"
        iconColor="#E74C3C"
        confirmText="Yes, log out"
        cancelText="Cancel"
        loading={loggingOut}
        onCancel={() => setShowLogoutModal(false)}
        onConfirm={handleConfirmLogout}
      />

      <SuccessModal
        visible={showSuccessModal}
        title="Logged out successfully!"
        subtitle="You have been signed out and will be redirected to the welcome screen."
        iconName="checkmark-circle-outline"
        iconColor="#1BC47D"
        buttonText="Continue"
        onClose={handleSuccessClose}
      />
    </SafeAreaView>
  );
};

export default More;
