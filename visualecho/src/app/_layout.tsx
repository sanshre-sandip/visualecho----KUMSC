import React, { useEffect, useRef, useState } from "react";
import { View, StyleSheet, SafeAreaView, StatusBar } from "react-native";
import { DarkTheme, ThemeProvider } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import WelcomeScreen from "./welcome";
import ChooseAIScreen from "./choose-ai";
import LocalComponentsScreen from "./local-components";
import ReviewSetupScreen from "./review-setup";
import SetupProgressScreen from "@/components/SetupProgressScreen";
import type { SetupProgressPhase } from "@/components/SetupProgressScreen";
import { loadConfiguration, saveConfiguration } from "@/config/service";
import type { AppConfiguration } from "@/config/model";
import { createStorageBackedModelManager } from "@/models/ModelStorage";
import type { ModelDefinition } from "@/models/ModelDefinition";
import type { ModelStatus } from "@/models/ModelStatus";

SplashScreen.preventAutoHideAsync();

const modelManager = createStorageBackedModelManager();

function normalizeAIMode(mode: string): "local" | "cloud" {
  return mode === "cloud" ? "cloud" : "local";
}

export default function RootLayout() {
  const [appReady, setAppReady] = useState<boolean>(false);
  const [initialized, setInitialized] = useState<boolean>(false);
  const [setupStep, setSetupStep] = useState<string>("welcome");
  const [aiMode, setAiMode] = useState<"local" | "cloud">("local");
  const [setupPhase, setSetupPhase] = useState<SetupProgressPhase>("idle");
  const [requiredModels, setRequiredModels] = useState<ModelDefinition[]>([]);
  const [modelStatuses, setModelStatuses] = useState<ModelStatus[]>([]);
  const [setupMessage, setSetupMessage] = useState<string | null>(null);
  const setupController = useRef<AbortController | null>(null);

  useEffect(() => {
    let mounted = true;

    const restoreSetup = async () => {
      const config = await loadConfiguration();
      if (!mounted) {
        return;
      }
      const restoredMode = normalizeAIMode(config.aiMode);
      setAiMode(restoredMode);

      if (config.setupCompleted) {
        const missing = await modelManager.getMissingModels(config);
        if (!mounted) {
          return;
        }
        if (missing.length === 0) {
          setAppReady(true);
        } else {
          const models = await modelManager.getRequiredModels(config);
          const statuses = await Promise.all(
            models.map(async (model) =>
              (await modelManager.getModelStatus(model.id)) ?? {
                modelId: model.id,
                state: "not_installed" as const,
                progress: null,
                error: null,
                errorCode: null,
                installedVersion: null,
              },
            ),
          );
          if (!mounted) {
            return;
          }
          setRequiredModels(models);
          setModelStatuses(statuses);
          setSetupMessage("Required models are missing or invalid. Set them up again to continue.");
          setSetupPhase("idle");
          setSetupStep("setup-progress");
          await saveConfiguration({ ...config, setupCompleted: false, setupStarted: true });
        }
      } else if (config.setupStarted) {
        const models = await modelManager.getRequiredModels(config);
        const statuses = await Promise.all(
          models.map(async (model) =>
            (await modelManager.getModelStatus(model.id)) ?? {
              modelId: model.id,
              state: "not_installed" as const,
              progress: null,
              error: null,
              errorCode: null,
              installedVersion: null,
            },
          ),
        );
        if (!mounted) {
          return;
        }
        setRequiredModels(models);
        setModelStatuses(statuses);
        setSetupMessage("Previous setup did not finish. Review model status and retry when ready.");
        setSetupPhase("idle");
        setSetupStep("setup-progress");
      } else {
        setSetupStep("welcome");
      }

      if (mounted) {
        setInitialized(true);
      }
    };

    void restoreSetup();
    return () => {
      mounted = false;
      setupController.current?.abort();
    };
  }, []);

  const beginSetup = async () => {
    const controller = new AbortController();
    setupController.current?.abort();
    setupController.current = controller;
    const config: AppConfiguration = {
      setupCompleted: false,
      setupStarted: true,
      aiMode,
      sttMode: "local",
      ttsMode: "local",
    };

    setSetupStep("setup-progress");
    setSetupPhase("preparing");
    setSetupMessage(null);
    setModelStatuses([]);

    try {
      if (!(await saveConfiguration(config))) {
        setSetupPhase("error");
        setSetupMessage("Setup progress could not be saved. Check app storage and retry.");
        return;
      }
      const models = await modelManager.getRequiredModels(config);
      setRequiredModels(models);
      const initialStatuses = await Promise.all(
        models.map(async (model) =>
          (await modelManager.getModelStatus(model.id)) ?? {
            modelId: model.id,
            state: "not_installed" as const,
            progress: null,
            error: null,
            errorCode: null,
            installedVersion: null,
          },
        ),
      );
      setModelStatuses(initialStatuses);

      const statuses = await modelManager.installRequiredModels(
        config,
        {
          onPhase: setSetupPhase,
          onStatus: (status) => {
            setModelStatuses((current) => {
              const index = current.findIndex((item) => item.modelId === status.modelId);
              if (index < 0) {
                return [...current, status];
              }
              return current.map((item) =>
                item.modelId === status.modelId ? status : item,
              );
            });
          },
        },
        controller.signal,
      );
      setModelStatuses(statuses);

      const missing = await modelManager.getMissingModels(config);
      if (missing.length === 0) {
        if (!(await saveConfiguration({ ...config, setupCompleted: true, setupStarted: false }))) {
          setSetupPhase("error");
          setSetupMessage("Setup could not be saved. Retry before continuing to Home.");
          return;
        }
        setSetupPhase("complete");
      } else {
        setSetupPhase("error");
        setSetupMessage(
          statuses.find((status) => status.state === "error")?.error ??
            "Some required local models could not be verified. Retry setup.",
        );
      }
    } catch {
      setSetupPhase("error");
      setSetupMessage("VisualEcho could not prepare model setup. Check device access and retry.");
    } finally {
      if (setupController.current === controller) {
        setupController.current = null;
      }
    }
  };

  if (!initialized) {
    return null;
  }

  if (!appReady) {
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
                  const selectedMode = normalizeAIMode(mode);
                  const newConfig: AppConfiguration = {
                    setupCompleted: false,
                    setupStarted: false,
                    aiMode: selectedMode,
                    sttMode: "local",
                    ttsMode: "local",
                  };
                  saveConfiguration(newConfig).then(() => {
                    setAiMode(selectedMode);
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
                aiMode={aiMode}
                onBack={() => setSetupStep("local-components")}
                onComplete={() => void beginSetup()}
              />
            </SafeAreaView>
          </ThemeProvider>
        );
      case "setup-progress":
        return (
          <ThemeProvider value={DarkTheme}>
            <SafeAreaView style={styles.safeArea}>
              <StatusBar barStyle="dark-content" />
              <SetupProgressScreen
                aiMode={aiMode}
                phase={setupPhase}
                models={requiredModels}
                statuses={modelStatuses}
                message={setupMessage}
                onStart={() => void beginSetup()}
                onCancel={() => setupController.current?.abort()}
                onContinue={() => setAppReady(true)}
                onBack={() => {
                  setupController.current?.abort();
                  setSetupStep("review");
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