# YouTube Transcript CLI

Terminal-first CLI for extracting YouTube transcripts and working with them quickly.

- transcribe from URL or video ID
- open transcript reader
- chat with AI grounded in transcript content
- browse transcript history
- check credits and plan status

Repository: https://github.com/frivx/youtube-transcript-cli

## Installation

```bash
npm install -g youtube-transcript-cli
```

Then run:

```bash
youtube-transcript
```

Or:

```bash
yt
```

## Quick Start

1. Launch CLI with `yt` or `youtube-transcript`.
2. Complete setup:
   - YouTube Transcript API key (`yt_sk_...`)
   - AI provider/model (OpenAI, Anthropic, Gemini)
   - provider API key
3. Paste a YouTube URL on home screen, or run `/transcribe <url|id>`.

## Commands

| Command | Description |
| --- | --- |
| `/transcribe <url\|id>` | Create transcript |
| `/chat <url\|id>` | Open transcript chat |
| `/view <url\|id>` | Open transcript reader |
| `/list` | Browse recent transcripts |
| `/status` | Show plan and credits |
| `/usage` | Alias for `/status` |
| `/model` | Change AI model/provider key |
| `/config` | Re-run setup wizard |
| `/help` | Show usage hints |
| `/quit` | Exit CLI |

## Environment Variables

API:

- `YT_API_KEY` or `YOUTUBE_TRANSCRIPT_API_KEY`
- `YT_API_BASE_URL` (optional)

AI provider keys:

- `OPENAI_API_KEY`
- `ANTHROPIC_API_KEY`
- `GEMINI_API_KEY`

## Config Storage

Configuration is persisted locally via `conf`:

- Windows: `%APPDATA%/youtube-transcript-cli`
- macOS: `~/Library/Preferences/youtube-transcript-cli`
- Linux: `~/.config/youtube-transcript-cli`

## Development

```bash
npm install
npm run dev
```

Build:

```bash
npm run build
```

## Troubleshooting

- `401/403` from API: check `yt_sk_...` key in `/config`.
- AI chat failing: verify selected provider key.
- Empty history: ensure transcript creation completed successfully.

## License

MIT

