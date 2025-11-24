import { router } from "expo-router";
import React, { useEffect } from "react";
import { Dimensions, Image, StyleSheet, Text, View } from "react-native";

const { width, height } = Dimensions.get("window");

const Onboarding1 = () => {
  useEffect(() => {
    const timer = setTimeout(() => {
      router.replace("/(Auth)/WelcomeScreen");
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.centerContent}>
        <Text style={styles.title} numberOfLines={1} adjustsFontSizeToFit>
          Inventra
        </Text>
        <Text style={styles.subtitle} numberOfLines={1} adjustsFontSizeToFit>
          Inventory Management System
        </Text>
      </View>

      <View style={styles.logoContainer}>
        <Text style={styles.fromText}>From</Text>
        <View style={styles.logoRow}>
          <View style={styles.logoIcon}>
            <Image
              source={require("../../assets/images/Logo White.png")}
              style={styles.image}
            />
          </View>
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
    backgroundColor: "#2046AE",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 40,
  },
  centerContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
    paddingHorizontal: 20,
  },
  title: {
    fontSize: height * 0.08, // Responsive font size
    color: "#fff",
    fontFamily: "Poppins-Bold",
    textAlign: "center",
    width: "100%",
    includeFontPadding: false,
  },
  subtitle: {
    fontSize: height * 0.03, // Responsive font size
    color: "#fff",
    fontWeight: "300",
    fontFamily: "Poppins-Regular",
    textAlign: "center",
    width: "100%",
    marginTop: 10,
    includeFontPadding: false,
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 20,
    width: "100%",
    paddingHorizontal: 20,
  },
  fromText: {
    color: "#fff",
    fontSize: 16,
    marginBottom: 2,
    fontFamily: "Poppins-Regular",
  },
  logoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
    width: "100%",
    justifyContent: "center",
  },
  logoIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  logoText: {
    color: "#fff",
    fontSize: 24,
    fontFamily: "Poppins-Bold",
    letterSpacing: 1,
    flexShrink: 1,
    includeFontPadding: false,
  },
  systemsText: {
    color: "#fff",
    fontSize: 14,
    letterSpacing: 4,
    fontWeight: "300",
    fontFamily: "Poppins-Regular",
    includeFontPadding: false,
    marginLeft: 28,
  },
  image: {
    height: 28,
    width: 28,
  },
});

export default Onboarding1;
