import type { VoiceBasedChannel, VoiceState } from "discord.js";
import type { GuildAudioState } from "@/models/types";
import type { ISessionService } from "./ISessionService";

export interface IAudioService {
  getState(guildId: string): GuildAudioState | undefined;
  hasState(guildId: string): boolean;
  getAllActiveStates(): Array<{ guildId: string; state: GuildAudioState }>;
  joinChannel(channel: VoiceBasedChannel): Promise<GuildAudioState>;
  startStream(guildId: string, streamUrl: string): Promise<void>;
  stopStream(guildId: string): void;
  cleanup(guildId: string): void;
  cleanupAll(): void;
  handleVoiceStateUpdate(oldState: VoiceState, newState: VoiceState): void;
  setSessionService(sessionService: ISessionService): void;
}
