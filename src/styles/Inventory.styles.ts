import { Dimensions, StyleSheet } from "react-native";

// Responsive helpers (copy these from Inventory.tsx or import if shared)
const { width, height } = Dimensions.get("window");
const isSmallDevice = width < 375;
const isTablet = width >= 768;
const scale = (size: number) => {
  const baseWidth = 375;
  const ratio = width / baseWidth;
  if (isTablet) return size * Math.min(ratio, 1.4);
  return size * ratio;
};
const verticalScale = (size: number) => {
  const baseHeight = 812;
  const ratio = height / baseHeight;
  if (isTablet) return size * Math.min(ratio, 1.4);
  return size * ratio;
};
const moderateScale = (size: number, factor = 0.5) =>
  size + (scale(size) - size) * factor;
const getFontSize = (base: number) => {
  if (isSmallDevice) return base * 0.88;
  if (isTablet) return base * 1.15;
  return base;
};
const H_PAD = isTablet ? scale(32) : isSmallDevice ? scale(14) : scale(20);

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#E7EEFA",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#E7EEFA",
  },
  loadingText: {
    marginTop: verticalScale(10),
    fontSize: getFontSize(moderateScale(16)),
    color: "#666",
    fontFamily: "DMSans_400Regular",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: H_PAD,
    paddingTop: verticalScale(isTablet ? 20 : 14),
    paddingBottom: verticalScale(isTablet ? 16 : 12),
    backgroundColor: "#E7EEFA",
  },
  headerTitle: {
    fontSize: getFontSize(
      moderateScale(isSmallDevice ? 22 : isTablet ? 32 : 26),
    ),
    color: "#000",
    fontFamily: "DMSans_700Bold",
    flexShrink: 1,
    marginRight: scale(10),
  },
  newProductButton: {
    backgroundColor: "#1155CC",
    borderRadius: moderateScale(8),
    paddingHorizontal: isSmallDevice ? scale(10) : scale(16),
    paddingVertical: verticalScale(isSmallDevice ? 8 : 10),
    flexDirection: "row",
    alignItems: "center",
    gap: scale(6),
    flexShrink: 0,
  },
  newProductButtonText: {
    color: "white",
    fontSize: getFontSize(moderateScale(isSmallDevice ? 12 : 14)),
    fontFamily: "DMSans_600SemiBold",
  },
  searchContainer: {
    flexDirection: "row",
    paddingHorizontal: H_PAD,
    paddingBottom: verticalScale(12),
    backgroundColor: "#E7EEFA",
    alignItems: "center",
    gap: scale(10),
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: moderateScale(10),
    paddingHorizontal: scale(14),
    paddingVertical: verticalScale(isSmallDevice ? 8 : 10),
    gap: scale(8),
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  searchInput: {
    flex: 1,
    fontSize: getFontSize(moderateScale(15)),
    fontFamily: "DMSans_400Regular",
    color: "#000",
    minHeight: verticalScale(20),
  },
  filterButton: {
    backgroundColor: "#FFFFFF",
    borderRadius: moderateScale(10),
    padding: scale(12),
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  filtersContainer: {
    backgroundColor: "#E7EEFA",
    paddingVertical: verticalScale(8),
    paddingBottom: verticalScale(12),
  },
  filtersContentContainer: {
    paddingHorizontal: H_PAD,
    gap: scale(8),
  },
  filterTab: {
    paddingHorizontal: scale(isSmallDevice ? 12 : 16),
    paddingVertical: verticalScale(8),
    borderRadius: moderateScale(10),
    marginRight: scale(8),
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  activeFilterTab: {
    backgroundColor: "#1155CC",
    borderColor: "#1155CC",
  },
  filterText: {
    fontSize: getFontSize(moderateScale(14)),
    color: "#1C1C1C",
    fontFamily: "DMSans_400Regular",
  },
  activeFilterText: {
    color: "#FFFFFF",
    fontFamily: "DMSans_600SemiBold",
  },
  productsContainer: {
    flex: 1,
    backgroundColor: "#E7EEFA",
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: verticalScale(20),
  },
  productsGrid: {
    paddingHorizontal: H_PAD,
    paddingTop: verticalScale(8),
    flexDirection: isTablet ? "row" : "column",
    flexWrap: isTablet ? "wrap" : "nowrap",
    gap: isTablet ? scale(16) : 0,
  },
  productCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: moderateScale(12),
    marginBottom: verticalScale(16),
    overflow: "hidden",
  },
  cardContent: {
    padding: scale(isSmallDevice ? 12 : 16),
  },
  productName: {
    textTransform: "capitalize",
    fontSize: getFontSize(moderateScale(isSmallDevice ? 17 : 20)),
    color: "#000",
    fontFamily: "DMSans_700Bold",
    marginBottom: verticalScale(12),
    minHeight: verticalScale(isSmallDevice ? 38 : 48),
  },
  imageAndInfoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: scale(12),
    width: "100%",
  },
  productImage: {
    borderRadius: moderateScale(8),
    backgroundColor: "#F0F0F0",
    height: "100%",
    width: "30%",
  },
  infoBoxesContainer: {
    flex: 1,
    gap: verticalScale(8),
  },
  unitPriceBox: {
    backgroundColor: "#FFFFFF",
    borderRadius: moderateScale(8),
    padding: scale(8),
    borderWidth: 1,
    borderColor: "#B5CAEF",
    minHeight: verticalScale(isSmallDevice ? 42 : 50),
    justifyContent: "center",
  },
  boxLabel: {
    fontSize: getFontSize(moderateScale(11)),
    color: "#D2D2D2",
    marginBottom: verticalScale(4),
    fontFamily: "DMSans_400Regular",
  },
  largePrice: {
    fontSize: getFontSize(moderateScale(isSmallDevice ? 18 : 22)),
    color: "#000",
    fontFamily: "DMSans_700Bold",
  },
  bottomBoxesRow: {
    flexDirection: "row",
    gap: scale(4),
  },
  smallInfoBox: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: moderateScale(8),
    padding: scale(isSmallDevice ? 8 : 12),
    borderWidth: 1,
    borderColor: "#B5CAEF",
    minHeight: verticalScale(isSmallDevice ? 42 : 50),
    justifyContent: "center",
  },
  infoBoxValue: {
    fontSize: getFontSize(moderateScale(isSmallDevice ? 13 : 17)),
    color: "#000",
    fontFamily: "DMSans_700Bold",
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: verticalScale(80),
    paddingHorizontal: H_PAD,
  },
  emptyTitle: {
    fontSize: getFontSize(moderateScale(20)),
    color: "#666",
    marginTop: verticalScale(16),
    marginBottom: verticalScale(8),
    fontFamily: "DMSans_600SemiBold",
  },
  emptyDescription: {
    fontSize: getFontSize(moderateScale(14)),
    color: "#999",
    textAlign: "center",
    marginBottom: verticalScale(24),
    paddingHorizontal: scale(isSmallDevice ? 10 : 30),
    fontFamily: "DMSans_400Regular",
    lineHeight: getFontSize(moderateScale(22)),
  },
  addFirstProductButton: {
    backgroundColor: "#1155CC",
    borderRadius: moderateScale(12),
    paddingHorizontal: scale(24),
    paddingVertical: verticalScale(12),
  },
  addFirstProductButtonText: {
    color: "#FFFFFF",
    fontSize: getFontSize(moderateScale(16)),
    fontFamily: "DMSans_600SemiBold",
  },
  clearSearchButton: {
    backgroundColor: "#F8F9FA",
    borderRadius: moderateScale(12),
    paddingHorizontal: scale(24),
    paddingVertical: verticalScale(12),
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  clearSearchText: {
    color: "#666",
    fontSize: getFontSize(moderateScale(16)),
    fontFamily: "DMSans_400Regular",
  },
  bottomPadding: {
    height: verticalScale(20),
  },
});
