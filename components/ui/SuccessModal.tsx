import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface SuccessModalProps {
  visible: boolean;
  title: string;
  subtitle?: string;
  iconName?: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  buttonText?: string;
  onClose: () => void;
}

const SuccessModal: React.FC<SuccessModalProps> = ({
  visible,
  title,
  subtitle,
  iconName = "checkmark-circle-outline",
  iconColor = "#1BC47D",
  buttonText = "OK",
  onClose,
}) => (
  <Modal
    visible={visible}
    transparent
    animationType="fade"
    onRequestClose={onClose}
  >
    <View style={styles.overlay}>
      <View style={styles.card}>
        <View style={styles.iconWrap}>
          <Ionicons name={iconName} size={36} color={iconColor} />
        </View>
        <Text style={styles.title}>{title}</Text>
        {!!subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
        <TouchableOpacity style={styles.button} onPress={onClose}>
          <Text style={styles.buttonText}>{buttonText}</Text>
        </TouchableOpacity>
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
    paddingVertical: 24,
    borderWidth: 1,
    borderColor: "#E4EAF7",
    alignItems: "center",
  },
  iconWrap: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#E6F9F2",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    color: "#1A1A1A",
    fontFamily: "DMSans_700Bold",
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: "#5F6778",
    fontFamily: "DMSans_400Regular",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 20,
  },
  button: {
    backgroundColor: "#1BC47D",
    borderRadius: 12,
    paddingVertical: 13,
    paddingHorizontal: 32,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontFamily: "DMSans_600SemiBold",
  },
});

export default SuccessModal;
