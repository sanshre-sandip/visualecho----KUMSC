# VisualEcho — AI Coding Agent Instructions

## IMPORTANT: READ PROJECT.md FIRST

Before writing, modifying, deleting, or generating **any code**, you MUST read and understand:

```text
PROJECT.md
```

`PROJECT.md` is the primary product and architecture specification for VisualEcho.

Do not contradict decisions defined in `PROJECT.md` unless explicitly instructed by the developer.

If a requested change conflicts with `PROJECT.md`, explain the conflict before implementing it.

---

# 1. Project Context

VisualEcho is an open-source assistive learning mobile application being developed for:

**Hacktoberfest Hack Day Dhulikhel × KUMSC**

The application is being built with:

```text
React Native
Expo
TypeScript
```

The first target platform is:

```text
Android
```

The application should be designed to remain modular and extensible.

---

# 2. Core Product

VisualEcho provides a daily learning loop:

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

After required practice, the user may optionally access a drawing activity.

---

# 3. Critical Architecture Rule

The application MUST NOT directly depend on a specific AI, STT, or TTS provider.

Use provider interfaces.

```text
UI
 ↓
Service
 ↓
Provider Interface
 ↓
Selected Provider
```

Never create architecture like:

```text
PracticeScreen
 ↓
Google API
```

Prefer:

```text
PracticeScreen
 ↓
PracticeService
 ↓
AIProvider
 ↓
GoogleAIProvider
```

---

# 4. AI Provider Architecture

Create and maintain:

```text
AIProvider
```

Possible implementations:

```text
LocalGemmaProvider
CustomAPIProvider
GoogleAIProvider
```

The UI should not know how the selected provider works internally.

Conceptual interface:

```typescript
interface AIProvider {
  generateWords(
    input: WordGenerationInput
  ): Promise<WordGenerationResult>;

  evaluateSpeech(
    input: SpeechEvaluationInput
  ): Promise<SpeechEvaluationResult>;

  analyzeDrawing(
    input: DrawingAnalysisInput
  ): Promise<DrawingAnalysisResult>;
}
```

Do not hard-code Gemma API calls inside screens.

---

# 5. STT Provider Architecture

Use:

```text
STTProvider
```

Possible implementations:

```text
LocalWhisperProvider
CustomAPISTTProvider
GoogleSTTProvider
```

Conceptual interface:

```typescript
interface STTProvider {
  transcribe(
    audio: AudioInput
  ): Promise<TranscriptionResult>;
}
```

The application must be able to change STT providers without rewriting the practice UI.

---

# 6. TTS Provider Architecture

Use:

```text
TTSProvider
```

Possible implementations:

```text
KokoroProvider
PiperProvider
CustomAPITTSProvider
GoogleTTSProvider
```

Conceptual interface:

```typescript
interface TTSProvider {
  synthesize(
    input: TTSInput
  ): Promise<AudioResult>;
}
```

---

# 7. Provider Selection

Users should independently select:

```text
AI
├── Local
├── API
└── Google

STT
├── Local
├── API
└── Google

TTS
├── Local
├── API
└── Google
```

For example:

```json
{
  "ai": "local",
  "stt": "google",
  "tts": "local"
}
```

Do not assume all three services use the same provider.

---

# 8. Local-First Principle

Prefer local processing whenever practical.

Local processing should be supported for:

```text
AI
STT
TTS
```

However, local models may require significant hardware.

Therefore, API and Google providers must remain supported.

Never remove the provider abstraction merely because the current MVP uses one provider.

---

# 9. MVP Development Strategy

Do NOT attempt to implement the entire system at once.

Build vertically.

Recommended order:

```text
1. App launches
2. Navigation works
3. Practice screen
4. Word display
5. TTS
6. Microphone recording
7. STT
8. AI evaluation
9. Feedback
10. Local progress
11. Drawing
12. Provider settings
13. Local model providers
```

Each stage should produce a working application.

---

# 10. Current Development Rule

When implementing a feature:

1. Read `PROJECT.md`.
2. Inspect the existing code.
3. Understand the current architecture.
4. Reuse existing abstractions.
5. Implement the smallest working change.
6. Test the change.
7. Fix errors.
8. Only then continue to the next feature.

Do not rewrite unrelated code.

---

# 11. React Native / Expo Rules

Use:

```text
React Native
Expo
TypeScript
```

Prefer Expo-compatible libraries where possible.

