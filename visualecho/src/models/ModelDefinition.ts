import type { ModelInstallState } from "./ModelStatus";

export type ModelType = "llm" | "stt" | "tts";

export type ModelPlatform = "android" | "ios" | "all";

export interface ModelDefinition {
  id: string;
  name: string;
  type: ModelType;
  description: string;
  /** Approximate size in MB. null until the size is verified. */
  approximateSizeMb: number | null;
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
  /** Execution runtime (e.g. native, GGUF, ONNX). null until verified. */
  runtime: string | null;
  /** Platforms this model can run on. */
  platform: ModelPlatform;
}

export interface CreateModelDefinitionInput {
  id: string;
  name: string;
  type: ModelType;
  description: string;
  approximateSizeMb?: number | null;
  required?: boolean;
  status?: ModelInstallState;
  version?: string | null;
  runtime?: string | null;
  platform?: ModelPlatform;
}

export function createModelDefinition(input: CreateModelDefinitionInput): ModelDefinition {
  return {
    id: input.id,
    name: input.name,
    type: input.type,
    description: input.description,
    approximateSizeMb: input.approximateSizeMb ?? null,
    required: input.required ?? false,
    status: input.status ?? "not_installed",
    version: input.version ?? null,
    runtime: input.runtime ?? null,
    platform: input.platform ?? "android",
  };
}