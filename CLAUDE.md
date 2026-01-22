# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

lofi-bot - A Discord bot that streams radio stations to voice channels. Built with Bun runtime, TypeScript, and PostgreSQL. Features MVC architecture with SOLID principles.

## Build/Test Commands

```bash
bun install          # Install dependencies
bun run start        # Run the bot
bun run dev          # Run with watch mode (auto-restart on changes)
bun run lint         # Run ESLint
bun run lint:fix     # Run ESLint with auto-fix
bun run format       # Format code with Prettier
bun run format:check # Check formatting
bun run db:generate  # Generate Drizzle migrations
bun run db:push      # Push schema to database
bun run db:studio    # Open Drizzle Studio
```

## Environment Setup

Copy `.env.example` to `.env` and configure:
- `DISCORD_TOKEN` - Your Discord bot token
- `DATABASE_URL` - PostgreSQL connection string
- `ADMIN_ROLE_ID` - (Optional) Role ID for admin commands

## Architecture

- **Runtime**: Bun (not Node.js)
- **Database**: PostgreSQL with Drizzle ORM
- **Pattern**: MVC with SOLID principles
- **Entry point**: `src/index.ts` (composition root)

### Directory Structure

```
src/
├── index.ts              # Composition root (DI setup)
├── config/               # Environment configuration
├── database/             # Drizzle connection and schema
├── models/               # TypeScript types
├── repositories/         # Data access layer
├── services/             # Business logic
├── controllers/          # Command routing
├── commands/             # Individual command handlers
├── views/                # Response formatting
└── utils/                # Utility functions (permissions)
```

### Key Components

- `AudioService`: Manages voice connections and audio playback
- `StreamService`: Creates FFmpeg processes for audio streaming
- `StationService`: CRUD operations for radio stations
- `CommandController`: Routes commands to handlers
- `StationRepository`: Database access for stations table

### Commands

| Command | Description | Access |
|---------|-------------|--------|
| `!play [station]` | Play station (default if omitted) | Everyone |
| `!stop` | Stop streaming and leave channel | Everyone |
| `!stations` | List all available stations | Everyone |
| `!addstation <name> <url> [desc]` | Add new station | Admin |
| `!removestation <id>` | Remove a station | Admin |
| `!setdefault <id>` | Set default station | Admin |

### Path Aliases

Use `@/*` to import from `src/*`:
```typescript
import { something } from "@/utils";
```

## Release Process

Uses [release-please](https://github.com/googleapis/release-please) for automated releases. Write commits using [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` → minor version bump
- `fix:` → patch version bump
- `feat!:` or `BREAKING CHANGE:` → major version bump
