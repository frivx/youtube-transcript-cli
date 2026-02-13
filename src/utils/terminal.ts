export function getTerminalWidth(): number {
  return process.stdout?.columns ?? 78;
}

export function getContentWidth(): number {
  return Math.min(86, Math.max(56, getTerminalWidth() - 4));
}
