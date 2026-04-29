import { createStackNavigator } from "@react-navigation/stack";
import React, { useEffect } from "react";
import { AppStackParamList } from "./types";

// Import all your screen components
import BusinessSelectionScreen from "@/app/(Auth)/BusinessSelectionScreen";
import VerificationScreen from "@/app/(Auth)/VerificationScreen";
import WelcomeScreen from "@/app/(Auth)/WelcomeScreen";
import Onboarding1 from "@/app/(Onboarding)/Onboarding1";
import Cart from "@/app/(Routes)/Cart";
import Checkout from "@/app/(Routes)/Checkout";
import MessagesScreen from "@/app/(Routes)/MessagesScreen";
import NotificationsScreen from "@/app/(Routes)/NotificationsScreen";
import ProductDetails from "@/app/(Routes)/ProductDetails";
import Profile from "@/app/(Routes)/Profile";
import QuickSellScreen from "@/app/(Routes)/QuickSellScreen";
import RestockDetails from "@/app/(Routes)/RestockDetails";
import SalesDetailScreen from "@/app/(Routes)/SalesDetailScreen";
import TotalSummaryScreen from "@/app/(Routes)/TotalSummaryScreen";
// import BottomTabNavigator from "./BottomTabNavigator";

const Stack = createStackNavigator<AppStackParamList>();

const AppNavigator = ({ navigationRef }: { navigationRef?: any }) => {
  useEffect(() => {
    if (
      !navigationRef ||
      !navigationRef.isReady ||
      typeof navigationRef.getRootState !== "function"
    )
      return;
    if (navigationRef.isReady) {
      const state = navigationRef.getRootState();
      if (state && state.routes && state.routes.length === 1) {
        const route = state.routes[0];
        if (route.name !== "(Main)") {
          navigationRef.reset({
            index: 0,
            routes: [{ name: "(Main)" }],
          });
        }
      }
    }
  }, [navigationRef]);

  return (
    <Stack.Navigator
      screenOptions={{ headerShown: false }}
      initialRouteName="Onboarding1"
    >
      {/* Onboarding and Authentication Flow */}
      <Stack.Screen name="Onboarding1" component={Onboarding1} />
      <Stack.Screen name="WelcomeScreen" component={WelcomeScreen} />
      <Stack.Screen name="VerificationScreen" component={VerificationScreen} />
      <Stack.Screen
        name="BusinessSelectionScreen"
        component={BusinessSelectionScreen}
      />

      {/* App-specific routes */}
      <Stack.Screen name="Notifications" component={NotificationsScreen} />
      <Stack.Screen
        name="RestockDetails"
        component={RestockDetails}
        options={{ headerShown: false }}
      />
      <Stack.Screen name="TotalSummary" component={TotalSummaryScreen} />
      <Stack.Screen name="SalesDetail" component={SalesDetailScreen} />
      <Stack.Screen name="QuickSell" component={QuickSellScreen} />
      <Stack.Screen name="Messages" component={MessagesScreen} />
      <Stack.Screen name="Profile" component={Profile} />
      <Stack.Screen name="Cart" component={Cart} />
      <Stack.Screen name="Checkout" component={Checkout} />
      <Stack.Screen name="ProductDetails" component={ProductDetails} />

      {/* Main app flow (bottom tabs) */}
      {/* <Stack.Screen name="(Main)" component={BottomTabNavigator} /> */}
    </Stack.Navigator>
  );
};

export default AppNavigator;
