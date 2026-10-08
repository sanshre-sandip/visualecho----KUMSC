import type { ModelInstallState } from "./ModelStatus";

export type ModelType = "llm" | "stt" | "tts";

export type ModelPlatform = "android" | "ios" | "all";

export interface ModelChecksum {
  algorithm: "md5" | "sha256";
  value: string;
}

export interface ModelDownloadSource {
  type: "https";
  url: string;
}

export interface ModelDefinition {
  id: string;
  name: string;
  type: ModelType;
  description: string;
  /** Approximate size in MB. null until the size is verified. */
  approximateSizeMb: number | null;
  /** Exact download/storage size. null until confirmed for an artifact. */
  sizeBytes: number | null;
  /**
   * Whether this model is always required regardless of the active
   * configuration. STT and TTS are always local, so they are required.
   * Configuration-dependent models (such as the local LLM) set this to false;
   * use ModelManager.getRequiredModels(config) to compute effective needs.
   */
  required: boolean;
  /** Baseline registered install state; live state comes from ModelManager. */
  status: ModelInstallState;
  /** Expected version. null until the model version is verified. */
  version: string | null;
  format: string | null;
  downloadSource: ModelDownloadSource | null;
  checksum: ModelChecksum | null;
  /** Execution runtime (e.g. native, GGUF, ONNX). null until verified. */
  runtime: string | null;
  /** Platforms this model can run on. */
  platform: ModelPlatform;
  requiredMemoryBytes: number | null;
  requiredStorageBytes: number | null;
  /** Exact relative artifact paths required before this model can be installed. */
  expectedFiles: readonly string[] | null;
}

export interface CreateModelDefinitionInput {
  id: string;
  name: string;
  type: ModelType;
  description: string;
  approximateSizeMb?: number | null;
  sizeBytes?: number | null;
  required?: boolean;
  status?: ModelInstallState;
  version?: string | null;
  format?: string | null;
  downloadSource?: ModelDownloadSource | null;
  checksum?: ModelChecksum | null;
  runtime?: string | null;
  platform?: ModelPlatform;
  requiredMemoryBytes?: number | null;
  requiredStorageBytes?: number | null;
  expectedFiles?: readonly string[] | null;
}

export function createModelDefinition(input: CreateModelDefinitionInput): ModelDefinition {
  if (input.downloadSource && !input.downloadSource.url.startsWith("https://")) {
    throw new Error("Model download sources must use HTTPS.");
  }

  return {
    id: input.id,
    name: input.name,
    type: input.type,
    description: input.description,
    approximateSizeMb: input.approximateSizeMb ?? null,
    sizeBytes: input.sizeBytes ?? null,
    required: input.required ?? false,
    status: input.status ?? "not_installed",
    version: input.version ?? null,
    format: input.format ?? null,
    downloadSource: input.downloadSource ?? null,
    checksum: input.checksum ?? null,
    runtime: input.runtime ?? null,
    platform: input.platform ?? "android",
    requiredMemoryBytes: input.requiredMemoryBytes ?? null,
    requiredStorageBytes: input.requiredStorageBytes ?? null,
    expectedFiles: input.expectedFiles ?? null,
  };
}