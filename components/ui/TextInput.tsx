// components/ui/TextInput.tsx
import React from "react";
import {
    TextInput as RNTextInput,
    TextInputProps as RNTextInputProps,
    StyleSheet,
} from "react-native";

import { AppFontWeight, FONT_FAMILY } from "@/constants/fonts";

interface TextInputProps extends RNTextInputProps {
  fontWeight?: AppFontWeight;
}

export const TextInput: React.FC<TextInputProps> = ({
  style,
  fontWeight = "regular",
  ...props
}) => {
  const fontFamily = FONT_FAMILY[fontWeight];

  return (
    <RNTextInput
      style={StyleSheet.flatten([{ fontFamily }, style])}
      {...props}
    />
  );
};
