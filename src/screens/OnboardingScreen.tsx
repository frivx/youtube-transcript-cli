import React, { useState } from "react";
import { Box, Text, useInput } from "ink";
import Spinner from "ink-spinner";
import SelectInput from "ink-select-input";
import { Hint, InputField, Key, Layout, Panel } from "../components/Layout.js";
import { orange, theme } from "../components/Theme.js";
import { setAiApiKey, setAiModel, setYtApiKey } from "../config/store.js";
import { clearApiCache, getCredits } from "../api/transcript-api.js";
import { AI_MODELS } from "../config/models.js";

type Step = "yt_key" | "model" | "ai_key";

interface OnboardingScreenProps {
  onComplete: () => void;
}

const API_KEY_ASCII_HEADER = [
  "    _    ____ ___   _  _________   __",
  "   / \\  |  _ \\_ _| | |/ / ____\\ \\ / /",
  "  / _ \\ | |_) | |  | ' /|  _|  \\ V / ",
  " / ___ \\|  __/| |  | . \\| |___  | |  ",
  "/_/   \\_\\_|  |___| |_|\\_\\_____| |_|  ",
];

function stepLabel(step: Step): string {
  if (step === "yt_key") return "[1/3] API key";
  if (step === "model") return "[2/3] AI model";
  return "[3/3] AI key";
}

function stepDots(step: Step): string {
  if (step === "yt_key") return "o . .";
  if (step === "model") return "o o .";
  return "o o o";
}

export function OnboardingScreen({ onComplete }: OnboardingScreenProps) {
  const [step, setStep] = useState<Step>("yt_key");
  const [ytKey, setYtKey] = useState("");
  const [ytError, setYtError] = useState<string | null>(null);
  const [ytValidating, setYtValidating] = useState(false);
  const [selectedModel, setSelectedModel] = useState<string | null>(null);
  const [aiKey, setAiKey] = useState("");
  const [aiError, setAiError] = useState<string | null>(null);

  useInput((_input, key) => {
    if (!key.escape || ytValidating) return;

    if (step === "ai_key") {
      setAiError(null);
      setStep("model");
      return;
    }

    if (step === "model") {
      setYtError(null);
      setStep("yt_key");
      return;
    }

    if (ytKey.trim().length > 0) {
      setYtKey("");
      setYtError(null);
    }
  });

  const modelOptions = AI_MODELS.map((model) => ({
    value: model.id,
    label: `${model.name} (${model.provider})`,
  }));

  const handleYtKeySubmit = async (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return;

    setYtValidating(true);
    setYtError(null);

    try {
      setYtApiKey(trimmed);
      clearApiCache();
      await getCredits();
      setStep("model");
    } catch (err) {
      setYtError(err instanceof Error ? err.message : "Unable to validate key.");
    } finally {
      setYtValidating(false);
    }
  };

  const handleModelSelect = (item: { value: string }) => {
    setSelectedModel(item.value);
    setStep("ai_key");
  };

  const handleAiKeySubmit = (value: string) => {
    if (!selectedModel) return;
    setAiError(null);

    try {
      setAiModel(selectedModel);
      clearApiCache();
      const trimmed = value.trim();
      if (trimmed) setAiApiKey(trimmed);
      clearApiCache();
      onComplete();
    } catch (err) {
      setAiError(err instanceof Error ? err.message : "Unable to save AI settings.");
    }
  };

  const layoutTitle = step === "yt_key" ? API_KEY_ASCII_HEADER.join("\n") : "Setup";

  return (
    <Layout title={layoutTitle} subtitle={`${stepLabel(step)}  ${stepDots(step)}`}>
      {step === "yt_key" ? (
        <Panel title="YouTubeTranscript API key" variant="focus">
          <Text>Get key from https://youtubetranscript.dev/dashboard/account</Text>
          <Box marginTop={1} />
          <InputField
            value={ytKey}
            onChange={setYtKey}
            onSubmit={handleYtKeySubmit}
            placeholder="yt_sk_live_..."
            label="Paste API key"
          />

          {ytValidating ? (
            <Box marginTop={1}>
              <Text color={orange}><Spinner type="dots" /></Text>
              <Text> validating...</Text>
            </Box>
          ) : null}

          {ytError ? <Text color={theme.error}>{ytError}</Text> : null}
        </Panel>
      ) : null}

      {step === "model" ? (
        <Panel title="Select AI model" variant="focus">
          <SelectInput items={modelOptions} onSelect={handleModelSelect} />
        </Panel>
      ) : null}

      {step === "ai_key" ? (
        <Panel title="AI provider key" variant="focus">
          <Text>Press Enter on empty input to use provider env var.</Text>
          <Box marginTop={1} />
          <InputField
            value={aiKey}
            onChange={setAiKey}
            onSubmit={handleAiKeySubmit}
            placeholder="sk-..."
            label="Provider key"
          />
          {aiError ? <Text color={theme.error}>{aiError}</Text> : null}
        </Panel>
      ) : null}

      <Hint>
        <Key>Enter</Key> continue  <Key>Esc</Key> back  <Key>Ctrl+C</Key> exit
      </Hint>
    </Layout>
  );
}
