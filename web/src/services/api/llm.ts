import type {
  DrawingAnalysisInput,
  DrawingAnalysisResult,
  SpeechEvaluationInput,
  SpeechEvaluationResult,
  WordGenerationInput,
  WordGenerationResult,
} from "../ai/types";
import { requestJson } from "./client";

function isWordGenerationResult(value: unknown): value is WordGenerationResult {
  return (
    typeof value === "object" &&
    value !== null &&
    "topic" in value &&
    typeof value.topic === "string" &&
    "difficulty" in value &&
    (value.difficulty === "easy" || value.difficulty === "medium" || value.difficulty === "hard") &&
    "words" in value &&
    Array.isArray(value.words) &&
    value.words.length > 0 &&
    value.words.every((word) => typeof word === "string") &&
    "provider" in value &&
    typeof value.provider === "string" &&
    "model" in value &&
    typeof value.model === "string"
  );
}

function isSpeechEvaluationResult(value: unknown): value is SpeechEvaluationResult {
  return (
    typeof value === "object" &&
    value !== null &&
    "correct" in value &&
    typeof value.correct === "boolean" &&
    "target_word" in value &&
    typeof value.target_word === "string" &&
    "transcript" in value &&
    typeof value.transcript === "string" &&
    "feedback" in value &&
    typeof value.feedback === "string" &&
    value.feedback.length > 0 &&
    "provider" in value &&
    typeof value.provider === "string" &&
    "model" in value &&
    typeof value.model === "string"
  );
}

function isDrawingAnalysisResult(value: unknown): value is DrawingAnalysisResult {
  return (
    typeof value === "object" &&
    value !== null &&
    "description" in value &&
    typeof value.description === "string" &&
    value.description.length > 0 &&
    "feedback" in value &&
    typeof value.feedback === "string" &&
    value.feedback.length > 0 &&
    "provider" in value &&
    typeof value.provider === "string" &&
    "model" in value &&
    typeof value.model === "string"
  );
}

export function generateWords(input: WordGenerationInput): Promise<WordGenerationResult> {
  return requestJson("/api/v1/llm/generate-words", "POST", isWordGenerationResult, input);
}

export function evaluateSpeech(
  input: SpeechEvaluationInput,
): Promise<SpeechEvaluationResult> {
  return requestJson("/api/v1/llm/evaluate-speech", "POST", isSpeechEvaluationResult, {
    target_word: input.targetWord,
    transcript: input.transcript,
  });
}

export function analyzeDrawing(
  input: DrawingAnalysisInput,
): Promise<DrawingAnalysisResult> {
  return requestJson("/api/v1/llm/analyze-drawing", "POST", isDrawingAnalysisResult, {
    mime_type: input.mimeType,
    image_base64: input.imageBase64,
  });
}
