import { Dimensions, StyleSheet } from "react-native";
import { getFontSize, moderateScale, verticalScale } from "./scaling";

const { width, height } = Dimensions.get("window");
const isSmallDevice = width < 375;
const isTablet = width >= 768;

const scale = (size: number) => {
  const baseWidth = 375;
  const ratio = width / baseWidth;
  if (isTablet) return size * Math.min(ratio, 1.4);
  return size * ratio;
};

export const H_PAD = isTablet
  ? scale(32)
  : isSmallDevice
    ? scale(14)
    : scale(20);
const CARD_GAP = scale(12);
const NUM_COLS = isTablet ? 3 : 2;
export const CARD_WIDTH =
  (width - H_PAD * 2 - CARD_GAP * (NUM_COLS - 1)) / NUM_COLS;

export const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#E7EEFA" },

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

  // ── Header ──────────────────────────────────────────────────────────────────
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: H_PAD,
    paddingTop: verticalScale(isTablet ? 20 : 14),
    paddingBottom: verticalScale(isTablet ? 14 : 10),
    backgroundColor: "#E7EEFA",
  },
  headerTitle: {
    fontSize: getFontSize(
      moderateScale(isSmallDevice ? 24 : isTablet ? 34 : 28),
    ),
    color: "#000",
    fontFamily: "DMSans_700Bold",
    flexShrink: 1,
    marginRight: scale(10),
  },

  // Cart pill
  cartPill: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: moderateScale(50),
    borderWidth: 1.5,
    borderColor: "#B5CAEF",
    paddingLeft: scale(14),
    paddingRight: scale(6),
    paddingVertical: verticalScale(5),
    gap: scale(4),
    flexShrink: 0,
    backgroundColor: "#fff",
  },
  cartPillLabel: {
    fontSize: getFontSize(moderateScale(15)),
    fontFamily: "DMSans_500Medium",
    color: "#1A1A1A",
  },
  cartIconWrap: {
    position: "relative",
    padding: scale(5),
  },
  cartBadge: {
    position: "absolute",
    top: verticalScale(-1),
    right: scale(-1),
    backgroundColor: "#FF3B30",
    borderRadius: moderateScale(10),
    minWidth: scale(16),
    height: verticalScale(16),
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: scale(3),
  },
  cartBadgeText: {
    color: "white",
    fontSize: getFontSize(moderateScale(9)),
    fontFamily: "DMSans_700Bold",
  },

  // ── Search ──────────────────────────────────────────────────────────────────
  searchRow: {
    flexDirection: "row",
    paddingHorizontal: H_PAD,
    paddingVertical: verticalScale(8),
    alignItems: "center",
    gap: scale(10),
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: moderateScale(14),
    paddingHorizontal: scale(14),
    paddingVertical: verticalScale(isSmallDevice ? 7 : 11),
    gap: scale(8),
  },
  searchInput: {
    flex: 1,
    fontSize: getFontSize(moderateScale(15)),
    fontFamily: "DMSans_400Regular",
    color: "#000",
    minHeight: verticalScale(20),
  },
  filterButton: {
    backgroundColor: "#1A1A1A",
    borderRadius: moderateScale(12),
    width: scale(46),
    height: scale(46),
    justifyContent: "center",
    alignItems: "center",
  },

  // ── Tabs ────────────────────────────────────────────────────────────────────
  tabsContainer: {
    flexDirection: "row",
    paddingHorizontal: H_PAD,
    paddingVertical: verticalScale(8),
    gap: scale(10),
  },
  tab: {
    paddingHorizontal: scale(isSmallDevice ? 16 : 22),
    paddingVertical: verticalScale(9),
    borderRadius: moderateScale(8),
  },
  activeTabOutline: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#D0D8EC",
  },
  activeTabBlue: {
    backgroundColor: "#1155CC",
  },
  tabViewNormal: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#D0D8EC",
  },
  tabText: {
    fontSize: getFontSize(moderateScale(15)),
    fontFamily: "DMSans_400Regular",
    color: "#666",
  },
  activeTabTextDark: {
    color: "#1A1A1A",
    fontFamily: "DMSans_600SemiBold",
  },
  activeTabTextWhite: {
    color: "#FFFFFF",
    fontFamily: "DMSans_600SemiBold",
  },

  // ── Section title (rendered inside AllProducts) ──────────────────────────────
  sectionTitle: {
    fontSize: getFontSize(moderateScale(14)),
    fontFamily: "DMSans_400Regular",
    color: "#718096",
    paddingHorizontal: H_PAD,
    paddingBottom: verticalScale(4),
  },

  // ── Products grid ────────────────────────────────────────────────────────────
  productsContainer: { flex: 1, paddingHorizontal: H_PAD },
  scrollContent: { flexGrow: 1, paddingBottom: verticalScale(110) },
  productsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingTop: verticalScale(10),
    gap: CARD_GAP,
  },
  productCard: {
    width: CARD_WIDTH,
    backgroundColor: "#FFFFFF",
    borderRadius: moderateScale(12),
    padding: scale(isSmallDevice ? 8 : 12),
  },
  productImage: {
    width: "100%",
    height: CARD_WIDTH * 0.75,
    borderRadius: moderateScale(8),
    backgroundColor: "#F0F0F0",
    marginBottom: verticalScale(8),
  },
  productDetails: { gap: scale(6) },
  productName: {
    fontSize: getFontSize(moderateScale(isSmallDevice ? 13 : 15)),
    fontFamily: "DMSans_600Bold",
    textTransform: "capitalize",
    color: "#000",
    minHeight: verticalScale(36),
  },
  priceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#EBEFFC",
    paddingVertical: scale(4),
    paddingHorizontal: scale(6),
    borderRadius: moderateScale(8),
  },
  productPrice: {
    fontSize: getFontSize(moderateScale(isSmallDevice ? 13 : 15)),
    fontFamily: "DMSans_400Bold",
    color: "#000",
    flex: 1,
  },
  addToCartButton: {
    backgroundColor: "#1155cc",
    borderRadius: moderateScale(8),
    width: scale(34),
    height: scale(34),
    justifyContent: "center",
    alignItems: "center",
  },
  addToCartButtonDisabled: { backgroundColor: "#E0E0E0" },

  // Quantity controls (inline inside price row)
  quantityControls: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(6),
  },
  quantityButton: {
    width: scale(26),
    height: scale(26),
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: moderateScale(13),
  },
  quantityText: {
    fontSize: getFontSize(moderateScale(14)),
    fontFamily: "DMSans_700Bold",
    color: "#000",
    minWidth: scale(18),
    textAlign: "center",
  },

  // ── Empty states ─────────────────────────────────────────────────────────────
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: verticalScale(60),
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
    paddingHorizontal: scale(isSmallDevice ? 10 : 30),
    fontFamily: "DMSans_400Regular",
    lineHeight: getFontSize(moderateScale(22)),
  },

  // ── View Cart FAB ────────────────────────────────────────────────────────────
  viewCartContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: H_PAD,
    paddingBottom: verticalScale(isTablet ? 24 : 16),
    backgroundColor: "#E7EEFA",
    borderTopWidth: 1,
    borderTopColor: "#D0D0D0",
  },
  viewCartButton: {
    backgroundColor: "#007AFF",
    borderRadius: moderateScale(12),
    paddingVertical: verticalScale(14),
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: scale(8),
  },
  viewCartButtonText: {
    color: "white",
    fontSize: getFontSize(moderateScale(16)),
    fontFamily: "DMSans_600SemiBold",
  },
  bottomPadding: { height: verticalScale(20) },

  // ── Sales history ────────────────────────────────────────────────────────────
  historyContainer: { paddingTop: verticalScale(10) },
  dateGroup: { marginBottom: verticalScale(16) },
  dateHeader: {
    fontSize: getFontSize(moderateScale(13)),
    fontFamily: "DMSans_500Medium",
    color: "#444",
    marginBottom: verticalScale(8),
    paddingHorizontal: scale(2),
  },
  saleCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: moderateScale(14),
    padding: scale(14),
    marginBottom: verticalScale(8),
    flexDirection: "row",
    alignItems: "center",
    gap: scale(12),
  },
  saleThumb: {
    width: scale(46),
    height: scale(46),
    borderRadius: moderateScale(10),
    backgroundColor: "#F0F0F0",
    flexShrink: 0,
  },
  saleThumbPlaceholder: {
    width: scale(46),
    height: scale(46),
    borderRadius: moderateScale(10),
    justifyContent: "center",
    alignItems: "center",
    flexShrink: 0,
  },
  saleThumbInitial: {
    fontSize: getFontSize(moderateScale(18)),
    fontFamily: "DMSans_700Bold",
    color: "#FFFFFF",
  },
  saleInfo: {
    flex: 1,
    gap: verticalScale(3),
    minWidth: 0,
  },
  saleProductName: {
    fontSize: getFontSize(moderateScale(14)),
    fontFamily: "DMSans_500Medium",
    textTransform: "capitalize",
    color: "#1A1A1A",
  },
  saleItemSeparator: {
    color: "#1A1A1A",
    fontFamily: "DMSans_400Regular",
  },
  saleItemQty: {
    color: "#F59E0B",
    fontFamily: "DMSans_400SemiBold",
    fontSize: getFontSize(moderateScale(14)),
  },
  saleMeta: {
    fontSize: getFontSize(moderateScale(11)),
    fontFamily: "DMSans_400Regular",
    color: "#999",
  },
  saleMetaPayment: {
    fontFamily: "DMSans_500Medium",
  },
  saleRight: {
    alignItems: "flex-end",
    flexShrink: 0,
    minWidth: scale(70),
  },
  saleAmount: {
    fontSize: getFontSize(moderateScale(16)),
    fontFamily: "DMSans_400Bold",
    color: "#1A1A1A",
  },
  salePaymentLabel: {
    fontSize: getFontSize(moderateScale(11)),
    fontFamily: "DMSans_500Medium",
    marginTop: verticalScale(2),
  },
});
