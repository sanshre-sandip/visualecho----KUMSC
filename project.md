# VisualEcho

> An open-source assistive learning mobile application for speech and word practice, built for Hacktoberfest Hack Day Dhulikhel × KUMSC.

## 1. Overview

**VisualEcho** is a mobile learning prototype designed to make daily speech and word practice more interactive and accessible.

The application combines:

* React Native + Expo
* TypeScript
* Speech-to-Text
* Text-to-Speech
* Digital Signal Processing (DSP)
* Gemma 4 multimodal AI via the Gemini API
* Local progress tracking
* Optional drawing activities
* A provider architecture that allows users to choose between local models, custom APIs, and Google services

VisualEcho is intended as an **assistive learning prototype**, not a medical diagnostic or treatment system.

---

# 2. Core Idea

The central learning loop is:

```text
Listen
   ↓
Practice
   ↓
Speak
   ↓
Speech-to-Text
   ↓
AI Evaluation
   ↓
Feedback
   ↓
Repeat
```

A typical daily session asks the learner to practice a small set of words or phonemes.

After completing the required practice, the learner can optionally unlock a creative activity such as drawing.

---

# 3. Target Users

The prototype focuses on children approximately ages 5–10 who may benefit from additional support during speech and word-learning activities.

The project is designed around accessibility considerations including:

* Clear visual feedback
* Controlled audio playback
* Adjustable speech speed
* Repetition
* Simple interactions
* Minimal cognitive load
* Optional drawing-based reinforcement

The system must not claim to diagnose, treat, or clinically assess a hearing, speech, or learning condition.

---

# 4. Technology Stack

## Mobile Application

```text
React Native
Expo
TypeScript
```

The application should initially target Android.

iOS support can be added later.

## AI

Primary:

```text
Gemma 4
```

Possible execution modes:

```text
Gemma 4
     │
     ├── Local Gemma / local server
     │
     ├── Custom API
     │
     └── Gemini API access
```

## Speech-to-Text

Primary local option:

```text
Whisper / Faster-Whisper
```

Possible providers:

```text
Local STT
Custom STT API
Google STT
```

## Text-to-Speech

Possible providers:

```text
Kokoro
Piper
Custom TTS API
Google TTS
```

## Local Storage

Initial options:

```text
SQLite
Expo SQLite
AsyncStorage
```

SQLite should be preferred for structured progress data.

---

# 5. Provider Architecture

A major design principle of VisualEcho is **provider independence**.

Users should not be forced to use a specific AI, STT, or TTS service.

Each component should have a common interface.

```text
                  VisualEcho
                      │
          ┌───────────┼───────────┐
          │           │           │
         AI          STT         TTS
          │           │           │
      ┌───┼───┐   ┌───┼───┐   ┌───┼───┐
      │   │   │   │   │   │   │   │   │
    Local API Google Local API Google Local API Google
```

The application should interact with interfaces rather than directly depending on a specific provider.

---

# 6. AI Provider

Conceptual interface:

```typescript
interface AIProvider {
  generateWords(input: WordGenerationInput): Promise<WordGenerationResult>;

  evaluateSpeech(input: SpeechEvaluationInput): Promise<SpeechEvaluationResult>;

  analyzeDrawing(input: DrawingAnalysisInput): Promise<DrawingAnalysisResult>;
}
```

Possible implementations:

```text
LocalGemmaProvider
CustomAPIProvider
GoogleAIProvider
```

The provider can be selected through application settings.

---

# 7. STT Provider

Conceptual interface:

```typescript
interface STTProvider {
  transcribe(audio: AudioInput): Promise<TranscriptionResult>;
}
```

Possible implementations:

```text
LocalWhisperProvider
CustomAPISTTProvider
GoogleSTTProvider
```

The application should not assume that STT is always cloud-based.

---

# 8. TTS Provider

Conceptual interface:

```typescript
interface TTSProvider {
  synthesize(input: TTSInput): Promise<AudioResult>;
}
```

Possible implementations:

```text
KokoroProvider
PiperProvider
CustomAPITTSProvider
GoogleTTSProvider
```

---

# 9. User Provider Settings

Users should be able to independently select providers.

Example:

```text
AI
├── Local Gemma
├── Custom API
└── Google

Speech-to-Text
├── Local Whisper
├── Custom API
└── Google

Text-to-Speech
├── Local TTS
├── Custom API
└── Google
```

This means a user could configure:

```text
AI  → Local Gemma
STT → Local Whisper
TTS → Google
```

or:

```text
AI  → Custom API
STT → Google
TTS → Local Piper
```

This flexibility is an important part of the project architecture.

---

# 10. Local-First Design

VisualEcho should prefer local processing whenever practical.

Benefits:

* Better privacy
* Offline capability
* Reduced API costs
* Lower dependency on internet connectivity
* Greater control over user data

However, local models can require significant computational resources.

Therefore, the application supports cloud/API providers as alternatives.

The application should clearly indicate which provider is currently being used.

---

# 11. Daily Practice

The primary MVP feature is daily word practice.

Example:

```text
Today's Practice

1. sun
2. fish
3. book
4. tree
5. school
```

