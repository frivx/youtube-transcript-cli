import React, { useState } from "react";
import { isConfigured, resetConfig } from "./config/store.js";
import { OnboardingScreen } from "./screens/OnboardingScreen.js";
import { HomeScreen } from "./screens/HomeScreen.js";
import { ConfigScreen } from "./screens/ConfigScreen.js";
import { ModelSelectScreen } from "./screens/ModelSelectScreen.js";
import { TranscriptListScreen } from "./screens/TranscriptListScreen.js";
import { ChatScreen } from "./screens/ChatScreen.js";
import { ViewScreen } from "./screens/ViewScreen.js";
import { TranscribeScreen } from "./screens/TranscribeScreen.js";
import { UsageScreen } from "./screens/UsageScreen.js";
import { extractVideoId } from "./api/transcript-api.js";
import { parseHomeInput } from "./core/commands.js";
import type { AppNotice, AppScreen } from "./core/types.js";

function resolveVideoTarget(value?: string): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  const extracted = extractVideoId(trimmed);
  return extracted ?? (/^[a-zA-Z0-9_-]{11}$/.test(trimmed) ? trimmed : null);
}

function buildInitialScreen(): AppScreen {
  return isConfigured() ? { name: "home" } : { name: "onboarding" };
}

export default function App() {
  const [screen, setScreen] = useState<AppScreen>(buildInitialScreen);
  const [notice, setNotice] = useState<AppNotice | null>(null);
  const [lastNonHomeScreen, setLastNonHomeScreen] = useState<AppScreen | null>(null);

  const goHome = (nextNotice?: AppNotice) => {
    if (screen.name !== "home" && screen.name !== "onboarding") {
      setLastNonHomeScreen(screen);
    }
    setScreen({ name: "home" });
    setNotice(nextNotice ?? null);
  };

  const handleHomeSubmit = (value: string) => {
    const parsed = parseHomeInput(value);

    switch (parsed.kind) {
      case "empty":
        return;
      case "help":
        setNotice({
          tone: "info",
          message: "Commands: /transcribe, /chat, /view, /list, /status, /model, /config, /quit.",
        });
        return;
      case "model":
        setNotice(null);
        setScreen({ name: "model" });
        return;
      case "list":
        setNotice(null);
        setScreen({ name: "list", mode: "view" });
        return;
      case "usage":
      case "status":
        setNotice(null);
        setScreen({ name: "usage" });
        return;
      case "config":
        setNotice(null);
        setScreen({ name: "config" });
        return;
      case "reset":
        resetConfig();
        setNotice(null);
        setLastNonHomeScreen(null);
        setScreen({ name: "onboarding" });
        return;
      case "quit":
        process.exit(0);
      case "chat": {
        const target = resolveVideoTarget(parsed.target);
        if (!target) {
          setNotice({ tone: "info", message: "Select a transcript for chat." });
          setScreen({ name: "list", mode: "chat" });
          return;
        }
        setNotice(null);
        setScreen({ name: "chat", videoId: target, returnTo: "home" });
        return;
      }
      case "view": {
        const target = resolveVideoTarget(parsed.target);
        if (!target) {
          setNotice({ tone: "info", message: "Select a transcript to view." });
          setScreen({ name: "list", mode: "view" });
          return;
        }
        setNotice(null);
        setScreen({ name: "view", videoId: target, returnTo: "home" });
        return;
      }
      case "transcribe_command": {
        if (!parsed.target) {
          setNotice({
            tone: "info",
            message: "Paste a YouTube URL directly, or run /transcribe <url|id>.",
          });
          return;
        }
        setNotice(null);
        setScreen({ name: "transcribe", input: parsed.target });
        return;
      }
      case "transcribe":
        setNotice(null);
        setScreen({ name: "transcribe", input: parsed.value });
        return;
      case "unknown":
        setNotice({
          tone: "error",
          message: `Unknown command: /${parsed.name}. Run /help for usage.`,
        });
        return;
      default:
        return;
    }
  };

  if (screen.name === "onboarding") {
    return (
      <OnboardingScreen
        onComplete={() => {
          goHome({ tone: "success", message: "Configuration saved. You can now transcribe and chat." });
        }}
      />
    );
  }

  if (screen.name === "model") {
    return (
      <ModelSelectScreen
        onBack={() => goHome()}
        onComplete={() => {
          goHome({ tone: "success", message: "AI model configuration updated." });
        }}
      />
    );
  }

  if (screen.name === "config") {
    return (
      <ConfigScreen
        onBack={() => goHome()}
        onUpdated={(message) => {
          setNotice({ tone: "success", message });
        }}
      />
    );
  }

  if (screen.name === "list") {
    return (
      <TranscriptListScreen
        initialMode={screen.mode}
        onOpen={(videoId, mode) => {
          setNotice(null);
          setScreen(
            mode === "chat"
              ? { name: "chat", videoId, returnTo: "list" }
              : { name: "view", videoId, returnTo: "list" }
          );
        }}
        onBack={() => goHome()}
      />
    );
  }

  if (screen.name === "chat") {
    const backTarget =
      screen.returnTo === "list" ? () => setScreen({ name: "list", mode: "chat" }) : () => goHome();
    return (
      <ChatScreen
        videoId={screen.videoId}
        onBack={backTarget}
        onOpenView={() => {
          setNotice(null);
          setScreen({
            name: "view",
            videoId: screen.videoId,
            returnTo: "chat",
            chatReturnTo: screen.returnTo === "list" ? "list" : "home",
          });
        }}
      />
    );
  }

  if (screen.name === "view") {
    const backTarget =
      screen.returnTo === "chat"
        ? () =>
            setScreen({
              name: "chat",
              videoId: screen.videoId,
              returnTo: screen.chatReturnTo === "list" ? "list" : "home",
            })
        : screen.returnTo === "list"
          ? () => setScreen({ name: "list", mode: "view" })
          : () => goHome();

    const openChat = () => {
      setNotice(null);
      setScreen({
        name: "chat",
        videoId: screen.videoId,
        returnTo:
          screen.returnTo === "chat"
            ? (screen.chatReturnTo === "list" ? "list" : "home")
            : (screen.returnTo === "list" ? "list" : "home"),
      });
    };

    return (
      <ViewScreen
        videoId={screen.videoId}
        onBack={backTarget}
        onOpenChat={openChat}
      />
    );
  }

  if (screen.name === "transcribe") {
    return (
      <TranscribeScreen
        urlOrId={screen.input}
        onComplete={(outcome) => {
          if (!outcome?.videoId) {
            goHome();
            return;
          }

          if (outcome.action === "chat") {
            setNotice(null);
            setScreen({ name: "chat", videoId: outcome.videoId, returnTo: "home" });
            return;
          }

          if (outcome.action === "view") {
            setNotice(null);
            setScreen({ name: "view", videoId: outcome.videoId, returnTo: "home" });
            return;
          }

          goHome({
            tone: "success",
            message: `Transcript ready for ${outcome.videoId}.`,
          });
        }}
      />
    );
  }

  if (screen.name === "usage") {
    return <UsageScreen onBack={() => goHome()} />;
  }

  return (
    <HomeScreen
      notice={notice}
      onSubmitInput={handleHomeSubmit}
      hasBackTarget={lastNonHomeScreen !== null}
      onEscape={() => {
        if (lastNonHomeScreen) {
          setNotice(null);
          setScreen(lastNonHomeScreen);
        } else {
          setNotice(null);
        }
      }}
      onClearNotice={() => setNotice(null)}
    />
  );
}
