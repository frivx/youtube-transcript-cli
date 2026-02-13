import React, { useState } from "react";
import { Box, Text, useInput } from "ink";
import SelectInput from "ink-select-input";
import { Hint, InputField, Key, Layout, Panel } from "../components/Layout.js";
import { AI_MODELS } from "../config/models.js";
import { setAiApiKey, setAiModel } from "../config/store.js";
import { clearApiCache } from "../api/transcript-api.js";

interface ModelSelectScreenProps {
  onComplete: () => void;
  onBack: () => void;
}

export function ModelSelectScreen({ onComplete, onBack }: ModelSelectScreenProps) {
  const [step, setStep] = useState<"select" | "key">("select");
  const [selected, setSelected] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState("");

  useInput((_input, key) => {
    if (!key.escape) return;
    if (step === "key") {
      setStep("select");
      return;
    }
    onBack();
  });

  const modelOptions = AI_MODELS.map((model) => ({
    label: `${model.name} (${model.provider})`,
    value: model.id,
  }));

  const handleModelSelect = (item: { value: string }) => {
    setSelected(item.value);
    setStep("key");
  };

  const handleKeySubmit = (value: string) => {
    if (!selected) return;
    setAiModel(selected);
    clearApiCache();
    const trimmed = value.trim();
    if (trimmed) setAiApiKey(trimmed);
    clearApiCache();
    onComplete();
  };

  const selectedModel = AI_MODELS.find((model) => model.id === selected);

  return (
    <Layout title="Model settings" subtitle="Choose AI model and key" commands={["Esc back"]}>
      {step === "select" ? (
        <Panel title="Select model" variant="focus">
          <SelectInput items={modelOptions} onSelect={handleModelSelect} />
        </Panel>
      ) : null}

      {step === "key" ? (
        <Panel title={`API key for ${selectedModel?.name ?? selected}`} variant="focus">
          <Text>Press Enter on empty input to use {selectedModel?.envKey ?? "env var"}.</Text>
          <Box marginTop={1} />
          <InputField
            value={apiKey}
            onChange={setApiKey}
            onSubmit={handleKeySubmit}
            placeholder="sk-..."
            label="Provider key"
          />
        </Panel>
      ) : null}

      <Hint>
        <Key>Enter</Key> continue  <Key>Esc</Key> back
      </Hint>
    </Layout>
  );
}
