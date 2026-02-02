// app/(routes)/WelcomeScreen.tsx
import { FirebaseRecaptchaVerifierModal } from "expo-firebase-recaptcha";
import { useFonts } from "expo-font";
import { router } from "expo-router";
import { ApplicationVerifier, PhoneAuthProvider } from "firebase/auth";
import React, { useRef, useState } from "react";
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

// ✅ Import both auth and config from firebaseConfig
import { auth, config } from "../config/firebaseConfig";

const { width, height } = Dimensions.get("window");

// Responsive sizing functions
const scale = (size: number) => (width / 375) * size;
const verticalScale = (size: number) => (height / 812) * size;
const moderateScale = (size: number, factor = 0.5) =>
  size + (scale(size) - size) * factor;

interface WelcomeScreenProps {
  onNavigateToVerification?: (
    phoneNumber: string,
    verificationId: string,
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
  const recaptchaVerifier = useRef<FirebaseRecaptchaVerifierModal>(null);

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

    if (!recaptchaVerifier.current) {
      Alert.alert("Error", "Verification system not ready. Please try again.");
      return;
    }

    try {
      setLoading(true);
      const phoneProvider = new PhoneAuthProvider(auth);

      const verificationId = await phoneProvider.verifyPhoneNumber(
        formattedPhone,
        recaptchaVerifier.current as ApplicationVerifier,
      );

      if (onNavigateToVerification) {
        onNavigateToVerification(formattedPhone, verificationId);
      } else {
        router.push({
          pathname: "./VerificationScreen",
          params: {
            phoneNumber: formattedPhone,
            verificationId: verificationId,
          },
        });
      }
    } catch (error: any) {
      console.error("Error sending OTP:", error);
      let errorMessage = "Failed to send verification code.";

      if (error.code === "auth/too-many-requests") {
        errorMessage = "Too many attempts. Please try again later.";
      } else if (error.code === "auth/invalid-phone-number") {
        errorMessage = "Invalid phone number. Please check and try again.";
      } else if (error.code === "auth/quota-exceeded") {
        errorMessage = "SMS quota exceeded. Please try again later.";
      } else if (error.code === "auth/app-not-authorized") {
        errorMessage =
          "App not authorized to use Firebase Authentication with this API key.";
      } else if (error.code === "auth/web-storage-unsupported") {
        errorMessage = "Web storage is not supported or disabled.";
      }

      Alert.alert("Error", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#2046AE" />

      {/* ✅ FIX: Added firebaseConfig={config} */}
      <FirebaseRecaptchaVerifierModal
        ref={recaptchaVerifier}
        firebaseConfig={config}
        attemptInvisibleVerification={true}
        appVerificationDisabledForTesting={false}
      />

      <View style={styles.topSection}>
        <Text style={styles.greeting}>Hello!</Text>
        <Text style={styles.subtitle}>Welcome to Inventra</Text>
        <Text style={styles.description}>
          No more paper book, your stock is safe here
        </Text>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 100 : 0}
      >
        <View style={styles.bottomSection}>
          <View style={styles.handleBar} />

          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
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
              We&apos;ll send you a one-time password (OTP) to verify your
              number.
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#1155CC" },
  topSection: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: scale(40),
  },
  greeting: {
    fontSize: moderateScale(68),
    fontFamily: "Poppins-Bold",
    color: "#FFFFFF",
    marginBottom: verticalScale(0),
  },
  subtitle: {
    fontSize: moderateScale(30),
    color: "#FFFFFF",
    marginBottom: verticalScale(0),
    fontFamily: "Poppins-Regular",
  },
  description: {
    fontSize: moderateScale(20),
    fontFamily: "Poppins-Regular",
    color: "#E3F2FD",
    textAlign: "center",
    lineHeight: 22,
    opacity: 0.9,
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
    marginBottom: verticalScale(32),
  },
  scrollContent: {
    paddingHorizontal: scale(24),
    paddingBottom: verticalScale(40),
    flexGrow: 1,
    justifyContent: "center",
  },
  input: {
    borderWidth: 1.5,
    borderColor: "#D1D5DB",
    borderRadius: moderateScale(12),
    paddingHorizontal: scale(16),
    paddingVertical: verticalScale(16),
    fontSize: moderateScale(18),
    fontFamily: "Poppins-Regular",
    color: "#111827",
    marginBottom: verticalScale(16),
    backgroundColor: "#FFFFFF",
  },
  inputDisabled: { opacity: 0.6 },
  infoText: {
    fontSize: moderateScale(16),
    fontFamily: "Poppins-Regular",
    color: "#6B7280",
    textAlign: "left",
    marginBottom: verticalScale(32),
    lineHeight: 20,
  },
  continueButton: {
    backgroundColor: "#1155CC",
    borderRadius: moderateScale(25),
    paddingVertical: verticalScale(16),
    alignItems: "center",
    marginBottom: verticalScale(16),
  },
  disabledButton: { opacity: 0.6 },
  continueButtonText: {
    color: "#FFFFFF",
    fontSize: moderateScale(20),
    fontFamily: "Poppins-Bold",
  },
});

export default WelcomeScreen;
