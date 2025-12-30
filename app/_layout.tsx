import { useFonts } from 'expo-font';
import { Stack, useRouter, useSegments } from "expo-router";
import * as SplashScreen from 'expo-splash-screen';
import { onAuthStateChanged } from "firebase/auth";
import { useCallback, useEffect, useState } from 'react';
import { auth } from "./config/firebaseConfig";

// Prevent splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

export default function AppLayout() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const router = useRouter();
  const segments = useSegments();

  // Load Poppins fonts
  const [fontsLoaded, fontError] = useFonts({
    'Poppins-Regular': require('../assets/fonts/Poppins-Regular.ttf'),
    'Poppins-Medium': require('../assets/fonts/Poppins-Medium.ttf'),
    'Poppins-SemiBold': require('../assets/fonts/Poppins-SemiBold.ttf'),
    'Poppins-Bold': require('../assets/fonts/Poppins-Bold.ttf'),
    'Poppins-Light': require('../assets/fonts/Poppins-Light.ttf'),
  });

  // Check authentication state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsAuthenticated(!!user);
    });

    return () => unsubscribe();
  }, []);

  // Navigation logic
  const handleNavigation = useCallback(() => {
    if ((fontsLoaded || fontError) && isAuthenticated !== null) {
      // Hide splash screen immediately
      SplashScreen.hideAsync();

      const inAuthGroup = segments[0] === "(Main)" || segments[0] === "(Routes)";
      const hasSegments = segments.length > 0;

      if (isAuthenticated && !inAuthGroup) {
        // User is logged in, go to main app
        router.replace("/(Main)/Home");
      } else if (!isAuthenticated && inAuthGroup) {
        // User is not logged in but in protected routes, go to onboarding
        router.replace("/Onboarding1");
      } else if (!isAuthenticated && !hasSegments) {
        // Initial load, user not authenticated, go to onboarding
        router.replace("/Onboarding1");
      } else if (isAuthenticated && !hasSegments) {
        // Initial load, user authenticated, go to main app
        router.replace("/(Main)/Home");
      }
    }
  }, [fontsLoaded, fontError, isAuthenticated, segments, router]);

  // Hide splash screen and navigate as soon as fonts are loaded
  useEffect(() => {
    handleNavigation();
  }, [handleNavigation]);

  // Show nothing until fonts and auth are ready - this prevents any flash
  if (!fontsLoaded && !fontError) {
    return null;
  }

  if (isAuthenticated === null) {
    return null;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      {/* Onboarding flow */}
      <Stack.Screen name="Onboarding1" options={{ headerShown: false }} />

      {/* Authentication flow */}
      <Stack.Screen name="(Auth)" options={{ headerShown: false }} />

      {/* Main app flow (bottom tabs) */}
      <Stack.Screen name="(Main)" options={{ headerShown: false }} />
      
      {/* Routes */}
      <Stack.Screen name="(Routes)" options={{ headerShown: false }} />
    </Stack>
  );
}