For each word:

```text
Word
 ↓
Play pronunciation
 ↓
Learner speaks
 ↓
Record audio
 ↓
STT transcription
 ↓
AI evaluation
 ↓
Feedback
```

The learner progresses through the session based on the application's learning logic.

---

# 12. AI Evaluation

Gemma should be used for reasoning and feedback rather than simply acting as a speech recognizer.

Example pipeline:

```text
Microphone
    ↓
Audio
    ↓
STT
    ↓
Transcript
    ↓
Gemma
    ↓
Evaluation
    ↓
Simple learner feedback
```

Possible feedback categories:

```text
Correct
Needs another attempt
Try again slowly
Practice this word again
```

The system should avoid presenting experimental AI output as a medical or clinical assessment.

---

# 13. Text-to-Speech

The application should provide a clear pronunciation model.

Basic pipeline:

```text
Word
 ↓
TTS
 ↓
Audio
 ↓
Optional DSP
 ↓
Playback
```

Speech speed should be configurable.

Example:

```text
0.80x
0.90x
1.00x
1.10x
```

The exact values should be treated as accessibility controls rather than universally optimal clinical settings.

---

# 14. Audio Processing

VisualEcho may include an audio-processing layer between TTS and playback.

Conceptually:

```text
TTS Audio
    ↓
DSP
    ↓
Processed Audio
    ↓
Playback
```

Possible processing features:

* Playback-speed adjustment
* Equalization
* Gain adjustment
* Limiting
* Noise handling where appropriate

Any DSP configuration should be treated as configurable experimental accessibility functionality rather than a clinically validated hearing intervention.

---

# 15. Drawing Reward

After completing required practice, the learner can optionally access a drawing activity.

Example:

```text
Practice Complete
       ↓
   Draw a picture
       ↓
   Save drawing
       ↓
 Optional AI analysis
```

The drawing feature is primarily intended as a motivational and creative activity.

It should not be used to make psychological or medical conclusions about the learner.

---

# 16. Drawing Canvas

The application should provide a simple touch-based canvas.

Required MVP functionality:

* Drawing
* Erasing
* Clear canvas
* Undo
* Save drawing
* Continue/finish button

Potential future functionality:

* Color selection
* Brush size
* Shapes
* Stickers
* AI-assisted feedback

---

# 17. Progress Tracking

The application should maintain local learning progress.

Example:

```text
Learner Progress

Words practiced: 42
Sessions completed: 8
Current streak: 4
Words needing practice: 6
```

Progress should focus on application activity and learning interaction rather than medical scores.

---

# 18. Privacy

Privacy is a core architectural principle.

The application should minimize unnecessary collection of:

* Audio recordings
* Transcripts
* Drawings
* Personal information
* AI requests

When local providers are selected, processing should remain local whenever technically possible.

When cloud providers are selected, the application should clearly communicate that data may leave the device.

API keys must never be committed to Git.

---

# 19. Project Structure

Initial structure:

```text
visualecho/
│
├── app/
│   ├── _layout.tsx
│   ├── index.tsx
│   │
│   ├── practice/
│   │   ├── index.tsx
│   │   └── session.tsx
│   │
│   ├── drawing/
│   │   └── index.tsx
│   │
│   ├── progress/
│   │   └── index.tsx
│   │
│   └── settings/
│       └── index.tsx
│
├── src/
│   ├── providers/
│   │   ├── ai/
│   │   │   ├── AIProvider.ts
│   │   │   ├── LocalGemmaProvider.ts
│   │   │   ├── CustomAPIProvider.ts
│   │   │   └── GoogleAIProvider.ts
│   │   │
│   │   ├── stt/
│   │   │   ├── STTProvider.ts
│   │   │   ├── LocalWhisperProvider.ts
│   │   │   ├── CustomAPIProvider.ts
│   │   │   └── GoogleSTTProvider.ts
│   │   │
│   │   └── tts/
│   │       ├── TTSProvider.ts
│   │       ├── LocalTTSProvider.ts
│   │       ├── CustomAPIProvider.ts
│   │       └── GoogleTTSProvider.ts
│   │
│   ├── audio/
│   │   ├── recorder.ts
│   │   ├── playback.ts
│   │   └── dsp.ts
│   │
│   ├── database/
│   │   ├── database.ts
│   │   └── migrations.ts
│   │
│   ├── models/
│   │   ├── Word.ts
│   │   ├── Session.ts
│   │   └── Progress.ts
│   │
│   └── services/
│       ├── practiceService.ts
│       └── progressService.ts
│
├── assets/
│
├── backend/
│   └── README.md
│
├── PROJECT.md
├── README.md
├── package.json
├── app.json
└── tsconfig.json
```

---

# 20. Backend

A backend is optional.

If local models cannot run directly on the phone, VisualEcho can communicate with a local computer/server:

```text
Flutter/React Native App
        ↓
     FastAPI
        ↓
 ┌──────┼────────┐
Gemma  Whisper   TTS
```

The same provider interfaces should work whether the model is:

* Running on-device
* Running on localhost
* Running on a LAN server
* Running through a remote API

---

