import React, { useMemo, useState } from "react";
import { Box, Text, useInput } from "ink";
import SelectInput from "ink-select-input";
import Spinner from "ink-spinner";
import { Hint, InputField, Key, Layout, Panel } from "../components/Layout.js";
import { orange, theme } from "../components/Theme.js";
import { AI_MODELS } from "../config/models.js";
import {
  getAiModel,
  getApiBaseUrl,
  getStoredAiApiKey,
  getStoredYtApiKey,
  getYtApiKey,
  setAiApiKey,
  setAiModel,
  setYtApiKey,
} from "../config/store.js";
import { clearApiCache, getCredits } from "../api/transcript-api.js";

type ConfigStep = "menu" | "edit_yt" | "edit_model" | "edit_ai" | "summary";

interface ConfigScreenProps {
  onBack: () => void;
  onUpdated?: (message: string) => void;
}

function maskKey(value: string): string {
  if (!value) return "(not set)";
  if (value.length <= 8) return "********";
  return `${value.slice(0, 4)}...${value.slice(-4)}`;
}

export function ConfigScreen({ onBack, onUpdated }: ConfigScreenProps) {
  const [step, setStep] = useState<ConfigStep>("menu");
  const [status, setStatus] = useState<string | null>(null);
  const [statusTone, setStatusTone] = useState<"info" | "error" | "success">("info");
  const [ytDraft, setYtDraft] = useState("");
  const [aiDraft, setAiDraft] = useState("");
  const [saving, setSaving] = useState(false);

  useInput((_input, key) => {
    if (!key.escape) return;
    if (saving) return;

    if (step === "menu") {
      onBack();
      return;
    }

    setStep("menu");
  });

  const activeModel = useMemo(() => {
    const modelId = getAiModel();
    return AI_MODELS.find((m) => m.id === modelId);
  }, [step, status]);

  const menuItems = [
    { label: "Replace YouTubeTranscript API key", value: "yt" },
    { label: "Replace AI model", value: "model" },
    { label: "Replace AI provider key", value: "ai" },
    { label: "View current config", value: "summary" },
    { label: "Back", value: "back" },
  ];

  const setStatusMessage = (tone: "info" | "error" | "success", message: string) => {
    setStatusTone(tone);
    setStatus(message);
  };

  const handleYtSave = async (value: string) => {
    const trimmed = value.trim();
    if (!trimmed || saving) return;

    const previous = getStoredYtApiKey();
    setSaving(true);

    try {
      setYtApiKey(trimmed);
      clearApiCache();
      await getCredits();
      clearApiCache();
      setStatusMessage("success", "YouTubeTranscript API key updated.");
      onUpdated?.("YouTubeTranscript API key updated.");
      setYtDraft("");
      setStep("menu");
    } catch (err) {
      setYtApiKey(previous);
      clearApiCache();
      setStatusMessage(
        "error",
        err instanceof Error ? err.message : "Unable to validate and save API key."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleModelSelect = (item: { value: string }) => {
    setAiModel(item.value);
    clearApiCache();
    setStatusMessage("success", "AI model updated.");
    onUpdated?.("AI model updated.");
    setStep("menu");
  };

  const handleAiSave = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed || saving) return;

    setAiApiKey(trimmed);
    clearApiCache();
    setStatusMessage("success", "AI provider key updated.");
    onUpdated?.("AI provider key updated.");
    setAiDraft("");
    setStep("menu");
  };

  return (
    <Layout title="Config" subtitle="Manage keys and model" commands={[]}>
      {status ? (
        <Panel title="Status" variant={statusTone === "error" ? "error" : statusTone === "success" ? "success" : "focus"}>
          <Text color={statusTone === "error" ? theme.error : statusTone === "success" ? theme.success : orange}>{status}</Text>
        </Panel>
      ) : null}

      {step === "menu" ? (
        <Panel title="Configuration menu" variant="focus">
          <SelectInput
            items={menuItems}
            onSelect={(item) => {
              if (item.value === "yt") {
                setStep("edit_yt");
                return;
              }

              if (item.value === "model") {
                setStep("edit_model");
                return;
              }

              if (item.value === "ai") {
                setStep("edit_ai");
                return;
              }

              if (item.value === "summary") {
                setStep("summary");
                return;
              }

              onBack();
            }}
          />
        </Panel>
      ) : null}

      {step === "edit_yt" ? (
        <Panel title="Replace YouTubeTranscript API key" variant="focus">
          <Text color={theme.muted}>Current key: {maskKey(getStoredYtApiKey() || getYtApiKey())}</Text>
          <Box marginTop={1} />
          <InputField
            value={ytDraft}
            onChange={setYtDraft}
            onSubmit={handleYtSave}
            placeholder="yt_sk_live_..."
            label="Enter new key (validated on save)"
          />
          {saving ? (
            <Box marginTop={1}>
              <Text color={orange}><Spinner type="dots" /></Text>
              <Text> validating and saving...</Text>
            </Box>
          ) : null}
        </Panel>
      ) : null}

      {step === "edit_model" ? (
        <Panel title="Replace AI model" variant="focus">
          <Text color={theme.muted}>Current model: {activeModel?.name ?? "not set"}</Text>
          <Box marginTop={1} />
          <SelectInput
            items={AI_MODELS.map((model) => ({
              label: `${model.name} (${model.provider})`,
              value: model.id,
            }))}
            onSelect={handleModelSelect}
          />
        </Panel>
      ) : null}

      {step === "edit_ai" ? (
        <Panel title="Replace AI provider key" variant="focus">
          <Text color={theme.muted}>Current key: {maskKey(getStoredAiApiKey())}</Text>
          <Box marginTop={1} />
          <InputField
            value={aiDraft}
            onChange={setAiDraft}
            onSubmit={handleAiSave}
            placeholder="sk-..."
            label="Enter new provider key"
          />
        </Panel>
      ) : null}

      {step === "summary" ? (
        <Panel title="Current config" variant="focus">
          <Text>API base URL: <Text color={orange}>{getApiBaseUrl()}</Text></Text>
          <Text>YouTubeTranscript key: <Text color={orange}>{maskKey(getStoredYtApiKey() || getYtApiKey())}</Text></Text>
          <Text>AI model: <Text color={orange}>{activeModel?.name ?? "not set"}</Text></Text>
          <Text>AI provider key: <Text color={orange}>{maskKey(getStoredAiApiKey())}</Text></Text>
        </Panel>
      ) : null}

      <Hint>
        <Key>Enter</Key> select/save  <Key>Esc</Key> back
      </Hint>
    </Layout>
  );
}
