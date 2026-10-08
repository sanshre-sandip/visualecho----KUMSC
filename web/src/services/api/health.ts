import { requestJson } from "./client";

export interface HealthResponse {
  status: "ok";
  service: string;
}

function isHealthResponse(value: unknown): value is HealthResponse {
  return (
    typeof value === "object" &&
    value !== null &&
    "status" in value &&
    value.status === "ok" &&
    "service" in value &&
    typeof value.service === "string"
  );
}

export function checkHealth(): Promise<HealthResponse> {
  return requestJson("/health", "GET", isHealthResponse);
}
