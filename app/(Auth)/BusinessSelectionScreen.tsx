// app/(Auth)/BusinessSelectionScreen.tsx
import { AUTH_PROFILE } from "@/src/api/endpoints";
import { useApiMutation } from "@/src/api/useApi";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const { width, height } = Dimensions.get("window");

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);
const scale = (size: number) =>
  clamp((width / 375) * size, size * 0.76, size * 1.3);
const verticalScale = (size: number) =>
  clamp((height / 812) * size, size * 0.62, size * 1.2);
const moderateScale = (size: number, factor = 0.5) =>
  size + (scale(size) - size) * factor;

interface BusinessType {
  id: string;
  title: string;
  description: string;
}

const businessTypes: BusinessType[] = [
  {
    id: "retail",
    title: "Retail Shop",
    description:
      "For supermarkets, provision stores, boutiques, pharmacies, and other product sellers.",
  },
  {
    id: "service",
    title: "Service Business",
    description:
      "For salons, barbers, tailors, mechanics, and similar service providers.",
  },
];

const BusinessSelectionScreen: React.FC = () => {
  const [selectedType, setSelectedType] = useState<string>("retail");
  const [loading, setLoading] = useState(false);

  const updateProfileMutation = useApiMutation("patch", AUTH_PROFILE, {
    onError: (error: any) => {
      console.error("API error updating profile:", error);
    },
  });

  const handleFinish = async () => {
    if (loading) return;
    setLoading(true);

    try {
      await Promise.all([
        AsyncStorage.setItem("businessType", selectedType),
        AsyncStorage.setItem("hasCompletedOnboarding", "true"),
        updateProfileMutation.mutateAsync({ business_type: selectedType }),
      ]);

      setTimeout(() => {
        router.replace("/(Main)/Home");
      }, 100);
    } catch (error) {
      console.error("Error saving business type:", error);
      Alert.alert(
        "Setup Complete",
        "Your business type was saved. Welcome to Inventra!",
        [
          {
            text: "Continue",
            onPress: () => {
              setTimeout(() => {
                router.replace("/(Main)/Home");
              }, 100);
            },
          },
        ],
      );
    } finally {
      setLoading(false);
    }
  };

  const handleGoBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/(Auth)/WelcomeScreen");
    }
  };

  const renderBusinessOption = (business: BusinessType) => {
    const isSelected = selectedType === business.id;
    const isRetail = business.id === "retail";

    return (
      <TouchableOpacity
        key={business.id}
        style={[
          styles.businessOption,
          isSelected && styles.selectedOption,
          loading && styles.disabled,
        ]}
        onPress={() => !loading && setSelectedType(business.id)}
        disabled={loading}
        activeOpacity={0.7}
      >
        <View style={styles.businessContent}>
          <View style={styles.businessInfo}>
            <Text style={styles.businessTitle}>{business.title}</Text>
            <Text style={styles.businessDescription}>
              {business.description}
            </Text>
          </View>
          <View style={styles.businessIcon}>
            <Text style={{ fontSize: 50 }}>{isRetail ? "🛒" : "👥"}</Text>
          </View>
        </View>
        {isSelected && <View style={styles.selectionIndicator} />}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1155CC" />

      <View style={styles.topSection} />

      <View style={styles.bottomSection}>
        <View style={styles.handleBar} />

        <ScrollView
          style={styles.scrollContainer}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          <View style={styles.formContainer}>
            <Text style={styles.successText}>You are in!</Text>
            <Text style={styles.title}>Choose One</Text>
            <Text style={styles.subtitle}>
              To maximize your experience of Inventra,{"\n"}tell us what you
              want to do!
            </Text>

            <Text style={styles.sectionTitle}>Choose your business type</Text>

            <View style={styles.optionsContainer}>
              {businessTypes.map(renderBusinessOption)}
            </View>
          </View>
        </ScrollView>

        <View style={styles.buttonContainer}>
          {/* <TouchableOpacity
            style={[styles.backButton, loading && styles.disabled]}
            onPress={handleGoBack}
            disabled={loading}
          >
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity> */}

          <TouchableOpacity
            style={[styles.finishButton, loading && styles.disabled]}
            onPress={handleFinish}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.finishButtonText}>Finish</Text>
            )}
          </TouchableOpacity>
        </View>

        {loading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#1155CC" />
            <Text style={styles.loadingText}>Setting up your account...</Text>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#1155CC" },
  topSection: { height: verticalScale(200) },
  bottomSection: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: moderateScale(24),
    borderTopRightRadius: moderateScale(24),
    paddingTop: verticalScale(8),
    flex: 1,
  },
  handleBar: {
    width: scale(80),
    height: verticalScale(4),
    backgroundColor: "#E5E7EB",
    borderRadius: moderateScale(2),
    alignSelf: "center",
    marginBottom: verticalScale(20),
  },
  scrollContainer: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingBottom: verticalScale(20) },
  formContainer: {
    paddingHorizontal: scale(24),
    minHeight: verticalScale(360),
  },
  successText: {
    fontSize: moderateScale(16),
    color: "#1155CC",
    textAlign: "center",
    marginBottom: verticalScale(8),
    fontFamily: "DMSans_400Regular",
  },
  title: {
    fontSize: moderateScale(24),
    fontFamily: "DMSans_700Bold",
    color: "#000000",
    textAlign: "center",
    marginBottom: verticalScale(8),
  },
  subtitle: {
    fontSize: moderateScale(16),
    color: "#BCBCBC",
    textAlign: "center",
    lineHeight: moderateScale(22),
    marginBottom: verticalScale(24),
    fontFamily: "DMSans_400Regular",
  },
  sectionTitle: {
    fontSize: moderateScale(16),
    fontFamily: "DMSans_400Regular",
    color: "#111827",
    marginBottom: verticalScale(14),
  },
  optionsContainer: { marginBottom: verticalScale(16) },
  businessOption: {
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    borderRadius: moderateScale(12),
    padding: moderateScale(14),
    backgroundColor: "#FFFFFF",
    position: "relative",
    minHeight: verticalScale(76),
    marginBottom: verticalScale(10),
  },
  selectedOption: {
    borderColor: "#1155CC",
    backgroundColor: "#F8FAFC",
  },
  businessContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    minHeight: verticalScale(46),
  },
  businessInfo: { flex: 1, paddingRight: scale(14) },
  businessTitle: {
    fontSize: moderateScale(16),
    fontFamily: "DMSans_400Regular",
    color: "#111827",
    marginBottom: verticalScale(4),
  },
  businessDescription: {
    fontSize: moderateScale(14),
    color: "#BCBCBC",
    lineHeight: moderateScale(18),
    fontFamily: "DMSans_400Regular",
  },
  businessIcon: {
    width: scale(62),
    height: scale(62),
    justifyContent: "center",
    alignItems: "center",
  },
  selectionIndicator: {
    position: "absolute",
    top: verticalScale(8),
    right: scale(8),
    width: scale(8),
    height: scale(8),
    backgroundColor: "#1155CC",
    borderRadius: moderateScale(4),
  },
  buttonContainer: {
    flexDirection: "row",
    gap: scale(12),
    paddingHorizontal: scale(24),
    paddingBottom:
      Platform.OS === "ios" ? verticalScale(30) : verticalScale(18),
    backgroundColor: "#FFFFFF",
  },
  backButton: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: "#1155CC",
    borderRadius: moderateScale(25),
    paddingVertical: verticalScale(14),
    alignItems: "center",
    minHeight: verticalScale(50),
  },
  backButtonText: {
    color: "#1155CC",
    fontSize: moderateScale(18),
    fontFamily: "DMSans_700Bold",
  },
  finishButton: {
    flex: 2,
    backgroundColor: "#1155CC",
    borderRadius: moderateScale(25),
    paddingVertical: verticalScale(14),
    alignItems: "center",
    minHeight: verticalScale(50),
  },
  finishButtonText: {
    color: "#FFFFFF",
    fontSize: moderateScale(14),
    fontFamily: "DMSans_500Medium",
  },
  disabled: { opacity: 0.6 },
  loadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  loadingText: {
    marginTop: verticalScale(10),
    fontSize: moderateScale(16),
    fontFamily: "DMSans_400Regular",
    color: "#1155CC",
  },
});

export default BusinessSelectionScreen;
