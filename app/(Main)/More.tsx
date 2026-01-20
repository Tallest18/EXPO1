import { auth, db } from "@/app/config/firebaseConfig";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

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
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        await fetchUserData(user.uid);
      } else {
        setUserName("Guest User");
        setUserPhone("");
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const fetchUserData = async (userId: string) => {
    try {
      // Fetch user document from Firestore
      const userDoc = await getDoc(doc(db, "users", userId));

      if (userDoc.exists()) {
        const userData = userDoc.data();
        console.log("User data from Firestore:", userData);

        setUserName(
          userData.name ||
            userData.businessName ||
            userData.displayName ||
            "Guest User",
        );
        setUserPhone(
          userData.phone || userData.phoneNumber || userData.mobile || "",
        );
      } else {
        console.log("No user document found in Firestore");
        if (auth.currentUser?.displayName) {
          setUserName(auth.currentUser.displayName);
        }
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
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

  const handleLogout = async () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          try {
            await signOut(auth);
            router.replace("/(Anboarding)/Onboarding1");
          } catch (error) {
            console.error("Error during logout:", error);
            Alert.alert("Error", "Failed to logout. Please try again.");
          }
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
    paddingTop: 0,
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
    paddingHorizontal: 20,
    paddingTop: 30,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: "#1a1a1a",
    marginBottom: 4,
    fontFamily: "Poppins-Bold",
  },
  headerSubtitle: {
    fontSize: 15,
    color: "#8E8E93",
    fontFamily: "Poppins-Regular",
  },
  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#2046AE",
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 24,
  },
  profileIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  profileInfo: {
    marginLeft: 12,
    flex: 1,
  },
  profileName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
    marginBottom: 4,
    fontFamily: "Poppins-SemiBold",
  },
  profilePhone: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.8)",
    fontFamily: "Poppins-Regular",
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "600",
    color: "#8E8E93",
    paddingHorizontal: 20,
    marginBottom: 8,
    letterSpacing: 0.5,
    fontFamily: "Poppins-SemiBold",
  },
  optionItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
    marginLeft: 20,
    marginRight: 20,
    borderRadius: 12,
  },
  iconContainer: {
    width: 24,
    alignItems: "center",
  },
  optionText: {
    flex: 1,
    marginLeft: 16,
    fontSize: 16,
    color: "#1a1a1a",
    fontFamily: "Poppins-Regular",
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    borderRadius: 50,
    borderWidth: 1,
    borderColor: "#E74C3C",
    paddingVertical: 14,
    marginHorizontal: 20,
    marginBottom: 24,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#E74C3C",
    marginLeft: 8,
    fontFamily: "Poppins-SemiBold",
  },
  footer: {
    alignItems: "center",
    paddingVertical: 24,
    paddingBottom: 40,
  },
  footerBrand: {
    fontSize: 18,
    fontWeight: "700",
    color: "#2046AE",
    marginBottom: 4,
    fontFamily: "Poppins-Bold",
  },
  footerTagline: {
    fontSize: 13,
    color: "#8E8E93",
    marginBottom: 4,
    fontFamily: "Poppins-Regular",
  },
  footerCredit: {
    fontSize: 13,
    color: "#8E8E93",
    fontFamily: "Poppins-Regular",
  },
});

export default More;
