#!/usr/bin/env node
import React from "react";
import { render } from "ink";
import App from "./App.js";

if (!process.stdin.isTTY) {
  console.error(
    "YouTube Transcript CLI requires an interactive terminal (TTY).\n" +
      "Run it directly in your terminal: npx youtube-transcript-cli"
  );
  process.exit(1);
}

render(<App />);
