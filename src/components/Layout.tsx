import React from "react";
import { Box, Text } from "ink";
import TextInput from "ink-text-input";
import { orange, theme } from "./Theme.js";
import { getContentWidth } from "../utils/terminal.js";

const H = "-";
const H_TOP = "=";
const V = "|";
const TL = "+";
const TR = "+";
const BL = "+";
const BR = "+";

type PanelVariant = "default" | "success" | "focus" | "error";

function borderColorForVariant(variant: PanelVariant): string {
  if (variant === "success") return theme.success;
  if (variant === "focus") return orange;
  if (variant === "error") return theme.error;
  return theme.muted;
}

function padLine(value: string, width: number): string {
  if (value.length >= width - 3) {
    return `${V} ${value.slice(0, Math.max(0, width - 3))}${V}`;
  }
  return `${V} ${value}${" ".repeat(Math.max(0, width - 3 - value.length))}${V}`;
}

interface LayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  commands?: string[];
  showHeader?: boolean;
}

export function Layout({
  children,
  title,
  subtitle,
  commands,
  showHeader = true,
}: LayoutProps) {
  const width = getContentWidth();

  return (
    <Box flexDirection="column" padding={1}>
      {showHeader ? (
        <Box flexDirection="column" width={width} marginBottom={1}>
          <Box>
            <Text color={orange}>o </Text>
            <Text color={orange}>o </Text>
            <Text color={orange}>o </Text>
            <Text bold color={theme.text}>YouTube Transcript CLI</Text>
          </Box>
          {title ? <Text bold>{title}</Text> : null}
          {subtitle ? <Text color={theme.muted}>{subtitle}</Text> : null}
          {commands && commands.length > 0 ? (
            <Text color={orange}>{commands.join("  ")}</Text>
          ) : null}
          <Text color={theme.muted}>{"-".repeat(width)}</Text>
        </Box>
      ) : null}
      {children}
    </Box>
  );
}

interface PanelProps {
  title?: string;
  children: React.ReactNode;
  width?: number;
  variant?: PanelVariant;
}

export function Panel({
  title,
  children,
  width,
  variant = "default",
}: PanelProps) {
  const w = Math.min(width ?? getContentWidth(), getContentWidth());
  const color = borderColorForVariant(variant);
  const topLine = `${TL}${H_TOP.repeat(Math.max(0, w - 2))}${TR}`;
  const divider = `${V}${H.repeat(Math.max(0, w - 2))}${V}`;
  const bottom = `${BL}${H.repeat(Math.max(0, w - 2))}${BR}`;

  return (
    <Box flexDirection="column" width={w}>
      <Text color={color}>{topLine}</Text>
      {title ? <Text color={color}>{padLine(title, w)}</Text> : null}
      {title ? <Text color={color}>{divider}</Text> : null}
      <Box paddingLeft={1} paddingRight={1} width={w} flexDirection="column">
        {children}
      </Box>
      <Text color={color}>{bottom}</Text>
    </Box>
  );
}

export function Hint({ children }: { children: React.ReactNode }) {
  return (
    <Box marginTop={1}>
      <Text color={theme.muted}>{children}</Text>
    </Box>
  );
}

export function Key({ children }: { children: React.ReactNode }) {
  return (
    <Text color={orange} bold>
      {children}
    </Text>
  );
}

export function KeyHint({ value, label }: { value: string; label: string }) {
  return (
    <Text>
      <Text color={orange} bold>{value}</Text>
      <Text color={theme.muted}> {label}</Text>
    </Text>
  );
}

interface InputFieldProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (value: string) => void;
  placeholder?: string;
  label?: string;
  prompt?: string;
}

export function InputField({
  value,
  onChange,
  onSubmit,
  placeholder,
  label,
  prompt = ">",
}: InputFieldProps) {
  return (
    <Box flexDirection="column">
      {label ? <Text color={theme.muted}>{label}</Text> : null}
      <Box marginTop={1}>
        <Text color={orange} bold>{`${prompt} `}</Text>
        <TextInput
          value={value}
          onChange={onChange}
          onSubmit={onSubmit}
          placeholder={placeholder}
        />
      </Box>
    </Box>
  );
}
