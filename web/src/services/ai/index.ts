import { MockAIProvider } from "./mockAIProvider";
import { RemoteAIProvider } from "./remoteAIProvider";

const mockAIProvider = new MockAIProvider();
const remoteAIProvider = new RemoteAIProvider();

export function getAIProvider(mode: "local" | "cloud") {
  return mode === "cloud" ? remoteAIProvider : mockAIProvider;
}
