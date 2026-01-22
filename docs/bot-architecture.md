# Lofi Bot Architecture

## How to Run

### Prerequisites
- [Bun](https://bun.sh) v1.0+ (for local development)
- Docker and Docker Compose (for containerized deployment)
- Discord Bot Token with these permissions:
  - Connect
  - Speak
  - Read Messages / View Channels
  - Send Messages
  - Message Content Intent (enabled in Discord Developer Portal)

### Option 1: Local Development

1. Install dependencies:
```bash
bun install
```

2. Create `.env` file:
```bash
cp .env.example .env
```

3. Add your Discord bot token to `.env`:
```
DISCORD_TOKEN=your_token_here
DATABASE_URL=postgresql://user:password@localhost:5432/lofi_bot
```

4. Run the bot:
```bash
bun run start
```

For development with auto-reload:
```bash
bun run dev
```

### Option 2: Docker Deployment

1. Create `.env` file with your Discord token:
```bash
echo "DISCORD_TOKEN=your_token_here" > .env
```

2. Build and run with Docker Compose:
```bash
docker compose up -d
```

3. Check logs:
```bash
docker compose logs -f bot
```

4. Stop the bot:
```bash
docker compose down
```

The Docker setup includes:
- **bot**: The Discord bot running on `oven/bun:1-alpine`
- **db**: PostgreSQL 16 database with persistent storage

Database connection is automatically configured as `postgresql://lofi:lofi@db:5432/lofi_bot`.

---

## What the Code Does

### Entry Point (`src/index.ts`)

The file is organized into these sections:

#### 1. Configuration (Lines 21-23)
```typescript
const LOFI_STREAM_URL = "https://play.streamafrica.net/lofiradio";
const RECONNECT_DELAY_MS = 5000;
const MAX_RECONNECT_ATTEMPTS = 5;
```
- `LOFI_STREAM_URL`: The Lofi Girl radio stream endpoint
- `RECONNECT_DELAY_MS`: Wait 5 seconds between reconnection attempts
- `MAX_RECONNECT_ATTEMPTS`: Give up after 5 failed attempts

#### 2. Discord Client Setup (Lines 25-32)
Creates a Discord client with required intents:
- `Guilds`: Access to server information
- `GuildMessages`: Receive message events
- `GuildVoiceStates`: Track voice channel membership
- `MessageContent`: Read message content for commands

#### 3. State Management (Lines 34-42)
```typescript
interface GuildAudioState {
  connection: VoiceConnection;
  player: AudioPlayer;
  ffmpegProcess: Subprocess | null;
  reconnectAttempts: number;
  isPlaying: boolean;
}

const guildStates = new Map<string, GuildAudioState>();
```
Each Discord server (guild) has its own state stored in a Map, allowing the bot to play in multiple servers simultaneously.

#### 4. Audio Pipeline (Lines 44-65)
```
Lofi Stream URL → FFmpeg Process → Opus Audio → Discord Voice
```
- `createFFmpegStream()`: Spawns an FFmpeg process that:
  - Connects to the Lofi radio URL
  - Transcodes to Opus format (Discord's required codec)
  - Outputs at 48kHz stereo, 96kbps
  - Includes built-in reconnection for stream stability

#### 5. Stream Management (Lines 67-108)
- `startStream()`: Initializes the FFmpeg process and starts playback
- `handleStreamError()`: Implements exponential retry logic when streams fail

#### 6. Event Listeners (Lines 110-144)
- **Player listeners**: Detect when audio stops unexpectedly and trigger reconnection
- **Connection listeners**: Handle Discord voice connection state changes (disconnect, destroy)

#### 7. Cleanup (Lines 146-157)
`cleanup()` function ensures proper resource disposal:
- Stops the FFmpeg process
- Destroys the voice connection
- Removes state from the Map

#### 8. Command Handlers (Lines 159-219)
- `handlePlay()`: Validates user is in voice channel, joins, and starts streaming
- `handleStop()`: Stops playback and leaves the voice channel

#### 9. Bot Initialization (Lines 221-252)
- Logs in with the Discord token
- Listens for messages and routes to command handlers
- Handles graceful shutdown on SIGINT (Ctrl+C)

---

## Flow Diagram

```
User types !play
       ↓
Check if user is in voice channel
       ↓
Join voice channel (joinVoiceChannel)
       ↓
Create audio player (createAudioPlayer)
       ↓
Spawn FFmpeg process (createFFmpegStream)
       ↓
Pipe FFmpeg output to audio resource
       ↓
Play audio resource through player
       ↓
       ↓ ← Stream drops?
       ↓
handleStreamError() → retry up to 5 times
       ↓
User types !stop
       ↓
cleanup() → kill FFmpeg, destroy connection
```

---

## Potential Improvements

### 1. Slash Commands
Replace prefix commands (`!play`) with Discord slash commands for better UX:
```typescript
// Instead of message-based commands
client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;
  if (interaction.commandName === "play") { ... }
});
```

### 2. Multiple Radio Stations
Add support for different lofi streams:
```typescript
const STATIONS = {
  lofi: "https://play.streamafrica.net/lofiradio",
  chillhop: "https://...",
  jazzhop: "https://...",
};
// !play lofi, !play chillhop
```

### 3. Volume Control
Add a `!volume` command using AudioPlayer's volume transformer:
```typescript
import { createAudioResource, StreamType } from "@discordjs/voice";
// Use inline volume for real-time adjustment
```

### 4. Now Playing Status
Update bot's Discord presence to show current stream:
```typescript
client.user?.setActivity("Lofi Radio", { type: ActivityType.Listening });
```

### 5. Queue System
Allow users to queue different stations or tracks.

### 6. Web Dashboard
Add a web interface for controlling the bot using Bun.serve():
```typescript
Bun.serve({
  port: 3000,
  fetch(req) {
    // API endpoints for bot control
  },
});
```

### 7. Logging Improvements
Replace console.log with a structured logger (e.g., pino, winston):
```typescript
import pino from "pino";
const logger = pino({ level: "info" });
logger.info({ guildId }, "Started playing");
```

### 8. Error Reporting
Add error tracking (Sentry, etc.) for production monitoring.

### 9. Sharding
For bots in 2500+ servers, implement Discord.js sharding:
```typescript
import { ShardingManager } from "discord.js";
const manager = new ShardingManager("./src/index.ts", { token });
manager.spawn();
```

### 10. Health Check Endpoint
Add an HTTP endpoint for uptime monitoring:
```typescript
Bun.serve({
  port: 8080,
  fetch(req) {
    if (new URL(req.url).pathname === "/health") {
      return new Response("OK");
    }
  },
});
```
