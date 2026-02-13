import React, { useEffect, useState } from "react";
import { Text } from "ink";
import { orange } from "./Theme.js";

const GLITCH_CHARS = "0O1l|/\\";

function glitchChar(char: string): string {
  if (char === " " || char === "\n") return char;
  if (Math.random() < 0.15) {
    return GLITCH_CHARS[Math.floor(Math.random() * GLITCH_CHARS.length)];
  }
  return char;
}

interface GlitchTextProps {
  children: string;
  active?: boolean;
  color?: string;
}

export function GlitchText({
  children,
  active = true,
  color = orange,
}: GlitchTextProps) {
  const [display, setDisplay] = useState(children);

  useEffect(() => {
    if (!active) {
      setDisplay(children);
      return;
    }

    const id = setInterval(() => {
      setDisplay(
        children
          .split("")
          .map(glitchChar)
          .join("")
      );
    }, 80);

    return () => clearInterval(id);
  }, [children, active]);

  return <Text color={color}>{display}</Text>;
}
