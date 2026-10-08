import { useEffect, useMemo, useRef, useState, type CSSProperties, type PointerEvent, type RefObject } from "react";
import { Link, NavLink, Route, Routes, useLocation } from "react-router-dom";
import "./app.css";
import { Button } from "@/components/Button";
import { Colors, Spacing, Typography } from "@/constants/theme";
import { checkHealth, type HealthResponse } from "@/services/api/health";
import { API_BASE_URL } from "@/services/api/config";
import { VisualEchoApiError } from "@/services/api/client";
import { getAIProvider } from "@/services/ai";
import { searchCommonsPhoto, type CommonsPhoto } from "@/services/commonsPhotos";
import type {
  Difficulty,
  SpeechEvaluationResult,
  WordGenerationResult,
} from "@/services/ai/types";
import {
  clearProgress,
  loadProgress,
  saveProgress,
  type ProgressData,
} from "@/services/progress";

type AIMode = "local" | "cloud";
type CloudAction = "words" | "speech" | "drawing";

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

const STARTER_WORDS: WordGenerationResult = {
  topic: "nature",
  difficulty: "easy",
  words: ["sun", "fish", "book", "tree", "school"],
  provider: "starter-list",
  model: "built-in",
};

const styles = {
  shell: {
    minHeight: "100%",
    display: "flex",
    flexDirection: "column" as const,
    background: Colors.light.background,
    color: Colors.light.onSurface,
  },
  header: {
    position: "sticky" as const,
    top: 0,
    zIndex: 2,
    display: "flex",
    alignItems: "center",
    gap: Spacing.three,
    minHeight: 68,
    padding: `0 ${Spacing.four}px`,
    borderBottom: `1px solid ${Colors.light.outlineVariant}`,
    background: Colors.light.surface,
  },
  brand: {
    display: "flex",
    alignItems: "center",
    gap: Spacing.two,
    color: Colors.light.onSurface,
    fontFamily: "system-ui, sans-serif",
    fontSize: 19,
    fontWeight: 750,
  },
  logo: {
    display: "grid",
    width: 34,
    height: 34,
    placeItems: "center",
    borderRadius: 12,
    background: Colors.light.primary,
    color: Colors.light.primaryText,
    fontWeight: 800,
  },
  navigation: {
    display: "flex",
    gap: Spacing.one,
    flex: 1,
  },
  navLink: {
    padding: `${Spacing.one}px ${Spacing.two}px`,
    borderRadius: 8,
    color: Colors.light.textSecondary,
    fontSize: 13,
    fontWeight: 600,
  },
  navActive: {
    color: Colors.light.primary,
    background: Colors.light.primaryContainer,
  },
  status: {
    display: "flex",
    alignItems: "center",
    gap: 7,
    color: Colors.light.textSecondary,
    fontSize: 11,
    whiteSpace: "nowrap" as const,
  },
  content: {
    width: "min(940px, calc(100% - 40px))",
    margin: "0 auto",
    padding: `${Spacing.five}px 0`,
    flex: 1,
  },
  footer: {
    display: "flex",
    justifyContent: "space-between",
    gap: Spacing.two,
    padding: `${Spacing.two}px ${Spacing.four}px`,
    color: "#64717D",
    borderTop: `1px solid ${Colors.light.outlineVariant}`,
    fontSize: 11,
  },
  panel: {
    padding: Spacing.four,
    background: Colors.light.surface,
    border: `1px solid ${Colors.light.outlineVariant}`,
    borderRadius: 16,
  },
  field: {
    display: "grid",
    gap: Spacing.one,
    marginBottom: Spacing.three,
  },
  fieldLabel: {
    color: Colors.light.textSecondary,
    fontSize: 13,
    fontWeight: 600,
  },
  input: {
    width: "100%",
    minHeight: 46,
    padding: "10px 12px",
    border: `1px solid ${Colors.light.outline}`,
    borderRadius: 8,
    color: Colors.light.onSurface,
    background: Colors.light.surface,
    font: "inherit",
  },
  row: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: Spacing.two,
    flexWrap: "wrap" as const,
  },
  muted: {
    color: Colors.light.textSecondary,
    fontSize: 13,
    lineHeight: 1.6,
  },
  eyebrow: {
    color: Colors.light.primary,
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: 1,
    textTransform: "uppercase" as const,
  },
} satisfies Record<string, CSSProperties>;

function initialMode(): { mode: AIMode; error: string } {
  try {
    return {
      mode: window.localStorage.getItem("visualecho.web.ai-mode") === "cloud" ? "cloud" : "local",
      error: "",
    };
  } catch {
    return { mode: "local", error: "Your AI mode preference could not be read from this browser." };
  }
}

function errorMessage(error: unknown): string {
  return error instanceof Error
    ? error.message
    : "An unexpected error occurred. Please try again.";
}

