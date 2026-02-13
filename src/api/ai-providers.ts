import { generateText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import type { LanguageModel } from "ai";
import { getModelById } from "../config/models.js";
import { getAiModel, getAiApiKey } from "../config/store.js";

const SYSTEM_PROMPT =
  "You are a helpful AI that answers questions about video transcripts. Be concise and accurate. Base your answers on the transcript content provided.";

export async function chatWithTranscript(
  transcriptText: string,
  userMessage: string,
  history: Array<{ role: "user" | "assistant"; content: string }> = []
): Promise<string> {
  const modelId = getAiModel();
  const apiKey = getAiApiKey();
  const modelDef = getModelById(modelId);

  if (!modelDef || !apiKey) {
    throw new Error("AI model not configured. Run /model to set up.");
  }

  const maxLen = 30000;
  const truncated =
    transcriptText.length > maxLen
      ? transcriptText.slice(0, maxLen) + "\n\n[Transcript truncated...]"
      : transcriptText;

  const model = createModel(modelDef.provider, modelId, apiKey);

  const historyContext =
    history.length > 0
      ? "\n\nPREVIOUS CONVERSATION:\n" +
        history
          .slice(-10)
          .map((m) => `${m.role === "user" ? "User" : "Assistant"}: ${m.content}`)
          .join("\n") +
        "\n\n"
      : "";

  const prompt = `VIDEO TRANSCRIPT:\n${truncated}${historyContext}USER QUESTION: ${userMessage}\n\nAnswer based on the transcript.`;

  const { text } = await generateText({
    model,
    system: SYSTEM_PROMPT,
    prompt,
  });

  return text;
}

function createModel(
  provider: string,
  modelId: string,
  apiKey: string
): LanguageModel {
  switch (provider) {
    case "openai": {
      const openai = createOpenAI({ apiKey });
      return openai(modelId) as LanguageModel;
    }
    case "anthropic": {
      const anthropic = createAnthropic({ apiKey });
      return anthropic(modelId) as LanguageModel;
    }
    case "gemini": {
      const google = createGoogleGenerativeAI({ apiKey });
      return google(modelId) as LanguageModel;
    }
    default:
      throw new Error(`Unknown provider: ${provider}`);
  }
}
