import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useFonts } from "expo-font";
import { Stack, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useCallback, useEffect, useRef, useState } from "react";
import { Platform, Text, TextInput } from "react-native";
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

import { AddProductContext } from "@/context/AddProductContext";
import { clearTokens, getAccessToken, getProfile } from "@/src/api";
import { FONT_ASSETS, FONT_FAMILY } from "../constants/fonts";
import AddProductFlow from "./(Routes)/AddProductFlow";

SplashScreen.preventAutoHideAsync();

export default function AppLayout() {
  return (
    <SafeAreaProvider>
      <AppContent />
    </SafeAreaProvider>
  );
}

function AppContent() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [queryClient] = useState(() => new QueryClient());
  const [showAddProduct, setShowAddProduct] = useState(false);
  const router = useRouter();
  const segments = useSegments();
  const insets = useSafeAreaInsets();
  const navigationHandled = useRef(false);

  const [fontsLoaded, fontError] = useFonts(FONT_ASSETS);

  // --- Global font defaults ---
  useEffect(() => {
    if (!fontsLoaded && !fontError) return;

    (Text as any).defaultProps = {
      ...(Text as any).defaultProps,
      allowFontScaling: false,
      maxFontSizeMultiplier: 1,
      style: [
        { fontFamily: FONT_FAMILY.regular },
        (Text as any).defaultProps?.style,
      ],
    };

    (TextInput as any).defaultProps = {
      ...(TextInput as any).defaultProps,
      allowFontScaling: false,
      maxFontSizeMultiplier: 1,
      style: [
        { fontFamily: FONT_FAMILY.regular },
        (TextInput as any).defaultProps?.style,
      ],
    };
  }, [fontsLoaded, fontError]);

  // --- Bootstrap auth session ---
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

  // --- Handle navigation based on auth state ---
  const handleNavigation = useCallback(() => {
    const fontsReady = fontsLoaded || fontError;
    const authReady = isAuthenticated !== null;
    const routerReady = segments.length > 0 && !!segments[0];

    if (!fontsReady || !authReady || !routerReady) return;
    if (navigationHandled.current) return;

    SplashScreen.hideAsync();

    const inProtectedGroup =
      segments[0] === "(Main)" || segments[0] === "(Routes)";
    const inAuthFlow = segments[0] === "(Auth)";
    const inOnboardingFlow = segments[0] === "(Onboarding)";
    const alreadyInCorrectPlace =
      (isAuthenticated && inProtectedGroup) || (!isAuthenticated && inAuthFlow);

    if (alreadyInCorrectPlace) return;

    // FIX: Set the flag BEFORE calling router.replace so a re-render
    // triggered by the replace cannot fire this callback a second time.
    // The old setTimeout(..., 100) caused a race: if the user tapped a tab
    // within that 100 ms window, Expo Router tore down part of the navigator
    // tree, and when the timeout fired it called History.pushState on a null
    // node → "Cannot read properties of null (reading 'dispatchEvent')".
    navigationHandled.current = true;

    if (isAuthenticated && !inProtectedGroup) {
      router.replace("/(Main)/Home");
    } else if (!isAuthenticated && inProtectedGroup) {
      router.replace("/(Auth)/WelcomeScreen");
    } else if (!isAuthenticated && !inOnboardingFlow) {
      router.replace("/(Onboarding)/Onboarding1");
    }
  }, [fontsLoaded, fontError, isAuthenticated, segments, router]);

  useEffect(() => {
    handleNavigation();
  }, [handleNavigation]);

  if (!fontsLoaded && !fontError) return null;
  if (isAuthenticated === null) return null;

  return (
    <QueryClientProvider client={queryClient}>
      <AddProductContext.Provider
        value={{ openAddProduct: () => setShowAddProduct(true) }}
      >
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: {
              paddingTop: Platform.OS === "android" ? insets.top : 0,
              backgroundColor: "#E7EEFA",
            },
          }}
        >
          <Stack.Screen name="(Onboarding)" options={{ headerShown: false }} />
          <Stack.Screen name="(Auth)" options={{ headerShown: false }} />
          <Stack.Screen name="(Main)" options={{ headerShown: false }} />
          <Stack.Screen name="(Routes)" options={{ headerShown: false }} />
        </Stack>

        <AddProductFlow
          visible={showAddProduct}
          onClose={() => setShowAddProduct(false)}
          onSaveProduct={() => setShowAddProduct(false)}
        />
      </AddProductContext.Provider>
    </QueryClientProvider>
  );
}
