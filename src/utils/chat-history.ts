import { readFile, writeFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import { getChatsDir } from "../config/store.js";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface ChatSession {
  video_id: string;
  messages: ChatMessage[];
  updated_at: string;
}

export async function loadChatHistory(videoId: string): Promise<ChatMessage[]> {
  const dir = getChatsDir();
  const file = path.join(dir, `${videoId}.json`);
  if (!existsSync(file)) return [];
  try {
    const data = await readFile(file, "utf-8");
    const session = JSON.parse(data) as ChatSession;
    return session.messages ?? [];
  } catch {
    return [];
  }
}

export async function saveChatHistory(
  videoId: string,
  messages: ChatMessage[]
): Promise<void> {
  const dir = getChatsDir();
  await mkdir(dir, { recursive: true });
  const file = path.join(dir, `${videoId}.json`);
  const session: ChatSession = {
    video_id: videoId,
    messages,
    updated_at: new Date().toISOString(),
  };
  await writeFile(file, JSON.stringify(session, null, 2));
}
