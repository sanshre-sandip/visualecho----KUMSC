import { API_BASE_URL } from "./config";

export class VisualEchoApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code: string,
  ) {
    super(message);
    this.name = "VisualEchoApiError";
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export async function requestJson<T>(
  path: string,
  method: "GET" | "POST",
  isResponse: (value: unknown) => value is T,
  body?: unknown,
): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers: body === undefined ? undefined : { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch (error) {
    if (error instanceof TypeError) {
      throw new VisualEchoApiError(
        "The VisualEcho API could not be reached. Check your connection and try again.",
        0,
        "NETWORK_ERROR",
      );
    }
    throw error;
  }

  const responseText = await response.text();
  let payload: unknown;
  try {
    payload = JSON.parse(responseText);
  } catch {
    throw new VisualEchoApiError(
      "The VisualEcho API returned an unreadable response.",
      response.status,
      "INVALID_RESPONSE",
    );
  }

  if (!response.ok) {
    const code =
      isRecord(payload) && typeof payload.error === "string"
        ? payload.error
        : `HTTP_${response.status}`;
    throw new VisualEchoApiError(
      `VisualEcho API request failed (${code}).`,
      response.status,
      code,
    );
  }
  if (!isResponse(payload)) {
    throw new VisualEchoApiError(
      "The VisualEcho API response did not match the expected format.",
      response.status,
      "INVALID_RESPONSE",
    );
  }
  return payload;
}
