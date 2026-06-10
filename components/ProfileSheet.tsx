import { clearTokens, getProfile, logout } from "@/src/api";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import ConfirmModal from "./ui/ConfirmModal";
import SuccessModal from "./ui/SuccessModal";

interface ProfileSheetProps {
  visible: boolean;
  onClose: () => void;
}

type Row = {
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  value?: string;
  action: () => void;
};

type Section = {
  title: string;
  rows: Row[];
};

const ProfileSheet: React.FC<ProfileSheetProps> = ({ visible, onClose }) => {
  const insets = useSafeAreaInsets();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const { data: profile } = useQuery({
    queryKey: ["profile"],
    queryFn: getProfile,
  });

  const userName = profile?.name || profile?.business_name || "Guest User";
  const userPhone = profile?.phone || "";
  const userProfileImage = profile?.profile_image || "";

  // Close the sheet, then run the navigation/action.
  const go = (action: () => void) => {
    onClose();
    action();
  };

  const SECTIONS: Section[] = [
    {
      title: "MY BUSINESS PROFILE",
      rows: [
        {
          title: "Business Information",
          icon: "storefront-outline",
          action: () => go(() => router.push("/(Routes)/Profile")),
        },
        {
          title: "Change Profile Photo",
          icon: "camera-outline",
          action: () => go(() => router.push("/(Routes)/Profile")),
        },
      ],
    },
    {
      title: "SETTINGS",
      rows: [
        {
          title: "Notifications",
          icon: "notifications-outline",
          action: () => go(() => router.push("/(Routes)/NotificationsScreen")),
        },
        {
          title: "Language",
          icon: "globe-outline",
          value: "English",
          action: () => {},
        },
        {
          title: "App Preferences",
          icon: "settings-outline",
          action: () => go(() => router.push("/(Routes)/SettingsScreen")),
        },
      ],
    },
    {
      title: "HELP & SUPPORT",
      rows: [
        {
          title: "FAQs",
          icon: "help-circle-outline",
          action: () => {},
        },
        {
          title: "Contact Support",
          icon: "help-circle-outline",
          action: () => {},
        },
      ],
    },
  ];

  // ─── Logout ────────────────────────────────────────────────────────────────

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
    onClose();
    router.replace("/(Auth)/WelcomeScreen");
  };

  return (
    <>
      <Modal
        visible={visible}
        transparent
        animationType="slide"
        onRequestClose={onClose}
        statusBarTranslucent
      >
        <View style={styles.overlay}>
          {/* Tap outside to dismiss */}
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={onClose}
          />

          <View style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}>
            <View style={styles.grabber} />

            {/* Profile header */}
            <View style={styles.profileRow}>
              <Image
                source={
                  userProfileImage
                    ? { uri: userProfileImage }
                    : require("../assets/images/noImg.jpg")
                }
                style={styles.avatar}
              />
              <View style={styles.profileInfo}>
                <Text style={styles.profileName} numberOfLines={1}>
                  {userName}
                </Text>
                {userPhone ? (
                  <Text style={styles.profilePhone}>{userPhone}</Text>
                ) : null}
              </View>
            </View>

            <View style={styles.headerDivider} />

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
            >
              {SECTIONS.map((section) => (
                <View key={section.title} style={styles.section}>
                  <Text style={styles.sectionTitle}>{section.title}</Text>
                  <View style={styles.card}>
                    {section.rows.map((row, index) => (
                      <TouchableOpacity
                        key={row.title}
                        style={[
                          styles.row,
                          index !== section.rows.length - 1 &&
                            styles.rowDivider,
                        ]}
                        onPress={row.action}
                        activeOpacity={0.7}
                      >
                        <Ionicons
                          name={row.icon}
                          size={22}
                          color="#1155CC"
                          style={styles.rowIcon}
                        />
                        <Text style={styles.rowText}>{row.title}</Text>
                        {row.value ? (
                          <Text style={styles.rowValue}>{row.value}</Text>
                        ) : null}
                        <Ionicons
                          name="chevron-forward"
                          size={20}
                          color="#C0C0C0"
                        />
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              ))}

              {/* Logout */}
              <TouchableOpacity
                style={styles.logoutButton}
                onPress={() => setShowLogoutModal(true)}
                activeOpacity={0.8}
              >
                <Ionicons name="log-out-outline" size={20} color="#E74C3C" />
                <Text style={styles.logoutText}>Logout</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

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
    </>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: "92%",
    paddingTop: 10,
  },
  grabber: {
    width: 44,
    height: 5,
    borderRadius: 3,
    backgroundColor: "#1C1C1C",
    alignSelf: "center",
    marginBottom: 12,
  },
  profileRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 16,
    gap: 14,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#eee",
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 22,
    color: "#1C1C1C",
    fontFamily: "DMSans_700Bold",
  },
  profilePhone: {
    fontSize: 15,
    color: "#8A8A8E",
    fontFamily: "DMSans_400Regular",
    marginTop: 2,
  },
  headerDivider: {
    height: 1,
    backgroundColor: "#EEEEEE",
  },
  scrollContent: {
    paddingBottom: 8,
  },
  section: {
    paddingHorizontal: 20,
    marginTop: 22,
  },
  sectionTitle: {
    fontSize: 12,
    letterSpacing: 1,
    color: "#9CA3AF",
    fontFamily: "DMSans_500Medium",
    marginBottom: 10,
  },
  card: {
    borderWidth: 1,
    borderColor: "#ECECEC",
    borderRadius: 14,
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 18,
    paddingHorizontal: 16,
  },
  rowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  rowIcon: {
    marginRight: 14,
  },
  rowText: {
    flex: 1,
    fontSize: 16,
    color: "#1C1C1C",
    fontFamily: "DMSans_400Regular",
  },
  rowValue: {
    fontSize: 15,
    color: "#6E6E6E",
    fontFamily: "DMSans_500Medium",
    marginRight: 10,
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    marginHorizontal: 20,
    marginTop: 28,
    borderWidth: 1,
    borderColor: "#EF4444",
    borderRadius: 16,
    paddingVertical: 16,
  },
  logoutText: {
    fontSize: 16,
    color: "#EF4444",
    fontFamily: "DMSans_700Bold",
  },
});

export default ProfileSheet;
