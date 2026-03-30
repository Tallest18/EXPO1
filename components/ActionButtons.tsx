import { Ionicons } from "@expo/vector-icons";
import AntDesign from "@expo/vector-icons/AntDesign";
import { useRouter } from "expo-router";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";

import { moderateScale, homeStyles as styles } from "./homeStyles";

interface ActionButtonsProps {
  onAddProduct: () => void;
}

const ActionButtons: React.FC<ActionButtonsProps> = ({ onAddProduct }) => {
  const router = useRouter();

  return (
    <View style={styles.row}>
      <TouchableOpacity
        style={[styles.actionBox, { backgroundColor: "#061E47" }]}
        onPress={onAddProduct}
        activeOpacity={0.8}
      >
        <Text style={{ color: "#fff", fontFamily: "DMSans_400Regular" }}>
          New Product{" "}
        </Text>
        <Ionicons
          name="add-circle-outline"
          size={moderateScale(30)}
          color="#fff"
        />
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.actionBox,
          { backgroundColor: "#1155CC", cursor: "pointer" },
        ]}
        onPress={() => router.push("/(Routes)/QuickSellScreen")}
        activeOpacity={0.8}
      >
        <Text style={{ color: "#fff", fontFamily: "DMSans_400Regular" }}>
          Quick Sell{" "}
        </Text>

        <AntDesign name="shopping-cart" size={30} color="white" />
      </TouchableOpacity>
    </View>
  );
};

export default ActionButtons;
