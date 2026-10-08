import type { AppConfiguration } from "@/config/model";
import type { ModelDefinition } from "./ModelDefinition";
import { createIdleModelStatus } from "./ModelStatus";
import type { ModelStatus, ModelStatusResolver } from "./ModelStatus";
import { DEFAULT_MODEL_REGISTRY, ModelRegistry } from "./ModelRegistry";

export type ModelRequirementsInput = Pick<AppConfiguration, "aiMode">;

export interface ModelManagerOptions {
  registry?: ModelRegistry;
  statusResolver?: ModelStatusResolver;
}

/** Baseline resolver that only reflects the definition's registered state. */
class StaticStatusResolver implements ModelStatusResolver {
  async getModelStatus(definition: ModelDefinition): Promise<ModelStatus> {
    return createIdleModelStatus(definition);
  }
}

export class ModelManager {
  private readonly registry: ModelRegistry;
  private readonly statusResolver: ModelStatusResolver;

  constructor(options: ModelManagerOptions = {}) {
    this.registry = options.registry ?? DEFAULT_MODEL_REGISTRY;
    this.statusResolver = options.statusResolver ?? new StaticStatusResolver();
  }

  /** All models the application can install. */
  async getAvailableModels(): Promise<ModelDefinition[]> {
    return [...this.registry.getAvailableModels()];
  }

  /** A single model definition, or null when the id is unknown. */
  async getModel(id: string): Promise<ModelDefinition | null> {
    return this.registry.getModel(id) ?? null;
  }

  async isModelInstalled(id: string): Promise<boolean> {
    const definition = this.registry.getModel(id);
    if (!definition) {
      return false;
    }
    const status = await this.statusResolver.getModelStatus(definition);
    return status.state === "installed";
  }

  /** Live status for a model, or null when the id is unknown. */
  async getModelStatus(id: string): Promise<ModelStatus | null> {
    const definition = this.registry.getModel(id);
    if (!definition) {
      return null;
    }
    return this.statusResolver.getModelStatus(definition);
  }

  /** Live status for every registered model. */
  async getModelStatuses(): Promise<ModelStatus[]> {
    const statuses: ModelStatus[] = [];
    for (const definition of this.registry.getAvailableModels()) {
      statuses.push(await this.statusResolver.getModelStatus(definition));
    }
    return statuses;
  }

  /**
   * Models required by the given configuration.
   * Local AI requires Gemma; Whisper and TTS are always required because STT
   * and TTS are always local.
   */
  async getRequiredModels(config: ModelRequirementsInput): Promise<ModelDefinition[]> {
    const usesLocalAi = config.aiMode === "local";
    return this.registry
      .getAvailableModels()
      .filter(
        (definition) => definition.required || (usesLocalAi && definition.type === "llm"),
      );
  }

  /** Required models that are not currently installed. */
  async getMissingModels(config: ModelRequirementsInput): Promise<ModelDefinition[]> {
    const required = await this.getRequiredModels(config);
    const missing: ModelDefinition[] = [];
    for (const definition of required) {
      if (!(await this.isModelInstalled(definition.id))) {
        missing.push(definition);
      }
    }
    return missing;
  }
}

export const modelManager = new ModelManager();