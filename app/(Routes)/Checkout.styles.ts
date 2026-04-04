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
    paddingBottom: verticalScale(10),
    backgroundColor: "#E7EEFA",
  },
  backButton: {
    padding: scale(4),
  },
  headerTitle: {
    fontSize: moderateScale(24),
    fontFamily: "DMSans_700Bold",
    color: "#000",
  },
  content: {
    flex: 1,
    paddingHorizontal: scale(20),
  },
  section: {
    marginTop: verticalScale(16),
  },
  sectionTitle: {
    fontSize: moderateScale(14),
    fontFamily: "DMSans_400Regular",
    color: "#666",
    marginBottom: verticalScale(12),
  },
  paymentOptionsContainer: {
    gap: scale(8),
  },
  paymentOption: {
    backgroundColor: "#FFFFFF",
    borderRadius: moderateScale(12),
    padding: scale(16),
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "transparent",
  },
  paymentOptionSelected: {
    borderColor: "#1155CC",
  },
  paymentOptionText: {
    fontSize: moderateScale(15),
    fontFamily: "DMSans_400Regular",
    color: "#000",
  },
  radioButton: {
    width: scale(22),
    height: verticalScale(22),
    borderRadius: moderateScale(11),
    borderWidth: 2,
    borderColor: "#D0D0D0",
    justifyContent: "center",
    alignItems: "center",
  },
  radioButtonSelected: {
    borderColor: "#1155CC",
  },
  radioButtonInner: {
    width: scale(10),
    height: verticalScale(10),
    borderRadius: moderateScale(5),
    backgroundColor: "#1155CC",
  },
  footer: {
    backgroundColor: "#E7EEFA",
    paddingHorizontal: scale(20),
    paddingTop: verticalScale(16),
    paddingBottom: verticalScale(20),
  },
  doneButton: {
    backgroundColor: "#1155CC",
    borderRadius: moderateScale(12),
    paddingVertical: verticalScale(16),
    alignItems: "center",
  },
  doneButtonText: {
    color: "white",
    fontSize: moderateScale(16),
    fontFamily: "DMSans_400Regular",
  },
  bottomPadding: {
    height: verticalScale(40),
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: scale(20),
    paddingTop: verticalScale(20),
    paddingBottom: verticalScale(30),
    maxHeight: "90%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: verticalScale(20),
  },
  modalTitle: {
    fontSize: moderateScale(20),
    fontFamily: "DMSans_700Bold",
    color: "#000",
  },
  closeButton: {
    padding: scale(4),
  },
  inputGroup: {
    marginBottom: verticalScale(20),
  },
  inputLabel: {
    fontSize: moderateScale(14),
    fontFamily: "DMSans_400Regular",
    color: "#000",
    marginBottom: verticalScale(8),
  },
  required: {
    color: "#FF3B30",
  },
  labelSubtext: {
    color: "#999",
    fontSize: moderateScale(13),
  },
  input: {
    backgroundColor: "#F5F7FA",
    borderRadius: moderateScale(8),
    padding: scale(14),
    fontSize: moderateScale(15),
    fontFamily: "DMSans_400Regular",
    color: "#000",
  },
  amountInputContainer: {
    backgroundColor: "#F5F7FA",
    borderRadius: moderateScale(8),
    padding: scale(14),
    flexDirection: "row",
    alignItems: "center",
  },
  currencySymbol: {
    fontSize: moderateScale(16),
    fontFamily: "DMSans_700Bold",
    color: "#000",
    marginRight: 8,
  },
  amountInput: {
    flex: 1,
    fontSize: moderateScale(15),
    fontFamily: "DMSans_400Regular",
    color: "#000",
    padding: scale(0),
  },
  quickAmountsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: scale(8),
    marginTop: verticalScale(12),
  },
  quickAmountButton: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#D0D0D0",
    borderRadius: moderateScale(8),
    paddingVertical: verticalScale(8),
    paddingHorizontal: scale(16),
  },
  quickAmountText: {
    fontSize: moderateScale(14),
    fontFamily: "DMSans_400Regular",
    color: "#000",
  },
  textArea: {
    minHeight: 100,
    paddingTop: verticalScale(14),
  },
  saveDebtorButton: {
    backgroundColor: "#1155CC",
    borderRadius: moderateScale(12),
    paddingVertical: verticalScale(16),
    alignItems: "center",
    marginTop: verticalScale(10),
  },
  saveDebtorButtonText: {
    color: "white",
    fontSize: moderateScale(16),
    fontFamily: "DMSans_400Regular",
  },
  toastContainer: {
    position: "absolute",
    top: verticalScale(10),
    left: scale(20),
    right: scale(20),
    borderRadius: moderateScale(14),
    paddingVertical: verticalScale(13),
    paddingHorizontal: scale(16),
    elevation: 7,
    shadowColor: "#000",
    shadowOpacity: 0.22,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    zIndex: 999,
  },
  toastSuccess: {
    backgroundColor: "#16A34A",
  },
  toastError: {
    backgroundColor: "#DC2626",
  },
  toastText: {
    color: "#FFFFFF",
    fontFamily: "DMSans_600SemiBold",
    fontSize: moderateScale(13),
    textAlign: "center",
  },
});