export default function App() {
  const initial = useMemo(initialMode, []);
  const [mode, setMode] = useState<AIMode>(initial.mode);
  const [modeError, setModeError] = useState(initial.error);
  const [apiStatus, setApiStatus] = useState<"checking" | "online" | "offline">("checking");
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [healthError, setHealthError] = useState("");
  const [cloudError, setCloudError] = useState("");
  const [retryAction, setRetryAction] = useState<CloudAction | null>(null);
  const [progress, setProgress] = useState<ProgressData>({ attempts: [], drawings: 0 });
  const [progressReady, setProgressReady] = useState(false);
  const [topic, setTopic] = useState("animals");
  const [difficulty, setDifficulty] = useState<Difficulty>("easy");
  const [wordSet, setWordSet] = useState(STARTER_WORDS);
  const [wordIndex, setWordIndex] = useState(0);
  const [transcript, setTranscript] = useState("");
  const [speechResult, setSpeechResult] = useState<SpeechEvaluationResult | null>(null);
  const [drawingResult, setDrawingResult] = useState("");
  const [drawingFeedback, setDrawingFeedback] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoiceURI, setSelectedVoiceURI] = useState("");
  const [speechRate, setSpeechRate] = useState(0.9);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [storageError, setStorageError] = useState("");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawingRef = useRef(false);
  const location = useLocation();
  const provider = getAIProvider(mode);
  const speechRecognition = useMemo(() => {
    const speechWindow = window as SpeechWindow;
    return speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition ?? null;
  }, []);
  const speechSynthesisAvailable =
    "speechSynthesis" in window && "SpeechSynthesisUtterance" in window;
  const currentWord = wordSet.words[wordIndex] ?? wordSet.words[0] ?? "";
  const successfulAttempts = progress.attempts.filter((attempt) => attempt.correct).length;
  const accuracy = progress.attempts.length
    ? Math.round((successfulAttempts / progress.attempts.length) * 100)
    : 0;
  const practiceDays = new Set(
    progress.attempts.map((attempt) => attempt.completedAt.slice(0, 10)),
  ).size;

  useEffect(() => {
    try {
      setProgress(loadProgress());
    } catch (error) {
      setStorageError(errorMessage(error));
    } finally {
      setProgressReady(true);
    }
  }, []);

  useEffect(() => {
    void refreshHealth();
  }, []);

  useEffect(() => {
    if (!("speechSynthesis" in window)) return;
    const synthesis = window.speechSynthesis;
    const updateVoices = () => {
      const voices = synthesis.getVoices();
      setAvailableVoices(voices);
      setSelectedVoiceURI((current) => {
        if (current && voices.some((voice) => voice.voiceURI === current)) return current;
        return voices.find((voice) => voice.lang.toLowerCase().startsWith("en-us"))?.voiceURI
          ?? voices.find((voice) => voice.lang.toLowerCase().startsWith("en"))?.voiceURI
          ?? "";
      });
    };

    updateVoices();
    synthesis.addEventListener("voiceschanged", updateVoices);
    return () => {
      synthesis.removeEventListener("voiceschanged", updateVoices);
      synthesis.cancel();
    };
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem("visualecho.web.ai-mode", mode);
      setModeError("");
    } catch {
      setModeError("Your AI mode preference could not be saved in this browser.");
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
    context.strokeStyle = "#1b5e8c";
  }, [location.pathname]);

  async function refreshHealth() {
    setApiStatus("checking");
    setHealthError("");
    try {
      const response = await checkHealth();
      setHealth(response);
      setApiStatus("online");
    } catch (error) {
      setHealth(null);
      setHealthError(errorMessage(error));
      setApiStatus("offline");
    }
  }

  function persistProgress(next: ProgressData) {
    setProgress(next);
    try {
      saveProgress(next);
      setStorageError("");
    } catch {
      setStorageError("Progress changed for this session but could not be saved in this browser.");
    }
  }

  function recordCloudError(error: unknown, action: CloudAction) {
    setRetryAction(action);
    setCloudError(
      error instanceof VisualEchoApiError
        ? "The cloud service is temporarily unavailable."
        : errorMessage(error),
    );
  }

  function changeMode(nextMode: AIMode) {
    setMode(nextMode);
    setCloudError("");
    setRetryAction(null);
    setWordSet(STARTER_WORDS);
    setWordIndex(0);
    setTranscript("");
    setSpeechResult(null);
    setDrawingResult("");
    setDrawingFeedback("");
  }

  async function generateWords() {
    setCloudError("");
    setSpeechResult(null);
    setTranscript("");
    setIsGenerating(true);
    try {
      const result = await provider.generateWords({ topic: topic.trim(), difficulty, count: 5 });
      setWordSet(result);
      setWordIndex(0);
      setRetryAction(null);
    } catch (error) {
      if (mode === "cloud") recordCloudError(error, "words");
      else setCloudError(errorMessage(error));
    } finally {
      setIsGenerating(false);
    }
  }

  function startSpeechRecognition() {
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
    setCloudError("");
    setIsListening(true);
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
      setSpeechResult(result);
      const responseText = `${result.correct ? "Nice work!" : "Keep practicing!"} ${result.feedback}`;
      if (result.correct) {
        speakText(responseText);
      } else {
        const spelledWord = [...result.target_word.trim()].join(" ... ");
        speakText(
          `${responseText} Let's learn it one letter at a time: ${spelledWord}. Now listen to the whole word slowly: ${result.target_word}. Try saying it again. This word will stay here until it matches.`,
          Math.min(speechRate, 0.7),
        );
      }
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
      if (result.correct) {
        setWordIndex((index) => Math.min(index + 1, wordSet.words.length - 1));
      }
      setTranscript("");
      setRetryAction(null);
    } catch (error) {
      if (mode === "cloud") recordCloudError(error, "speech");
      else setCloudError(errorMessage(error));
    } finally {
      setIsEvaluating(false);
    }
  }

  function canvasPoint(event: PointerEvent<HTMLCanvasElement>) {
    const canvas = event.currentTarget;
    const bounds = canvas.getBoundingClientRect();
    return {
      x: ((event.clientX - bounds.left) / bounds.width) * canvas.width,
      y: ((event.clientY - bounds.top) / bounds.height) * canvas.height,
    };
  }

  function beginDrawing(event: PointerEvent<HTMLCanvasElement>) {
    event.currentTarget.setPointerCapture(event.pointerId);
    const context = event.currentTarget.getContext("2d");
    if (!context) return;
    const point = canvasPoint(event);
    context.beginPath();
    context.moveTo(point.x, point.y);
    isDrawingRef.current = true;
  }

  function continueDrawing(event: PointerEvent<HTMLCanvasElement>) {
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

  async function analyzeDrawing() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    setCloudError("");
    setIsAnalyzing(true);
    try {
      const imageBase64 = canvas.toDataURL("image/png").split(",")[1];
      const result = await provider.analyzeDrawing({ mimeType: "image/png", imageBase64 });
      setDrawingResult(result.description);
      setDrawingFeedback(result.feedback);
      persistProgress({ ...progress, drawings: progress.drawings + 1 });
      setRetryAction(null);
    } catch (error) {
      if (mode === "cloud") recordCloudError(error, "drawing");
      else setCloudError(errorMessage(error));
    } finally {
      setIsAnalyzing(false);
    }
  }

  function speakText(text: string, rate = speechRate) {
    if (!speechSynthesisAvailable) {
      setCloudError("Text-to-speech is not available in this browser.");
      return;
    }
    const synthesis = window.speechSynthesis;
    synthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    const voice = availableVoices.find((candidate) => candidate.voiceURI === selectedVoiceURI);
    if (voice) {
      utterance.voice = voice;
      utterance.lang = voice.lang;
    } else {
      utterance.lang = "en-US";
    }
    utterance.rate = rate;
    utterance.pitch = 1.05;
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = (event) => {
      setIsSpeaking(false);
      if (event.error === "canceled" || event.error === "interrupted") return;
      setCloudError("Browser text-to-speech could not play this word. Try another voice.");
    };
    setCloudError("");
    synthesis.speak(utterance);
  }

  function stopSpeaking() {
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    setIsSpeaking(false);
  }

  function retryCloudRequest() {
    if (retryAction === "words") void generateWords();
    else if (retryAction === "speech") void evaluateAttempt();
    else if (retryAction === "drawing") void analyzeDrawing();
    else void refreshHealth();
  }

  function resetProgress() {
    try {
      clearProgress();
      setProgress({ attempts: [], drawings: 0 });
      setStorageError("");
    } catch {
      setStorageError("Saved progress could not be removed from this browser.");
    }
  }

  return (
    <div style={styles.shell}>
      <header style={styles.header}>
        <Link to="/" style={{ ...styles.brand, textDecoration: "none" }}>
          <span style={styles.logo} aria-hidden="true">v</span>
          <span>VisualEcho</span>
        </Link>
        <nav style={styles.navigation} aria-label="Main navigation">
          <NavigationLink to="/" label="Overview" />
          <NavigationLink to="/practice" label="Practice" />
          <NavigationLink to="/drawing" label="Drawing" />
          <NavigationLink to="/progress" label="Progress" />
          <NavigationLink to="/settings" label="Settings" />
        </nav>
        <div style={styles.status} aria-live="polite">
          <span className={`status-indicator ${apiStatus}`} />
          {apiStatus === "checking" ? "Checking API" : apiStatus === "online" ? "API online" : "API unavailable"}
        </div>
      </header>

      {(cloudError || healthError || storageError || modeError) && (
        <div className={`message-banner ${cloudError ? "message-error" : ""}`} role="status">
          <div>
            <strong>
              {cloudError && mode === "cloud" && cloudError === "The cloud service is temporarily unavailable."
                ? "Unable to connect to VisualEcho"
                : storageError || modeError
                  ? "Browser storage needs attention"
                  : cloudError
                    ? "Something needs attention"
                    : "VisualEcho API is unavailable"}
            </strong>
            <p>{cloudError || storageError || modeError || healthError}</p>
          </div>
          {cloudError && mode === "cloud" ? (
            <div className="banner-actions">
              <button className="quiet-button" onClick={retryCloudRequest}>Try again</button>
              <button className="quiet-button" onClick={() => changeMode("local")}>Use demo mode</button>
            </div>
          ) : healthError ? (
            <button className="quiet-button" onClick={() => void refreshHealth()}>Try again</button>
          ) : null}
        </div>
      )}

      <main style={styles.content}>
        <Routes>
          <Route
            path="/"
            element={<HomePage mode={mode} progress={progress} />}
          />
          <Route
            path="/practice"
            element={
              <PracticePage
                mode={mode}
                topic={topic}
                setTopic={setTopic}
                difficulty={difficulty}
                setDifficulty={setDifficulty}
                wordSet={wordSet}
                wordIndex={wordIndex}
                setWordIndex={setWordIndex}
                currentWord={currentWord}
                transcript={transcript}
                setTranscript={setTranscript}
                speechResult={speechResult}
                setSpeechResult={setSpeechResult}
                generateWords={() => void generateWords()}
                evaluateAttempt={() => void evaluateAttempt()}
                speakText={speakText}
                stopSpeaking={stopSpeaking}
                availableVoices={availableVoices}
                selectedVoiceURI={selectedVoiceURI}
                setSelectedVoiceURI={setSelectedVoiceURI}
                speechRate={speechRate}
                setSpeechRate={setSpeechRate}
                isSpeaking={isSpeaking}
                speechSynthesisAvailable={speechSynthesisAvailable}
                startSpeechRecognition={startSpeechRecognition}
                speechRecognitionAvailable={Boolean(speechRecognition)}
                isListening={isListening}
                isGenerating={isGenerating}
                isEvaluating={isEvaluating}
              />
            }
          />
          <Route
            path="/drawing"
            element={
              <DrawingPage
                mode={mode}
                canvasRef={canvasRef}
                drawingResult={drawingResult}
                drawingFeedback={drawingFeedback}
                isAnalyzing={isAnalyzing}
                beginDrawing={beginDrawing}
                continueDrawing={continueDrawing}
                endDrawing={endDrawing}
                clearCanvas={clearCanvas}
                analyzeDrawing={() => void analyzeDrawing()}
              />
            }
          />
          <Route path="/progress" element={<ProgressPage progress={progress} accuracy={accuracy} practiceDays={practiceDays} />} />
          <Route
            path="/settings"
            element={
              <SettingsPage
                mode={mode}
                changeMode={changeMode}
                speechRecognitionAvailable={Boolean(speechRecognition)}
                speechSynthesisAvailable={speechSynthesisAvailable}
                health={health}
                healthError={healthError}
                apiBaseUrl={API_BASE_URL}
                refreshHealth={() => void refreshHealth()}
                resetProgress={resetProgress}
              />
            }
          />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>
      <footer style={styles.footer}>
        <span>VisualEcho is a practice companion, not a clinical tool.</span>
        <span>{progressReady ? "Progress saved in this browser" : "Loading progress…"}</span>
      </footer>
    </div>
  );
}

