// app/(routes)/WelcomeScreen.tsx
import { requestOtp } from "@/src/api";
import { useFonts } from "expo-font";
import { router } from "expo-router";
import React, { useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

const { width, height } = Dimensions.get("window");

// Clamped responsive sizing — safe on all screen sizes including tiny phones
const clamp = (val: number, min: number, max: number) =>
  Math.min(Math.max(val, min), max);
const scale = (size: number) =>
  clamp((width / 375) * size, size * 0.76, size * 1.3);
const verticalScale = (size: number) =>
  clamp((height / 812) * size, size * 0.62, size * 1.2);
const moderateScale = (size: number, factor = 0.5) =>
  size + (scale(size) - size) * factor;

interface WelcomeScreenProps {
  onNavigateToVerification?: (
    phoneNumber: string,
    verificationId: string,
    mockCode?: string,
  ) => void;
}

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({
  onNavigateToVerification,
}) => {
  const [fontsLoaded] = useFonts({
    "Poppins-Regular": require("../../assets/fonts/Poppins-Regular.ttf"),
    "Poppins-Bold": require("../../assets/fonts/Poppins-Bold.ttf"),
    "Poppins-Light": require("../../assets/fonts/Poppins-Light.ttf"),
  });
  const [phoneNumber, setPhoneNumber] = useState("");
  const [loading, setLoading] = useState(false);

  if (!fontsLoaded) return null;

  // --- Phone helpers ---
  const formatPhoneNumber = (phone: string): string => {
    let formatted = phone.trim().replace(/[\s\-\(\)]/g, "");
    if (!formatted.startsWith("+")) {
      formatted = formatted.replace(/^0/, "");
      formatted = "+234" + formatted; // Default to Nigeria
    }
    return formatted;
  };

  const validatePhoneNumber = (phone: string): boolean => {
    const phoneRegex = /^\+[1-9]\d{6,14}$/;
    return phoneRegex.test(phone);
  };

  // --- Handle OTP send ---
  const handleSendOTP = async () => {
    if (!phoneNumber.trim()) {
      Alert.alert("Error", "Please enter your phone number");
      return;
    }

    const formattedPhone = formatPhoneNumber(phoneNumber);

    if (!validatePhoneNumber(formattedPhone)) {
      Alert.alert(
        "Error",
        "Please enter a valid phone number with country code",
      );
      return;
    }

    try {
      setLoading(true);
      const resp = await requestOtp(formattedPhone);
      const verificationId = resp.verification_id;
      const returnedCode = resp.code;

      if (onNavigateToVerification) {
        onNavigateToVerification(formattedPhone, verificationId, returnedCode);
      } else {
        router.push({
          pathname: "./VerificationScreen",
          params: {
            phoneNumber: formattedPhone,
            verificationId: verificationId,
            mockCode: returnedCode,
          },
        });
      }
    } catch (error: any) {
      console.error("Error sending OTP:", error);
      const message =
        error?.response?.data?.error ||
        error?.response?.data?.detail ||
        "Failed to send verification code. Please try again.";
      Alert.alert("Error", message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={0}
    >
      <StatusBar barStyle="light-content" backgroundColor="#2046AE" />

      <View style={styles.topSection}>
        <Text style={styles.greeting}>Hello!</Text>
        <Text style={styles.subtitle}>Welcome to Inventra</Text>
        <Text style={styles.description}>
          No more paper book, your stock is safe here
        </Text>
      </View>

      <View style={styles.bottomSection}>
        <View style={styles.handleBar} />

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <TextInput
            style={[styles.input, loading && styles.inputDisabled]}
            placeholder="Phone number (e.g., +234XXXXXXXXX)"
            placeholderTextColor="#9CA3AF"
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            keyboardType="phone-pad"
            maxLength={17}
            autoComplete="tel"
            textContentType="telephoneNumber"
            editable={!loading}
            autoFocus
          />

          <Text style={styles.infoText}>
            We&apos;ll send you a one-time password (OTP) to verify your number.
          </Text>

          <TouchableOpacity
            style={[styles.continueButton, loading && styles.disabledButton]}
            onPress={handleSendOTP}
            disabled={loading || !phoneNumber.trim()}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.continueButtonText}>Send OTP</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#1155CC" },
  topSection: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: scale(32),
    paddingVertical: verticalScale(16),
  },
  greeting: {
    fontSize: moderateScale(52),
    fontFamily: "Poppins-Bold",
    color: "#FFFFFF",
    lineHeight: moderateScale(64),
  },
  subtitle: {
    fontSize: moderateScale(22),
    color: "#FFFFFF",
    fontFamily: "Poppins-Regular",
    lineHeight: moderateScale(32),
    textAlign: "center",
  },
  description: {
    fontSize: moderateScale(14),
    fontFamily: "Poppins-Regular",
    color: "#E3F2FD",
    textAlign: "center",
    lineHeight: moderateScale(22),
    opacity: 0.9,
    marginTop: verticalScale(4),
  },
  bottomSection: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: verticalScale(8),
  },
  handleBar: {
    width: scale(80),
    height: verticalScale(4),
    backgroundColor: "#E5E7EB",
    borderRadius: moderateScale(2),
    alignSelf: "center",
    marginBottom: verticalScale(24),
  },
  scrollContent: {
    paddingHorizontal: scale(24),
    paddingBottom: verticalScale(32),
    flexGrow: 1,
    justifyContent: "center",
  },
  input: {
    borderWidth: 1.5,
    borderColor: "#D1D5DB",
    borderRadius: moderateScale(12),
    paddingHorizontal: scale(16),
    paddingVertical: verticalScale(14),
    fontSize: moderateScale(16),
    fontFamily: "Poppins-Regular",
    color: "#111827",
    marginBottom: verticalScale(14),
    backgroundColor: "#FFFFFF",
  },
  inputDisabled: { opacity: 0.6 },
  infoText: {
    fontSize: moderateScale(13),
    fontFamily: "Poppins-Regular",
    color: "#6B7280",
    textAlign: "left",
    marginBottom: verticalScale(28),
    lineHeight: moderateScale(20),
  },
  continueButton: {
    backgroundColor: "#1155CC",
    borderRadius: moderateScale(25),
    paddingVertical: verticalScale(14),
    alignItems: "center",
    marginBottom: verticalScale(12),
  },
  disabledButton: { opacity: 0.6 },
  continueButtonText: {
    color: "#FFFFFF",
    fontSize: moderateScale(17),
    fontFamily: "Poppins-Bold",
    lineHeight: moderateScale(24),
  },
});

export default WelcomeScreen;
