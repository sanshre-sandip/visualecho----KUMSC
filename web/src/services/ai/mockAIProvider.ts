import type {
  AIProvider,
  DrawingAnalysisInput,
  DrawingAnalysisResult,
  SpeechEvaluationInput,
  SpeechEvaluationResult,
  WordGenerationInput,
  WordGenerationResult,
} from "./types";

const DEMO_WORDS: Record<string, string[]> = {
  animals: ["rabbit", "turtle", "kitten", "puppy", "dolphin", "monkey", "parrot", "giraffe"],
  nature: ["sunshine", "flower", "rainbow", "mountain", "river", "butterfly", "forest", "cloud"],
  food: ["apple", "banana", "pancake", "carrot", "sandwich", "strawberry", "cookie", "orange"],
  home: ["window", "pillow", "kitchen", "blanket", "garden", "doorway", "picture", "family"],
};

export class MockAIProvider implements AIProvider {
  private readonly provider = "mock-demo";

  async generateWords(input: WordGenerationInput): Promise<WordGenerationResult> {
    const key = input.topic.trim().toLowerCase();
    const choices = DEMO_WORDS[key] ?? [
      `${key}day`,
      `${key}time`,
      `little ${key}`,
      `happy ${key}`,
      `${key}friend`,
      `bright ${key}`,
    ];
    return {
      topic: input.topic,
      difficulty: input.difficulty,
      words: choices.slice(0, input.count),
      provider: this.provider,
      model: "browser-demo",
    };
  }

  async evaluateSpeech(input: SpeechEvaluationInput): Promise<SpeechEvaluationResult> {
    const normalizedTarget = input.targetWord.toLocaleLowerCase().replace(/[^\p{L}\p{N}]/gu, "");
    const normalizedTranscript = input.transcript
      .toLocaleLowerCase()
      .replace(/[^\p{L}\p{N}]/gu, "");
    const correct = normalizedTarget === normalizedTranscript;
    return {
      correct,
      target_word: input.targetWord,
      transcript: input.transcript,
      feedback: correct
        ? "Nice work! You matched the word in this demo check."
        : `Good try! The word to practice is “${input.targetWord}”.`,
      provider: this.provider,
      model: "browser-demo",
    };
  }

  async analyzeDrawing(_input: DrawingAnalysisInput): Promise<DrawingAnalysisResult> {
    return {
      description: "Your drawing is ready. Image understanding is not implemented in browser demo mode.",
      feedback: "Choose Cloud AI to request a real drawing analysis.",
      provider: this.provider,
      model: "browser-demo",
    };
  }
}
