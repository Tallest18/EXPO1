// components/ui/Text.tsx
import React from "react";
import {
    Text as RNText,
    TextProps as RNTextProps,
    StyleSheet,
} from "react-native";

import { AppFontWeight, FONT_FAMILY } from "@/constants/fonts";

interface TextProps extends RNTextProps {
  fontWeight?: AppFontWeight;
}

export const Text: React.FC<TextProps> = ({
  style,
  fontWeight = "regular",
  ...props
}) => {
  const fontFamily = FONT_FAMILY[fontWeight];

  return (
    <RNText style={StyleSheet.flatten([{ fontFamily }, style])} {...props} />
  );
};

// Pre-styled variants for convenience
export const H1: React.FC<RNTextProps> = ({ style, ...props }) => (
  <Text fontWeight="bold" style={[styles.h1, style]} {...props} />
);

export const H2: React.FC<RNTextProps> = ({ style, ...props }) => (
  <Text fontWeight="bold" style={[styles.h2, style]} {...props} />
);

export const H3: React.FC<RNTextProps> = ({ style, ...props }) => (
  <Text fontWeight="semibold" style={[styles.h3, style]} {...props} />
);

export const BodyText: React.FC<RNTextProps> = ({ style, ...props }) => (
  <Text fontWeight="regular" style={[styles.body, style]} {...props} />
);

export const BodyBold: React.FC<RNTextProps> = ({ style, ...props }) => (
  <Text fontWeight="semibold" style={[styles.body, style]} {...props} />
);

export const Caption: React.FC<RNTextProps> = ({ style, ...props }) => (
  <Text fontWeight="regular" style={[styles.caption, style]} {...props} />
);

const styles = StyleSheet.create({
  h1: {
    fontSize: 24,
    lineHeight: 32,
  },
  h2: {
    fontSize: 20,
    lineHeight: 28,
  },
  h3: {
    fontSize: 18,
    lineHeight: 24,
  },
  body: {
    fontSize: 14,
    lineHeight: 20,
  },
  caption: {
    fontSize: 12,
    lineHeight: 16,
  },
});
