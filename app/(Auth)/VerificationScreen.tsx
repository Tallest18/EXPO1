// app/(Auth)/VerificationScreen.tsx
import { resendOtp, saveAuthTokens, verifyOtp } from "@/src/api";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { styles } from "./VerificationScreen.style";

const VerificationScreen: React.FC = () => {
  const params = useLocalSearchParams<{
    phoneNumber: string;
    verificationId: string;
    mockCode?: string;
  }>();

  const phoneNumber = params.phoneNumber ?? "";
  const [verificationId, setVerificationId] = useState(
    params.verificationId ?? "",
  );
  const [mockCode, setMockCode] = useState<string | null>(
    params.mockCode || null,
  );

  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(45);
  const [resendLoading, setResendLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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

    // Clear error when typing again
    if (errorMessage) setErrorMessage(null);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto verify when all digits are filled
    if (newCode.every((d) => d !== "")) {
      verifyCode(newCode.join(""));
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

      setTimeout(() => {
        if (result.is_new_user) {
          router.replace("/(Auth)/BusinessSelectionScreen");
        } else {
          router.replace("/(Main)/Home");
        }
      }, 100);
    } catch (error: any) {
      console.error("Verification failed:", error);
      const message =
        error?.response?.data?.error ||
        error?.response?.data?.detail ||
        "Invalid verification code. Please try again.";
      setErrorMessage(message); // show inline error
      setCode(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
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
      setErrorMessage(null);
    } catch (error: any) {
      console.error("Error resending code:", error);
      const message =
        error?.response?.data?.error ||
        error?.response?.data?.detail ||
        "Failed to resend verification code.";
      setErrorMessage(message);
    } finally {
      setResendLoading(false);
    }
  };

  const clearAllInputs = () => {
    setCode(["", "", "", "", "", ""]);
    setErrorMessage(null);
    inputRefs.current[0]?.focus();
  };

  const handleGoBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/(Auth)/WelcomeScreen");
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

            {/* Inline error message */}
            {errorMessage && (
              <Text style={{ color: "red", marginTop: 8, textAlign: "center" }}>
                {errorMessage}
              </Text>
            )}

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

            <View style={styles.actionsContainer}>
              {mockCode ? (
                <Text style={styles.mockCodeText}>
                  Test code (mock mode):{" "}
                  <Text style={styles.mockCodeValue}>{mockCode}</Text>
                </Text>
              ) : null}
              <View
                style={{
                  flexDirection: "row",
                  marginTop: 10,
                  justifyContent: "space-between",
                }}
              >
                <TouchableOpacity
                  style={[styles.backButton, loading && styles.disabled]}
                  onPress={handleGoBack}
                  disabled={loading}
                >
                  <Ionicons name="arrow-back" size={20} color="#1155CC" />
                  <Text style={styles.backText}>Back</Text>
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
            </View>
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

export default VerificationScreen;
