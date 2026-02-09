import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { onAuthStateChanged, User } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import useThemeStore from "../../stores/themeStore";
import { auth, db } from "../config/firebaseConfig";

// Types
interface SettingItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  text: string;
  onPress: () => void;
  hasArrow?: boolean;
  color?: string;
}

interface UserProfile {
  name: string;
  username: string;
}

// Reusable component for a single setting row
const SettingItem: React.FC<SettingItemProps> = ({
  icon,
  text,
  onPress,
  hasArrow = true,
  color = "#6366f1",
}) => {
  return (
    <TouchableOpacity
      style={itemStyles.container}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={itemStyles.leftContent}>
        <View
          style={[itemStyles.iconContainer, { backgroundColor: `${color}15` }]}
        >
          <Ionicons name={icon} size={22} color={color} />
        </View>
        <Text style={itemStyles.text}>{text}</Text>
      </View>
      {hasArrow && (
        <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
      )}
    </TouchableOpacity>
  );
};

const itemStyles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: "#fff",
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  leftContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  text: {
    fontSize: 16,
    marginLeft: 16,
    color: "#1f2937",
    fontWeight: "500",
  },
});

const SettingsScreen = () => {
  const { themeColor, isDarkMode, toggleTheme } = useThemeStore();
  const [profile, setProfile] = useState<UserProfile | null>(null);

  // Handle user logout
  const handleLogout = async () => {
    try {
      await auth.signOut();
      router.replace("../../Onboarding1");
    } catch (error) {
      console.error("Logout failed:", error);
      alert("Failed to log out. Please try again.");
    }
  };

  // Fetch user profile data on mount
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user: User | null) => {
      if (user) {
        try {
          const userDocRef = doc(db, "users", user.uid);
          const userDocSnap = await getDoc(userDocRef);

          if (userDocSnap.exists()) {
            const userData = userDocSnap.data();
            setProfile({
              name: userData.name || "User's Name",
              username: userData.username || user.email || "username",
            });
          } else {
            setProfile({
              name: user.displayName || "User's Name",
              username: user.email || "username",
            });
          }
        } catch (error) {
          console.error("Error fetching user profile:", error);
          setProfile({
            name: user.displayName || "User's Name",
            username: user.email || "username",
          });
        }
      } else {
        setProfile(null);
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" />

      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header with Gradient */}
        <LinearGradient
          colors={[themeColor || "#6366f1", "#8b5cf6"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.headerGradient}
        >
          <View style={styles.header}>
            <Text style={styles.title}>Settings</Text>
          </View>

          {/* Profile Section */}
          <View style={styles.profileSection}>
            <View style={styles.avatarContainer}>
              <LinearGradient
                colors={["#fff", "#f3f4f6"]}
                style={styles.avatarGradient}
              >
                <Ionicons
                  name="person"
                  size={48}
                  color={themeColor || "#6366f1"}
                />
              </LinearGradient>
            </View>
            <Text style={styles.name}>
              {profile ? profile.name : "User's Name"}
            </Text>
            <Text style={styles.username}>
              {profile ? `@${profile.username}` : "@username"}
            </Text>
          </View>
        </LinearGradient>

        {/* Settings Sections */}
        <View style={styles.sectionsContainer}>
          {/* Account Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>ACCOUNT</Text>
            <SettingItem
              icon="person-outline"
              text="Account Settings"
              onPress={() => router.push("./AccountScreen" as any)}
              color="#6366f1"
            />
            <SettingItem
              icon="shield-checkmark-outline"
              text="Privacy & Security"
              onPress={() => router.push("./PrivacyPolicyScreen" as any)}
              color="#8b5cf6"
            />
          </View>

          {/* Preferences Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>PREFERENCES</Text>
            <SettingItem
              icon="color-palette-outline"
              text="Theme"
              onPress={() => router.push("../../ThemeSelectionScreen" as any)}
              color="#ec4899"
            />

            <View style={[itemStyles.container, { marginBottom: 12 }]}>
              <View style={itemStyles.leftContent}>
                <View
                  style={[
                    itemStyles.iconContainer,
                    { backgroundColor: "#f59e0b15" },
                  ]}
                >
                  <Ionicons
                    name={isDarkMode ? "moon" : "sunny"}
                    size={22}
                    color="#f59e0b"
                  />
                </View>
                <Text style={itemStyles.text}>Dark Mode</Text>
              </View>
              <Switch
                trackColor={{ false: "#e5e7eb", true: themeColor || "#6366f1" }}
                thumbColor="#fff"
                ios_backgroundColor="#e5e7eb"
                onValueChange={toggleTheme}
                value={isDarkMode}
                style={styles.switch}
              />
            </View>

            <SettingItem
              icon="notifications-outline"
              text="Notifications"
              onPress={() => console.log("Go to notifications")}
              color="#10b981"
            />
          </View>

          {/* App Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>SUPPORT</Text>
            <SettingItem
              icon="help-circle-outline"
              text="Help Center"
              onPress={() => router.push("./HelpCenterScreen" as any)}
              color="#3b82f6"
            />
            <SettingItem
              icon="information-circle-outline"
              text="About"
              onPress={() => console.log("Go to about")}
              color="#06b6d4"
            />
            <SettingItem
              icon="star-outline"
              text="Rate Us"
              onPress={() => console.log("Rate app")}
              color="#fbbf24"
            />
          </View>

          {/* Logout Section */}
          <View style={styles.section}>
            <TouchableOpacity
              style={styles.logoutButton}
              onPress={handleLogout}
              activeOpacity={0.7}
            >
              <Ionicons name="log-out-outline" size={22} color="#ef4444" />
              <Text style={styles.logoutText}>Logout</Text>
            </TouchableOpacity>
          </View>

          {/* App Version */}
          <Text style={styles.version}>Version 1.0.0</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f9fafb",
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  headerGradient: {
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    paddingBottom: 40,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: Platform.OS === "ios" ? 20 : 40,
    paddingBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#fff",
  },
  profileSection: {
    alignItems: "center",
    paddingHorizontal: 24,
  },
  avatarContainer: {
    marginBottom: 16,
  },
  avatarGradient: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
  },
  name: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 4,
  },
  username: {
    fontSize: 15,
    color: "#fff",
    opacity: 0.85,
  },
  sectionsContainer: {
    paddingHorizontal: 20,
    marginTop: -20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "#9ca3af",
    marginBottom: 12,
    marginLeft: 4,
    letterSpacing: 1,
  },
  switch: {
    transform: [{ scaleX: 0.9 }, { scaleY: 0.9 }],
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: "#fee2e2",
  },
  logoutText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#ef4444",
    marginLeft: 8,
  },
  version: {
    textAlign: "center",
    fontSize: 13,
    color: "#9ca3af",
    marginTop: 16,
  },
});

export default SettingsScreen;
