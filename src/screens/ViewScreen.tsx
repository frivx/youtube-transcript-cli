import React, { useEffect, useMemo, useState } from "react";
import { Box, Text, useInput } from "ink";
import Spinner from "ink-spinner";
import { Hint, Key, Layout, Panel } from "../components/Layout.js";
import { orange, theme } from "../components/Theme.js";
import { getCachedTranscript, getTranscript } from "../api/transcript-api.js";
import { getContentWidth, getTerminalWidth } from "../utils/terminal.js";

interface ViewScreenProps {
  videoId: string;
  onBack: () => void;
  onOpenChat?: () => void;
}

function wrapLine(line: string, width: number): string[] {
  if (!line) return [""];
  if (line.length <= width) return [line];

  const out: string[] = [];
  let rest = line;

  while (rest.length > width) {
    const chunk = rest.slice(0, width);
    const spaceIndex = chunk.lastIndexOf(" ");
    const cut = spaceIndex > Math.floor(width * 0.5) ? spaceIndex : width;
    out.push(rest.slice(0, cut).trimEnd());
    rest = rest.slice(cut).trimStart();
  }

  if (rest.length > 0) out.push(rest);
  return out;
}

function paginate(lines: string[], pageSize: number): string[][] {
  if (lines.length === 0) return [[""]];

  const pages: string[][] = [];
  for (let i = 0; i < lines.length; i += pageSize) {
    pages.push(lines.slice(i, i + pageSize));
  }
  return pages;
}

export function ViewScreen({ videoId, onBack, onOpenChat }: ViewScreenProps) {
  const [text, setText] = useState<string>(() => {
    const cached = getCachedTranscript(videoId);
    if (!cached) return "";
    const fromText = cached.text?.trim() || "";
    const fromSegments = cached.segments?.map((segment) => segment.text).join("\n")?.trim() || "";
    return fromText || fromSegments;
  });
  const [title, setTitle] = useState<string>(() => getCachedTranscript(videoId)?.video_title || "Untitled");
  const [loading, setLoading] = useState(() => getCachedTranscript(videoId) === null);
  const [error, setError] = useState<string | null>(null);
  const [pageIndex, setPageIndex] = useState(0);

  useEffect(() => {
    let active = true;

    (async () => {
      const hasCached = getCachedTranscript(videoId) !== null;
      if (!hasCached) {
        setLoading(true);
      }
      setError(null);
      try {
        const transcript = await getTranscript(videoId);
        if (!active) return;
        const primaryText = transcript.text?.trim() || "";
        const fallbackText =
          transcript.segments?.map((segment) => segment.text).join("\n")?.trim() || "";
        setText(primaryText || fallbackText);
        setTitle(transcript.video_title || "Untitled");
      } catch (err) {
        if (!active) return;
        setError(err instanceof Error ? err.message : "Unable to load transcript view.");
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [videoId]);

  const contentWidth = getContentWidth();
  const terminalWidth = getTerminalWidth();
  const textWidth = Math.max(40, Math.min(contentWidth - 4, terminalWidth - 12));
  const pageSize = Math.max(10, Math.min(24, (process.stdout?.rows ?? 30) - 12));

  const pages = useMemo(() => {
    const lines = text
      .split(/\r?\n/)
      .flatMap((line) => wrapLine(line, textWidth));
    return paginate(lines, pageSize);
  }, [text, textWidth, pageSize]);

  const totalPages = pages.length;
  const clampedPage = Math.max(0, Math.min(pageIndex, totalPages - 1));

  useEffect(() => {
    if (pageIndex !== clampedPage) setPageIndex(clampedPage);
  }, [pageIndex, clampedPage]);

  useInput((input, key) => {
    if (key.escape) {
      onBack();
      return;
    }

    if (input.toLowerCase() === "c" && onOpenChat) {
      onOpenChat();
      return;
    }

    if (key.leftArrow || key.upArrow || input.toLowerCase() === "k") {
      setPageIndex((prev) => Math.max(0, prev - 1));
      return;
    }

    if (key.rightArrow || key.downArrow || input.toLowerCase() === "j") {
      setPageIndex((prev) => Math.min(totalPages - 1, prev + 1));
    }
  });

  if (loading) {
    return (
      <Layout title="View" subtitle={`Loading transcript ${videoId}`} commands={["Esc back"]}>
        <Panel variant="focus">
          <Box>
            <Text color={orange}><Spinner type="dots" /></Text>
            <Text> loading transcript...</Text>
          </Box>
        </Panel>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout title="View" subtitle={videoId} commands={["Esc back"]}>
        <Panel title="Error" variant="error">
          <Text color={theme.error}>{error}</Text>
        </Panel>
      </Layout>
    );
  }

  return (
    <Layout
      title="View"
      subtitle={`${title} (${videoId})`}
      commands={["J next page", "K prev page", "C open chat", "Esc back"]}
    >
      <Panel title={`Transcript page ${clampedPage + 1}/${totalPages || 1}`} variant="focus" width={contentWidth}>
        <Box flexDirection="column">
          {text.trim().length === 0 ? (
            <Text color={theme.muted}>
              Transcript text is empty for this item. Try another transcript or re-transcribe the video.
            </Text>
          ) : (
            (pages[clampedPage] || [""]).map((line, index) => (
              <Text key={`${clampedPage}-${index}`} wrap="truncate-end">{line || " "}</Text>
            ))
          )}
        </Box>
      </Panel>

      <Hint>
        <Key>J</Key>/<Key>Down</Key> next  <Key>K</Key>/<Key>Up</Key> previous  <Key>C</Key> chat  <Key>Esc</Key> back
      </Hint>
    </Layout>
  );
}
