import { StyleSheet } from "react-native";
import {
  getFontSize,
  H_PAD,
  isSmallDevice,
  isTablet,
  moderateScale,
  scale,
  verticalScale,
} from "./scaling";

export const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#E7EEFA" },
  container: { flex: 1 },
  scrollView: { flex: 1 },

  loadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(231, 238, 250, 0.9)",
    // FIX: zIndex removed — rendered after ScrollView handles visual stacking.
    // Having zIndex here was creating a stacking context that trapped the
    // native date picker underneath it on Android.
  },
  loadingText: {
    marginTop: verticalScale(12),
    fontSize: getFontSize(moderateScale(14)),
    color: "#6B7280",
    fontFamily: "DMSans_400Regular",
  },

  header: {
    paddingHorizontal: H_PAD,
    paddingTop: verticalScale(isTablet ? 20 : 14),
    paddingBottom: verticalScale(12),
  },
  headerTitle: {
    fontSize: getFontSize(
      moderateScale(isSmallDevice ? 20 : isTablet ? 30 : 24),
    ),
    color: "#1F2937",
    marginBottom: verticalScale(4),
    fontFamily: "DMSans_700Bold",
  },
  headerSubtitle: {
    fontSize: getFontSize(moderateScale(isSmallDevice ? 12 : 14)),
    color: "#6B7280",
    fontFamily: "DMSans_400Regular",
  },

  periodSelector: {
    flexDirection: "row",
    paddingHorizontal: H_PAD,
    marginBottom: verticalScale(14),
    gap: scale(8),
  },
  periodButton: {
    paddingVertical: verticalScale(7),
    paddingHorizontal: scale(isSmallDevice ? 10 : 18),
    borderRadius: moderateScale(10),
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  periodButtonActive: { backgroundColor: "#1155CC", borderColor: "#1155CC" },
  periodText: {
    fontSize: getFontSize(moderateScale(isSmallDevice ? 12 : 14)),
    color: "#6B7280",
    fontFamily: "DMSans_600SemiBold",
  },
  periodTextActive: { color: "#FFFFFF", fontFamily: "DMSans_600SemiBold" },
});
