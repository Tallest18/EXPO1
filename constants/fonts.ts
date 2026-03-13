export const FONT_FAMILY = {
  regular: "Poppins-Regular",
  medium: "Poppins-Medium",
  semibold: "Poppins-SemiBold",
  bold: "Poppins-Bold",
  light: "Poppins-Light",
} as const;

export const FONT_ASSETS = {
  [FONT_FAMILY.regular]: require("../assets/fonts/Poppins-Regular.ttf"),
  [FONT_FAMILY.medium]: require("../assets/fonts/Poppins-Medium.ttf"),
  [FONT_FAMILY.semibold]: require("../assets/fonts/Poppins-SemiBold.ttf"),
  [FONT_FAMILY.bold]: require("../assets/fonts/Poppins-Bold.ttf"),
  [FONT_FAMILY.light]: require("../assets/fonts/Poppins-Light.ttf"),
} as const;

export type AppFontWeight = keyof typeof FONT_FAMILY;
