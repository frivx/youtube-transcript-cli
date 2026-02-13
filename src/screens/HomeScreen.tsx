import React, { useEffect, useMemo, useState } from "react";
import { Box, Text, useInput } from "ink";
import { Hint, InputField, Key, Layout, Panel } from "../components/Layout.js";
import { orange, theme } from "../components/Theme.js";
import { getCachedCredits, getCredits } from "../api/transcript-api.js";
import { getAiModel } from "../config/store.js";
import { getModelById } from "../config/models.js";
import type { AppNotice } from "../core/types.js";

interface HomeScreenProps {
  onSubmitInput: (input: string) => void;
  notice: AppNotice | null;
  onEscape: () => void;
  onClearNotice: () => void;
  hasBackTarget: boolean;
}

interface CommandOption {
  command: string;
  description: string;
  requiresArg?: boolean;
}

const COMMAND_OPTIONS: CommandOption[] = [
  { command: "/transcribe", description: "Create transcript for URL or id.", requiresArg: true },
  { command: "/chat", description: "Open chat for transcript.", requiresArg: true },
  { command: "/view", description: "Open transcript reader.", requiresArg: true },
  { command: "/list", description: "Browse transcripts and open chat/view." },
  { command: "/status", description: "Show plan and remaining credits." },
  { command: "/model", description: "Update AI model and provider key." },
  { command: "/config", description: "Run setup wizard again." },
  { command: "/help", description: "Show command usage hints." },
  { command: "/quit", description: "Exit CLI." },
];

function noticeColor(tone: AppNotice["tone"]): string {
  if (tone === "error") return theme.error;
  if (tone === "success") return theme.success;
  return orange;
}

export function HomeScreen({ onSubmitInput, notice, onEscape, onClearNotice, hasBackTarget }: HomeScreenProps) {
  const [credits, setCredits] = useState<number | null>(() => getCachedCredits()?.credits ?? null);
  const [plan, setPlan] = useState(() => getCachedCredits()?.plan || "free");
  const [loading, setLoading] = useState(() => getCachedCredits() === null);
  const [error, setError] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    let active = true;

    (async () => {
      const hasCached = getCachedCredits() !== null;
      if (!hasCached) {
        setLoading(true);
      }
      setError(null);
      try {
        const creditResponse = await getCredits();
        if (!active) return;
        setCredits(creditResponse.credits);
        setPlan(creditResponse.plan || "free");
      } catch (err) {
        if (!active) return;
        setError(err instanceof Error ? err.message : "Failed to load account status.");
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  const model = getModelById(getAiModel());

  const subtitle = useMemo(() => {
    const base = `Plan ${plan} | Credits ${credits ?? "-"} | Model ${model?.name ?? "not configured"}`;
    return loading ? `${base} | Syncing...` : base;
  }, [credits, loading, model?.name, plan]);

  const commandQuery = useMemo(() => {
    if (!input.startsWith("/")) return "";
    return input.slice(1).trim().toLowerCase();
  }, [input]);

  const showDropdown = input.startsWith("/") && !input.includes(" ");

  const filteredCommands = useMemo(() => {
    if (!showDropdown) return [];
    if (!commandQuery) return COMMAND_OPTIONS;

    return COMMAND_OPTIONS.filter((option) =>
      option.command.slice(1).startsWith(commandQuery)
    );
  }, [showDropdown, commandQuery]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [commandQuery, showDropdown]);

  useInput((_input, key) => {
    if (key.escape) {
      if (input.trim().length > 0) {
        setInput("");
        setSelectedIndex(0);
        return;
      }

      if (notice) {
        onClearNotice();
        return;
      }

      onEscape();
      return;
    }

    if (!showDropdown || filteredCommands.length === 0) return;

    if (key.upArrow) {
      setSelectedIndex((prev) => Math.max(0, prev - 1));
      return;
    }

    if (key.downArrow) {
      setSelectedIndex((prev) => Math.min(filteredCommands.length - 1, prev + 1));
      return;
    }

    if (key.tab) {
      const selected = filteredCommands[selectedIndex] || filteredCommands[0];
      if (!selected) return;

      if (selected.requiresArg) {
        setInput(`${selected.command} `);
        return;
      }

      onSubmitInput(selected.command);
      setInput("");
      setSelectedIndex(0);
    }
  });

  const handleSubmit = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return;

    const isSingleCommandToken = trimmed.startsWith("/") && !trimmed.includes(" ");
    if (isSingleCommandToken && filteredCommands.length > 0) {
      const selected = filteredCommands[selectedIndex] || filteredCommands[0];
      if (selected) {
        onSubmitInput(selected.command);
        setInput("");
        setSelectedIndex(0);
        return;
      }
    }

    onSubmitInput(trimmed);
    setInput("");
    setSelectedIndex(0);
  };

  return (
    <Layout title="Home" subtitle={subtitle} commands={[]}>
      {error ? (
        <Panel title="Error" variant="error">
          <Text color={theme.error}>{error}</Text>
        </Panel>
      ) : null}

      {notice ? (
        <Panel
          title="Status"
          variant={notice.tone === "error" ? "error" : notice.tone === "success" ? "success" : "focus"}
        >
          <Text color={noticeColor(notice.tone)}>{notice.message}</Text>
        </Panel>
      ) : null}

      <Panel title="Command input" variant="focus">
        <InputField
          value={input}
          onChange={setInput}
          onSubmit={handleSubmit}
          placeholder="Paste YouTube URL or type /"
          label={showDropdown ? "Select command (Tab to apply)." : "Type / to open commands."}
        />

        {showDropdown ? (
          <Box flexDirection="column" marginTop={1}>
            {filteredCommands.length === 0 ? (
              <Text color={theme.muted}>No command matches this prefix.</Text>
            ) : (
              filteredCommands.map((option, index) => (
                <Text key={option.command}>
                  <Text color={index === selectedIndex ? orange : theme.muted}>
                    {index === selectedIndex ? "o " : ". "}
                  </Text>
                  <Text color={index === selectedIndex ? orange : theme.text} bold={index === selectedIndex}>
                    {option.command}
                  </Text>
                  <Text color={theme.muted}>  {option.description}</Text>
                </Text>
              ))
            )}
          </Box>
        ) : null}
      </Panel>

      <Hint>
        <Key>Enter</Key> submit  <Key>Tab</Key> apply command  <Key>Up/Down</Key> select  <Key>Esc</Key> {hasBackTarget ? "back/clear" : "clear"}  <Key>Ctrl+C</Key> exit
      </Hint>
    </Layout>
  );
}
