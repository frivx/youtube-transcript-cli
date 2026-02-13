import React from "react";
import { Box, Text } from "ink";
import { orange, theme } from "./Theme.js";

interface MarkdownTextProps {
  content: string;
}

function parseInline(line: string, keyPrefix: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  const pattern = /(\*\*[^*]+\*\*|`[^`]+`|\*[^*]+\*|\[[^\]]+\]\([^)]+\))/;

  let rest = line;
  let index = 0;

  while (rest.length > 0) {
    const match = rest.match(pattern);

    if (!match || match.index === undefined) {
      nodes.push(<Text key={`${keyPrefix}-plain-${index}`}>{rest}</Text>);
      break;
    }

    if (match.index > 0) {
      nodes.push(
        <Text key={`${keyPrefix}-plain-${index}`}>
          {rest.slice(0, match.index)}
        </Text>
      );
      index += 1;
    }

    const token = match[0];

    if (token.startsWith("**") && token.endsWith("**")) {
      nodes.push(
        <Text key={`${keyPrefix}-bold-${index}`} bold>
          {token.slice(2, -2)}
        </Text>
      );
    } else if (token.startsWith("`") && token.endsWith("`")) {
      nodes.push(
        <Text key={`${keyPrefix}-code-${index}`} color={orange}>
          {token.slice(1, -1)}
        </Text>
      );
    } else if (token.startsWith("*") && token.endsWith("*")) {
      nodes.push(
        <Text key={`${keyPrefix}-em-${index}`} color={theme.muted}>
          {token.slice(1, -1)}
        </Text>
      );
    } else {
      const linkMatch = token.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
      if (linkMatch) {
        nodes.push(
          <Text key={`${keyPrefix}-link-text-${index}`} color={orange}>
            {linkMatch[1]}
          </Text>
        );
        nodes.push(
          <Text key={`${keyPrefix}-link-url-${index}`} color={theme.muted}>
            {` (${linkMatch[2]})`}
          </Text>
        );
      } else {
        nodes.push(<Text key={`${keyPrefix}-token-${index}`}>{token}</Text>);
      }
    }

    rest = rest.slice(match.index + token.length);
    index += 1;
  }

  return nodes;
}

export function MarkdownText({ content }: MarkdownTextProps) {
  const lines = content.replace(/\r\n/g, "\n").split("\n");
  const rendered: React.ReactNode[] = [];

  let inCodeBlock = false;

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i] || "";
    const trimmed = line.trim();
    const keyBase = `line-${i}`;

    if (trimmed.startsWith("```")) {
      inCodeBlock = !inCodeBlock;
      rendered.push(
        <Text key={`${keyBase}-fence`} color={theme.muted}>
          {inCodeBlock ? "code:" : "end code"}
        </Text>
      );
      continue;
    }

    if (inCodeBlock) {
      rendered.push(
        <Text key={`${keyBase}-code`} color={orange}>
          {`  ${line}`}
        </Text>
      );
      continue;
    }

    const headingMatch = trimmed.match(/^(#{1,3})\s+(.+)$/);
    if (headingMatch) {
      rendered.push(
        <Text key={`${keyBase}-heading`} color={orange} bold>
          {headingMatch[2]}
        </Text>
      );
      continue;
    }

    const listMatch = trimmed.match(/^[-*]\s+(.+)$/);
    if (listMatch) {
      rendered.push(
        <Text key={`${keyBase}-list`} wrap="wrap">
          <Text color={orange}>o </Text>
          {parseInline(listMatch[1], `${keyBase}-list-inline`)}
        </Text>
      );
      continue;
    }

    const numberListMatch = trimmed.match(/^(\d+)\.\s+(.+)$/);
    if (numberListMatch) {
      rendered.push(
        <Text key={`${keyBase}-olist`} wrap="wrap">
          <Text color={orange}>{`${numberListMatch[1]}. `}</Text>
          {parseInline(numberListMatch[2], `${keyBase}-olist-inline`)}
        </Text>
      );
      continue;
    }

    const quoteMatch = trimmed.match(/^>\s+(.+)$/);
    if (quoteMatch) {
      rendered.push(
        <Text key={`${keyBase}-quote`} color={theme.muted} wrap="wrap">
          {`| ${quoteMatch[1]}`}
        </Text>
      );
      continue;
    }

    if (/^(-{3,}|_{3,}|\*{3,})$/.test(trimmed)) {
      rendered.push(
        <Text key={`${keyBase}-hr`} color={theme.muted}>
          {"-".repeat(30)}
        </Text>
      );
      continue;
    }

    if (trimmed.length === 0) {
      rendered.push(<Text key={`${keyBase}-empty`}> </Text>);
      continue;
    }

    rendered.push(
      <Text key={`${keyBase}-text`} wrap="wrap">
        {parseInline(line, `${keyBase}-inline`)}
      </Text>
    );
  }

  return <Box flexDirection="column">{rendered}</Box>;
}
