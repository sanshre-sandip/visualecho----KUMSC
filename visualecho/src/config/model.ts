export type AIMode = "local" | "cloud";

export type StTMode = "local";

export type TTSMode = "local";

export type SetupMode = "private-offline" | "cloud";

export interface AppConfiguration {
  setupCompleted: boolean;
  aiMode: AIMode;
  sttMode: StTMode;
  ttsMode: TTSMode;
}