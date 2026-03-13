import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useFonts } from "expo-font";
import { Stack, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useCallback, useEffect, useState } from "react";

import { clearTokens, getAccessToken, getProfile } from "@/src/api";

// Prevent splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

export default function AppLayout() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [queryClient] = useState(() => new QueryClient());
  const router = useRouter();
  const segments = useSegments();

  // Load Poppins fonts
  const [fontsLoaded, fontError] = useFonts({
    "Poppins-Regular": require("../assets/fonts/Poppins-Regular.ttf"),
    "Poppins-Medium": require("../assets/fonts/Poppins-Medium.ttf"),
    "Poppins-SemiBold": require("../assets/fonts/Poppins-SemiBold.ttf"),
    "Poppins-Bold": require("../assets/fonts/Poppins-Bold.ttf"),
    "Poppins-Light": require("../assets/fonts/Poppins-Light.ttf"),
  });

  // Bootstrap session from JWT token + profile probe
  useEffect(() => {
    let cancelled = false;

    const bootstrapSession = async () => {
      try {
        const accessToken = await getAccessToken();
        if (!accessToken) {
          if (!cancelled) setIsAuthenticated(false);
          return;
        }

        await getProfile();
        if (!cancelled) setIsAuthenticated(true);
      } catch {
        await clearTokens();
        if (!cancelled) setIsAuthenticated(false);
      }
    };

    bootstrapSession();

    return () => {
      cancelled = true;
    };
  }, []);

  // Navigation logic
  const handleNavigation = useCallback(() => {
    if ((fontsLoaded || fontError) && isAuthenticated !== null) {
      // Hide splash screen immediately
      SplashScreen.hideAsync();

      const inProtectedGroup =
        segments[0] === "(Main)" || segments[0] === "(Routes)";
      const inAuthFlow = segments[0] === "(Auth)";
      const inOnboardingFlow = segments[0] === "(Anboarding)";
      const hasSegments = segments.length > 0;

      if (
        isAuthenticated &&
        !inProtectedGroup &&
        !inAuthFlow &&
        !inOnboardingFlow
      ) {
        // User is logged in, go to main app
        router.replace("/(Main)/Home");
      } else if (!isAuthenticated && inProtectedGroup) {
        // Re-verify token in case user just completed OTP login (bootstrap ran before tokens were saved)
        getAccessToken().then((token) => {
          if (token) {
            setIsAuthenticated(true);
          } else {
            router.replace("/(Auth)/WelcomeScreen");
          }
        });
      } else if (!isAuthenticated && !hasSegments) {
        // Initial load, user not authenticated, go to onboarding
        router.replace("/(Anboarding)/Onboarding1");
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
    <QueryClientProvider client={queryClient}>
      <Stack screenOptions={{ headerShown: false }}>
        {/* Onboarding flow */}
        <Stack.Screen name="(Anboarding)" options={{ headerShown: false }} />

        {/* Authentication flow */}
        <Stack.Screen name="(Auth)" options={{ headerShown: false }} />

        {/* Main app flow (bottom tabs) */}
        <Stack.Screen name="(Main)" options={{ headerShown: false }} />

        {/* Routes */}
        <Stack.Screen name="(Routes)" options={{ headerShown: false }} />
      </Stack>
    </QueryClientProvider>
  );
}
