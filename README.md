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
npm install -g ytscribe-cli
```

Then run:

```bash
youtube-transcript
```

Or:

```bash
ytscribe
```

Without global install:

```bash
npx -y ytscribe-cli ytscribe
```

## Quick Start

1. Launch CLI with `yt` or `youtube-transcript`.
2. Complete setup when prompted (API key and optional AI provider).
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

## License

MIT

