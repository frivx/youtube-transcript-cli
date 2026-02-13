export const orange = "#FF8C00";

export const theme = {
  orange,
  text: "#f5f5f5",
  muted: "gray",
  success: "green",
  error: "red",
  warning: "yellow",
} as const;

export type Theme = typeof theme;
