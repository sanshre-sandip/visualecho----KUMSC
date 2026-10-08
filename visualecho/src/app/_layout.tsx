import { DarkTheme, DefaultTheme, ThemeProvider } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect, useState } from "react";
import { SafeAreaView, StatusBar } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { loadConfiguration, saveConfiguration, AppConfiguration } from "@/config/service";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const navigation = useNavigation();
  const [configuration, setConfiguration] = useState<AppConfiguration>({
    setupCompleted: false,
    aiMode: "local",
    sttMode: "local",
    ttsMode: "local",
  });

  useEffect(() => {
    loadConfiguration().then((config) => {
      setConfiguration(config);
      if (config.setupCompleted) {
        navigation.navigate("Home");
      } else {
        navigation.replace("Welcome");
      }
    });
  }, [navigation]);

  return (
    <ThemeProvider value={DarkTheme}>
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="light-content" />
      </SafeAreaView>
    </ThemeProvider>
  );
}

const styles = {
  safeArea: {
    flex: 1,
    backgroundColor: "#fff",
  },
};