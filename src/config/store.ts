import Conf from "conf";
import path from "path";
import { homedir } from "os";

const configDir = path.join(homedir(), ".config", "youtube-transcript-cli");

export const config = new Conf({
  projectName: "youtube-transcript-cli",
  cwd: configDir,
  defaults: {
    apiBaseUrl: "https://youtubetranscript.dev",
    ytApiKey: "",
    aiModel: "",
    aiApiKey: "",
  },
});

export function getYtApiKey(): string {
  return (
    (config.get("ytApiKey") as string) ||
    process.env.YT_API_KEY ||
    process.env.YOUTUBE_TRANSCRIPT_API_KEY ||
    ""
  );
}

export function setYtApiKey(key: string): void {
  config.set("ytApiKey", key);
}

export function getStoredYtApiKey(): string {
  return (config.get("ytApiKey") as string) || "";
}

export function getAiModel(): string {
  return (config.get("aiModel") as string) || "";
}

export function setAiModel(model: string): void {
  config.set("aiModel", model);
}

export function getAiApiKey(): string {
  const model = getAiModel();
  const stored = (config.get("aiApiKey") as string) || "";

  if (stored) {
    return stored;
  }

  if (model.startsWith("gemini")) {
    return process.env.GEMINI_API_KEY || "";
  }
  if (model.startsWith("gpt") || model.startsWith("o1")) {
    return process.env.OPENAI_API_KEY || "";
  }
  if (model.startsWith("claude")) {
    return process.env.ANTHROPIC_API_KEY || "";
  }
  return "";
}

export function setAiApiKey(key: string): void {
  config.set("aiApiKey", key);
}

export function getStoredAiApiKey(): string {
  return (config.get("aiApiKey") as string) || "";
}

export function getApiBaseUrl(): string {
  return (
    process.env.YT_API_BASE_URL ||
    (config.get("apiBaseUrl") as string) ||
    "https://youtubetranscript.dev"
  );
}

export function isConfigured(): boolean {
  const yt = getYtApiKey();
  const ai = getAiModel();
  const aiKey = getAiApiKey();
  return yt.length > 0 && ai.length > 0 && aiKey.length > 0;
}

export function getChatsDir(): string {
  return path.join(configDir, "chats");
}
