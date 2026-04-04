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
    paddingTop: verticalScale(30),
    backgroundColor: "#E7EEFA",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: verticalScale(10),
    fontSize: moderateScale(16),
    color: "#666",
    fontFamily: "DMSans_400Regular",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: scale(20),
    paddingTop: verticalScale(20),
    paddingBottom: verticalScale(15),
    backgroundColor: "#E7EEFA",
  },
  headerTitle: {
    fontSize: moderateScale(24),
    fontFamily: "DMSans_700Bold",
    color: "#000",
    textAlign: "center",
  },
  backButton: {
    padding: scale(8),
    backgroundColor: "#fff",
    borderRadius: moderateScale(8),
  },
  headerRight: {
    padding: scale(8),
  },
  itemCount: {
    fontSize: moderateScale(14),
    fontFamily: "DMSans_400Regular",
    color: "#666",
  },
  cartContainer: {
    flex: 1,
    padding: scale(10),
  },
  // cartContentContainer: {
  //   paddingHorizontal: scale(20),
  //   paddingTop: verticalScale(10),
  //   paddingBottom: verticalScale(20),
  //   backgroundColor: "#1a4591",
  // },
  cartItem: {
    borderRadius: moderateScale(12),
    padding: scale(8),
    marginBottom: verticalScale(12),
    flexDirection: "row",
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "#000000",
    borderTopWidth: 0,
    borderLeftWidth: 0,
    borderRightWidth: 0,
  },
  productImageContainer: {
    padding: scale(4),
    width: "35%",
    height: scale(120),
    borderRadius: moderateScale(8),
    backgroundColor: "#F5F5F5",
    marginRight: 12,
  },

  productImage: {
    width: "100%",
    height: "100%",
  },
  productInfo: {
    flex: 1,
    justifyContent: "space-between",
    gap: verticalScale(8),
  },
  productHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: verticalScale(4),
  },
  productName: {
    fontSize: moderateScale(16),
    fontFamily: "DMSans_600SemiBold",
    color: "#1C1C1C",
    flex: 1,
    marginRight: 8,
  },
  removeButton: {
    padding: scale(2),
  },
  priceQuantityRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(8),
    marginBottom: verticalScale(8),
  },
  productPrice: {
    fontSize: moderateScale(20),
    fontFamily: "DMSans_400Regular",
    color: "#1C1C1C",
  },

  bottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  quantityControl: {
    flexDirection: "row",
    backgroundColor: "#ffffff",
    alignItems: "center",
    padding: scale(6),
    borderRadius: moderateScale(8),
    alignSelf: "flex-start",
  },
  quantityButton: {
    width: scale(28),
    height: verticalScale(28),
    justifyContent: "center",
    alignItems: "center",
  },
  quantityButtonText: {
    fontSize: moderateScale(18),
    fontFamily: "DMSans_400Regular",
    color: "#000",
    lineHeight: 20,
  },
  quantityText: {
    fontSize: moderateScale(16),
    fontFamily: "DMSans_700Bold",
    color: "#000",
    marginHorizontal: scale(16),
    minWidth: 20,
    textAlign: "center",
  },

  footer: {
    backgroundColor: "#ffffff",
    paddingHorizontal: scale(20),
    paddingVertical: verticalScale(22),
  },
  totalContainer: {
    flexDirection: "row",
    display: "flex",
    gap: scale(16),
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: verticalScale(16),
  },
  totalLabel: {
    fontSize: moderateScale(24),
    fontFamily: "DMSans_700Regular",
    color: "#000",
  },
  totalAmount: {
    fontSize: moderateScale(32),
    fontFamily: "DMSans_700Bold",
    color: "#000",
  },
  checkoutButton: {
    backgroundColor: "#1155CC",
    borderRadius: moderateScale(10),
    paddingVertical: verticalScale(18),
    alignItems: "center",
  },
  checkoutButtonText: {
    color: "white",
    fontSize: moderateScale(16),
    fontFamily: "DMSans_400Regular",
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: scale(40),
  },
  emptyTitle: {
    fontSize: moderateScale(20),
    color: "#666",
    marginTop: verticalScale(16),
    marginBottom: verticalScale(8),
    fontFamily: "DMSans_400Regular",
  },
  emptyDescription: {
    fontSize: moderateScale(14),
    color: "#999",
    textAlign: "center",
    marginBottom: verticalScale(24),
    fontFamily: "DMSans_400Regular",
  },
  shopButton: {
    backgroundColor: "#1155CC",
    borderRadius: moderateScale(12),
    paddingHorizontal: scale(24),
    paddingVertical: verticalScale(12),
  },
  shopButtonText: {
    color: "#FFF",
    fontSize: moderateScale(16),
    fontFamily: "DMSans_400Regular",
  },
});