Before adding a dependency, check whether an existing dependency already provides the required functionality.

Do not introduce unnecessary frameworks.

Avoid installing large libraries when a small implementation is sufficient.

---

# 12. TypeScript Rules

Use strict typing.

Avoid:

```typescript
any
```

unless there is a clear technical reason.

Prefer explicit types:

```typescript
type ProviderType =
  | "local"
  | "api"
  | "google";
```

Use interfaces/types for:

* AI requests
* AI responses
* Audio data
* Transcription
* TTS responses
* Practice sessions
* Words
* Progress
* Provider configuration

---

# 13. Service Layer

Business logic should not live inside UI components.

Bad:

```typescript
function PracticeScreen() {
  // recording
  // STT
  // AI request
  // database
  // evaluation
  // navigation
}
```

Preferred:

```text
PracticeScreen
     ↓
PracticeService
     ↓
STTProvider
AIProvider
TTSProvider
ProgressService
```

Screens should primarily handle:

* UI
* user interaction
* navigation
* displaying state

---

# 14. Audio Architecture

Keep audio functionality modular.

Suggested:

```text
src/audio/
├── recorder.ts
├── playback.ts
└── dsp.ts
```

Do not mix audio recording logic with AI evaluation logic.

Pipeline:

```text
Microphone
 ↓
Recorder
 ↓
Audio
 ↓
STTProvider
 ↓
Transcript
 ↓
AIProvider
```

TTS:

```text
Text
 ↓
TTSProvider
 ↓
Audio
 ↓
Optional DSP
 ↓
Playback
```

---

# 15. DSP Rules

DSP is an accessibility-oriented experimental feature.

Possible functionality:

* Playback speed
* Equalization
* Gain
* Limiting
* Other controlled audio processing

Do NOT present arbitrary DSP parameters as clinically validated.

Do not claim that a particular frequency range, gain, or processing configuration is universally optimal.

Make processing configurable where practical.

---

# 16. AI Evaluation Rules

Gemma should provide reasoning and feedback after STT.

Pipeline:

```text
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
Simple feedback
```

Possible feedback:

```text
Correct
Try again
Practice this word again
Try speaking more slowly
```

AI output should be converted into a safe, simple structure before being shown to the learner.

Do not expose raw model output unnecessarily.

---

# 17. Privacy Rules

VisualEcho follows a local-first privacy model.

Never:

* Commit API keys.
* Hard-code secrets.
* Put credentials in source code.
* Log private audio unnecessarily.
* Upload audio without an explicit provider path.
* Assume cloud processing is always enabled.

Use environment/configuration mechanisms for secrets.

---

# 18. Settings Architecture

Provider configuration should be centralized.

Example:

```text
src/
└── providers/
    └── config/
```

The rest of the application should access the selected provider through a provider factory or dependency-injection mechanism.

Avoid:

```typescript
if (settings.ai === "google") {
   // huge implementation
} else if (...) {
   // huge implementation
}
```

inside screens.

Prefer:

```typescript
const aiProvider = providerRegistry.getAIProvider();
```

---

# 19. Error Handling

Provider failures are expected.

Handle:

```text
Network unavailable
Model unavailable
Permission denied
Microphone unavailable
Invalid audio
API failure
Timeout
Unsupported device
```

The application should provide understandable feedback.

Never let a provider failure crash the entire application.

Example:

```text
Unable to process your speech right now.

Try again or choose another speech provider.
```

---

# 20. Offline Behavior

When local providers are available:

```text
Internet unavailable
       ↓
Local provider
       ↓
Continue practicing
```

If the selected cloud provider requires internet access:

```text
Internet unavailable
       ↓
Explain limitation
       ↓
Offer another configured provider
```

Do not silently switch providers if that would surprise the user.

---

# 21. Permissions

Request permissions only when necessary.

Examples:

```text
Microphone
Storage / media where required
```

Explain why the permission is needed through the application UI.

Do not request unnecessary permissions.

---

# 22. UI Principles

VisualEcho should have a simple, accessible interface.

Prioritize:

* Large readable text
* Clear buttons
* High visual clarity
* Simple navigation
* Minimal cognitive load
* Clear success/error states
* Audio controls
* Accessible touch targets

Do not create a generic AI dashboard.

The product should feel like a focused learning application.

---

# 23. Main Screens

The MVP should eventually contain:

```text
Home
Practice
Drawing
Progress
Settings
```

Navigation:

