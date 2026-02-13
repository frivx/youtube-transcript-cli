import React, { useEffect, useMemo, useState } from "react";
import { Box, Text, useInput } from "ink";
import Spinner from "ink-spinner";
import { Hint, Key, Layout, Panel } from "../components/Layout.js";
import { orange, theme } from "../components/Theme.js";
import { getCachedCredits, getCredits } from "../api/transcript-api.js";

interface UsageScreenProps {
  onBack: () => void;
}

interface UsageState {
  credits: number;
  total: number;
  plan: string;
}

function meter(value: number, total: number): string {
  if (total <= 0) return "[..........]";
  const len = 10;
  const ratio = Math.max(0, Math.min(1, value / total));
  const filled = Math.round(len * ratio);
  return `[${"#".repeat(filled)}${".".repeat(len - filled)}]`;
}

export function UsageScreen({ onBack }: UsageScreenProps) {
  const [usage, setUsage] = useState<UsageState | null>(() => {
    const cached = getCachedCredits();
    if (!cached) return null;
    return { credits: cached.credits, total: cached.total_credits, plan: cached.plan };
  });
  const [loading, setLoading] = useState(() => getCachedCredits() === null);
  const [error, setError] = useState<string | null>(null);

  useInput((_input, key) => {
    if (key.escape) onBack();
  });

  useEffect(() => {
    let active = true;

    getCredits()
      .then((data) => {
        if (!active) return;
        setUsage({
          credits: data.credits,
          total: data.total_credits,
          plan: data.plan,
        });
      })
      .catch((err) => {
        if (!active) return;
        setError(err instanceof Error ? err.message : "Failed to load usage.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const usageMeter = useMemo(() => {
    if (!usage) return meter(0, 0);
    return meter(usage.credits, usage.total);
  }, [usage]);

  if (loading) {
    return (
      <Layout title="Status" subtitle="Loading" commands={[]}>
        <Panel variant="focus">
          <Box>
            <Text color={orange}><Spinner type="dots" /></Text>
            <Text> loading credits...</Text>
          </Box>
        </Panel>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout title="Status" subtitle="Error" commands={[]}>
        <Panel title="Error" variant="error">
          <Text color={theme.error}>{error}</Text>
        </Panel>
      </Layout>
    );
  }

  return (
    <Layout title="Status" subtitle="Plan and usage" commands={[]}>
      <Panel title="Account" variant="focus">
        <Text>Plan: <Text color={orange}>{usage?.plan ?? "free"}</Text></Text>
        <Text>Available credits: <Text color={orange}>{usage?.credits ?? 0}</Text></Text>
        <Text color={theme.muted}>Total credits: {usage?.total ?? 0}</Text>
      </Panel>

      <Panel title="Credit meter">
        <Text color={orange}>{usageMeter}</Text>
      </Panel>

      <Hint>
        <Key>Esc</Key> back
      </Hint>
    </Layout>
  );
}
