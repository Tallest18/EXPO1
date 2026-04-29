import { router } from "expo-router";
import React, { useEffect } from "react";
import { Dimensions, Image, StyleSheet, Text, View } from "react-native";

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

const Onboarding1 = () => {
  useEffect(() => {
    const timer = setTimeout(() => {
      router.replace("/(Auth)/WelcomeScreen");
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.centerContent}>
        <Text style={styles.title} numberOfLines={1} adjustsFontSizeToFit>
          Inventra
        </Text>
        <Text style={styles.subtitle} numberOfLines={1} adjustsFontSizeToFit>
          One App, everything your shop needs
        </Text>
      </View>

      <View style={styles.logoContainer}>
        <Text style={styles.fromText}>From</Text>
        <View style={styles.logoRow}>
          {/* <View style={styles.logoIcon}> */}
          <Image
            source={require("../../assets/images/logo1.png")}
            style={styles.image}
          />
          {/* </View> */}
          <Text style={styles.logoText} numberOfLines={1} adjustsFontSizeToFit>
            Wonderfall
          </Text>
        </View>
        <Text style={styles.systemsText} numberOfLines={1} adjustsFontSizeToFit>
          S Y S T E M S
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1155CC",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: verticalScale(40),
  },
  centerContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
    paddingHorizontal: scale(2),
  },
  title: {
    fontSize: height * 0.08, // Responsive font size
    color: "#fff",
    fontFamily: "DMSans_700Bold",
    textAlign: "center",
    width: "100%",
    includeFontPadding: false,
  },
  subtitle: {
    fontSize: 14,
    color: "#fff",
    fontFamily: "DMSans_400Regular",
    textAlign: "center",
    width: "100%",
    marginTop: verticalScale(10),
    includeFontPadding: false,
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: verticalScale(20),
    width: "100%",
    paddingHorizontal: scale(20),
  },
  fromText: {
    color: "#fff",
    fontSize: moderateScale(16),
    marginBottom: verticalScale(2),
    fontFamily: "DMSans_400Regular",
  },
  logoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: verticalScale(4),
    width: "100%",
    justifyContent: "center",
  },
  logoIcon: {
    width: scale(32),
    height: verticalScale(32),
    borderRadius: moderateScale(16),
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  logoText: {
    color: "#fff",
    fontSize: moderateScale(24),
    fontFamily: "DMSans_700Bold",
    letterSpacing: 1,
    flexShrink: 1,
    includeFontPadding: false,
  },
  systemsText: {
    color: "#fff",
    fontSize: moderateScale(14),
    letterSpacing: 4,

    fontFamily: "DMSans_400Regular",
    includeFontPadding: false,
    marginLeft: 28,
  },
  image: {
    height: verticalScale(28),
    width: scale(28),
  },
});

export default Onboarding1;
