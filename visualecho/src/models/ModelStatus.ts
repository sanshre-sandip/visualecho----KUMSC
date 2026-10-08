import type { ModelDefinition } from "./ModelDefinition";

export type ModelInstallState =
  | "not_installed"
  | "checking"
  | "queued"
  | "downloading"
  | "verifying"
  | "installed"
  | "error";

export type ModelInstallErrorCode =
  | "source_unavailable"
  | "network"
  | "interrupted"
  | "insufficient_storage"
  | "verification"
  | "permission"
  | "unsupported_device"
  | "unknown";

/** Download progress in the range 0..1, or null when unavailable. */
export type ModelDownloadProgress = number | null;

export interface ModelStatus {
  modelId: string;
  state: ModelInstallState;
  progress: ModelDownloadProgress;
  error: string | null;
  errorCode: ModelInstallErrorCode | null;
  installedVersion: string | null;
}

/**
 * Resolves the current status of a given model definition. Implementations
 * will eventually perform filesystem/model checks; the current default only
 * reflects the definition's baseline state.
 */
export interface ModelStatusResolver {
  getModelStatus(definition: ModelDefinition): Promise<ModelStatus>;
}

export function createIdleModelStatus(definition: ModelDefinition): ModelStatus {
  return {
    modelId: definition.id,
    state: definition.status,
    progress: null,
    error: null,
    errorCode: null,
    installedVersion: definition.version,
  };
}