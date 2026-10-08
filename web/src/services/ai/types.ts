export type Difficulty = "easy" | "medium" | "hard";

export interface WordGenerationInput {
  topic: string;
  difficulty: Difficulty;
  count: number;
}

export interface WordGenerationResult {
  topic: string;
  difficulty: Difficulty;
  words: string[];
  provider: string;
  model: string;
}

export interface SpeechEvaluationInput {
  targetWord: string;
  transcript: string;
}

export interface SpeechEvaluationResult {
  correct: boolean;
  target_word: string;
  transcript: string;
  feedback: string;
  provider: string;
  model: string;
}

export interface DrawingAnalysisInput {
  mimeType: "image/png" | "image/jpeg" | "image/webp";
  imageBase64: string;
}

export interface DrawingAnalysisResult {
  description: string;
  feedback: string;
  provider: string;
  model: string;
}

export interface AIProvider {
  generateWords(input: WordGenerationInput): Promise<WordGenerationResult>;
  evaluateSpeech(input: SpeechEvaluationInput): Promise<SpeechEvaluationResult>;
  analyzeDrawing(input: DrawingAnalysisInput): Promise<DrawingAnalysisResult>;
}