function NavigationLink({ to, label }: { to: string; label: string }) {
  return (
    <NavLink
      to={to}
      end={to === "/"}
      className={({ isActive }) => `route-link${isActive ? " route-link-active" : ""}`}
    >
      {label}
    </NavLink>
  );
}

function HomePage({
  mode,
  progress,
}: {
  mode: AIMode;
  progress: ProgressData;
}) {
  return (
    <section>
      <PageHeading
        eyebrow="Your practice space"
        title="A little practice, a lot of progress."
        subtitle="A calm, encouraging place to practice words at your own pace."
      />
      <div className="home-mode" role="status">
        <span aria-hidden="true">{mode === "cloud" ? "☁" : "✳"}</span>
        <div>
          <strong>{mode === "cloud" ? "Cloud AI" : "Local demo"}</strong>
          <p>{mode === "cloud" ? "Supported requests go to the VisualEcho API." : "Mock content for the browser; Gemma is not running locally."}</p>
        </div>
        <Link to="/settings">Change mode →</Link>
      </div>
      <h2 className="section-title">Choose your next step</h2>
      <div className="home-cards">
        <Link className="home-card" to="/practice">
          <span className="home-card-icon">Aa</span>
          <span className="eyebrow">WORDS · AT YOUR OWN PACE</span>
          <strong>Practice speaking</strong>
          <span>Explore words and try saying them out loud.</span>
          <b>Start practicing →</b>
        </Link>
        <Link className="home-card drawing-card" to="/drawing">
          <span className="home-card-icon">✎</span>
          <span className="eyebrow">A CREATIVE BREAK</span>
          <strong>Draw something</strong>
          <span>Make a picture on your own browser canvas.</span>
          <b>Open drawing studio →</b>
        </Link>
      </div>
      <div className="metric-grid">
        <Metric label="Practice attempts" value={progress.attempts.length} />
        <Metric label="Matched words" value={progress.attempts.filter((attempt) => attempt.correct).length} />
        <Metric label="Drawing sessions" value={progress.drawings} />
      </div>
    </section>
  );
}

