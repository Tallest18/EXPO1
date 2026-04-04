// app/(routes)/VerificationScreen.tsx
import { resendOtp, saveAuthTokens, verifyOtp } from "@/src/api";
import { Ionicons } from "@expo/vector-icons";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import { router } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
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
import type { AppStackParamList } from "../../src/navigation/types";

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

export interface VerificationExtraProps {
  onSuccess?: () => void;
  onGoBack?: () => void;
  phoneNumber?: string;
  verificationId?: string;
  mockCode?: string;
}

const VerificationScreen: React.FC<VerificationExtraProps> = ({
  onSuccess,
  onGoBack,
  phoneNumber: propPhoneNumber,
  verificationId: propVerificationId,
  mockCode: propMockCode,
}) => {
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<AppStackParamList, "VerificationScreen">>();
  const params = route?.params;

  // Use props first, then route params, then defaults
  const phoneNumber = propPhoneNumber || params?.phoneNumber || "";
  const [verificationId, setVerificationId] = useState(
    propVerificationId || params?.verificationId || "",
  );
  const [mockCode, setMockCode] = useState<string | null>(
    propMockCode || params?.mockCode || null,
  );

  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(45);
  const [resendLoading, setResendLoading] = useState(false);
  const inputRefs = useRef<TextInput[]>([]);

  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer((p) => p - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  const handleCodeChange = (value: string, index: number) => {
    if (value && !/^\d$/.test(value)) return;

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (key: string, index: number) => {
    if (key === "Backspace" || key === "Delete") {
      if (!code[index] && index > 0) {
        inputRefs.current[index - 1]?.focus();
      } else {
        const newCode = [...code];
        newCode[index] = "";
        setCode(newCode);
      }
    }
  };

  const verifyCode = async (verificationCode: string) => {
    if (loading || !verificationId) return;

    setLoading(true);

    try {
      const result = await verifyOtp(verificationId, verificationCode);
      await saveAuthTokens(result.tokens);

      setLoading(false);
      if (onSuccess) {
        onSuccess();
      } else if (result.is_new_user) {
        router.replace("/(Auth)/BusinessSelectionScreen");
      } else {
        router.replace("/(Main)/Home");
      }
    } catch (error: any) {
      setLoading(false);
      console.error("Verification failed:", error);

      const message =
        error?.response?.data?.error ||
        error?.response?.data?.detail ||
        "Invalid verification code. Please try again.";
      Alert.alert("Verification Failed", message);
      setCode(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    }
  };

  const resendCode = async () => {
    if (resendTimer > 0 || resendLoading || !phoneNumber) return;

    setResendLoading(true);

    try {
      const resp = await resendOtp(verificationId);
      setVerificationId(resp.verification_id);
      setMockCode(resp.code || null);
      setResendTimer(45);
      setResendLoading(false);
      Alert.alert("Success", "Verification code resent successfully!");
    } catch (error: any) {
      setResendLoading(false);
      console.error("Error resending code:", error);

      const message =
        error?.response?.data?.error ||
        error?.response?.data?.detail ||
        "Failed to resend verification code.";
      Alert.alert("Error", message);
    }
  };

  const clearAllInputs = () => {
    setCode(["", "", "", "", "", ""]);
    inputRefs.current[0]?.focus();
  };

  const handleGoBack = () => {
    if (onGoBack) {
      onGoBack();
    } else if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      router.back();
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={0}
    >
      <StatusBar barStyle="light-content" backgroundColor="#1155CC" />

      <View style={styles.topSection} />

      <View style={styles.bottomSection}>
        <View style={styles.handleBar} />

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.formContainer}>
            <Text style={styles.title}>Confirmation Code</Text>
            <Text style={styles.subtitle}>
              Enter the 6-digit code we sent to {phoneNumber}
            </Text>

            <View style={styles.codeContainer}>
              {code.map((digit, index) => (
                <TextInput
                  key={index}
                  ref={(ref) => {
                    if (ref) inputRefs.current[index] = ref;
                  }}
                  style={[
                    styles.codeInput,
                    digit ? styles.codeInputFilled : null,
                    loading && styles.codeInputDisabled,
                  ]}
                  value={digit}
                  onChangeText={(value) => handleCodeChange(value, index)}
                  onKeyPress={({ nativeEvent: { key } }) =>
                    handleKeyPress(key, index)
                  }
                  keyboardType="numeric"
                  maxLength={1}
                  selectTextOnFocus
                  autoFocus={index === 0}
                  editable={!loading}
                  returnKeyType="next"
                />
              ))}
            </View>

            {mockCode ? (
              <Text style={styles.mockCodeText}>
                Test code (mock mode):{" "}
                <Text style={styles.mockCodeValue}>{mockCode}</Text>
              </Text>
            ) : null}

            <TouchableOpacity
              style={[
                styles.verifyButton,
                (code.some((d) => d === "") || loading) && styles.disabled,
              ]}
              onPress={() => verifyCode(code.join(""))}
              disabled={code.some((d) => d === "") || loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.verifyText}>Verify</Text>
              )}
            </TouchableOpacity>

            <View style={styles.actionsContainer}>
              <TouchableOpacity
                style={[
                  styles.resendContainer,
                  (resendTimer > 0 || resendLoading) && styles.disabled,
                ]}
                onPress={resendCode}
                disabled={resendTimer > 0 || resendLoading}
              >
                <Text
                  style={[
                    styles.resendText,
                    (resendTimer > 0 || resendLoading) && styles.disabledText,
                  ]}
                >
                  {resendLoading
                    ? "Sending..."
                    : resendTimer > 0
                      ? `Didn't get the code? Resend in ${resendTimer}s`
                      : "Didn't get the code? Resend now"}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.clearButton}
                onPress={clearAllInputs}
                disabled={loading}
              >
                <Text
                  style={[styles.clearText, loading && styles.disabledText]}
                >
                  Clear all
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.backButton, loading && styles.disabled]}
              onPress={handleGoBack}
              disabled={loading}
            >
              <Ionicons name="arrow-back" size={20} color="#1155CC" />
              <Text style={styles.backText}>Back</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        {loading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#1155CC" />
            <Text style={styles.loadingText}>Verifying...</Text>
          </View>
        )}
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#1155CC" },
  topSection: { flex: 1 },
  bottomSection: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: verticalScale(8),
    minHeight: "60%",
    flex: 1,
  },
  handleBar: {
    width: scale(40),
    height: verticalScale(4),
    backgroundColor: "#E5E7EB",
    borderRadius: moderateScale(2),
    alignSelf: "center",
    marginBottom: verticalScale(32),
  },
  scrollContent: {
    flexGrow: 1,
  },
  formContainer: {
    paddingHorizontal: scale(24),
    paddingBottom: verticalScale(40),
  },
  title: {
    fontSize: moderateScale(22),
    color: "#111827",
    marginBottom: verticalScale(8),
    fontFamily: "DMSans_400Regular",
  },
  subtitle: {
    fontSize: moderateScale(18),
    color: "#6B7280",
    marginBottom: verticalScale(32),
    lineHeight: 24,
    fontFamily: "DMSans_400Regular",
  },
  codeContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: verticalScale(10),
    gap: scale(3),
  },
  mockCodeText: {
    marginBottom: verticalScale(14),
    fontSize: moderateScale(11),
    fontFamily: "DMSans_400Regular",
    color: "#6B7280",
    textAlign: "left",
  },
  mockCodeValue: {
    fontFamily: "DMSans_700Bold",
    color: "#1155CC",
    letterSpacing: 2,
  },
  codeInput: {
    width: scale(50),
    borderWidth: 2,
    borderColor: "#D1D5DB",
    borderRadius: moderateScale(8),
    textAlign: "center",
    fontSize: moderateScale(16),
    color: "#111827",
    backgroundColor: "#FFFFFF",
    fontFamily: "DMSans_400Regular",
  },
  codeInputFilled: { borderColor: "#10B981", backgroundColor: "#F0FDF4" },
  codeInputDisabled: { opacity: 0.6 },
  verifyButton: {
    backgroundColor: "#1155CC",
    paddingVertical: verticalScale(12),
    borderRadius: moderateScale(8),
    marginBottom: verticalScale(24),
    alignItems: "center",
  },
  verifyText: {
    fontSize: moderateScale(16),
    color: "#FFFFFF",
    fontFamily: "DMSans_400Regular",
  },
  actionsContainer: { marginBottom: verticalScale(32) },
  resendContainer: {
    paddingVertical: verticalScale(8),
    marginBottom: verticalScale(8),
  },
  resendText: {
    fontSize: moderateScale(14),
    color: "#6B7280",
    textAlign: "left",
    fontFamily: "DMSans_400Regular",
  },
  clearButton: { paddingVertical: verticalScale(4) },
  clearText: {
    fontSize: moderateScale(14),
    color: "#EF4444",
    textAlign: "left",
    fontFamily: "DMSans_400Regular",
  },
  disabled: { opacity: 0.6 },
  disabledText: { color: "#9CA3AF" },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: verticalScale(8),
  },
  backText: {
    fontSize: moderateScale(16),
    fontFamily: "DMSans_400Regular",
    color: "#1155CC",
    marginLeft: 8,
  },
  loadingOverlay: {
    position: "absolute",
    top: verticalScale(0),
    left: scale(0),
    right: scale(0),
    bottom: verticalScale(0),
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: verticalScale(12),
    fontSize: moderateScale(18),
    color: "#1155CC",
    fontFamily: "DMSans_400Regular",
  },
});

export default VerificationScreen;
