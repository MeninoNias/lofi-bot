# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

lofi-bot - A Discord bot that streams Lofi Girl radio to voice channels. Built with Bun runtime and TypeScript.

## Build/Test Commands

```bash
bun install          # Install dependencies
bun run start        # Run the bot
bun run dev          # Run with watch mode (auto-restart on changes)
```

## Environment Setup

Copy `.env.example` to `.env` and set `DISCORD_TOKEN` with your bot token.

## Architecture

- **Runtime**: Bun (not Node.js)
- **Entry point**: `src/index.ts`
- **Audio pipeline**: ffmpeg-static → opus stream → discord.js voice

### Key Components

- `guildStates` Map: Tracks active voice connections per Discord server
- `createFFmpegStream()`: Spawns ffmpeg process to transcode Lofi radio stream
- Auto-reconnection: Retries up to 5 times with 5s delay on stream failure

### Commands

- `!play` - Join voice channel and start streaming
- `!stop` - Stop streaming and leave voice channel