function PracticePage(props: {
  mode: AIMode;
  topic: string;
  setTopic: (value: string) => void;
  difficulty: Difficulty;
  setDifficulty: (value: Difficulty) => void;
  wordSet: WordGenerationResult;
  wordIndex: number;
  setWordIndex: (value: number) => void;
  currentWord: string;
  transcript: string;
  setTranscript: (value: string) => void;
  speechResult: SpeechEvaluationResult | null;
  setSpeechResult: (result: SpeechEvaluationResult | null) => void;
  generateWords: () => void;
  evaluateAttempt: () => void;
  speakText: (text: string, rate?: number) => void;
  stopSpeaking: () => void;
  availableVoices: SpeechSynthesisVoice[];
  selectedVoiceURI: string;
  setSelectedVoiceURI: (voiceURI: string) => void;
  speechRate: number;
  setSpeechRate: (rate: number) => void;
  isSpeaking: boolean;
  speechSynthesisAvailable: boolean;
  startSpeechRecognition: () => void;
  speechRecognitionAvailable: boolean;
  isListening: boolean;
  isGenerating: boolean;
  isEvaluating: boolean;
}) {
  const {
    mode, topic, setTopic, difficulty, setDifficulty, wordSet, wordIndex,
    setWordIndex, currentWord, transcript, setTranscript, speechResult,
    setSpeechResult,
    generateWords, evaluateAttempt, speakText, stopSpeaking, availableVoices,
    selectedVoiceURI, setSelectedVoiceURI, speechRate, setSpeechRate, isSpeaking,
    speechSynthesisAvailable,
    startSpeechRecognition,
    speechRecognitionAvailable, isListening, isGenerating, isEvaluating,
  } = props;
  const completedWords = wordSet.words.slice(0, wordIndex).length;
  return (
    <section>
      <PageHeading eyebrow="Daily practice" title="Find your words" subtitle="One word at a time. Listen, try, and keep going at your own pace." />
      <div className="practice-set-progress" aria-label={`${completedWords} of ${wordSet.words.length} words completed`}>
        <div className="practice-set-progress-copy">
          <span>Today's word set</span>
          <strong>{completedWords} of {wordSet.words.length} words matched</strong>
        </div>
        <div className="practice-set-progress-track" aria-hidden="true">
          <span style={{ width: `${wordSet.words.length ? (completedWords / wordSet.words.length) * 100 : 0}%` }} />
        </div>
      </div>
      <div className="two-column">
        <section className="surface-card setup-card">
          <span className="card-step">01 <span>SET UP</span></span>
          <h2>Choose a word theme</h2>
          <p className="card-intro">Pick a topic and a level that feels right for today.</p>
          <div style={styles.field}>
            <label style={styles.fieldLabel} htmlFor="topic">Word theme</label>
            <input style={styles.input} id="topic" value={topic} onChange={(event) => setTopic(event.target.value)} maxLength={64} />
          </div>
          <div style={styles.field}>
            <label style={styles.fieldLabel} htmlFor="difficulty">Word level</label>
            <select style={styles.input} id="difficulty" value={difficulty} onChange={(event) => setDifficulty(event.target.value as Difficulty)}>
              <option value="easy">Easy</option><option value="medium">Medium</option><option value="hard">A little challenging</option>
            </select>
          </div>
          <Button title={isGenerating ? "Finding words…" : mode === "cloud" ? "Ask VisualEcho for words" : "Make a demo word set"} onClick={generateWords} disabled={isGenerating || !topic.trim()} style={{ width: "100%" }} />
          <ProviderNote mode={mode} result={wordSet} />
        </section>
        <section className="surface-card current-word-card">
          <div style={styles.row}>
            <div className="word-card-heading">
              <span className="card-step">02 <span>SAY IT</span></span>
              <span className={speechSynthesisAvailable ? "tts-badge" : "tts-badge unavailable"}>
                <span className="voice-status-dot" />
                {speechSynthesisAvailable ? "Voice ready" : "Voice unavailable"}
              </span>
            </div>
            <span className="word-position">{String(Math.min(wordIndex + 1, wordSet.words.length)).padStart(2, "0")} <span>/ {String(wordSet.words.length).padStart(2, "0")}</span></span>
          </div>
          <div className="word-picture-row">
            <WordPhoto word={currentWord} />
            <div className="word-reading">
              <div className="practice-word">{currentWord || "Ready?"}</div>
              <div className="tts-controls">
                <Button
                  title={isSpeaking ? "Playing word…" : "Hear the word"}
                  onClick={() => speakText(currentWord)}
                  disabled={!currentWord || isSpeaking || !speechSynthesisAvailable}
                  style={{ minHeight: 44 }}
                />
                {isSpeaking && <button className="quiet-button" onClick={stopSpeaking}>Stop</button>}
              </div>
              {isSpeaking && <span className="speaking-status" aria-live="polite"><i /><i /><i /> Speaking the word</span>}
              {!speechSynthesisAvailable && <p className="helper-text">Text-to-speech is not available in this browser.</p>}
            </div>
          </div>
          <details className="voice-settings">
            <summary>Voice options <span>Choose a voice and adjust speed</span></summary>
            <div className="voice-options-grid">
            <label className="voice-field" htmlFor="speech-voice">
              <span>Voice</span>
              <select
                id="speech-voice"
                value={selectedVoiceURI}
                onChange={(event) => setSelectedVoiceURI(event.target.value)}
                disabled={availableVoices.length === 0}
              >
                {availableVoices.length === 0
                  ? <option value="">Default browser voice</option>
                  : availableVoices.map((voice) => (
                    <option key={voice.voiceURI} value={voice.voiceURI}>
                      {voice.name} ({voice.lang})
                    </option>
                  ))}
              </select>
            </label>
            <label className="voice-field rate-field" htmlFor="speech-rate">
              <span>Speaking speed <strong>{speechRate.toFixed(1)}×</strong></span>
              <input
                id="speech-rate"
                type="range"
                min="0.75"
                max="1.15"
                step="0.05"
                value={speechRate}
                onChange={(event) => setSpeechRate(Number(event.target.value))}
                aria-label="Speaking speed"
              />
              <span className="speed-hints"><span>Slower</span><span>Faster</span></span>
            </label>
            </div>
          </details>
          <div style={styles.field}>
            <div style={styles.row}>
              <label style={styles.fieldLabel} htmlFor="transcript">What did you say?</label>
              {speechRecognitionAvailable && <button className="quiet-button" onClick={startSpeechRecognition} disabled={isListening}>{isListening ? "Listening…" : "Use microphone"}</button>}
            </div>
            <textarea style={{ ...styles.input, minHeight: 78, resize: "vertical" }} id="transcript" value={transcript} onChange={(event) => setTranscript(event.target.value)} placeholder={speechRecognitionAvailable ? "Type your attempt or use the microphone" : "Type what you said"} maxLength={500} />
            {!speechRecognitionAvailable && <span className="helper-text">Browser speech recognition is not available; typed attempts are supported.</span>}
          </div>
          <Button title={isEvaluating ? "Checking your attempt…" : mode === "cloud" ? "Check with Cloud AI" : "Check demo attempt"} onClick={evaluateAttempt} disabled={isEvaluating || !transcript.trim()} style={{ width: "100%" }} />
          {speechResult && <div className={`feedback-box ${speechResult.correct ? "feedback-positive" : ""}`} role="status">
            <strong>{speechResult.correct ? "Nice work!" : "Keep practicing!"}</strong>
            <p>{speechResult.feedback}</p>
            <div className="learning-prompt">
              {!speechResult.correct && (
                <>
                  <p>This word stays here until it matches. Listen, then try saying it again.</p>
                  <div className="learning-actions">
                    <button className="quiet-button" onClick={() => speakText(`The letters are: ${[...speechResult.target_word.trim()].join(" ... ")}.`, Math.min(speechRate, 0.7))} disabled={!speechSynthesisAvailable}>
                      Hear letters slowly
                    </button>
                    <button className="quiet-button" onClick={() => speakText(speechResult.target_word, 0.65)} disabled={!speechSynthesisAvailable}>
                      Hear whole word slowly
                    </button>
                  </div>
                </>
              )}
              <button
                className="quiet-button"
                onClick={() => speakText(`${speechResult.correct ? "Nice work!" : "Keep practicing!"} ${speechResult.feedback}`)}
                disabled={!speechSynthesisAvailable}
              >
                Hear this feedback
              </button>
            </div>
            {mode === "local" && <small>Demo evaluation · {speechResult.provider} · not a clinical measure.</small>}
          </div>}
        </section>
      </div>
      <div className="word-chips" aria-label="Words in this practice set">
        {wordSet.words.map((word, index) => <button key={`${word}-${index}`} className={`word-chip ${index === wordIndex ? "word-chip-active" : ""}`} disabled={Boolean(speechResult && !speechResult.correct && index !== wordIndex)} title={speechResult && !speechResult.correct && index !== wordIndex ? "Match this word before moving on" : undefined} onClick={() => { setWordIndex(index); setTranscript(""); setSpeechResult(null); }}>{index + 1}. {word}</button>)}
      </div>
    </section>
  );
}

