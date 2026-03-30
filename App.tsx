// App.tsx
import {
    NavigationContainer,
    useNavigationContainerRef,
} from "@react-navigation/native";
import React, { useEffect } from "react";
import AppNavigator from "./src/navigation/AppNavigator";

import * as Font from "expo-font";
import * as SplashScreen from "expo-splash-screen";

// Keep splash while fonts load (optional)
SplashScreen.preventAutoHideAsync().catch(() => {});

function App() {
  const [fontsLoaded, setFontsLoaded] = React.useState(false);
  const navigationRef = useNavigationContainerRef();

  useEffect(() => {
    async function loadFonts() {
      await Font.loadAsync({
        DMSans_400Regular: require("./assets/fonts/DMSans-Regular.ttf"),
        DMSans_500Medium: require("./assets/fonts/DMSans-Medium.ttf"),
        DMSans_600SemiBold: require("./assets/fonts/DMSans-SemiBold.ttf"),
        DMSans_700Bold: require("./assets/fonts/DMSans-Bold.ttf"),
        DMSans_300Light: require("./assets/fonts/DMSans-Light.ttf"),
      });
      setFontsLoaded(true);
      SplashScreen.hideAsync().catch(() => {});
    }
    loadFonts();
  }, []);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <NavigationContainer ref={navigationRef}>
      <AppNavigator navigationRef={navigationRef} />
    </NavigationContainer>
  );
}

export default App;
