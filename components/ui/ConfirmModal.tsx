import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  ActivityIndicator,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface ConfirmModalProps {
  visible: boolean;
  title: string;
  subtitle?: string;
  iconName?: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  confirmText?: string;
  cancelText?: string;
  loading?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  singleButton?: boolean; // NEW PROP
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
  visible,
  title,
  subtitle,
  iconName = "help-circle-outline",
  iconColor = "#E74C3C",
  confirmText = "Yes",
  cancelText = "Cancel",
  loading = false,
  onCancel,
  onConfirm,
  singleButton = false, // DEFAULT TO FALSE
}) => (
  <Modal
    visible={visible}
    transparent
    animationType="fade"
    onRequestClose={onCancel}
  >
    <View style={styles.overlay}>
      <View style={styles.card}>
        <View style={styles.iconWrap}>
          <Ionicons name={iconName} size={24} color={iconColor} />
        </View>
        <Text style={styles.title}>{title}</Text>
        {!!subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
        <View style={styles.actions}>
          {!singleButton && (
            <TouchableOpacity
              style={styles.cancelAction}
              onPress={onCancel}
              disabled={loading}
            >
              <Text style={styles.cancelActionText}>{cancelText}</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={styles.confirmAction}
            onPress={onConfirm}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.confirmActionText}>{confirmText}</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  </Modal>
);

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(13, 30, 66, 0.45)",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderWidth: 1,
    borderColor: "#E4EAF7",
  },
  iconWrap: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#FDEBE9",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    color: "#1A1A1A",
    fontFamily: "DMSans_700Bold",
    textAlign: "center",
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: "#5F6778",
    fontFamily: "DMSans_400Regular",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 16,
  },
  actions: {
    flexDirection: "row",
    gap: 10,
  },
  cancelAction: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F1F4FB",
    borderWidth: 1,
    borderColor: "#D8E2F6",
  },
  cancelActionText: {
    color: "#2046AE",
    fontSize: 14,
    fontFamily: "DMSans_600SemiBold",
  },
  confirmAction: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E74C3C",
  },
  confirmActionText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontFamily: "DMSans_600SemiBold",
  },
});

export default ConfirmModal;