function WordPhoto({ word }: { word: string }) {
  const [photo, setPhoto] = useState<CommonsPhoto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [retryNumber, setRetryNumber] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setPhoto(null);
    setError("");
    setIsLoading(true);

    void searchCommonsPhoto(word, controller.signal)
      .then((result) => setPhoto(result))
      .catch((reason: unknown) => {
        if (reason instanceof DOMException && reason.name === "AbortError") return;
        setError(errorMessage(reason));
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false);
      });

    return () => controller.abort();
  }, [word, retryNumber]);

  if (isLoading) {
    return (
      <div className="word-photo-state" role="status" aria-live="polite">
        <span className="photo-spinner" aria-hidden="true" />
        <span>Finding a real photo of {word}…</span>
        <small>Searching Wikimedia Commons</small>
      </div>
    );
  }

  if (error || !photo) {
    return (
      <div className="word-photo-state word-photo-error" role="status">
        <span>{error ? `Photo unavailable: ${error}` : `No suitable photo found for “${word}”.`}</span>
        <small>Photos are fetched from Wikimedia Commons; no placeholder image is substituted.</small>
        <button className="quiet-button" onClick={() => setRetryNumber((value) => value + 1)}>
          Try photo search again
        </button>
      </div>
    );
  }

  return (
    <figure className="word-photo">
      <img
        className="word-picture"
        src={photo.imageUrl}
        alt={photo.description}
        onError={() => {
          setPhoto(null);
          setError("The Wikimedia Commons image could not be loaded.");
        }}
      />
      <figcaption>
        <a href={photo.sourceUrl} target="_blank" rel="noreferrer">
          Source: {photo.fileTitle}
        </a>
        <span>Photo: {photo.artist} · {photo.license}</span>
      </figcaption>
    </figure>
  );
}

