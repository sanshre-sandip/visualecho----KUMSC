import {
  analyzeDrawing,
  evaluateSpeech,
  generateWords,
} from "../api/llm";
import type {
  AIProvider,
  DrawingAnalysisInput,
  DrawingAnalysisResult,
  SpeechEvaluationInput,
  SpeechEvaluationResult,
  WordGenerationInput,
  WordGenerationResult,
} from "./types";

export class RemoteAIProvider implements AIProvider {
  generateWords(input: WordGenerationInput): Promise<WordGenerationResult> {
    return generateWords(input);
  }

  evaluateSpeech(input: SpeechEvaluationInput): Promise<SpeechEvaluationResult> {
    return evaluateSpeech(input);
  }

  analyzeDrawing(input: DrawingAnalysisInput): Promise<DrawingAnalysisResult> {
    return analyzeDrawing(input);
  }
}
