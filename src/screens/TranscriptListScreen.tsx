import React, { useEffect, useMemo, useState } from "react";
import { Box, Text, useInput } from "ink";
import Spinner from "ink-spinner";
import SelectInput from "ink-select-input";
import { Hint, Key, Layout, Panel } from "../components/Layout.js";
import { orange, theme } from "../components/Theme.js";
import { getCachedHistory, listHistory, type TranscriptItem } from "../api/transcript-api.js";

interface TranscriptListScreenProps {
  initialMode?: "chat" | "view";
  onOpen: (videoId: string, mode: "chat" | "view") => void;
  onBack: () => void;
}

function truncate(value: string, max = 56): string {
  if (value.length <= max) return value;
  return `${value.slice(0, max - 3)}...`;
}

export function TranscriptListScreen({ initialMode = "view", onOpen, onBack }: TranscriptListScreenProps) {
  const [items, setItems] = useState<TranscriptItem[]>(() => getCachedHistory({ limit: 30 })?.items ?? []);
  const [loading, setLoading] = useState(() => getCachedHistory({ limit: 30 }) === null);
  const [error, setError] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState(0);
  const [openMode, setOpenMode] = useState<"chat" | "view">(initialMode);

  useEffect(() => {
    setOpenMode(initialMode);
  }, [initialMode]);

  useInput((input, key) => {
    if (key.escape) onBack();
    if (input.toLowerCase() === "r") setRefreshToken((value) => value + 1);
    if (input.toLowerCase() === "c") setOpenMode("chat");
    if (input.toLowerCase() === "v") setOpenMode("view");
  });

  useEffect(() => {
    let active = true;

    (async () => {
      const hasCached = getCachedHistory({ limit: 30 }) !== null;
      if (!hasCached) {
        setLoading(true);
      }
      setError(null);
      try {
        const response = await listHistory({ limit: 30 });
        if (!active) return;
        setItems(response.items);
      } catch (err) {
        if (!active) return;
        setError(err instanceof Error ? err.message : "Failed to load history.");
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [refreshToken]);

  const options = useMemo(
    () =>
      items.map((item, index) => ({
        key: `${item.id || item.video_id}-${item.created_at || "na"}-${index}`,
        value: item.video_id,
        label: `${item.video_id}  ${truncate(item.video_title || "Untitled")}`,
      })),
    [items]
  );

  if (loading) {
    return (
      <Layout title="History" subtitle="Loading transcripts" commands={["Esc back"]}>
        <Panel variant="focus">
          <Box>
            <Text color={orange}><Spinner type="dots" /></Text>
            <Text> loading...</Text>
          </Box>
        </Panel>
      </Layout>
    );
  }

  return (
    <Layout
      title="History"
      subtitle={`Select transcript to open in ${openMode.toUpperCase()} mode`}
      commands={["Esc back", "R refresh", "C chat mode", "V view mode"]}
    >
      <Panel title="Recent transcripts" variant="focus">
        {error ? <Text color={theme.error}>{error}</Text> : null}

        {!error && options.length === 0 ? (
          <Text color={theme.muted}>No transcripts found. Run /transcribe first.</Text>
        ) : null}

        {!error && options.length > 0 ? (
          <SelectInput
            items={options}
            onSelect={(item) => {
              onOpen(item.value, openMode);
            }}
          />
        ) : null}
      </Panel>

      <Hint>
        <Key>Up</Key>/<Key>Down</Key> move  <Key>Enter</Key> open  <Key>C</Key> chat  <Key>V</Key> view  <Key>Esc</Key> back
      </Hint>
    </Layout>
  );
}
