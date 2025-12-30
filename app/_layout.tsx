import { useFonts } from 'expo-font';
import { Stack } from "expo-router";
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';

// Prevent splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

export default function AppLayout() {
  // Load Poppins fonts
  const [fontsLoaded, fontError] = useFonts({
    'Poppins-Regular': require('../assets/fonts/Poppins-Regular.ttf'),
    'Poppins-Medium': require('../assets/fonts/Poppins-Medium.ttf'),
    'Poppins-SemiBold': require('../assets/fonts/Poppins-SemiBold.ttf'),
    'Poppins-Bold': require('../assets/fonts/Poppins-Bold.ttf'),
    'Poppins-Light': require('../assets/fonts/Poppins-Light.ttf'),
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      // Hide splash screen when fonts are loaded
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  // Don't render anything until fonts are loaded
  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <Stack screenOptions={{ headerShown: false }} initialRouteName="index">
      {/* Onboarding flow */}
      <Stack.Screen name="index" />

      {/* Authentication flow */}
      <Stack.Screen name="(Auth)" />

      {/* Main app flow (bottom tabs) */}
      <Stack.Screen name="(Main)" />
      
      {/* Routes */}
      <Stack.Screen name="(Routes)" />
    </Stack>
  );
}