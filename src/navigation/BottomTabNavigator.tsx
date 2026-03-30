import Finance from "@/app/(Main)/Finance";
import Home from "@/app/(Main)/Home";
import Inventory from "@/app/(Main)/Inventory";
import More from "@/app/(Main)/More";
import Sell from "@/app/(Main)/Sell";
import { Ionicons } from "@expo/vector-icons";
import Octicons from "@expo/vector-icons/Octicons";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import React from "react";

const Tab = createBottomTabNavigator();

const BottomTabNavigator = () => {
  return (
    <Tab.Navigator
      initialRouteName="Home"
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ color, size }) => {
          if (route.name === "Home") {
            return <Octicons name="home-fill" size={size} color="black" />;
          } else if (route.name === "Inventory") {
            return <Ionicons name="albums-outline" size={size} color={color} />;
          } else if (route.name === "Sell") {
            return <Ionicons name="cart-outline" size={size} color={color} />;
          } else if (route.name === "Finance") {
            return <Ionicons name="wallet-outline" size={size} color={color} />;
          } else if (route.name === "More") {
            // Use Octicons for the "More" tab
            return <Octicons name="gear" size={size} color={color} />;
          }
          // Default fallback
          return (
            <Ionicons name="alert-circle-outline" size={size} color={color} />
          );
        },
        tabBarActiveTintColor: "#1155CC",
        tabBarInactiveTintColor: "#9CA3AF",
      })}
    >
      <Tab.Screen name="Home" component={Home} />
      <Tab.Screen name="Inventory" component={Inventory} />
      <Tab.Screen name="Sell" component={Sell} />
      <Tab.Screen name="Finance" component={Finance} />
      <Tab.Screen name="More" component={More} />
    </Tab.Navigator>
  );
};

export default BottomTabNavigator;
