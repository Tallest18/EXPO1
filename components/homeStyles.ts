import React from "react";
import { Dimensions, StyleSheet, Text } from "react-native";

export const { width, height } = Dimensions.get("window");

export const isSmallDevice = width < 375;
export const isMediumDevice = width >= 375 && width < 414;
export const isTablet = width >= 768;

export const scale = (size: number) => {
  const baseWidth = 375;
  const ratio = width / baseWidth;
  if (isTablet) return size * Math.min(ratio, 1.5);
  return size * ratio;
};

export const verticalScale = (size: number) => {
  const baseHeight = 812;
  const ratio = height / baseHeight;
  if (isTablet) return size * Math.min(ratio, 1.5);
  return size * ratio;
};

export const moderateScale = (size: number, factor = 0.5) =>
  size + (scale(size) - size) * factor;

export const getFontSize = (base: number) => {
  if (isSmallDevice) return base * 0.9;
  if (isTablet) return base * 1.2;
  return base;
};

export const formatCurrency = (value: number | undefined) =>
  React.createElement(
    Text,
    { style: { fontFamily: "DMSans_700Bold" } },
    "₦",
    React.createElement(
      Text,
      { style: { fontFamily: "DMSans_400Regular" } },
      (value || 0).toFixed(2),
    ),
  );

