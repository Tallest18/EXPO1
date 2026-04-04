import { Tabs } from "expo-router";
import {
  ChartColumnIncreasing,
  CircleEllipsis,
  FolderOpen,
  House,
  ShoppingCart,
} from "lucide-react-native";
import React from "react";
import { Text } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const MainLayout = () => {
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "black", // active = black
        tabBarInactiveTintColor: "#1155CC", // inactive = blue
        headerShown: false,
        tabBarHideOnKeyboard: true,
        tabBarStyle: {
          backgroundColor: "#FFFFFF",
          borderTopWidth: 1,
          borderTopColor: "#E5E7EB",
          paddingBottom: insets.bottom + 6,
          paddingTop: 8,
          height: 58 + insets.bottom,
          shadowColor: "#000",
          shadowOffset: {
            width: 0,
            height: -2,
          },
        },
        tabBarLabelStyle: {
          fontSize: 16,
          fontWeight: "500",
          marginTop: 4,
          fontFamily: "DMSans_400Regular",
        },
        tabBarIconStyle: {
          marginTop: 2,
        },
      }}
    >
      <Tabs.Screen
        name="Home"
        options={{
          title: "Home",
          tabBarIcon: ({ color, focused }) => <House size={32} color={color} />,
          tabBarLabel: ({ focused }) => (
            <Text
              style={{
                color: focused ? "#000000" : "#B5CAEF",
                fontSize: 16,
                fontWeight: "500",
                marginTop: 4,
                fontFamily: "DMSans_400Regular",
              }}
            >
              Home
            </Text>
          ),
        }}
      />
      <Tabs.Screen
        name="Inventory"
        options={{
          title: "Inventory",
          tabBarIcon: ({ color, focused }) => (
            <FolderOpen size={32} color={color} />
          ),
          tabBarLabel: ({ focused }) => (
            <Text
              style={{
                color: focused ? "#000000" : "#D2D2D2", // Example: blue when active, light blue when inactive
                fontSize: 16,
                fontWeight: "500",
                marginTop: 4,
                fontFamily: "DMSans_400Regular",
              }}
            >
              Inventory
            </Text>
          ),
        }}
      />
      <Tabs.Screen
        name="Sell"
        options={{
          title: "Sell",
          tabBarIcon: ({ color, focused }) => (
            <ShoppingCart size={32} color={color} />
          ),
          tabBarLabel: ({ focused }) => (
            <Text
              style={{
                color: focused ? "#000000" : "#D2D2D2", // Example: orange when active, light blue when inactive
                fontSize: 16,
                fontWeight: "500",
                marginTop: 4,
                fontFamily: "DMSans_400Regular",
              }}
            >
              Sell
            </Text>
          ),
        }}
      />
      <Tabs.Screen
        name="Finance"
        options={{
          title: "Finance",
          tabBarIcon: ({ color, focused }) => (
            <ChartColumnIncreasing size={32} color={color} />
          ),
          tabBarLabel: ({ focused }) => (
            <Text
              style={{
                color: focused ? "#000000" : "#D2D2D2", // Example: green when active, light blue when inactive
                fontSize: 16,
                fontWeight: "500",
                marginTop: 4,
                fontFamily: "DMSans_400Regular",
              }}
            >
              Finance
            </Text>
          ),
        }}
      />
      <Tabs.Screen
        name="More"
        options={{
          title: "More",
          tabBarIcon: ({ color, focused }) => (
            <CircleEllipsis size={32} color={color} />
          ),
          tabBarLabel: ({ focused }) => (
            <Text
              style={{
                color: focused ? "#000000" : "#D2D2D2", // Example: dark blue when active, light blue when inactive
                fontSize: 16,
                fontWeight: "500",
                marginTop: 4,
                fontFamily: "DMSans_400Regular",
              }}
            >
              More
            </Text>
          ),
        }}
      />
    </Tabs>
  );
};

export default MainLayout;