```text
Home
 ├── Start Practice
 ├── Progress
 └── Settings

Practice
 └── Drawing Reward

Drawing
 └── Save / Finish
```

---

# 24. Project Structure

Follow the structure described in `PROJECT.md`.

Expected direction:

```text
visualecho/
│
├── app/
│
├── src/
│   ├── providers/
│   │   ├── ai/
│   │   ├── stt/
│   │   └── tts/
│   │
│   ├── audio/
│   ├── database/
│   ├── models/
│   └── services/
│
├── assets/
├── backend/
├── PROJECT.md
├── PROMPT.md
├── README.md
├── package.json
└── tsconfig.json
```

Adapt to the actual Expo project structure if it differs.

Do not blindly create every directory before it is needed.

---

# 25. Database

Progress should be stored locally.

Potential implementation:

```text
Expo SQLite
```

Possible entities:

```text
Word
PracticeSession
PracticeAttempt
Progress
Settings
```

Keep database logic separate from UI.

---

# 26. Testing

Before considering a feature complete:

```text
TypeScript compilation
       ↓
Application starts
       ↓
Feature works
       ↓
Error state tested
       ↓
Android tested
```

At minimum, test:

* Normal flow
* Empty state
* Provider unavailable
* Permission denied
* Network unavailable where relevant

---

# 27. Dependencies

Before installing a package:

1. Check whether Expo already provides the functionality.
2. Check whether an existing dependency can handle it.
3. Prefer maintained packages.
4. Avoid unnecessary dependencies.
5. Make sure the package supports the current Expo SDK.

Do not install packages simply because they are popular.

---

# 28. Backend

A FastAPI backend may be used for model serving/orchestration.

Possible architecture:

```text
React Native
      ↓
FastAPI
      ↓
┌─────┼─────┐
Gemma Whisper TTS
```

The backend must remain optional.

The mobile application architecture should not assume that FastAPI is always running.

---

# 29. Local AI

The project eventually aims to support local:

```text
Gemma
Whisper
TTS
```

Do not attempt to rewrite these models in TypeScript.

Use appropriate:

* Native Android integration
* FFI
* Local HTTP servers
* Native libraries
* Existing model runtimes

depending on the final implementation.

---

# 30. Hackathon Priority

When choosing between:

```text
Perfect architecture
```

and:

```text
Working end-to-end demo
```

prioritize:

```text
Working end-to-end demo
```

But do not destroy the provider abstraction to achieve it.

The ideal hackathon demo is:

```text
Open app
   ↓
Start practice
   ↓
Hear word
   ↓
Speak
   ↓
STT
   ↓
Gemma
   ↓
Feedback
   ↓
Progress
   ↓
Drawing
```

---

# 31. Responsible Development

VisualEcho is an assistive-learning prototype.

Do not introduce claims that the application:

* Diagnoses conditions
* Treats medical conditions
* Provides clinical assessments
* Replaces professionals
* Guarantees learning outcomes

Keep descriptions technically accurate.

---

# 32. Code Modification Rules

When asked to modify the project:

### First

Read:

```text
PROJECT.md
PROMPT.md
```

### Then

Inspect the relevant files.

### Then

Implement only the requested feature.

### Do not

* Rewrite unrelated files
* Change architecture without reason
* Remove provider abstraction
* Add unnecessary dependencies
* Add secrets
* Break existing functionality
* Replace working code unnecessarily

---

# 33. Before Every Major Change

Ask internally:

```text
Does this follow PROJECT.md?
Does this preserve provider independence?
Does this keep local/API/Google options possible?
Does this work on Android?
Does this keep the MVP simple?
Does this introduce unnecessary dependencies?
Does this expose private data?
```

If the answer to any important architectural question is "no", reconsider the implementation.

---

# 34. Definition of Done

A feature is complete when:

```text
[ ] PROJECT.md requirements respected
[ ] TypeScript types are correct
[ ] Existing architecture preserved
[ ] UI works
[ ] Error states handled
[ ] Android behavior checked
[ ] No secrets committed
[ ] No unnecessary dependencies
[ ] Code is understandable
```

---

# 35. Final Rule

**PROJECT.md is the product specification.**

**PROMPT.md is the coding-agent rulebook.**

Always read both before making substantial changes.

When uncertain:

```text
PROJECT.md
    ↓
Current code
    ↓
Smallest correct implementation
    ↓
Test
```

Do not invent product requirements that are not present in `PROJECT.md`.
