import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useFonts } from "expo-font";
import { Stack, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useCallback, useEffect, useState } from "react";
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

  const [fontsLoaded, fontError] = useFonts(FONT_ASSETS);

  useEffect(() => {
    if (!fontsLoaded && !fontError) {
      return;
    }

    const textComponent = Text as typeof Text & {
      defaultProps?: {
        style?: unknown;
        allowFontScaling?: boolean;
        maxFontSizeMultiplier?: number;
      };
    };
    const textInputComponent = TextInput as typeof TextInput & {
      defaultProps?: {
        style?: unknown;
        allowFontScaling?: boolean;
        maxFontSizeMultiplier?: number;
      };
    };

    textComponent.defaultProps = {
      ...textComponent.defaultProps,
      allowFontScaling: false,
      maxFontSizeMultiplier: 1,
      style: [
        { fontFamily: FONT_FAMILY.regular },
        textComponent.defaultProps?.style,
      ],
    };

    textInputComponent.defaultProps = {
      ...textInputComponent.defaultProps,
      allowFontScaling: false,
      maxFontSizeMultiplier: 1,
      style: [
        { fontFamily: FONT_FAMILY.regular },
        textInputComponent.defaultProps?.style,
      ],
    };
  }, [fontError, fontsLoaded]);

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

  const handleNavigation = useCallback(() => {
    if ((fontsLoaded || fontError) && isAuthenticated !== null) {
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
        router.replace("/(Main)/Home");
      } else if (!isAuthenticated && inProtectedGroup) {
        getAccessToken().then((token) => {
          if (token) {
            setIsAuthenticated(true);
          } else {
            router.replace("/(Auth)/WelcomeScreen");
          }
        });
      } else if (!isAuthenticated && !hasSegments) {
        router.replace("/(Anboarding)/Onboarding1");
      } else if (isAuthenticated && !hasSegments) {
        router.replace("/(Main)/Home");
      }
    }
  }, [fontsLoaded, fontError, isAuthenticated, segments, router]);

  useEffect(() => {
    handleNavigation();
  }, [handleNavigation]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  if (isAuthenticated === null) {
    return null;
  }

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
          <Stack.Screen name="(Anboarding)" options={{ headerShown: false }} />
          <Stack.Screen name="(Auth)" options={{ headerShown: false }} />
          <Stack.Screen name="(Main)" options={{ headerShown: false }} />
          <Stack.Screen name="(Routes)" options={{ headerShown: false }} />
        </Stack>

        {/* Rendered outside Stack so it sits above the tab bar */}
        <AddProductFlow
          visible={showAddProduct}
          onClose={() => setShowAddProduct(false)}
          onSaveProduct={(product) => {
            // handle save if needed at root level
            setShowAddProduct(false);
          }}
        />
      </AddProductContext.Provider>
    </QueryClientProvider>
  );
}