function DrawingPage(props: {
  mode: AIMode;
  canvasRef: RefObject<HTMLCanvasElement | null>;
  drawingResult: string;
  drawingFeedback: string;
  isAnalyzing: boolean;
  beginDrawing: (event: PointerEvent<HTMLCanvasElement>) => void;
  continueDrawing: (event: PointerEvent<HTMLCanvasElement>) => void;
  endDrawing: () => void;
  clearCanvas: () => void;
  analyzeDrawing: () => void;
}) {
  const {
    mode, canvasRef, drawingResult, drawingFeedback, isAnalyzing,
    beginDrawing, continueDrawing, endDrawing, clearCanvas, analyzeDrawing,
  } = props;
  return (
    <section>
      <PageHeading eyebrow="Drawing studio" title="Make something lovely" subtitle="Use your mouse, trackpad, or touch screen to draw." />
      <section className="surface-card">
        <div style={styles.row}><span style={styles.eyebrow}>Your canvas</span><Button variant="secondary" title="Clear canvas" onClick={clearCanvas} style={{ minHeight: 40 }} /></div>
        <canvas
          ref={canvasRef}
          className="drawing-canvas"
          width={900}
          height={480}
          aria-label="Drawing canvas"
          onPointerDown={beginDrawing}
          onPointerMove={continueDrawing}
          onPointerUp={endDrawing}
          onPointerCancel={endDrawing}
          onPointerLeave={endDrawing}
        />
        <div className="canvas-actions">
          <p>Your drawing is sent to the backend only if you request Cloud AI analysis.</p>
          <Button title={isAnalyzing ? "Looking at your drawing…" : mode === "cloud" ? "Ask Cloud AI about my drawing" : "Try demo analysis"} onClick={analyzeDrawing} disabled={isAnalyzing} />
        </div>
      </section>
      {(drawingResult || drawingFeedback) && <div className="feedback-box feedback-positive" role="status">
        <strong>A note about your picture</strong>
        <p>{drawingResult}</p>
        <span>{drawingFeedback}</span>
        {mode === "local" && <small>Demo message · no image recognition ran in the browser.</small>}
      </div>}
    </section>
  );
}

