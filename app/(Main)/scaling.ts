import { Dimensions } from "react-native";

const { width, height } = Dimensions.get("window");

export const isSmallDevice = width < 375;
export const isTablet = width >= 768;

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

export const scale = (size: number) => {
  const ratio = width / 375;
  if (isTablet) return size * Math.min(ratio, 1.4);
  return clamp(size * ratio, size * 0.76, size * 1.25);
};

export const verticalScale = (size: number) => {
  const ratio = height / 812;
  if (isTablet) return size * Math.min(ratio, 1.4);
  return clamp(size * ratio, size * 0.62, size * 1.2);
};

export const moderateScale = (size: number, factor = 0.5) =>
  size + (scale(size) - size) * factor;

export const getFontSize = (base: number) => {
  if (isSmallDevice) return base * 0.88;
  if (isTablet) return base * 1.15;
  return base;
};

export const H_PAD = isTablet
  ? scale(32)
  : isSmallDevice
    ? scale(14)
    : scale(20);

export const screenWidth = width;
