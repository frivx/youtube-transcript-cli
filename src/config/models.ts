export interface AIModel {
  id: string;
  name: string;
  provider: "gemini" | "openai" | "anthropic";
  envKey: string;
}

export const AI_MODELS: AIModel[] = [
  { id: "gemini-3-pro-preview", name: "Gemini 3 Pro", provider: "gemini", envKey: "GEMINI_API_KEY" },
  { id: "gemini-3-flash-preview", name: "Gemini 3 Flash", provider: "gemini", envKey: "GEMINI_API_KEY" },
  { id: "gemini-2.5-flash", name: "Gemini 2.5 Flash", provider: "gemini", envKey: "GEMINI_API_KEY" },
  { id: "gemini-2.5-pro", name: "Gemini 2.5 Pro", provider: "gemini", envKey: "GEMINI_API_KEY" },
  { id: "gemini-2.5-flash-lite", name: "Gemini 2.5 Flash-Lite", provider: "gemini", envKey: "GEMINI_API_KEY" },
  { id: "claude-opus-4-6", name: "Claude Opus 4.6", provider: "anthropic", envKey: "ANTHROPIC_API_KEY" },
  { id: "claude-sonnet-4-5-20250929", name: "Claude Sonnet 4.5", provider: "anthropic", envKey: "ANTHROPIC_API_KEY" },
  { id: "claude-3-5-haiku-20241022", name: "Claude 3.5 Haiku", provider: "anthropic", envKey: "ANTHROPIC_API_KEY" },
  { id: "gpt-5.2", name: "GPT-5.2", provider: "openai", envKey: "OPENAI_API_KEY" },
  { id: "gpt-5-mini", name: "GPT-5 Mini", provider: "openai", envKey: "OPENAI_API_KEY" },
  { id: "gpt-5-nano", name: "GPT-5 Nano", provider: "openai", envKey: "OPENAI_API_KEY" },
];

export function getModelById(id: string): AIModel | undefined {
  return AI_MODELS.find((m) => m.id === id);
}