function ProgressPage({
  progress,
  accuracy,
  practiceDays,
}: {
  progress: ProgressData;
  accuracy: number;
  practiceDays: number;
}) {
  return (
    <section>
      <PageHeading eyebrow="Your journey" title="Every try counts" subtitle="Your history stays in this browser. Progress is personal—not a score." />
      <div className="metric-grid">
        <Metric label="Practice attempts" value={progress.attempts.length} />
        <Metric label="Matched words" value={progress.attempts.filter((attempt) => attempt.correct).length} />
        <Metric label="Demo accuracy" value={`${accuracy}%`} />
        <Metric label="Practice days" value={practiceDays} />
        <Metric label="Drawing sessions" value={progress.drawings} />
      </div>
      <section className="surface-card history-card">
        <h2>Recent practice</h2>
        {progress.attempts.length === 0 ? <p style={styles.muted}>Practice attempts will appear here. Ready when you are.</p> : (
          <div className="history-list">
            {[...progress.attempts].reverse().slice(0, 12).map((attempt, index) => (
              <div className="history-row" key={`${attempt.completedAt}-${index}`}>
                <span aria-hidden="true">{attempt.correct ? "✓" : "↻"}</span>
                <strong>{attempt.word}</strong>
                <time dateTime={attempt.completedAt}>{new Date(attempt.completedAt).toLocaleDateString()}</time>
                <span>{attempt.correct ? "Matched" : "Practiced"}</span>
              </div>
            ))}
          </div>
        )}
      </section>
    </section>
  );
}

