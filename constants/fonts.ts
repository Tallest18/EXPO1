import {
  DMSans_300Light,
  DMSans_400Regular,
  DMSans_500Medium,
  DMSans_600SemiBold,
  DMSans_700Bold,
} from "@expo-google-fonts/dm-sans";

export const FONT_FAMILY = {
  regular: "DMSans_400Regular",
  medium: "DMSans_500Medium",
  semibold: "DMSans_600SemiBold",
  bold: "DMSans_700Bold",
  light: "DMSans_300Light",
} as const;

export const FONT_ASSETS = {
  [FONT_FAMILY.regular]: DMSans_400Regular,
  [FONT_FAMILY.medium]: DMSans_500Medium,
  [FONT_FAMILY.semibold]: DMSans_600SemiBold,
  [FONT_FAMILY.bold]: DMSans_700Bold,
  [FONT_FAMILY.light]: DMSans_300Light,
  DMSans_400Regular: DMSans_400Regular,
  DMSans_500Medium: DMSans_500Medium,
  DMSans_600SemiBold: DMSans_600SemiBold,
  DMSans_700Bold: DMSans_700Bold,
  DMSans_300Light: DMSans_300Light,
} as const;

export type AppFontWeight = keyof typeof FONT_FAMILY;