export const homeStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#E7EEFA",
  },
  header: {
    flexDirection: "column",
    justifyContent: "flex-start",
    alignItems: "flex-start",
    width: "100%",
    paddingHorizontal: scale(20),
    marginTop: verticalScale(20),
  },
  hello: {
    fontSize: getFontSize(moderateScale(20)),
    color: "#1C1C1C",
    fontFamily: "DMSans_400Regular",
    paddingBottom: verticalScale(2),
  },
  username: {
    fontSize: 16,
    fontFamily: "DMSans_700Bold", // use the bold font
    color: "#1C1C1C",
    lineHeight: 16, // 100% of 16px
    letterSpacing: 0,
    maxWidth: scale(isTablet ? 300 : 200),
  },
  headerIcons: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(12),
    backgroundColor: "white",
    padding: scale(8),
    borderRadius: moderateScale(50),
  },
  avatar: {
    width: scale(32),
    height: scale(32),
    borderRadius: moderateScale(100),
    backgroundColor: "#eee",
  },
  salesBox: {
    // backgroundColor: "#1155CC", // REMOVE this line for gradient
    borderRadius: moderateScale(12),
    padding: scale(16),
    margin: scale(20),
  },
  salesTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  salesLabel: {
    color: "#B3CCF7",
    fontSize: 12,
    lineHeight: 12,
    letterSpacing: 0,
    fontFamily: "DMSans_700Bold",
  },
  salesRate: {
    backgroundColor: "#E6F9EF",
    color: "#22C55E",
    paddingHorizontal: scale(8),
    paddingVertical: verticalScale(2),
    borderRadius: moderateScale(12),
    fontSize: getFontSize(moderateScale(12)),
    fontFamily: "DMSans_400Regular",
  },
  salesAmount: {
    color: "#FFFFFF",
    fontSize: 32,
    lineHeight: 32,
    letterSpacing: 0,
    fontFamily: "DMSans_700Bold",
  },
  profitRow: {
    marginTop: verticalScale(12),
    backgroundColor: "#fff",
    padding: scale(12),
    borderRadius: moderateScale(8),
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  profitLabel: {
    color: "#6E6E6E",
    fontFamily: "DMSans_700Bold",
    fontSize: 12,
    lineHeight: 12,
    letterSpacing: 0,
  },
  profitAmount: {
    color: "#1C1C1C",
    fontSize: 20,
    lineHeight: 20,
    letterSpacing: 0,
    fontFamily: "DMSans_700Bold",
    flex: 1,
    textAlign: "right",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginHorizontal: scale(20),
    marginBottom: verticalScale(12),
    gap: scale(8),
  },
  infoBox: {
    flex: 1,
    backgroundColor: "white",
    justifyContent: "space-between",
    borderRadius: moderateScale(12),
    padding: scale(10),
  },
  infoLabel: {
    color: "#6E6E6E",
    fontFamily: "DMSans_700Bold",
    fontSize: 12,
    lineHeight: 12,
    letterSpacing: 0,
  },
  infoValue: {
    fontSize: getFontSize(moderateScale(20)),
    fontFamily: "DMSans_700Bold",
    marginTop: verticalScale(8),
  },
  transactionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: verticalScale(8),
  },
  actionBox: {
    display: "flex",
    color: "white",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: scale(8),
    flex: 1,
    borderRadius: moderateScale(12),
    padding: scale(20),
    minHeight: verticalScale(60),
  },
  salesSummarySection: {
    marginTop: verticalScale(20),
    marginHorizontal: scale(20),
    backgroundColor: "white",
    borderRadius: moderateScale(12),
    padding: scale(16),
  },
  salesSummaryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: verticalScale(16),
  },
  salesSummaryHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(12),
    flex: 1,
  },
  salesSummaryHeaderTextContainer: {
    flex: 1,
  },
  dollarIconCircle: {
    padding: scale(2),
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "#1155CC",
    justifyContent: "center",
    alignItems: "center",
  },
  salesSummaryHeaderTitle: {
    fontSize: getFontSize(moderateScale(16)),
    fontFamily: "DMSans_700Bold",
    color: "#000",
  },
  salesSummaryHeaderSubtitle: {
    fontSize: getFontSize(moderateScale(11)),
    fontFamily: "DMSans_400Regular",
    color: "#999",
    marginTop: verticalScale(2),
  },
  arrowIconCircle: {
    padding: scale(8),
    borderRadius: moderateScale(20),
    backgroundColor: "#1C1C1C",
    justifyContent: "center",
    alignItems: "center",
  },
  salesSummaryCard: {
    flexDirection: "row",
    borderRadius: moderateScale(8),
    alignItems: "center",
    backgroundColor: "#FBFBFB",
    padding: scale(12),
    marginBottom: verticalScale(12),
    gap: scale(12),
  },
  productImageContainer: {
    width: scale(48),
    height: scale(48),
  },
  productThumbnail: {
    width: scale(48),
    height: scale(48),
    borderRadius: moderateScale(8),
    backgroundColor: "#F3F4F6",
  },
  productPlaceholder: {
    width: scale(48),
    height: scale(48),
    borderRadius: moderateScale(8),
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
  },
  salesSummaryContent: {
    flex: 1,
  },
  salesSummaryProductName: {
    fontSize: getFontSize(moderateScale(14)),
    textTransform: "capitalize",
    fontFamily: "DMSans_400Regular",
    color: "#000",
    marginBottom: verticalScale(4),
    display: "flex",
    alignItems: "center",
  },
  salesSummaryDate: {
    fontSize: getFontSize(moderateScale(11)),
    color: "#999",
    fontFamily: "DMSans_400Regular",
  },
  salesSummaryRight: {
    alignItems: "flex-end",
    minWidth: scale(80),
  },
  salesSummaryAmount: {
    fontSize: getFontSize(moderateScale(16)),
    fontFamily: "DMSans_700Bold",
    color: "#000",
    marginBottom: verticalScale(2),
  },
  salesSummaryLabel: {
    fontSize: getFontSize(moderateScale(11)),
    color: "#999",
    fontFamily: "DMSans_400Regular",
  },
  viewAllLink: {
    color: "#1155CC",
    fontSize: getFontSize(moderateScale(14)),
    fontFamily: "DMSans_400Regular",
  },
  notificationSection: {
    marginTop: verticalScale(20),
    marginHorizontal: scale(20),
    backgroundColor: "white",
    borderRadius: moderateScale(12),
    padding: scale(16),
    marginBottom: verticalScale(40),
  },
  notificationHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: verticalScale(16),
  },
  notificationHeaderTitle: {
    fontSize: getFontSize(moderateScale(18)),
    fontFamily: "DMSans_700Bold",
  },
  notificationCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    backgroundColor: "#FBFBFB",
    padding: scale(12),
    borderRadius: moderateScale(8),
    marginBottom: verticalScale(12),
  },
  notifLeftSection: {
    flexDirection: "row",
    flex: 1,
    gap: scale(12),
  },
  notifIconBox: {
    justifyContent: "center",
    backgroundColor: "#FBFBFB",
    alignItems: "center",
  },
  notifContent: {
    flex: 1,
  },
  notifTitleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: verticalScale(4),
  },
  notifTitle: {
    fontSize: 10,
    fontFamily: "DMSans_400Regular",
    color: "#6E6E6E",
    flex: 1,
  },
  notifTime: {
    fontSize: getFontSize(moderateScale(8)),
    color: "#6E6E6E",
    fontFamily: "DMSans_400Regular",
    marginLeft: scale(8),
  },
  notifMessage: {
    fontSize: 14,
    color: "#1C1C1C",
    fontFamily: "DMSans_400Regular",
    marginBottom: verticalScale(4),
  },
  notifActions: {
    fontSize: getFontSize(moderateScale(12)),
    color: "#1155CC",
    fontFamily: "DMSans_400Regular",
    marginTop: verticalScale(4),
  },
  unreadDot: {
    width: scale(8),
    height: scale(8),
    borderRadius: moderateScale(4),
    backgroundColor: "#FACC15",
    marginTop: verticalScale(8),
    marginLeft: scale(8),
  },
  emptyText: {
    textAlign: "center",
    color: "#777",
    marginTop: verticalScale(10),
    fontFamily: "DMSans_400Regular",
    fontSize: getFontSize(moderateScale(14)),
  },
});
