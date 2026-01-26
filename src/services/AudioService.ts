import {
  AudioPlayerStatus,
  VoiceConnectionStatus,
  StreamType,
  createAudioPlayer,
  createAudioResource,
  entersState,
  joinVoiceChannel,
  NoSubscriberBehavior,
} from "@discordjs/voice";
import type { VoiceBasedChannel, VoiceState } from "discord.js";
import { Readable } from "node:stream";
import { config } from "@/config";
import type { GuildAudioState } from "@/models/types";
import { streamLogger, playerLogger, logger, voiceLogger } from "@/utils/logger";
import type { IAudioService } from "./interfaces/IAudioService";
import type { IStreamService } from "./interfaces/IStreamService";

export class AudioService implements IAudioService {
  private readonly guildStates = new Map<string, GuildAudioState>();

  constructor(private readonly streamService: IStreamService) {}

  getState(guildId: string): GuildAudioState | undefined {
    return this.guildStates.get(guildId);
  }

  hasState(guildId: string): boolean {
    return this.guildStates.has(guildId);
  }

  async joinChannel(channel: VoiceBasedChannel): Promise<GuildAudioState> {
    const guildId = channel.guild.id;

    const connection = joinVoiceChannel({
      channelId: channel.id,
      guildId: guildId,
      adapterCreator: channel.guild.voiceAdapterCreator,
    });

    await entersState(connection, VoiceConnectionStatus.Ready, 30000);

    const player = createAudioPlayer({
      behaviors: {
        noSubscriber: NoSubscriberBehavior.Play,
      },
    });
    connection.subscribe(player);

    const state: GuildAudioState = {
      connection,
      player,
      ffmpegProcess: null,
      reconnectAttempts: 0,
      isPlaying: false,
      currentStationId: null,
      channelId: channel.id,
    };

    this.guildStates.set(guildId, state);
    this.setupPlayerListeners(state, guildId);
    this.setupConnectionListeners(state, guildId);

    return state;
  }

  async startStream(guildId: string, streamUrl: string): Promise<void> {
    const state = this.guildStates.get(guildId);
    if (!state) {
      throw new Error(`No audio state found for guild ${guildId}`);
    }

    await this.startStreamInternal(state, streamUrl);
  }

  private async startStreamInternal(state: GuildAudioState, streamUrl: string): Promise<void> {
    try {
      if (state.ffmpegProcess) {
        state.ffmpegProcess.kill();
      }

      state.ffmpegProcess = this.streamService.createStream(streamUrl);

      if (!state.ffmpegProcess.stdout || typeof state.ffmpegProcess.stdout === "number") {
        throw new Error("Failed to create ffmpeg stdout stream");
      }

      const nodeStream = Readable.fromWeb(
        state.ffmpegProcess.stdout as import("stream/web").ReadableStream
      );
      const resource = createAudioResource(nodeStream, {
        inputType: StreamType.OggOpus,
      });
      state.player.play(resource);
      state.isPlaying = true;
      state.reconnectAttempts = 0;

      // Store the URL for reconnection
      (state as GuildAudioState & { currentStreamUrl?: string }).currentStreamUrl = streamUrl;

      streamLogger.info("Started playing radio");
    } catch (error) {
      streamLogger.error({ err: error }, "Error starting stream");
      await this.handleStreamError(state);
    }
  }

  private async handleStreamError(state: GuildAudioState): Promise<void> {
    if (state.reconnectAttempts >= config.stream.maxReconnectAttempts) {
      streamLogger.error(
        { maxAttempts: config.stream.maxReconnectAttempts },
        "Max reconnection attempts reached"
      );
      state.isPlaying = false;
      return;
    }

    state.reconnectAttempts++;
    streamLogger.warn(
      { attempt: state.reconnectAttempts, maxAttempts: config.stream.maxReconnectAttempts },
      "Reconnecting..."
    );

    await Bun.sleep(config.stream.reconnectDelayMs);

    const streamUrl = (state as GuildAudioState & { currentStreamUrl?: string }).currentStreamUrl;
    if (state.isPlaying && streamUrl) {
      await this.startStreamInternal(state, streamUrl);
    }
  }

  stopStream(guildId: string): void {
    const state = this.guildStates.get(guildId);
    if (state) {
      state.isPlaying = false;
      if (state.ffmpegProcess) {
        state.ffmpegProcess.kill();
        state.ffmpegProcess = null;
      }
      state.player.stop();
    }
  }

  cleanup(guildId: string): void {
    const state = this.guildStates.get(guildId);
    if (state) {
      // Delete first to prevent re-entrant calls from the Destroyed event
      this.guildStates.delete(guildId);

      state.isPlaying = false;
      if (state.ffmpegProcess) {
        state.ffmpegProcess.kill();
      }
      state.connection.destroy();
      logger.info({ guildId }, "Cleaned up resources");
    }
  }

  cleanupAll(): void {
    for (const guildId of this.guildStates.keys()) {
      this.cleanup(guildId);
    }
  }

  handleVoiceStateUpdate(oldState: VoiceState, newState: VoiceState): void {
    const guildId = oldState.guild.id;
    const state = this.guildStates.get(guildId);

    if (!state) return;

    // Check if someone left the bot's channel
    if (oldState.channelId === state.channelId && oldState.channelId !== newState.channelId) {
      const channel = oldState.channel;
      if (!channel) return;

      // Count non-bot members in the channel
      const humanMembers = channel.members.filter((member) => !member.user.bot).size;

      if (humanMembers === 0) {
        voiceLogger.info(
          { guildId, channelId: state.channelId },
          "All users left voice channel, stopping bot"
        );
        this.cleanup(guildId);
      }
    }
  }

  private setupPlayerListeners(state: GuildAudioState, guildId: string): void {
    state.player.on(AudioPlayerStatus.Idle, async () => {
      if (state.isPlaying) {
        playerLogger.warn({ guildId }, "Stream ended unexpectedly, attempting reconnect");
        await this.handleStreamError(state);
      }
    });

    state.player.on("error", async (error) => {
      playerLogger.error({ guildId, error: error.message }, "Player error");
      if (state.isPlaying) {
        await this.handleStreamError(state);
      }
    });
  }

  private setupConnectionListeners(state: GuildAudioState, guildId: string): void {
    state.connection.on(VoiceConnectionStatus.Disconnected, async () => {
      try {
        await Promise.race([
          entersState(state.connection, VoiceConnectionStatus.Signalling, 5000),
          entersState(state.connection, VoiceConnectionStatus.Connecting, 5000),
        ]);
      } catch {
        this.cleanup(guildId);
      }
    });

    state.connection.on(VoiceConnectionStatus.Destroyed, () => {
      this.cleanup(guildId);
    });
  }
}
