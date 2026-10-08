import { useEffect, useMemo, useRef, useState } from "react";
import { API_BASE_URL } from "./services/api/config";
import { checkHealth, type HealthResponse } from "./services/api/health";
import { VisualEchoApiError } from "./services/api/client";
import { getAIProvider } from "./services/ai";
import type { Difficulty, WordGenerationResult } from "./services/ai/types";
import {
  clearProgress,
  loadProgress,
  saveProgress,
  type ProgressData,
} from "./services/progress";

type Page = "home" | "practice" | "drawing" | "progress" | "settings";
type AIStatus = "checking" | "online" | "offline";

interface BrowserSpeechResult {
  readonly results: ArrayLike<ArrayLike<{ transcript: string }>>;
}

interface BrowserSpeechRecognition {
  lang: string;
  interimResults: boolean;
  onresult: ((event: BrowserSpeechResult) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start(): void;
}

interface SpeechRecognitionConstructor {
  new (): BrowserSpeechRecognition;
}

type SpeechWindow = Window & {
  SpeechRecognition?: SpeechRecognitionConstructor;
  webkitSpeechRecognition?: SpeechRecognitionConstructor;
};

const DEFAULT_WORDS: WordGenerationResult = {
  topic: "nature",
  difficulty: "easy",
  words: ["sun", "fish", "book", "tree", "school"],
  provider: "starter-list",
  model: "built-in",
};

function getMessage(error: unknown): string {
  return error instanceof Error ? error.message : "An unexpected error occurred. Please try again.";
}

function App() {
  const [page, setPage] = useState<Page>("home");
  const [mode, setMode] = useState<"local" | "cloud">(
    window.localStorage.getItem("visualecho.web.ai-mode") === "cloud" ? "cloud" : "local",
  );
  const [aiStatus, setAIStatus] = useState<AIStatus>("checking");
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [healthError, setHealthError] = useState("");
  const [cloudError, setCloudError] = useState("");
  const [retryAction, setRetryAction] = useState<"words" | "speech" | "drawing" | null>(null);
  const [storageError, setStorageError] = useState("");
  const [progress, setProgress] = useState<ProgressData>({ attempts: [], drawings: 0 });
  const [progressReady, setProgressReady] = useState(false);
  const [topic, setTopic] = useState("animals");
  const [difficulty, setDifficulty] = useState<Difficulty>("easy");
  const [wordSet, setWordSet] = useState<WordGenerationResult>(DEFAULT_WORDS);
  const [wordIndex, setWordIndex] = useState(0);
  const [transcript, setTranscript] = useState("");
  const [speechResult, setSpeechResult] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [drawingResult, setDrawingResult] = useState("");
  const [drawingFeedback, setDrawingFeedback] = useState("");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const recognitionRef = useRef<BrowserSpeechRecognition | null>(null);
  const isDrawingRef = useRef(false);

  const speechRecognition = useMemo(() => {
    const speechWindow = window as SpeechWindow;
    return speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition ?? null;
  }, []);
  const currentWord = wordSet.words[wordIndex] ?? wordSet.words[0] ?? "";
  const provider = getAIProvider(mode);
  const accuracy = progress.attempts.length
    ? Math.round(
        (progress.attempts.filter((attempt) => attempt.correct).length /
          progress.attempts.length) *
          100,
      )
    : 0;
  const completedDays = new Set(
    progress.attempts.map((attempt) => attempt.completedAt.slice(0, 10)),
  ).size;

  useEffect(() => {
    try {
      setProgress(loadProgress());
    } catch (error) {
      setStorageError(getMessage(error));
    } finally {
      setProgressReady(true);
    }
  }, []);

  useEffect(() => {
    void refreshHealth();
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem("visualecho.web.ai-mode", mode);
    } catch {
      setStorageError("Your AI mode preference could not be saved in this browser.");
    }
  }, [mode]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;
    context.fillStyle = "#fffdf8";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.lineCap = "round";
    context.lineJoin = "round";
    context.lineWidth = 5;
    context.strokeStyle = "#3b699d";
  }, [page]);

  async function refreshHealth() {
    setAIStatus("checking");
    setHealthError("");
    try {
      const response = await checkHealth();
      setHealth(response);
      setAIStatus("online");
    } catch (error) {
      setHealth(null);
      setHealthError(getMessage(error));
      setAIStatus("offline");
    }
  }

  function persistProgress(nextProgress: ProgressData) {
    setProgress(nextProgress);
    try {
      saveProgress(nextProgress);
      setStorageError("");
    } catch {
      setStorageError("Progress changed for this session but could not be saved to this browser.");
    }
  }

  function handleCloudFailure(
    error: unknown,
    action: "words" | "speech" | "drawing",
  ) {
    setRetryAction(action);
    setCloudError(
      error instanceof VisualEchoApiError
        ? "The cloud service is temporarily unavailable."
        : getMessage(error),
    );
  }

  async function generatePracticeWords() {
    setCloudError("");
    setSpeechResult("");
    setTranscript("");
    setIsGenerating(true);
    try {
      const result = await provider.generateWords({ topic, difficulty, count: 5 });
      setWordSet(result);
      setWordIndex(0);
      setRetryAction(null);
    } catch (error) {
      if (mode === "cloud") handleCloudFailure(error, "words");
      else setCloudError(getMessage(error));
    } finally {
      setIsGenerating(false);
    }
  }

  function startListening() {
    if (!speechRecognition) return;
    const recognition = new speechRecognition();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.onresult = (event) => {
      const result = event.results[event.results.length - 1];
      if (result?.[0]?.transcript) setTranscript(result[0].transcript);
    };
    recognition.onerror = () => {
      setCloudError("Browser speech recognition could not capture that attempt. You can type it instead.");
    };
    recognition.onend = () => setIsListening(false);
    recognitionRef.current = recognition;
    setIsListening(true);
    setCloudError("");
    recognition.start();
  }

  async function evaluateAttempt() {
    if (!currentWord || !transcript.trim()) return;
    setCloudError("");
    setIsEvaluating(true);
    try {
      const result = await provider.evaluateSpeech({
        targetWord: currentWord,
        transcript: transcript.trim(),
      });
      setSpeechResult(`${result.correct ? "Great effort!" : "Keep practicing!"} ${result.feedback}`);
      setRetryAction(null);
      persistProgress({
        ...progress,
        attempts: [
          ...progress.attempts,
          {
            word: currentWord,
            correct: result.correct,
            completedAt: new Date().toISOString(),
          },
        ],
      });
      setWordIndex((index) => Math.min(index + 1, wordSet.words.length - 1));
    } catch (error) {
      if (mode === "cloud") handleCloudFailure(error, "speech");
      else setCloudError(getMessage(error));
    } finally {
      setIsEvaluating(false);
    }
  }

  function canvasPoint(event: React.PointerEvent<HTMLCanvasElement>) {
    const canvas = event.currentTarget;
    const bounds = canvas.getBoundingClientRect();
    return {
      x: ((event.clientX - bounds.left) / bounds.width) * canvas.width,
      y: ((event.clientY - bounds.top) / bounds.height) * canvas.height,
    };
  }

  function beginDrawing(event: React.PointerEvent<HTMLCanvasElement>) {
    const canvas = event.currentTarget;
    canvas.setPointerCapture(event.pointerId);
    const context = canvas.getContext("2d");
    if (!context) return;
    const point = canvasPoint(event);
    context.beginPath();
    context.moveTo(point.x, point.y);
    isDrawingRef.current = true;
  }

  function continueDrawing(event: React.PointerEvent<HTMLCanvasElement>) {
    if (!isDrawingRef.current) return;
    const context = event.currentTarget.getContext("2d");
    if (!context) return;
    const point = canvasPoint(event);
    context.lineTo(point.x, point.y);
    context.stroke();
  }

  function endDrawing() {
    isDrawingRef.current = false;
  }

  function clearCanvas() {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;
    context.fillStyle = "#fffdf8";
    context.fillRect(0, 0, canvas.width, canvas.height);
    setDrawingResult("");
    setDrawingFeedback("");
  }

  async function analyzeCurrentDrawing() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    setCloudError("");
    setIsAnalyzing(true);
    try {
      const imageBase64 = canvas.toDataURL("image/png").split(",")[1];
      const result = await provider.analyzeDrawing({ mimeType: "image/png", imageBase64 });
      setDrawingResult(result.description);
      setDrawingFeedback(result.feedback);
      setRetryAction(null);
      persistProgress({ ...progress, drawings: progress.drawings + 1 });
    } catch (error) {
      if (mode === "cloud") handleCloudFailure(error, "drawing");
      else setCloudError(getMessage(error));
    } finally {
      setIsAnalyzing(false);
    }
  }

  function speakWord(word: string) {
    if (!("speechSynthesis" in window)) {
      setCloudError("Text-to-speech is not available in this browser.");
      return;
    }
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(new SpeechSynthesisUtterance(word));
  }

  function resetSavedProgress() {
    try {
      clearProgress();
      setProgress({ attempts: [], drawings: 0 });
      setStorageError("");
    } catch {
      setStorageError("Saved progress could not be cleared from this browser.");
    }
  }

  function retryCloudRequest() {
    if (retryAction === "words") void generatePracticeWords();
    else if (retryAction === "speech") void evaluateAttempt();
    else if (retryAction === "drawing") void analyzeCurrentDrawing();
    else void refreshHealth();
  }

  function switchToDemo() {
    setMode("local");
    setCloudError("");
    setRetryAction(null);
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="#" onClick={() => setPage("home")}>
          <span className="brand-mark" aria-hidden="true">v</span>
          <span>visualecho<span className="brand-dot">.</span></span>
        </a>
        <div className="sidebar-label">YOUR SPACE</div>
        <nav className="side-nav" aria-label="Main navigation">
          <NavButton active={page === "home"} label="Overview" icon="⌂" onClick={() => setPage("home")} />
          <NavButton active={page === "practice"} label="Word practice" icon="Aa" onClick={() => setPage("practice")} />
          <NavButton active={page === "drawing"} label="Drawing studio" icon="✎" onClick={() => setPage("drawing")} />
          <NavButton active={page === "progress"} label="My progress" icon="↗" onClick={() => setPage("progress")} />
        </nav>
        <div className="sidebar-bottom">
          <button className="nav-item" onClick={() => setPage("settings")}>
            <span className="nav-icon">⚙</span><span>Settings</span>
          </button>
          <div className="privacy-note"><span className="privacy-dot" />Your progress stays on this device.</div>
        </div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <div className="mobile-brand"><span className="brand-mark">v</span> visualecho<span className="brand-dot">.</span></div>
          <div className="topbar-spacer" />
          <div className={`connection-pill ${aiStatus}`} aria-live="polite">
            <span className="connection-dot" />
            {aiStatus === "checking" ? "Checking service" : aiStatus === "online" ? "Service online" : "Service unavailable"}
          </div>
          <button className="avatar" aria-label="Open settings" onClick={() => setPage("settings")}>S</button>
        </header>

        {(storageError || cloudError || healthError) && (
          <div className={`notice ${cloudError ? "notice-error" : ""}`} role="status">
            <div className="notice-copy">
              {cloudError ? (
                <>
                  <strong>{mode === "cloud" && cloudError === "The cloud service is temporarily unavailable." ? "Unable to connect to VisualEcho" : "Something needs attention"}</strong>
                  <span>{cloudError}</span>
                </>
              ) : (
                <>
                  <strong>{storageError ? "Progress storage" : "Service connection"}</strong>
                  <span>{storageError || healthError}</span>
                </>
              )}
            </div>
            {cloudError && mode === "cloud" ? (
              <div className="notice-actions">
                <button className="text-button" onClick={retryCloudRequest}>Try again</button>
                <button className="text-button" onClick={switchToDemo}>Use demo mode</button>
              </div>
            ) : !storageError ? (
              <button className="text-button" onClick={() => void refreshHealth()}>Try again</button>
            ) : null}
          </div>
        )}

        <div className="page-content">
          {page === "home" && (
            <section className="home-page">
              <div className="welcome-row">
                <div>
                  <div className="eyebrow">WEDNESDAY · YOUR PRACTICE SPACE</div>
                  <h1>A little practice,<br /><span>a lot of progress.</span></h1>
                  <p className="lead">A calm, encouraging place to practice words at your own pace.</p>
                </div>
                <div className="welcome-art" aria-hidden="true"><span className="sun">✳</span><span className="art-leaf">⌁</span><span className="art-word">hello!</span></div>
              </div>

              <section className="mode-strip">
                <div className="mode-icon">{mode === "cloud" ? "☁" : "✳"}</div>
                <div className="mode-description">
                  <strong>{mode === "cloud" ? "Cloud AI" : "Demo mode"}</strong>
                  <span>{mode === "cloud" ? "Uses the VisualEcho API when available." : "A browser demo. Gemma is not running locally."}</span>
                </div>
                <button className="mode-switch" onClick={() => setPage("settings")}>Change mode <span aria-hidden="true">→</span></button>
              </section>

              <div className="section-heading">
                <div><div className="eyebrow">MAKE TODAY YOURS</div><h2>Choose your next step</h2></div>
              </div>
              <div className="action-grid">
                <button className="action-card practice-card" onClick={() => setPage("practice")}>
                  <span className="card-art word-art">Aa</span><span className="card-kicker">5 MIN · WORDS</span>
                  <strong>Practice speaking</strong><span className="card-description">Explore words and say them out loud.</span><span className="card-link">Start practicing <b>→</b></span>
                </button>
                <button className="action-card draw-card" onClick={() => setPage("drawing")}>
                  <span className="card-art draw-art">✎</span><span className="card-kicker">TAKE A CREATIVE BREAK</span>
                  <strong>Draw something</strong><span className="card-description">Make a picture on your own canvas.</span><span className="card-link">Open drawing studio <b>→</b></span>
                </button>
              </div>

              <div className="stats-row">
                <StatCard label="PRACTICE ATTEMPTS" value={String(progress.attempts.length)} detail="Every try counts" icon="✦" />
                <StatCard label="WORDS GOT THROUGH" value={String(progress.attempts.filter((attempt) => attempt.correct).length)} detail="One word at a time" icon="Aa" />
                <StatCard label="DAYS YOU SHOWED UP" value={String(completedDays)} detail="Progress, your way" icon="◷" />
              </div>
            </section>
          )}

          {page === "practice" && (
            <section className="work-page">
              <PageHeading eyebrow="DAILY PRACTICE" title="Find your words" subtitle="Listen, try saying a word, and go at your own pace." />
              <div className="practice-layout">
                <section className="panel word-panel">
                  <div className="panel-heading"><div><div className="eyebrow">WORD SETUP</div><h2>Make it yours</h2></div><span className="panel-sparkle">✳</span></div>
                  <label className="field-label" htmlFor="topic">What would you like words about?</label>
                  <input id="topic" className="text-input" value={topic} onChange={(event) => setTopic(event.target.value)} maxLength={64} placeholder="Try animals, nature, food…" />
                  <label className="field-label" htmlFor="difficulty">Word level</label>
                  <select id="difficulty" className="text-input" value={difficulty} onChange={(event) => setDifficulty(event.target.value as Difficulty)}>
                    <option value="easy">Easy</option><option value="medium">Medium</option><option value="hard">A little challenging</option>
                  </select>
                  <button className="primary-button full-button" onClick={() => void generatePracticeWords()} disabled={isGenerating || !topic.trim()}>
                    {isGenerating ? "Finding words…" : mode === "cloud" ? "Ask VisualEcho for words" : "Make a demo word set"}
                  </button>
                  <ProviderNote mode={mode} source={wordSet.provider} />
                </section>

                <section className="panel current-word-panel">
                  <div className="panel-heading"><div><div className="eyebrow">YOUR WORD</div><h2>Say it your way</h2></div><span className="word-count">{Math.min(wordIndex + 1, wordSet.words.length)} / {wordSet.words.length}</span></div>
                  <div className="word-display">{currentWord || "Ready?"}</div>
                  <button className="listen-button" onClick={() => speakWord(currentWord)} disabled={!currentWord}>▶ <span>Hear the word</span></button>
                  <div className="field-row">
                    <label className="field-label" htmlFor="transcript">What did you say?</label>
                    {speechRecognition && <button className="text-button mic-button" onClick={startListening} disabled={isListening}>{isListening ? "Listening…" : "Use microphone"}</button>}
                  </div>
                  <textarea id="transcript" className="text-input transcript-input" value={transcript} onChange={(event) => setTranscript(event.target.value)} placeholder={speechRecognition ? "Type your attempt or use the microphone" : "Type what you said"} rows={2} maxLength={500} />
                  {!speechRecognition && <p className="field-hint">Speech recognition is not available here; you can type your attempt.</p>}
                  <button className="primary-button full-button" onClick={() => void evaluateAttempt()} disabled={isEvaluating || !transcript.trim()}>
                    {isEvaluating ? "Checking your attempt…" : mode === "cloud" ? "Check with Cloud AI" : "Check demo attempt"}
                  </button>
                  {speechResult && <div className="result-card" role="status">{speechResult}</div>}
                </section>
              </div>
              <div className="word-list" aria-label="Words in this practice set">
                {wordSet.words.map((word, index) => <button key={`${word}-${index}`} className={`word-chip ${index === wordIndex ? "selected" : ""}`} onClick={() => { setWordIndex(index); setTranscript(""); setSpeechResult(""); }}>{index + 1}. {word}</button>)}
              </div>
            </section>
          )}

          {page === "drawing" && (
            <section className="work-page">
              <PageHeading eyebrow="DRAWING STUDIO" title="Make something lovely" subtitle="Use your mouse, trackpad, or touch screen to draw." />
              <div className="drawing-layout">
                <section className="panel canvas-panel">
                  <div className="canvas-toolbar"><span className="eyebrow">YOUR CANVAS</span><button className="secondary-button" onClick={clearCanvas}>Clear canvas</button></div>
                  <canvas ref={canvasRef} width={900} height={480} aria-label="Drawing canvas" onPointerDown={beginDrawing} onPointerMove={continueDrawing} onPointerUp={endDrawing} onPointerCancel={endDrawing} onPointerLeave={endDrawing} />
                  <div className="canvas-bottom"><span>Draw anything you like. Your picture is sent only if you choose Cloud AI analysis.</span><button className="primary-button" onClick={() => void analyzeCurrentDrawing()} disabled={isAnalyzing}>{isAnalyzing ? "Looking at your drawing…" : mode === "cloud" ? "Ask Cloud AI about my drawing" : "Try demo analysis"}</button></div>
                </section>
                {(drawingResult || drawingFeedback) && <div className="result-card drawing-result" role="status"><div className="eyebrow">A NOTE ABOUT YOUR PICTURE</div><p>{drawingResult}</p><span>{drawingFeedback}</span>{mode === "local" && <small>Demo message — no image recognition ran in the browser.</small>}</div>}
              </div>
            </section>
          )}

          {page === "progress" && (
            <section className="work-page">
              <PageHeading eyebrow="YOUR JOURNEY" title="Look how far you've come" subtitle="Every attempt is part of learning. Progress is saved on this device." />
              <div className="stats-row progress-stats">
                <StatCard label="PRACTICE ATTEMPTS" value={String(progress.attempts.length)} detail="Keep showing up" icon="✦" />
                <StatCard label="WORDS GOT THROUGH" value={String(progress.attempts.filter((attempt) => attempt.correct).length)} detail="Your practice wins" icon="Aa" />
                <StatCard label="DEMO ACCURACY" value={`${accuracy}%`} detail="Not a clinical measure" icon="◷" />
                <StatCard label="DRAWINGS ANALYZED" value={String(progress.drawings)} detail="Creative moments" icon="✎" />
              </div>
              <section className="panel history-panel"><div className="panel-heading"><div><div className="eyebrow">RECENT PRACTICE</div><h2>Your tries</h2></div></div>
                {progress.attempts.length === 0 ? <p className="empty-state">Your practice attempts will appear here. Ready when you are.</p> : <div className="history-list">{[...progress.attempts].reverse().slice(0, 12).map((attempt, index) => <div className="history-item" key={`${attempt.completedAt}-${index}`}><span className="history-status">{attempt.correct ? "✓" : "↻"}</span><span className="history-word">{attempt.word}</span><span className="history-date">{new Date(attempt.completedAt).toLocaleDateString()}</span><span className={`history-badge ${attempt.correct ? "success" : ""}`}>{attempt.correct ? "Matched" : "Practiced"}</span></div>)}</div>}
              </section>
            </section>
          )}

          {page === "settings" && (
            <section className="work-page">
              <PageHeading eyebrow="YOUR PREFERENCES" title="A setup that suits you" subtitle="Choose how VisualEcho responds. Your choice is saved in this browser." />
              <section className="panel settings-panel"><div className="panel-heading"><div><div className="eyebrow">WORD & DRAWING HELP</div><h2>Choose an AI mode</h2></div></div>
                <label className={`mode-option ${mode === "local" ? "active" : ""}`}><input type="radio" name="mode" checked={mode === "local"} onChange={() => { setMode("local"); setCloudError(""); }} /><span className="mode-option-icon">✳</span><span className="mode-option-copy"><strong>Local demo</strong><span>Mock practice content runs in this browser. It is not Gemma or image recognition.</span></span><span className="mode-tag">PRIVATE</span></label>
                <label className={`mode-option ${mode === "cloud" ? "active" : ""}`}><input type="radio" name="mode" checked={mode === "cloud"} onChange={() => { setMode("cloud"); setCloudError(""); }} /><span className="mode-option-icon">☁</span><span className="mode-option-copy"><strong>Cloud AI</strong><span>Sends supported requests to the VisualEcho backend. Your Gemini key stays server-side.</span></span><span className="mode-tag">ONLINE</span></label>
                <div className="settings-divider" />
                <div className="settings-line"><div><strong>Speech recognition</strong><span>{speechRecognition ? "Browser speech recognition is available. Audio is processed by your browser." : "Not available in this browser. Type your attempt instead."}</span></div><span className={`availability ${speechRecognition ? "available" : ""}`}>{speechRecognition ? "AVAILABLE" : "UNAVAILABLE"}</span></div>
                <div className="settings-line"><div><strong>Read words aloud</strong><span>{("speechSynthesis" in window) ? "Uses the browser's built-in speech synthesis." : "Not available in this browser."}</span></div><span className={`availability ${("speechSynthesis" in window) ? "available" : ""}`}>{("speechSynthesis" in window) ? "AVAILABLE" : "UNAVAILABLE"}</span></div>
                <div className="settings-divider" />
                <div className="settings-line"><div><strong>API health</strong><span>{health ? `${health.service} is responding.` : healthError || "Checking the VisualEcho API…"}</span></div><button className="secondary-button" onClick={() => void refreshHealth()}>Check again</button></div>
                <div className="endpoint-display"><span>API base URL</span><code>{API_BASE_URL}</code></div>
              </section>
              <section className="panel reset-panel"><div><strong>Reset saved progress</strong><span>This removes practice history and drawing counts stored on this device.</span></div><button className="secondary-button" onClick={resetSavedProgress}>Reset progress</button></section>
            </section>
          )}
        </div>
        <footer className="page-footer"><span>VisualEcho is a practice companion, not a clinical tool.</span><span>{progressReady ? "Progress stored in this browser" : "Loading your progress…"}</span></footer>
      </main>
    </div>
  );
}

function NavButton({ active, label, icon, onClick }: { active: boolean; label: string; icon: string; onClick: () => void }) {
  return <button className={`nav-item ${active ? "active" : ""}`} onClick={onClick}><span className="nav-icon">{icon}</span><span>{label}</span></button>;
}

function PageHeading({ eyebrow, title, subtitle }: { eyebrow: string; title: string; subtitle: string }) {
  return <div className="page-heading"><div className="eyebrow">{eyebrow}</div><h1>{title}</h1><p>{subtitle}</p></div>;
}

function StatCard({ label, value, detail, icon }: { label: string; value: string; detail: string; icon: string }) {
  return <div className="stat-card"><span className="stat-icon">{icon}</span><div className="stat-label">{label}</div><div className="stat-value">{value}</div><div className="stat-detail">{detail}</div></div>;
}

function ProviderNote({ mode, source }: { mode: "local" | "cloud"; source: string }) {
  if (source === "starter-list") {
    return <p className="provider-note">Starter word list · no AI request has run yet.</p>;
  }
  return <p className="provider-note">{mode === "cloud" ? `Backend response · ${source}` : `Demo provider · ${source}; no local Gemma runtime`}</p>;
}

export default App;
