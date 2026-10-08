# VisualEcho Backend

Secure FastAPI gateway for VisualEcho's **cloud** LLM mode.

```text
React Native (VisualEcho)
        |  HTTPS
        v
VisualEcho FastAPI Backend   <- server-side API key lives here
        |
        v
Google Gemini API
```

The mobile app never receives, stores, or logs a Gemini API key.

Notes:

* The backend only handles `aiMode = "cloud"`. Local Gemma, local STT, and local
  TTS run on-device and are not served by this backend.
* No authentication, database, STT, or TTS is implemented yet.

## Structure

```text
backend/
├── app/
│   ├── __init__.py
│   ├── main.py                 FastAPI app factory, CORS, safe error handlers
│   ├── config.py               environment-based settings (pydantic-settings)
│   ├── routes/
│   │   ├── __init__.py
│   │   ├── health.py           GET /health
│   │   └── llm.py              reserved prefix for /api/v1/llm/...
│   ├── services/
│   │   ├── __init__.py
│   │   └── llm/
│   │       ├── __init__.py     provider factory
│   │       ├── base.py         LLMProvider interface + safe error codes
│   │       └── google_gemini.py  Google Gemini implementation
│   └── schemas/
│       ├── __init__.py
│       └── health.py
├── .env.example
├── .gitignore
├── requirements.txt
└── README.md
```

## Setup

Python 3.11+ (tested with 3.14). [uv](https://docs.astral.sh/uv/) is
recommended; pip works too.

```bash
cd backend

uv venv
uv pip install -r requirements.txt
```

With pip instead:

```bash
python -m venv .venv
.venv\Scripts\activate      # Windows
pip install -r requirements.txt
```

## Configuration

Copy the example file and fill in values:

```bash
cp .env.example .env
```

| Variable         | Required | Purpose                                             |
| ---------------- | -------- | --------------------------------------------------- |
| `GEMINI_API_KEY` | no       | Cloud LLM key; server-side only                     |
| `GEMINI_MODEL`   | no       | Model id, defaults to `gemini-3.8-flash`            |
| `CORS_ORIGINS`   | no       | Comma-separated allowed origins; development defaults include the Vite web app at `http://localhost:5173`; set the exact deployed web origin in production |
| `ENVIRONMENT`    | no       | `development` or `production`                       |

The backend starts and serves `/health` **without** `GEMINI_API_KEY`.
Cloud generation reports `LLM_PROVIDER_NOT_CONFIGURED` until a key is set.

## Run

```bash
cd backend
uv run uvicorn app.main:app --reload
```

or:

```bash
.venv\Scripts\uvicorn.exe app.main:app --reload
```

Open <http://127.0.0.1:8000/health> and <http://127.0.0.1:8000/docs>.

## Endpoints

| Method | Path                             | Auth | Description                                    |
| ------ | -------------------------------- | ---- | ---------------------------------------------- |
| GET    | `/health`                        | none | Service liveness                               |
| POST   | `/api/v1/llm/generate-words`     | none | Generate practice words                       |
| POST   | `/api/v1/llm/evaluate-speech`    | none | Evaluate a browser/on-device STT transcript    |
| POST   | `/api/v1/llm/analyze-drawing`    | none | Analyze a drawing sent as base64 image content |

The LLM routes require a configured server-side `GEMINI_API_KEY`. Production
browser clients also require their exact web origin in `CORS_ORIGINS`; CORS
changes take effect only after the backend is redeployed.

## LLM abstraction

Routes must never call Google directly. They use the provider interface:

```python
from app.services.llm import create_llm_provider

provider = create_llm_provider(settings)
result = await provider.generate(prompt)
```

New cloud providers implement `LLMProvider` from
`app/services/llm/base.py` and are registered in the factory.

Errors are mapped to safe payloads, for example:

```json
{ "error": "LLM_PROVIDER_UNAVAILABLE" }
```

Raw provider exceptions and credentials are never returned to clients.

## Security

* `.env` is git-ignored; only `.env.example` (placeholders) is committed.
* The API key is stored as a `SecretStr` and is never logged or returned.
* No endpoint exposes environment variables.
* CORS is disabled unless `CORS_ORIGINS` is set explicitly.
