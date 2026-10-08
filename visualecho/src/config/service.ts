import AsyncStorage from "@react-native-async-storage/async-storage";
import { AppConfiguration, AIMode, StTMode, TTSMode, SetupMode } from "./model";

const STORAGE_KEY = "visualecho_config";

export type { AppConfiguration } from "./model";

export async function loadConfiguration(): Promise<AppConfiguration> {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed: AppConfiguration = JSON.parse(stored);
      return {
        setupCompleted: parsed.setupCompleted ?? false,
        aiMode: parsed.aiMode ?? "local",
        sttMode: parsed.sttMode ?? "local",
        ttsMode: parsed.ttsMode ?? "local",
      };
    }
    return {
      setupCompleted: false,
      aiMode: "local",
      sttMode: "local",
      ttsMode: "local",
    };
  } catch (error) {
    console.warn("Failed to load configuration, using defaults", error);
    return {
      setupCompleted: false,
      aiMode: "local",
      sttMode: "local",
      ttsMode: "local",
    };
  }
}

export async function saveConfiguration(config: AppConfiguration): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch (error) {
    console.warn("Failed to save configuration", error);
  }
}