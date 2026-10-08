const WORD_SYMBOLS: Record<string, string> = {
  apple: "🍎",
  banana: "🍌",
  book: "📚",
  butterfly: "🦋",
  cloud: "☁️",
  cookie: "🍪",
  dolphin: "🐬",
  fish: "🐟",
  flower: "🌼",
  forest: "🌳",
  giraffe: "🦒",
  garden: "🌷",
  happy: "😊",
  home: "🏠",
  kitten: "🐱",
  kitchen: "🍽️",
  mountain: "⛰️",
  monkey: "🐒",
  orange: "🍊",
  parrot: "🦜",
  pancake: "🥞",
  pillow: "🛏️",
  puppy: "🐶",
  rabbit: "🐰",
  rainbow: "🌈",
  river: "🌊",
  school: "🏫",
  strawberry: "🍓",
  sunshine: "🌞",
  sun: "☀️",
  sandwich: "🥪",
  tree: "🌳",
  turtle: "🐢",
  window: "🪟",
};

function normalizeWord(word: string): string {
  return word
    .toLocaleLowerCase()
    .normalize("NFKD")
    .replace(/[^\p{L}\p{N}\s]/gu, "")
    .trim();
}

function findSymbol(word: string, topic: string): string {
  const words = normalizeWord(word).split(/\s+/).filter(Boolean);
  for (const part of words) {
    if (WORD_SYMBOLS[part]) return WORD_SYMBOLS[part];
  }

  const normalizedTopic = normalizeWord(topic);
  if (WORD_SYMBOLS[normalizedTopic]) return WORD_SYMBOLS[normalizedTopic];
  if (normalizedTopic.includes("animal")) return "🐾";
  if (normalizedTopic.includes("food")) return "🍽️";
  if (normalizedTopic.includes("nature")) return "🌿";
  if (normalizedTopic.includes("home")) return "🏠";
  return "💬";
}

export function getWordIllustration(word: string, topic: string): string {
  const symbol = findSymbol(word, topic);
  const safeWord = word.replace(/[<>&"]/g, "");
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 240" role="img">
      <defs>
        <linearGradient id="background" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="#e8f1f6"/>
          <stop offset="1" stop-color="#f8f0dc"/>
        </linearGradient>
      </defs>
      <rect width="320" height="240" rx="28" fill="url(#background)"/>
      <circle cx="160" cy="111" r="73" fill="#fff" fill-opacity=".76"/>
      <text x="160" y="139" text-anchor="middle" font-size="92"
        font-family="Apple Color Emoji, Segoe UI Emoji, Noto Color Emoji, sans-serif">${symbol}</text>
      <text x="160" y="211" text-anchor="middle" fill="#345d78" font-size="22"
        font-family="Arial, sans-serif" font-weight="700">${safeWord}</text>
    </svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}