function SettingsPage(props: {
  mode: AIMode;
  changeMode: (mode: AIMode) => void;
  speechRecognitionAvailable: boolean;
  speechSynthesisAvailable: boolean;
  health: HealthResponse | null;
  healthError: string;
  apiBaseUrl: string;
  refreshHealth: () => void;
  resetProgress: () => void;
}) {
  const {
    mode, changeMode, speechRecognitionAvailable, speechSynthesisAvailable,
    health, healthError, apiBaseUrl, refreshHealth, resetProgress,
  } = props;
  return (
    <section>
      <PageHeading eyebrow="Preferences" title="Choose what works for you" subtitle="Select the AI mode. Browser speech features stay separate." />
      <section className="surface-card settings-card">
        <h2>AI mode</h2>
        <label className="mode-choice">
          <input type="radio" name="ai-mode" checked={mode === "local"} onChange={() => changeMode("local")} />
          <span><strong>Local demo</strong><small>Mock practice content; not Gemma or image recognition.</small></span>
        </label>
        <label className="mode-choice">
          <input type="radio" name="ai-mode" checked={mode === "cloud"} onChange={() => changeMode("cloud")} />
          <span><strong>Cloud AI</strong><small>Uses the VisualEcho backend. The Gemini key is never sent to this app.</small></span>
        </label>
        <hr />
        <Capability name="Speech recognition" available={speechRecognitionAvailable} detail={speechRecognitionAvailable ? "Browser speech recognition is available; audio is processed by your browser." : "Unavailable here; type a transcript instead."} />
        <Capability name="Read words aloud" available={speechSynthesisAvailable} detail={speechSynthesisAvailable ? "Uses browser speech synthesis." : "Unavailable in this browser."} />
        <div className="settings-row">
          <div><strong>Word photos</strong><small>Searches Wikimedia Commons using the displayed practice word. Photo credits and licenses are shown with each image.</small></div>
          <a className="quiet-button" href="https://commons.wikimedia.org/" target="_blank" rel="noreferrer">About Commons</a>
        </div>
        <hr />
        <div className="settings-row">
          <div><strong>Backend health</strong><small>{health ? `${health.service} is responding.` : healthError || "Checking…"}</small></div>
          <Button variant="secondary" title="Check again" onClick={refreshHealth} style={{ minHeight: 40 }} />
        </div>
        <div className="api-origin"><span>API base URL</span><code>{apiBaseUrl}</code></div>
      </section>
      <section className="surface-card reset-card">
        <div><strong>Reset saved progress</strong><small>Remove practice history stored on this device.</small></div>
        <Button variant="secondary" title="Reset progress" onClick={resetProgress} style={{ minHeight: 40 }} />
      </section>
    </section>
  );
}

function Capability({ name, available, detail }: { name: string; available: boolean; detail: string }) {
  return <div className="settings-row">
    <div><strong>{name}</strong><small>{detail}</small></div>
    <span className={`capability ${available ? "capability-available" : ""}`}>{available ? "AVAILABLE" : "UNAVAILABLE"}</span>
  </div>;
}

function ProviderNote({ mode, result }: { mode: AIMode; result: WordGenerationResult }) {
  if (result.provider === "starter-list") {
    return <p className="provider-note">Starter word list · no AI request has run yet.</p>;
  }
  return <p className="provider-note">
    {mode === "cloud"
      ? `Backend response · ${result.provider} · ${result.model}`
      : `Demo provider · ${result.provider} · no local Gemma runtime`}
  </p>;
}

function PageHeading({ eyebrow, title, subtitle }: { eyebrow: string; title: string; subtitle: string }) {
  return <header className="page-heading">
    <span style={styles.eyebrow}>{eyebrow}</span>
    <h1 style={Typography.headlineLarge}>{title}</h1>
    <p style={styles.muted}>{subtitle}</p>
  </header>;
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return <div className="metric-card"><span>{label}</span><strong>{value}</strong></div>;
}

function NotFoundPage() {
  return <section className="surface-card"><h1>That page isn't here</h1><Link to="/">Return to overview</Link></section>;
}