# 21. Model Architecture

The application should avoid tightly coupling UI code to model implementations.

Bad:

```text
PracticeScreen
    ↓
Gemma API directly
```

Preferred:

```text
PracticeScreen
    ↓
PracticeService
    ↓
AIProvider
    ↓
Selected AI implementation
```

Similarly:

```text
PracticeScreen
    ↓
SpeechService
    ↓
STTProvider
    ↓
Selected STT implementation
```

and:

```text
PracticeScreen
    ↓
AudioService
    ↓
TTSProvider
    ↓
Selected TTS implementation
```

---

# 22. MVP Scope

The hackathon MVP should prioritize a working end-to-end experience.

## Must Have

* [ ] React Native/Expo application
* [ ] Home screen
* [ ] Daily practice screen
* [ ] Word presentation
* [ ] TTS playback
* [ ] Microphone recording
* [ ] STT integration
* [ ] AI evaluation
* [ ] Simple feedback
* [ ] Local progress
* [ ] Provider settings
* [ ] Basic drawing canvas

## Should Have

* [ ] Local Gemma integration
* [ ] Local Whisper integration
* [ ] Local TTS
* [ ] Configurable speech speed
* [ ] Basic audio processing
* [ ] Offline-friendly behavior

## Nice to Have

* [ ] AI drawing analysis
* [ ] Adaptive word generation
* [ ] Advanced DSP controls
* [ ] Multiple languages
* [ ] Teacher/parent dashboard
* [ ] Cloud synchronization

---

# 23. Development Priorities

Build in this order:

```text
1. React Native / Expo setup
        ↓
2. Basic navigation
        ↓
3. Practice UI
        ↓
4. Audio playback
        ↓
5. Microphone recording
        ↓
6. STT provider
        ↓
7. AI provider
        ↓
8. TTS provider
        ↓
9. Progress storage
        ↓
10. Drawing
        ↓
11. Provider settings
        ↓
12. Local model integration
```

Do not begin by implementing the entire AI infrastructure.

First make the application work with a simple provider.

Then replace the provider with local models.

---

# 24. Hackathon Demo Flow

The ideal demonstration should take only a few minutes.

```text
Open VisualEcho
      ↓
Start today's practice
      ↓
Application presents a word
      ↓
TTS pronounces the word
      ↓
Learner speaks
      ↓
STT converts speech to text
      ↓
Gemma evaluates the response
      ↓
Visual feedback
      ↓
Complete practice
      ↓
Unlock drawing activity
      ↓
Show progress
      ↓
Open Settings
      ↓
Demonstrate provider selection
```

---

# 25. Example Provider Configuration

Example:

```json
{
  "ai": "local",
  "stt": "local",
  "tts": "local"
}
```

Cloud configuration:

```json
{
  "ai": "google",
  "stt": "google",
  "tts": "google"
}
```

Mixed configuration:

```json
{
  "ai": "local",
  "stt": "google",
  "tts": "local"
}
```

The UI should allow these choices without changing the application code.

---

# 26. Design Principles

VisualEcho should follow these principles:

### Local-first

Prefer local processing when practical.

### Provider-agnostic

No single AI or cloud provider should control the architecture.

### Privacy-conscious

Minimize unnecessary data transmission.

### Accessible

Use simple interfaces, readable text, clear feedback, and controllable audio.

### Modular

AI, STT, TTS, audio processing, storage, and UI should remain independently replaceable.

### Hackathon-focused

Prioritize a working demonstration over unnecessary production infrastructure.

### Responsible AI

AI output should be treated as experimental assistance, not professional medical or educational assessment.

---

# 27. Future Direction

Potential future development:

```text
VisualEcho
│
├── Offline AI
├── Adaptive learning
├── Multilingual support
├── Nepali language support
├── Teacher dashboard
├── Parent dashboard
├── Classroom mode
├── Progress synchronization
├── More accessibility controls
└── Community-developed providers
```

The provider architecture should make it possible for developers to add new AI, STT, and TTS implementations without rewriting the application.

---

# 28. Open Source

VisualEcho is intended to be an open-source project.

Contributions may include:

* UI improvements
* Accessibility improvements
* New AI providers
* New STT providers
* New TTS providers
* Audio-processing improvements
* Language support
* Documentation
* Testing
* Bug fixes

---

# 29. Responsible Use

VisualEcho is an experimental assistive-learning application.

It must not be represented as:

* A medical device
* A diagnostic system
* A hearing-loss treatment
* A dyslexia treatment
* A replacement for a qualified professional
* A clinically validated speech assessment

The project should clearly communicate its experimental nature.

---

# 30. Hackathon Goal

The goal of the MVP is to demonstrate that modern multimodal AI can be combined with accessible mobile interaction and local-first computing to create a more flexible learning experience.

The most important outcome is a working loop:

```text
Hear
 ↓
Practice
 ↓
Speak
 ↓
Understand
 ↓
Feedback
 ↓
Improve
```

while allowing the user to decide **where their AI runs**:

```text
LOCAL
  OR
API
  OR
GOOGLE
```

That provider independence is a core part of the VisualEcho architecture.
