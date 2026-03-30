// app/(routes)/BusinessSelectionScreen.tsx
import { updateProfile } from "@/src/api";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
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

export interface BusinessSelectionExtraProps {
  onFinish?: (businessType: string) => void;
  onGoBack?: () => void;
}

const CartIcon: React.FC<{ size?: number }> = ({ size = 60 }) => (
  <Text style={{ fontSize: size }}>x:</Text>
);

const PeopleIcon: React.FC<{ size?: number }> = ({ size = 60 }) => (
  <Text style={{ fontSize: size }}>x⬍"️</Text>
);

const BusinessSelectionScreen: React.FC<BusinessSelectionExtraProps> = ({
  onFinish,
  onGoBack,
}) => {
  const navigation = useNavigation<any>();
  const [selectedType, setSelectedType] = useState<string>("retail");
  const [loading, setLoading] = useState(false);

  const handleFinish = async () => {
    if (loading) return;
    setLoading(true);

    try {
      if (onFinish) {
        onFinish(selectedType);
        setLoading(false);
        return;
      }

      await Promise.all([
        AsyncStorage.setItem("businessType", selectedType),
        AsyncStorage.setItem("hasCompletedOnboarding", "true"),
        updateProfile({ business_type: selectedType }),
      ]);

      try {
        router.replace("/(Main)/Home");
      } catch {
        try {
          router.push("/(Main)/Home");
        } catch {
          if (navigation) {
            navigation.reset({
              index: 0,
              routes: [{ name: "Main" }],
            });
          }
        }
      }
    } catch (error) {
      console.error("Error saving business type:", error);
      Alert.alert("Setup Complete", "Welcome to Inventra!", [
        {
          text: "Continue",
          onPress: () => {
            try {
              router.replace("/(Main)/Home");
            } catch {
              if (navigation) {
                navigation.reset({
                  index: 0,
                  routes: [{ name: "Main" }],
                });
              }
            }
          },
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleGoBack = () => {
    if (onGoBack) {
      onGoBack();
    } else if (navigation.canGoBack()) {
      navigation.goBack();
    } else if (router.canGoBack()) {
      router.back();
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
            {isRetail ? <CartIcon size={50} /> : <PeopleIcon size={50} />}
          </View>
        </View>
        {isSelected && <View style={styles.selectionIndicator} />}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#2046AE" />

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
            <ActivityIndicator size="large" color="#2046AE" />
            <Text style={styles.loadingText}>Setting up your account...</Text>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#2046AE" },
  topSection: { height: verticalScale(320) },
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
    backgroundColor: "black",
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
    fontSize: moderateScale(15),
    color: "#2046AE",
    textAlign: "center",
    marginBottom: verticalScale(8),
    fontFamily: "DMSans_700Bold",
  },
  title: {
    fontSize: moderateScale(26),
    fontFamily: "DMSans_700Bold",
    color: "#111827",
    textAlign: "center",
    marginBottom: verticalScale(8),
  },
  subtitle: {
    fontSize: moderateScale(16),
    color: "#6B7280",
    textAlign: "center",
    lineHeight: moderateScale(22),
    marginBottom: verticalScale(24),
    fontFamily: "DMSans_400Regular",
  },
  sectionTitle: {
    fontSize: moderateScale(19),
    fontFamily: "DMSans_700Bold",
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
    borderColor: "#2046AE",
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
    fontFamily: "DMSans_700Bold",
    color: "#111827",
    marginBottom: verticalScale(4),
  },
  businessDescription: {
    fontSize: moderateScale(13),
    color: "#6B7280",
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
    backgroundColor: "#2046AE",
    borderRadius: moderateScale(4),
  },
  buttonContainer: {
    paddingHorizontal: scale(24),
    paddingBottom:
      Platform.OS === "ios" ? verticalScale(30) : verticalScale(18),
    backgroundColor: "#FFFFFF",
  },
  finishButton: {
    backgroundColor: "#2046AE",
    borderRadius: moderateScale(25),
    paddingVertical: verticalScale(14),
    alignItems: "center",
    minHeight: verticalScale(50),
  },
  finishButtonText: {
    color: "#FFFFFF",
    fontSize: moderateScale(18),
    fontFamily: "DMSans_700Bold",
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
    color: "#2046AE",
  },
  emoji: {
    fontSize: moderateScale(42),
  },
});

export default BusinessSelectionScreen;
