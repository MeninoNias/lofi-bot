import type { AudioPlayer, VoiceConnection } from "@discordjs/voice";
import type { Subprocess } from "bun";
import type { Message } from "discord.js";

export interface GuildAudioState {
  connection: VoiceConnection;
  player: AudioPlayer;
  ffmpegProcess: Subprocess | null;
  reconnectAttempts: number;
  isPlaying: boolean;
  currentStationId: number | null;
  channelId: string;
}

export interface CommandContext {
  message: Message;
  args: string[];
}

export interface CommandResult {
  success: boolean;
  message: string;
}
