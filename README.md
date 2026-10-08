# VisualEcho

VisualEcho is an open-source assistive learning prototype for speech and word practice. It is designed to help children build confidence with spoken language through a simple daily learning loop: listen, practice, speak, evaluate, and repeat.

The project is being developed for Hacktoberfest Hack Day Dhulikhel × KUMSC and is intended as an accessible learning tool, not a medical diagnostic or treatment system. The repository is published under the MIT License and is designed to fit the MLH prize categories focused on Gemma 4 and open-source AI.

## Project overview

VisualEcho combines:

- React / Vite web experience
- Python FastAPI backend for cloud AI
- Provider-based architecture for AI, STT, and TTS
- Browser speech recognition and audio playback
- Drawing activity and progress tracking
- Local demo provider and cloud provider support

The core experience is a daily learning flow:

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

After the required practice, the learner can optionally access the drawing activity to reinforce learning in a creative way.

## Repository structure

```text
KUH/
├── README.md               # Project overview and setup
├── project.md              # Product and architecture specification
├── prompt.md               # Agent instructions and product rules
├── backend/                # FastAPI cloud backend
│   ├── app/
│   ├── .env.example
│   ├── requirements.txt
│   └── README.md
├── web/                    # Vite React browser prototype
│   ├── src/
│   ├── package.json
│   ├── .env.example
│   └── README.md
├── visualecho/              # Expo app workspace
│   └── README.md
└── ...
```

## Architecture

VisualEcho follows a provider-based design so the UI is not tightly coupled to a single AI, STT, or TTS service.

```text
UI / Practice Flow
   ↓
Service Layer
   ↓
Provider Interface
   ↓
Selected Provider
```

Possible provider types include:

- AI providers: Local, custom API, Google
- STT providers: Local, custom API, Google
- TTS providers: Local, custom API, Google

This keeps the app modular and allows different execution modes without rewriting the practice screens.

## Tech stack

### Web prototype

- React
- TypeScript
- Vite
- Browser speech recognition and synthesis

### Backend

- Python
- FastAPI
- Pydantic settings
- Gemma 4 via the Gemini API for multimodal AI evaluation

### Planned mobile target

- React Native / Expo
- Android-first design
- Optional future iOS support

## Challenge fit

VisualEcho is designed to fit both MLH Hackoberfest challenge categories:

- Best Use of Gemma 4: the app centers Gemma 4 as the multimodal AI layer that helps generate practice words, evaluate spoken responses, and analyze drawing-based learning feedback.
- Best Open-Source AI Project: the project is open-source, uses an open-weight model as a core part of the product, and is structured around an extensible provider architecture.

The project uses the Gemini API to access Gemma 4 in the cloud-backed AI mode, while preserving a provider-based design that can also support local and custom model alternatives. If a different model is chosen later, the provider abstraction makes it easy to swap the AI backend without changing the learning flow.

## MHL requirement

The project includes an MHL requirement for working on the codebase and running the app in a realistic development environment.

Minimum hardware and environment requirements:

- Modern desktop or laptop computer
- At least 8 GB RAM recommended
- Node.js 18+ or newer
- npm package manager
- Python 3.11+ for the backend
- Modern browser for the web prototype
- Android device or emulator when testing the mobile app workflows
- Internet access for cloud AI usage and image search features

This MHL requirement ensures the app can run smoothly while supporting local development, browser testing, and cloud provider integration.

## Quick start

### 1) Backend setup

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
```

Then run:

```bash
uvicorn app.main:app --reload
```

### 2) Web app setup

```bash
cd web
npm install
copy .env.example .env.local
npm run dev
```

Open the local Vite URL shown in the terminal, typically:

```text
http://localhost:5173
```

### 3) Mobile app workflow

For the Expo/mobile version, refer to the app-specific instructions in the project workspace and keep the provider architecture in mind while developing.

## Features

- Daily word and speech practice loop
- Speech-to-text input support
- Text-to-speech output support
- AI feedback and evaluation
- Local storage for progress
- Optional drawing activity
- Flexible provider selection and modular architecture
- Browser-based demo mode and cloud AI mode

## Notes

- The application is intended to support learning and communication practice in an accessible way.
- It should not claim to diagnose, assess, or treat hearing, speech, or learning conditions.
- The backend keeps API credentials server-side and does not expose them to the browser.

## Related documentation

- [project.md](./project.md)
- [prompt.md](./prompt.md)
- [LICENSE](./LICENSE)
- [backend/README.md](./backend/README.md)
- [web/README.md](./web/README.md)
- [visualecho/README.md](./visualecho/README.md)

This repository is organized around the VisualEcho product specification and the working code for the backend and browser prototype.
