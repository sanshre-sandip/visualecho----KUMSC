import AsyncStorage from "@react-native-async-storage/async-storage";
import { AppConfiguration } from "./model";

const STORAGE_KEY = "visualecho_config";

export type { AppConfiguration } from "./model";

export async function loadConfiguration(): Promise<AppConfiguration> {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed: AppConfiguration = JSON.parse(stored);
      return {
        setupCompleted: parsed.setupCompleted ?? false,
        setupStarted: parsed.setupStarted ?? false,
        demoMode: parsed.demoMode ?? false,
        aiMode: parsed.aiMode ?? "local",
        sttMode: parsed.sttMode ?? "local",
        ttsMode: parsed.ttsMode ?? "local",
      };
    }
    return {
      setupCompleted: false,
      setupStarted: false,
      demoMode: false,
      aiMode: "local",
      sttMode: "local",
      ttsMode: "local",
    };
  } catch (error) {
    console.warn("Failed to load configuration, using defaults", error);
    return {
      setupCompleted: false,
      setupStarted: false,
      demoMode: false,
      aiMode: "local",
      sttMode: "local",
      ttsMode: "local",
    };
  }
}

export async function saveConfiguration(config: AppConfiguration): Promise<boolean> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    return true;
  } catch (error) {
    console.warn("Failed to save configuration", error);
    return false;
  }
}