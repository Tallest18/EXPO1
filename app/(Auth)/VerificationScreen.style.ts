import { Dimensions, StyleSheet } from "react-native";

const { width, height } = Dimensions.get("window");

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);
const scale = (size: number) =>
  clamp((width / 375) * size, size * 0.76, size * 1.3);
const verticalScale = (size: number) =>
  clamp((height / 812) * size, size * 0.62, size * 1.2);
const moderateScale = (size: number, factor = 0.5) =>
  size + (scale(size) - size) * factor;

export const styles = StyleSheet.create({
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
  scrollContent: { flexGrow: 1 },
  formContainer: {
    paddingHorizontal: scale(24),
    paddingBottom: verticalScale(12),
  },
  title: {
    fontSize: moderateScale(16),
    color: "#4F4F4F",
    marginBottom: verticalScale(8),
    fontFamily: "DMSans_400Regular",
  },
  subtitle: {
    fontSize: moderateScale(14),
    color: "#6B7280",
    marginBottom: verticalScale(12),
    lineHeight: moderateScale(20),
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
    height: scale(50),
    width: scale(50),
    borderWidth: 1,
    borderColor: "#34C759",
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
    color: "#4F4F4F",
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
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
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
