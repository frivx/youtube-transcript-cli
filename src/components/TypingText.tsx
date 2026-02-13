import React, { useEffect, useState } from "react";
import { Text } from "ink";
import { theme } from "./Theme.js";

interface TypingTextProps {
  text: string;
  speed?: number;
  color?: string;
  onComplete?: () => void;
}

export function TypingText({
  text,
  speed = 20,
  color = theme.text,
  onComplete,
}: TypingTextProps) {
  const [display, setDisplay] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!text) {
      setDisplay("");
      setDone(true);
      onComplete?.();
      return;
    }

    setDisplay("");
    setDone(false);

    let index = 0;
    const intervalId = setInterval(() => {
      index += 1;
      setDisplay(text.slice(0, index));
      if (index >= text.length) {
        clearInterval(intervalId);
        setDone(true);
        onComplete?.();
      }
    }, speed);

    return () => clearInterval(intervalId);
  }, [text, speed, onComplete]);

  return (
    <Text color={color}>
      {display}
      {!done ? "|" : ""}
    </Text>
  );
}
