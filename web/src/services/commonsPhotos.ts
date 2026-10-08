export interface CommonsPhoto {
  imageUrl: string;
  description: string;
  fileTitle: string;
  artist: string;
  license: string;
  sourceUrl: string;
}

interface CommonsImageInfo {
  thumburl?: unknown;
  url?: unknown;
  mime?: unknown;
  extmetadata?: Record<string, { value?: unknown } | undefined>;
}

interface CommonsPage {
  title?: unknown;
  imageinfo?: CommonsImageInfo[];
}

interface CommonsSearchResponse {
  query?: {
    pages?: Record<string, CommonsPage>;
  };
  error?: {
    info?: string;
  };
}

const cache = new Map<string, CommonsPhoto | null>();
const NON_PHOTO_TERMS = /\b(illustration|drawing|painting|diagram|logo|map|coat of arms|icon|symbol|render)\b/i;

function plainText(value: unknown): string {
  if (typeof value !== "string") return "";
  return value
    .replace(/<[^>]*>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#0*39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

function metadataValue(info: CommonsImageInfo, key: string): string {
  return plainText(info.extmetadata?.[key]?.value);
}

function asPhoto(page: CommonsPage): CommonsPhoto | null {
  const info = page.imageinfo?.[0];
  if (
    typeof page.title !== "string" ||
    !info ||
    (info.mime !== "image/jpeg" && info.mime !== "image/png" && info.mime !== "image/webp")
  ) {
    return null;
  }

  const imageUrl =
    typeof info.thumburl === "string"
      ? info.thumburl
      : typeof info.url === "string"
        ? info.url
        : "";
  if (!imageUrl.startsWith("https://")) return null;

  const description = metadataValue(info, "ImageDescription");
  if (NON_PHOTO_TERMS.test(`${page.title} ${description}`)) return null;

  const fileName = page.title.replace(/^File:/, "");
  const sourceUrl = `https://commons.wikimedia.org/wiki/${encodeURIComponent(`File:${fileName}`).replace(/%3A/gi, ":")}`;
  return {
    imageUrl,
    description: description || fileName,
    fileTitle: fileName,
    artist: metadataValue(info, "Artist") || "Wikimedia Commons contributor",
    license: metadataValue(info, "LicenseShortName") || "See source page for license",
    sourceUrl,
  };
}

async function fetchCommonsPhoto(word: string, signal: AbortSignal): Promise<CommonsPhoto | null> {
  const endpoint = new URL("https://commons.wikimedia.org/w/api.php");
  endpoint.search = new URLSearchParams({
    action: "query",
    generator: "search",
    gsrnamespace: "6",
    gsrsearch: `${word} photo filetype:bitmap -illustration -drawing -diagram`,
    gsrlimit: "10",
    prop: "imageinfo",
    iiprop: "url|mime|extmetadata",
    iiurlwidth: "720",
    format: "json",
    origin: "*",
  }).toString();

  let response: Response;
  try {
    response = await fetch(endpoint, { signal });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") throw error;
    throw new Error("Photo search could not connect to Wikimedia Commons.", { cause: error });
  }

  if (!response.ok) {
    throw new Error(`Photo search failed with HTTP ${response.status}.`);
  }

  let payload: CommonsSearchResponse;
  try {
    payload = (await response.json()) as CommonsSearchResponse;
  } catch (error) {
    throw new Error("Wikimedia Commons returned an unreadable photo search response.", {
      cause: error,
    });
  }
  if (payload.error) {
    throw new Error(payload.error.info || "Wikimedia Commons photo search failed.");
  }

  const pages = Object.values(payload.query?.pages ?? {});
  return pages.map(asPhoto).find((photo): photo is CommonsPhoto => photo !== null) ?? null;
}

export function searchCommonsPhoto(word: string, signal: AbortSignal): Promise<CommonsPhoto | null> {
  const query = word.trim().toLocaleLowerCase();
  if (!query) return Promise.resolve(null);
  if (cache.has(query)) return Promise.resolve(cache.get(query) ?? null);

  return fetchCommonsPhoto(query, signal).then((photo) => {
    cache.set(query, photo);
    return photo;
  });
}
