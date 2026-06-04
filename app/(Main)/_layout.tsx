import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import React from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const MainLayout = () => {
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#1155CC",
        tabBarInactiveTintColor: "#9CA3AF",
        headerShown: false,
        tabBarHideOnKeyboard: true,
        tabBarShowLabel: true,
        tabBarStyle: {
          backgroundColor: "#FFFFFF",
          borderTopWidth: 1,
          borderTopColor: "#E5E7EB",
          paddingBottom: insets.bottom > 0 ? insets.bottom : 8,
          paddingTop: 6,
          height: 64 + insets.bottom,
          shadowColor: "#000",
          shadowOffset: {
            width: 0,
            height: -2,
          },
        },
        tabBarItemStyle: {
          paddingVertical: 2,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          lineHeight: 14,
          marginTop: 2,
          marginBottom: 2,
        },
        tabBarIconStyle: {
          marginTop: 0,
        },
      }}
    >
      <Tabs.Screen
        name="Home"
        options={{
          title: "Home",
          tabBarIcon: ({ color }) => (
            <Ionicons name="home-outline" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="Inventory"
        options={{
          title: "Inventory",
          tabBarIcon: ({ color }) => (
            <Ionicons name="folder-open-outline" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="Sell"
        options={{
          title: "Sell",
          tabBarIcon: ({ color }) => (
            <Ionicons name="cart-outline" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="Finance"
        options={{
          title: "Finance",
          tabBarIcon: ({ color }) => (
            <Ionicons name="bar-chart-outline" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="More"
        options={{
          title: "More",
          tabBarIcon: ({ color }) => (
            <Ionicons
              name="ellipsis-horizontal-circle-outline"
              size={24}
              color={color}
            />
          ),
        }}
      />
    </Tabs>
  );
};

export default MainLayout;
