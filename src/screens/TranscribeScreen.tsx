import React, { useEffect, useMemo, useState } from "react";
import { Box, Text, useInput } from "ink";
import Spinner from "ink-spinner";
import { Hint, Key, Layout, Panel } from "../components/Layout.js";
import { orange, theme } from "../components/Theme.js";
import {
  extractVideoId,
  transcribeSingle,
  type TranscribeResponse,
} from "../api/transcript-api.js";

interface TranscribeScreenProps {
  urlOrId: string;
  onComplete: (outcome?: { videoId?: string; action?: "back" | "chat" | "view" }) => void;
}

const TRANSCRIBE_STEPS = [
  "Preparing request.",
  "Fetching captions/transcript sources..",
  "Processing text and metadata...",
  "Finalizing transcript payload....",
];

const TRANSCRIBE_COLORS = [orange, theme.warning, "cyan"];

function isUrl(value: string): boolean {
  return /^https?:\/\//i.test(value);
}

export function TranscribeScreen({ urlOrId, onComplete }: TranscribeScreenProps) {
  const [status, setStatus] = useState<"loading" | "done" | "error">("loading");
  const [result, setResult] = useState<TranscribeResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [stepIndex, setStepIndex] = useState(0);

  useInput((input, key) => {
    if (key.escape && status === "loading") {
      onComplete({ action: "back" });
      return;
    }

    if (status === "loading") return;

    if (input.toLowerCase() === "c" && result?.video_id) {
      onComplete({ videoId: result.video_id, action: "chat" });
      return;
    }

    if (input.toLowerCase() === "v" && result?.video_id) {
      onComplete({ videoId: result.video_id, action: "view" });
      return;
    }

    if (key.escape || key.return) {
      onComplete({ videoId: result?.video_id, action: "back" });
    }
  });

  useEffect(() => {
    let active = true;

    (async () => {
      const videoId = extractVideoId(urlOrId);
      if (!videoId) {
        if (!active) return;
        setError("Invalid YouTube URL or video id.");
        setStatus("error");
        return;
      }

      setStatus("loading");
      setError(null);

      try {
        const response = await transcribeSingle({
          video_url: isUrl(urlOrId) ? urlOrId : `https://youtube.com/watch?v=${videoId}`,
        });
        if (!active) return;
        setResult(response);
        setStatus("done");
      } catch (err) {
        if (!active) return;
        setError(err instanceof Error ? err.message : "Transcription failed.");
        setStatus("error");
      }
    })();

    return () => {
      active = false;
    };
  }, [urlOrId]);

  useEffect(() => {
    if (status !== "loading") {
      setStepIndex(0);
      return;
    }

    const id = setInterval(() => {
      setStepIndex((prev) => (prev + 1) % TRANSCRIBE_STEPS.length);
    }, 900);

    return () => clearInterval(id);
  }, [status]);

  const resolvedId = useMemo(
    () => result?.video_id ?? extractVideoId(urlOrId) ?? "unknown",
    [result?.video_id, urlOrId]
  );

  if (status === "loading") {
    const stepColor = TRANSCRIBE_COLORS[stepIndex % TRANSCRIBE_COLORS.length];
    return (
      <Layout title="Transcribe" subtitle="Submitting job" commands={["Esc back", "Ctrl+C exit"]}>
        <Panel variant="focus">
          <Box>
            <Text color={stepColor}><Spinner type="dots" /></Text>
            <Text color={stepColor}> {TRANSCRIBE_STEPS[stepIndex]}</Text>
          </Box>
        </Panel>
      </Layout>
    );
  }

  if (status === "error") {
    return (
      <Layout title="Transcribe" subtitle="Failed" commands={["Enter back", "Esc back"]}>
        <Panel title="Error" variant="error">
          <Text color={theme.error}>{error ?? "Unknown error"}</Text>
        </Panel>
        <Hint>
          <Key>Enter</Key> back  <Key>Esc</Key> back
        </Hint>
      </Layout>
    );
  }

  return (
    <Layout
      title="Transcribe"
      subtitle={`Completed for ${resolvedId}`}
      commands={["C chat", "V view", "Enter back", "Esc back"]}
    >
      <Panel title="Result" variant="success">
        <Text color={theme.success}>Transcript created successfully.</Text>
        <Text>Video id: <Text color={orange}>{resolvedId}</Text></Text>
        {result?.credits_used !== undefined ? (
          <Text color={theme.muted}>Credits used: {result.credits_used}</Text>
        ) : null}
      </Panel>

      {result?.text ? (
        <Panel title="Preview">
          <Text color={theme.muted}>{result.text.slice(0, 260)}{result.text.length > 260 ? "..." : ""}</Text>
        </Panel>
      ) : null}

      <Hint>
        <Key>C</Key> chat  <Key>V</Key> view  <Key>Enter</Key> back  <Key>Esc</Key> back
      </Hint>
    </Layout>
  );
}
