import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
    Dimensions,
    Modal,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { width, height } = Dimensions.get("screen"); // use "screen" not "window"
const isSmall = width < 360;

interface Props {
  visible: boolean;
  onClose: () => void;
  onSearchClick: () => void;
  onAddManually: () => void;
}

const InitialChoiceSheet: React.FC<Props> = ({
  visible,
  onClose,
  onSearchClick,
  onAddManually,
}) => {
  const insets = useSafeAreaInsets();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent={true} // covers status bar on Android
    >
      <TouchableOpacity
        style={styles.modalBackdrop}
        activeOpacity={1}
        onPress={onClose}
      >
        <View style={styles.bottomSheetContainer}>
          <TouchableOpacity
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
            style={[
              styles.bottomSheetContent,
              { paddingBottom: insets.bottom + 34 },
            ]}
          >
            <View style={styles.handleBar} />

            <Text style={styles.bottomSheetHeader}>Add Product</Text>

            <Text style={styles.initialChoiceTitle}>
              How would you like to{"\n"}add a product?
            </Text>
            <Text style={styles.initialChoiceSubtitle}>
              You can search from existing products or{"\n"}add a new one
              manually
            </Text>

            <TouchableOpacity
              style={styles.searchButtonInitial}
              onPress={onSearchClick}
            >
              <Ionicons
                name="search-outline"
                size={20}
                color="#666"
                style={{ marginRight: 10 }}
              />
              <Text style={styles.searchButtonInitialText}>Search</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.addManuallyButton}
              onPress={onAddManually}
            >
              <Ionicons
                name="add"
                size={20}
                color="#FFF"
                style={{ marginRight: 8 }}
              />
              <Text style={styles.addManuallyButtonText}>Add Manually</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    height: height, // force full screen height
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  bottomSheetContainer: {
    justifyContent: "flex-end",
  },
  bottomSheetContent: {
    backgroundColor: "#FFF",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: isSmall ? 16 : 24,
    paddingTop: 8,
  },
  handleBar: {
    width: 60,
    height: 4,
    backgroundColor: "#1155CC",
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 16,
  },
  bottomSheetHeader: {
    fontSize: isSmall ? 13 : 15,
    color: "#1155CC",
    textAlign: "center",
    marginBottom: 16,
    fontFamily: "DMSans_600SemiBold",
  },
  initialChoiceTitle: {
    fontSize: isSmall ? 16 : 19,
    color: "#1A202C",
    textAlign: "center",
    marginBottom: 8,
    fontFamily: "DMSans_600SemiBold",
  },
  initialChoiceSubtitle: {
    fontSize: isSmall ? 11 : 13,
    color: "#718096",
    textAlign: "center",
    marginBottom: isSmall ? 20 : 28,
    lineHeight: 19,
    fontFamily: "DMSans_400Regular",
  },
  searchButtonInitial: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    backgroundColor: "#fff",
    borderRadius: 50,
    paddingVertical: isSmall ? 11 : 13,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#1155CC",
  },
  searchButtonInitialText: {
    fontSize: isSmall ? 13 : 14,
    color: "#1C1C1C",
    fontFamily: "DMSans_500Medium",
  },
  addManuallyButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    backgroundColor: "#1155CC",
    borderRadius: 50,
    paddingVertical: isSmall ? 11 : 13,
  },
  addManuallyButtonText: {
    fontSize: isSmall ? 13 : 14,
    color: "#FFF",
    fontFamily: "DMSans_600SemiBold",
  },
});

export default InitialChoiceSheet;
