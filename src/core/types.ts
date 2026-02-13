export type NoticeTone = "info" | "success" | "error";

export interface AppNotice {
  tone: NoticeTone;
  message: string;
}

export type AppScreen =
  | { name: "onboarding" }
  | { name: "home" }
  | { name: "config" }
  | { name: "model" }
  | { name: "list"; mode?: "chat" | "view" }
  | { name: "chat"; videoId: string; returnTo?: "home" | "list" }
  | { name: "view"; videoId: string; returnTo?: "home" | "list" | "chat"; chatReturnTo?: "home" | "list" }
  | { name: "transcribe"; input: string }
  | { name: "usage" };
