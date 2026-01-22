import {
  Client,
  GatewayIntentBits,
  Events,
  type Message,
  type VoiceBasedChannel,
} from "discord.js";
import {
  joinVoiceChannel,
  createAudioPlayer,
  createAudioResource,
  AudioPlayerStatus,
  VoiceConnectionStatus,
  entersState,
  type VoiceConnection,
  type AudioPlayer,
} from "@discordjs/voice";
import ffmpegPath from "ffmpeg-static";
import { spawn, type Subprocess } from "bun";

const LOFI_STREAM_URL = "https://play.streamafrica.net/lofiradio";
const RECONNECT_DELAY_MS = 5000;
const MAX_RECONNECT_ATTEMPTS = 5;

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.MessageContent,
  ],
});

interface GuildAudioState {
  connection: VoiceConnection;
  player: AudioPlayer;
  ffmpegProcess: Subprocess | null;
  reconnectAttempts: number;
  isPlaying: boolean;
}

const guildStates = new Map<string, GuildAudioState>();

function createFFmpegStream(): Subprocess {
  if (!ffmpegPath) {
    throw new Error("ffmpeg-static path not found");
  }

  return spawn({
    cmd: [
      ffmpegPath,
      "-reconnect", "1",
      "-reconnect_streamed", "1",
      "-reconnect_delay_max", "5",
      "-i", LOFI_STREAM_URL,
      "-f", "opus",
      "-ar", "48000",
      "-ac", "2",
      "-b:a", "96k",
      "-",
    ],
    stdout: "pipe",
    stderr: "ignore",
  });
}

async function startStream(state: GuildAudioState): Promise<void> {
  try {
    if (state.ffmpegProcess) {
      state.ffmpegProcess.kill();
    }

    state.ffmpegProcess = createFFmpegStream();
    
    if (!state.ffmpegProcess.stdout) {
      throw new Error("Failed to create ffmpeg stdout stream");
    }

    const resource = createAudioResource(state.ffmpegProcess.stdout);
    state.player.play(resource);
    state.isPlaying = true;
    state.reconnectAttempts = 0;

    console.log("[Stream] Started playing lofi radio");
  } catch (error) {
    console.error("[Stream] Error starting stream:", error);
    await handleStreamError(state);
  }
}

async function handleStreamError(state: GuildAudioState): Promise<void> {
  if (state.reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
    console.error("[Stream] Max reconnection attempts reached");
    state.isPlaying = false;
    return;
  }

  state.reconnectAttempts++;
  console.log(
    `[Stream] Reconnecting... Attempt ${state.reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS}`
  );

  await Bun.sleep(RECONNECT_DELAY_MS);

  if (state.isPlaying) {
    await startStream(state);
  }
}

function setupPlayerListeners(state: GuildAudioState, guildId: string): void {
  state.player.on(AudioPlayerStatus.Idle, async () => {
    if (state.isPlaying) {
      console.log("[Player] Stream ended unexpectedly, attempting reconnect");
      await handleStreamError(state);
    }
  });

  state.player.on("error", async (error) => {
    console.error("[Player] Error:", error.message);
    if (state.isPlaying) {
      await handleStreamError(state);
    }
  });
}

function setupConnectionListeners(
  state: GuildAudioState,
  guildId: string
): void {
  state.connection.on(VoiceConnectionStatus.Disconnected, async () => {
    try {
      await Promise.race([
        entersState(state.connection, VoiceConnectionStatus.Signalling, 5000),
        entersState(state.connection, VoiceConnectionStatus.Connecting, 5000),
      ]);
    } catch {
      cleanup(guildId);
    }
  });

  state.connection.on(VoiceConnectionStatus.Destroyed, () => {
    cleanup(guildId);
  });
}

function cleanup(guildId: string): void {
  const state = guildStates.get(guildId);
  if (state) {
    state.isPlaying = false;
    if (state.ffmpegProcess) {
      state.ffmpegProcess.kill();
    }
    state.connection.destroy();
    guildStates.delete(guildId);
    console.log(`[Cleanup] Cleaned up resources for guild ${guildId}`);
  }
}

async function handlePlay(message: Message): Promise<void> {
  const voiceChannel = message.member?.voice.channel as VoiceBasedChannel | null;

  if (!voiceChannel) {
    await message.reply("You need to be in a voice channel to use this command!");
    return;
  }

  const guildId = message.guildId!;
  let state = guildStates.get(guildId);

  if (state) {
    await message.reply("Already playing lofi radio!");
    return;
  }

  try {
    const connection = joinVoiceChannel({
      channelId: voiceChannel.id,
      guildId: guildId,
      adapterCreator: message.guild!.voiceAdapterCreator,
    });

    await entersState(connection, VoiceConnectionStatus.Ready, 30000);

    const player = createAudioPlayer();
    connection.subscribe(player);

    state = {
      connection,
      player,
      ffmpegProcess: null,
      reconnectAttempts: 0,
      isPlaying: false,
    };

    guildStates.set(guildId, state);
    setupPlayerListeners(state, guildId);
    setupConnectionListeners(state, guildId);

    await startStream(state);
    await message.reply("Now playing lofi radio! 🎵");
  } catch (error) {
    console.error("[Play] Error joining voice channel:", error);
    cleanup(guildId);
    await message.reply("Failed to join voice channel. Please try again.");
  }
}

async function handleStop(message: Message): Promise<void> {
  const guildId = message.guildId!;
  const state = guildStates.get(guildId);

  if (!state) {
    await message.reply("Not currently playing anything!");
    return;
  }

  cleanup(guildId);
  await message.reply("Stopped playing and left the voice channel.");
}

client.once(Events.ClientReady, (readyClient) => {
  console.log(`[Bot] Logged in as ${readyClient.user.tag}`);
});

client.on(Events.MessageCreate, async (message) => {
  if (message.author.bot || !message.guild) return;

  const content = message.content.toLowerCase();

  if (content === "!play") {
    await handlePlay(message);
  } else if (content === "!stop") {
    await handleStop(message);
  }
});

const token = process.env.DISCORD_TOKEN;
if (!token) {
  console.error("[Bot] DISCORD_TOKEN environment variable is required");
  process.exit(1);
}

client.login(token);

process.on("SIGINT", () => {
  console.log("[Bot] Shutting down...");
  for (const guildId of guildStates.keys()) {
    cleanup(guildId);
  }
  client.destroy();
  process.exit(0);
});
