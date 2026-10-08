import React, { useEffect, useState } from "react";
import { View, StyleSheet } from "react-native";
import { DarkTheme, ThemeProvider } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import WelcomeScreen from "./welcome";
import ChooseAIScreen from "./choose-ai";
import LocalComponentsScreen from "./local-components";
import ReviewSetupScreen from "./review-setup";
import { loadConfiguration, saveConfiguration, AppConfiguration } from "@/config/service";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [setupCompleted, setSetupCompleted] = useState<boolean>(false);
  const [setupStep, setSetupStep] = useState<string>("welcome");
  const [aiMode, setAiMode] = useState<string>("local");

  useEffect(() => {
    loadConfiguration().then((config: AppConfiguration) => {
      if (config.setupCompleted) {
        setSetupCompleted(true);
      } else {
        setSetupStep("welcome");
      }
    });
  }, []);

  // If setup is not completed, manage the setup flow steps
  if (!setupCompleted) {
    switch (setupStep) {
      case "welcome":
        return (
          <ThemeProvider value={DarkTheme}>
            <SafeAreaView style={styles.safeArea}>
              <StatusBar barStyle="light-content" />
              <WelcomeScreen
                onContinue={() => setSetupStep("choose-ai")}
              />
            </SafeAreaView>
          </ThemeProvider>
        );
      case "choose-ai":
        return (
          <ThemeProvider value={DarkTheme}>
            <SafeAreaView style={styles.safeArea}>
              <StatusBar barStyle="light-content" />
              <ChooseAIScreen
                onSelect={(mode: string) => {
                  const newConfig: AppConfiguration = {
                    setupCompleted: false,
                    aiMode: mode,
                    sttMode: "local",
                    ttsMode: "local",
                  };
                  saveConfiguration(newConfig).then(() => {
                    setAiMode(mode);
                    setSetupStep("local-components");
                  });
                }}
              />
            </SafeAreaView>
          </ThemeProvider>
        );
      case "local-components":
        return (
          <ThemeProvider value={DarkTheme}>
            <SafeAreaView style={styles.safeArea}>
              <StatusBar barStyle="light-content" />
              <LocalComponentsScreen
                onContinue={() => setSetupStep("review")}
              />
            </SafeAreaView>
          </ThemeProvider>
        );
      case "review":
        return (
          <ThemeProvider value={DarkTheme}>
            <SafeAreaView style={styles.safeArea}>
              <StatusBar barStyle="light-content" />
              <ReviewSetupScreen
                aiMode={aiMode ?? "local"}
                onBack={() => setSetupStep("local-components")}
                onComplete={() => {
                  saveConfiguration({
                    setupCompleted: true,
                    aiMode: aiMode ?? "local",
                    sttMode: "local",
                    ttsMode: "local",
                  }).then(() => {
                    setSetupCompleted(true);
                  });
                }}
              />
            </SafeAreaView>
          </ThemeProvider>
        );
      default:
        return null;
    }
  }

  // If setup is completed, show the main app (expo-router managed routes)
  return (
    <ThemeProvider value={DarkTheme}>
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="light-content" />
        <View style={styles.mainContainer}>
          {/* expo-router will render the matching route below (index, practice, etc.) */}
        </View>
      </SafeAreaView>
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#fff",
  },
  mainContainer: {
    flex: 1,
    backgroundColor: "#fff",
  },
});