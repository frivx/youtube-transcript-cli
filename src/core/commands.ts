export interface CommandDoc {
  usage: string;
  description: string;
}

export const HOME_COMMANDS: CommandDoc[] = [
  { usage: "/transcribe <url|id>", description: "Generate transcript for a video." },
  { usage: "/chat <url|id>", description: "Open transcript chat for a video." },
  { usage: "/view <url|id>", description: "Open transcript reader for a video." },
  { usage: "/status", description: "Show current plan and credit usage." },
  { usage: "/model", description: "Change AI provider/model/key." },
  { usage: "/usage", description: "Show plan and remaining credits." },
  { usage: "/config", description: "Run setup wizard again." },
  { usage: "/reset", description: "Clear local config and restart setup." },
  { usage: "/help", description: "Show command usage tips." },
  { usage: "/quit", description: "Exit CLI." },
];

export type ParsedHomeInput =
  | { kind: "empty" }
  | { kind: "transcribe"; value: string }
  | { kind: "transcribe_command"; target?: string }
  | { kind: "chat"; target?: string }
  | { kind: "view"; target?: string }
  | { kind: "model" }
  | { kind: "status" }
  | { kind: "usage" }
  | { kind: "config" }
  | { kind: "reset" }
  | { kind: "help" }
  | { kind: "quit" }
  | { kind: "unknown"; name: string };

const COMMAND_ALIASES: Record<string, string> = {
  h: "help",
  // Back-compat: /list and /ls map to /view (no arg opens the recent picker).
  ls: "view",
  list: "view",
  c: "chat",
  v: "view",
  t: "transcribe",
  m: "model",
  s: "status",
  u: "usage",
  cfg: "config",
  r: "reset",
  factory: "reset",
  q: "quit",
  exit: "quit",
};

export function parseHomeInput(value: string): ParsedHomeInput {
  const input = value.trim();
  if (!input) return { kind: "empty" };

  if (!input.startsWith("/")) {
    return { kind: "transcribe", value: input };
  }

  const parts = input.slice(1).trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { kind: "help" };

  const rawName = parts[0].toLowerCase();
  const name = COMMAND_ALIASES[rawName] ?? rawName;
  const arg = parts.slice(1).join(" ");

  switch (name) {
    case "help":
      return { kind: "help" };
    case "model":
      return { kind: "model" };
    case "status":
      return { kind: "status" };
    case "usage":
      return { kind: "usage" };
    case "config":
      return { kind: "config" };
    case "reset":
      return { kind: "reset" };
    case "chat":
      return { kind: "chat", target: arg || undefined };
    case "view":
      return { kind: "view", target: arg || undefined };
    case "transcribe":
      return { kind: "transcribe_command", target: arg || undefined };
    case "quit":
      return { kind: "quit" };
    default:
      return { kind: "unknown", name: rawName };
  }
}
