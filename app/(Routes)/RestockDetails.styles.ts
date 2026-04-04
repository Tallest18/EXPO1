import { Dimensions, StyleSheet } from "react-native";
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

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#E7EEFA",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: scale(20),
    paddingVertical: verticalScale(16),
    backgroundColor: "#E7EEFA",
  },
  headerTitle: {
    fontSize: moderateScale(24),
    color: "#111827",
    fontFamily: "DMSans_700Bold",
  },
  backButton: {
    backgroundColor: "#fff",
    padding: scale(12),
    borderRadius: moderateScale(12),
  },
  content: {
    flex: 1,
    paddingHorizontal: scale(20),
  },
  mainCard: {
    backgroundColor: "#1155CC",
    borderRadius: moderateScale(16),
    padding: scale(20),
    marginTop: verticalScale(20),
  },
  productHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(16),
  },
  productImage: {
    width: scale(60),
    height: verticalScale(60),
    borderRadius: moderateScale(12),
    backgroundColor: "#fff",
  },
  placeholderImage: {
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.3)",
  },
  productInfo: {
    flex: 1,
  },
  notificationType: {
    fontSize: moderateScale(14),
    color: "rgba(255,255,255,0.8)",
    marginBottom: verticalScale(4),
    fontFamily: "DMSans_400Regular",
  },
  productName: {
    fontSize: 20,
    color: "#FFFFFF",
    fontFamily: "DMSans_700Bold",
    lineHeight: 20,
    letterSpacing: 0,
  },
  actionButtons: {
    flexDirection: "row",
    gap: scale(12),
    marginTop: verticalScale(20),
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: verticalScale(18),
    borderRadius: moderateScale(12),
    gap: scale(8),
  },
  restockButton: {
    backgroundColor: "#001F54",
  },
  viewProductButton: {
    backgroundColor: "#1155CC",
  },
  actionButtonText: {
    color: "#fff",
    fontSize: moderateScale(12),
    fontFamily: "DMSans_400Regular",
  },
  detailsSection: {
    marginTop: verticalScale(20),
  },
  detailsTitle: {
    fontSize: moderateScale(16),
    color: "#111827",
    marginBottom: verticalScale(12),
    fontFamily: "DMSans_700Bold",
  },
  detailsCard: {
    backgroundColor: "#fff",
    borderRadius: moderateScale(12),
    padding: scale(20),
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: verticalScale(14),
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  detailLabel: {
    fontSize: moderateScale(15),
    color: "#9CA3AF",
    fontFamily: "DMSans_400Regular",
  },
  detailValue: {
    fontSize: moderateScale(15),
    color: "#111827",
    fontFamily: "DMSans_400Regular",
    textAlign: "right",
    maxWidth: "60%",
  },
  stockValue: {
    color: "#F59E0B",
  },
  tipCard: {
    backgroundColor: "#fff",
    borderRadius: moderateScale(12),
    padding: scale(20),
    marginTop: verticalScale(20),
    marginBottom: verticalScale(40),
    borderLeftWidth: 5,
    borderLeftColor: "#FACC15",
  },
  tipTitle: {
    fontSize: moderateScale(18),
    color: "#111827",
    marginBottom: verticalScale(8),
    fontFamily: "DMSans_700Bold",
  },
  tipMessage: {
    fontSize: moderateScale(15),
    color: "#6B7280",
    lineHeight: 22,
    fontFamily: "DMSans_400Regular",
  },
  loadingOverlay: {
    position: "absolute",
    top: verticalScale(0),
    left: scale(0),
    right: scale(0),
    bottom: verticalScale(0),
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
});
