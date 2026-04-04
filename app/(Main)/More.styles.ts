import { Dimensions, StyleSheet } from "react-native";

const { width, height } = Dimensions.get("window");

// ─── Responsive helpers ───────────────────────────────────────────────────────

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

const scale = (size: number) =>
  clamp((width / 375) * size, size * 0.76, size * 1.3);

const verticalScale = (size: number) =>
  clamp((height / 812) * size, size * 0.62, size * 1.2);

const moderateScale = (size: number, factor = 0.5) =>
  size + (scale(size) - size) * factor;

// ─── Design tokens ────────────────────────────────────────────────────────────

const COLOR = {
  bg: "#E7EEFA",
  white: "#FFFFFF",
  blue: "#1155CC",
  textPrimary: "#1A1A1A",
  textMuted: "#8E8E93",
  border: "#F0F0F0",
  red: "#E74C3C",
} as const;

// ─── Styles ───────────────────────────────────────────────────────────────────

export const styles = StyleSheet.create({
  // ── Layout ────────────────────────────────────────────────────────────────

  safeArea: {
    flex: 1,
    backgroundColor: COLOR.bg,
  },
  centered: {
    justifyContent: "center",
    alignItems: "center",
  },
  container: {
    flex: 1,
    backgroundColor: COLOR.bg,
  },
  contentContainer: {
    flexGrow: 1,
    paddingBottom: verticalScale(20),
  },

  // ── Header ─────────────────────────────────────────────────────────────────

  header: {
    paddingHorizontal: scale(20),
    paddingTop: verticalScale(30),
    paddingBottom: verticalScale(20),
  },
  headerTitle: {
    fontSize: moderateScale(28),
    color: COLOR.textPrimary,
    marginBottom: verticalScale(4),
    fontFamily: "DMSans_700Bold",
  },
  headerSubtitle: {
    fontSize: moderateScale(15),
    color: COLOR.textMuted,
    fontFamily: "DMSans_400Regular",
  },

  // ── Profile card ───────────────────────────────────────────────────────────

  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLOR.blue,
    borderRadius: moderateScale(16),
    padding: scale(16),
    marginHorizontal: scale(20),
    marginBottom: verticalScale(24),
  },
  profileIcon: {
    width: scale(52),
    height: scale(52),
    borderRadius: moderateScale(26),
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  profileInfo: {
    marginLeft: scale(12),
    flex: 1,
  },
  profileName: {
    fontSize: moderateScale(17),
    color: COLOR.white,
    marginBottom: verticalScale(4),
    fontFamily: "DMSans_600SemiBold",
  },
  profilePhone: {
    fontSize: moderateScale(14),
    color: "rgba(255,255,255,0.8)",
    fontFamily: "DMSans_400Regular",
  },

  // ── Sections ───────────────────────────────────────────────────────────────

  section: {
    marginBottom: verticalScale(20),
  },
  sectionTitle: {
    fontSize: moderateScale(12),
    color: COLOR.textMuted,
    paddingHorizontal: scale(20),
    marginBottom: verticalScale(8),
    letterSpacing: 0.5,
    fontFamily: "DMSans_600SemiBold",
  },

  // All options in a section share one rounded white card
  sectionCard: {
    marginHorizontal: scale(20),
    backgroundColor: COLOR.white,
    borderRadius: moderateScale(14),
    overflow: "hidden",
  },

  // ── Option rows ────────────────────────────────────────────────────────────

  optionItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLOR.white,
    paddingVertical: verticalScale(16),
    paddingHorizontal: scale(16),
    borderBottomWidth: 1,
    borderBottomColor: COLOR.border,
  },
  // Remove top radius clipping artefact on first item
  optionItemFirst: {
    borderTopLeftRadius: moderateScale(14),
    borderTopRightRadius: moderateScale(14),
  },
  // Remove bottom divider and apply bottom radius on last item
  optionItemLast: {
    borderBottomWidth: 0,
    borderBottomLeftRadius: moderateScale(14),
    borderBottomRightRadius: moderateScale(14),
  },
  iconContainer: {
    width: scale(28),
    alignItems: "center",
  },
  optionText: {
    flex: 1,
    marginLeft: scale(12),
    fontSize: moderateScale(16),
    color: COLOR.textPrimary,
    fontFamily: "DMSans_400Regular",
  },

  // ── Notification badge ─────────────────────────────────────────────────────

  badge: {
    backgroundColor: COLOR.red,
    borderRadius: moderateScale(10),
    minWidth: scale(20),
    height: scale(20),
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: scale(5),
    marginRight: scale(8),
  },
  badgeText: {
    color: COLOR.white,
    fontSize: moderateScale(11),
    fontFamily: "DMSans_600SemiBold",
  },

  // ── Logout button ──────────────────────────────────────────────────────────

  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLOR.white,
    borderRadius: moderateScale(50),
    borderWidth: 1,
    borderColor: COLOR.red,
    paddingVertical: verticalScale(14),
    marginHorizontal: scale(20),
    marginBottom: verticalScale(16),
    gap: scale(8),
  },
  logoutText: {
    fontSize: moderateScale(16),
    color: COLOR.red,
    fontFamily: "DMSans_600SemiBold",
  },

  // ── Footer ─────────────────────────────────────────────────────────────────

  footer: {
    paddingHorizontal: scale(20),
    paddingBottom: verticalScale(20),
  },
  footerCard: {
    backgroundColor: COLOR.white,
    borderRadius: moderateScale(14),
    borderWidth: 1,
    borderColor: "#E5E7EB",
    paddingVertical: verticalScale(20),
    alignItems: "center",
  },
  footerBrand: {
    fontSize: moderateScale(18),
    color: COLOR.blue,
    marginBottom: verticalScale(4),
    fontFamily: "DMSans_700Bold",
  },
  footerTagline: {
    fontSize: moderateScale(13),
    color: COLOR.textMuted,
    marginBottom: verticalScale(4),
    fontFamily: "DMSans_400Regular",
  },
  footerCredit: {
    fontSize: moderateScale(13),
    color: COLOR.textMuted,
    fontFamily: "DMSans_400Regular",
  },

  // ── Modal styles (kept for backward-compat with ConfirmModal/SuccessModal) ─

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(13, 30, 66, 0.45)",
    justifyContent: "center",
    paddingHorizontal: scale(24),
  },
  modalCard: {
    backgroundColor: COLOR.white,
    borderRadius: moderateScale(18),
    paddingHorizontal: scale(20),
    paddingVertical: verticalScale(20),
    borderWidth: 1,
    borderColor: "#E4EAF7",
  },
  modalIconWrap: {
    width: scale(50),
    height: scale(50),
    borderRadius: moderateScale(25),
    backgroundColor: "#FDEBE9",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    marginBottom: verticalScale(12),
  },
  modalTitle: {
    fontSize: moderateScale(18),
    color: "#1A1A1A",
    fontFamily: "DMSans_700Bold",
    textAlign: "center",
    marginBottom: verticalScale(6),
  },
  modalSubtitle: {
    fontSize: moderateScale(14),
    color: "#5F6778",
    fontFamily: "DMSans_400Regular",
    textAlign: "center",
    lineHeight: moderateScale(22),
    marginBottom: verticalScale(16),
  },
  modalActions: {
    flexDirection: "row",
    gap: scale(10),
  },
  cancelAction: {
    flex: 1,
    borderRadius: moderateScale(12),
    paddingVertical: verticalScale(13),
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F1F4FB",
    borderWidth: 1,
    borderColor: "#D8E2F6",
  },
  cancelActionText: {
    color: COLOR.blue,
    fontSize: moderateScale(14),
    fontFamily: "DMSans_600SemiBold",
  },
  confirmAction: {
    flex: 1,
    borderRadius: moderateScale(12),
    paddingVertical: verticalScale(13),
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLOR.red,
  },
  confirmActionText: {
    color: COLOR.white,
    fontSize: moderateScale(14),
    fontFamily: "DMSans_600SemiBold",
  },
});
