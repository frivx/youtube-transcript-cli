import React, { useEffect, useMemo, useState } from "react";
import { Box, Text, useInput } from "ink";
import Spinner from "ink-spinner";
import { Hint, InputField, Key, Layout, Panel } from "../components/Layout.js";
import { MarkdownText } from "../components/MarkdownText.js";
import { orange, theme } from "../components/Theme.js";
import { chatWithTranscript } from "../api/ai-providers.js";
import { getCachedTranscript, getTranscript } from "../api/transcript-api.js";
import { loadChatHistory, saveChatHistory } from "../utils/chat-history.js";
import type { ChatMessage } from "../utils/chat-history.js";

interface ChatScreenProps {
  videoId: string;
  onBack: () => void;
  onOpenView: () => void;
}

const THINKING_STEPS = [
  "Thinking.",
  "Reasoning over transcript context..",
  "Checking supporting lines...",
  "Drafting a precise answer...",
];

const THINKING_COLORS = [orange, theme.warning, "cyan"];

type StatusTone = "info" | "error" | "success";

export function ChatScreen({ videoId, onBack, onOpenView }: ChatScreenProps) {
  const cachedTranscript = getCachedTranscript(videoId);
  const [transcript, setTranscript] = useState<string | null>(() => {
    const cached = cachedTranscript;
    if (!cached) return null;
    const fromText = cached.text?.trim() || "";
    const fromSegments = cached.segments?.map((seg) => seg.text).join("\n")?.trim() || "";
    return fromText || fromSegments || null;
  });
  const [transcriptTitle, setTranscriptTitle] = useState<string>(() => cachedTranscript?.video_title || "Untitled");
  const [history, setHistory] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(() => cachedTranscript === null);
  const [thinking, setThinking] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ tone: StatusTone; message: string } | null>(null);
  const [thinkingStep, setThinkingStep] = useState(0);

  useInput((_inputValue, key) => {
    if (key.escape) onBack();
  });

  useEffect(() => {
    let active = true;

    (async () => {
      const hasCached = getCachedTranscript(videoId) !== null;
      if (!hasCached) {
        setLoading(true);
      }
      setStatusMessage(null);
      try {
        const [transcriptData, chatData] = await Promise.all([
          getTranscript(videoId),
          loadChatHistory(videoId),
        ]);

        if (!active) return;
        const fromText = transcriptData.text?.trim() || "";
        const fromSegments = transcriptData.segments?.map((seg) => seg.text).join("\n")?.trim() || "";
        setTranscript(fromText || fromSegments || null);
        setTranscriptTitle(transcriptData.video_title || "Untitled");
        setHistory(chatData);
      } catch (err) {
        if (!active) return;
        setStatusMessage({
          tone: "error",
          message: err instanceof Error ? err.message : "Unable to load transcript.",
        });
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [videoId]);

  useEffect(() => {
    if (!thinking) {
      setThinkingStep(0);
      return;
    }

    const id = setInterval(() => {
      setThinkingStep((prev) => (prev + 1) % THINKING_STEPS.length);
    }, 900);

    return () => clearInterval(id);
  }, [thinking]);

  const transcriptWordCount = useMemo(() => {
    if (!transcript) return 0;
    return transcript.trim().split(/\s+/).filter(Boolean).length;
  }, [transcript]);

  const transcriptSnippet = useMemo(() => {
    if (!transcript) return "";
    const normalized = transcript.replace(/\s+/g, " ").trim();
    if (normalized.length <= 160) return normalized;
    return `${normalized.slice(0, 157)}...`;
  }, [transcript]);

  const handleSubmit = async (value: string) => {
    const trimmed = value.trim();
    if (!trimmed || thinking) return;

    if (trimmed.startsWith("/")) {
      if (trimmed === "/back") {
        onBack();
        return;
      }

      if (trimmed === "/view") {
        onOpenView();
        return;
      }

      if (trimmed === "/clear") {
        setHistory([]);
        await saveChatHistory(videoId, []);
        setStatusMessage({ tone: "success", message: "Chat history cleared." });
        setInput("");
        return;
      }

      if (trimmed === "/help") {
        setStatusMessage({ tone: "info", message: "Chat commands: /view /clear /back" });
        setInput("");
        return;
      }

      setStatusMessage({ tone: "error", message: `Unknown chat command: ${trimmed}` });
      setInput("");
      return;
    }

    if (!transcript) {
      setStatusMessage({ tone: "error", message: "Transcript is unavailable." });
      return;
    }

    setStatusMessage(null);
    setInput("");
    setThinking(true);

    const userMessage: ChatMessage = { role: "user", content: trimmed };
    const workingHistory = [...history, userMessage];
    setHistory(workingHistory);

    try {
      const answer = await chatWithTranscript(transcript, trimmed, history);
      const savedHistory = [...workingHistory, { role: "assistant" as const, content: answer }];
      setHistory(savedHistory);
      await saveChatHistory(videoId, savedHistory);
    } catch (err) {
      setStatusMessage({
        tone: "error",
        message: err instanceof Error ? err.message : "Chat request failed.",
      });
    } finally {
      setThinking(false);
    }
  };

  if (loading) {
    return (
      <Layout title="Chat" subtitle={`Video ${videoId}`} commands={["Esc back"]}>
        <Panel variant="focus">
          <Box>
            <Text color={orange}><Spinner type="dots" /></Text>
            <Text> loading transcript...</Text>
          </Box>
        </Panel>
      </Layout>
    );
  }

  return (
    <Layout title="Chat" subtitle={`${transcriptTitle} (${videoId})`} commands={["/view transcript", "Esc back"]}>
      {statusMessage ? (
        <Panel
          title="Status"
          variant={statusMessage.tone === "error" ? "error" : statusMessage.tone === "success" ? "success" : "focus"}
        >
          <Text color={statusMessage.tone === "error" ? theme.error : statusMessage.tone === "success" ? theme.success : orange}>
            {statusMessage.message}
          </Text>
        </Panel>
      ) : null}

      <Panel title="Transcript context">
        <Text>Video id: <Text color={orange}>{videoId}</Text></Text>
        <Text>Words: <Text color={orange}>{transcriptWordCount}</Text></Text>
        <Text color={theme.muted}>
          {transcriptSnippet || "Transcript text is unavailable for preview."}
        </Text>
      </Panel>

      <Panel title="Conversation" variant="focus">
        <Box flexDirection="column">
          {history.length === 0 ? <Text color={theme.muted}>No messages yet.</Text> : null}

          {history.slice(-8).map((message, index) => (
            <Box key={`${message.role}-${index}`} flexDirection="column" marginBottom={1}>
              <Text color={message.role === "user" ? orange : theme.text} bold>
                {message.role === "user" ? "You" : "AI"}
              </Text>
              <MarkdownText content={message.content} />
            </Box>
          ))}

          {thinking ? (
            <Box>
              <Text color={THINKING_COLORS[thinkingStep % THINKING_COLORS.length]}><Spinner type="dots" /></Text>
              <Text color={THINKING_COLORS[thinkingStep % THINKING_COLORS.length]}>
                {" "}
                {THINKING_STEPS[thinkingStep]}
              </Text>
            </Box>
          ) : null}
        </Box>
      </Panel>

      <Panel title="Input">
        <InputField
          value={input}
          onChange={setInput}
          onSubmit={handleSubmit}
          placeholder={thinking ? "Waiting for AI..." : "Ask about this transcript"}
        />
      </Panel>

      <Hint>
        <Key>Enter</Key> send  <Key>/view</Key> transcript  <Key>/clear</Key> reset  <Key>Esc</Key> back
      </Hint>
    </Layout>
  );
}
