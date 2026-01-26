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
- `LOG_LEVEL` - (Optional) Logging level: `debug`, `info`, `warn`, `error` (default: `info`)

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
└── utils/                # Utility functions (permissions, logging)

.github/
├── ISSUE_TEMPLATE/       # Issue templates
├── workflows/            # GitHub Actions CI/CD
├── pull_request_template.md  # PR template
└── dependabot.yml        # Dependency updates config
```

### Key Components

- `AudioService`: Manages voice connections and audio playback with automatic reconnection
- `StreamService`: Creates FFmpeg processes for audio streaming
- `StationService`: CRUD operations for radio stations with ID/name/default resolution
- `CommandController`: Routes commands to handlers with error handling
- `StationRepository`: Database access for stations table
- `MessageView`: Consistent response formatting for all bot messages

### Logging

Uses pino for structured logging with child loggers per module:
- `streamLogger`, `playerLogger`, `botLogger`, `configLogger`, `commandLogger`, `seedLogger`, `voiceLogger`
- Pretty-printing in development, JSON in production
- Configured via `LOG_LEVEL` environment variable

### Error Handling & Recovery

- `AudioService` implements retry logic with reconnection attempts (max 5, 5s delay)
- Graceful shutdown on SIGINT with resource cleanup
- Connection state listeners for Disconnected/Destroyed events
- Stream errors trigger automatic reconnection
- Auto-disconnect when all users leave the voice channel (via `VoiceStateUpdate` event)

### Startup Behavior

- Default station seeding on first run (if no stations exist)
- Graceful shutdown handler registered for SIGINT
- Suppresses TimeoutNegativeWarning from @discordjs/voice

### Permissions

Admin commands check both:
1. Discord Administrator permission
2. Configured `ADMIN_ROLE_ID` (if set)

Falls back to Administrator check if no role ID configured.

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

### Interfaces

All services and repositories implement interfaces (in `interfaces/` subdirectories):
- `IAudioService`, `IStreamService`, `IStationService`
- `IStationRepository`
- `ICommand` - Commands have `name`, `description`, `usage`, `adminOnly`, and `execute()`

### Database Schema

Stations table:
- `id`: Serial primary key
- `name`: Unique station name
- `url`: Stream URL
- `description`: Optional description
- `isDefault`: Boolean for default station
- `createdAt`, `updatedAt`: Timestamps (auto-managed)

## Release Process

Uses [release-please](https://github.com/googleapis/release-please) for automated releases. Write commits using [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` → minor version bump
- `fix:` → patch version bump
- `feat!:` or `BREAKING CHANGE:` → major version bump
