import React from "react";
import { Box, Text } from "ink";
import { orange, theme } from "./Theme.js";

interface HeaderProps {
  title: string;
  subtitle?: string;
  commands?: string[];
}

export function Header({ title, subtitle, commands = [] }: HeaderProps) {
  return (
    <Box flexDirection="column" marginBottom={1}>
      <Text color={orange} bold>{title}</Text>
      {subtitle ? <Text color={theme.muted}>{subtitle}</Text> : null}
      {commands.length > 0 ? <Text color={orange}>{commands.join(" | ")}</Text> : null}
    </Box>
  );
}
