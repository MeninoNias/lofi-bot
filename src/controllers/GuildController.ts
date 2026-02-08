import type { Client, VoiceChannel } from "discord.js";
import { ChannelType } from "discord.js";
import type { IAudioService } from "@/services/interfaces/IAudioService";
import type { IStationService } from "@/services/interfaces/IStationService";

interface GuildAudioResponse {
  isPlaying: boolean;
  currentStation: { id: number; name: string } | null;
  channelId: string | null;
  channelName: string | null;
  listenerCount: number;
  connectedSince: string | null;
}

interface VoiceChannelInfo {
  id: string;
  name: string;
}

interface GuildStatusResponse {
  guildId: string;
  name: string;
  iconUrl: string | null;
  memberCount: number;
  audio: GuildAudioResponse;
  voiceChannels: VoiceChannelInfo[];
}

export class GuildController {
  constructor(
    private readonly audioService: IAudioService,
    private readonly stationService: IStationService,
    private readonly client: Client,
  ) {}

  async getGuilds() {
    const guilds: GuildStatusResponse[] = [];

    for (const [guildId, guild] of this.client.guilds.cache) {
      guilds.push(await this.buildGuildStatus(guildId, guild));
    }

    return { data: guilds, status: 200 };
  }

  async getGuildStatus(guildId: string) {
    const guild = this.client.guilds.cache.get(guildId);
    if (!guild) {
      return { data: { error: "Guild not found" }, status: 404 };
    }

    return { data: await this.buildGuildStatus(guildId, guild), status: 200 };
  }

  async playInGuild(guildId: string, stationId?: number, channelId?: string) {
    if (!stationId || !channelId) {
      return { data: { error: "stationId and channelId are required" }, status: 400 };
    }

    const guild = this.client.guilds.cache.get(guildId);
    if (!guild) {
      return { data: { error: "Guild not found" }, status: 404 };
    }

    const channel = guild.channels.cache.get(channelId);
    if (!channel || channel.type !== ChannelType.GuildVoice) {
      return { data: { error: "Voice channel not found" }, status: 404 };
    }

    const station = await this.stationService.getStationById(stationId);
    if (!station) {
      return { data: { error: "Station not found" }, status: 404 };
    }

    // Cleanup existing connection if any
    if (this.audioService.hasState(guildId)) {
      this.audioService.cleanup(guildId);
    }

    const state = await this.audioService.joinChannel(channel as VoiceChannel);
    state.currentStationId = stationId;
    await this.audioService.startStream(guildId, station.url);

    return { data: await this.buildGuildStatus(guildId, guild), status: 200 };
  }

  async stopInGuild(guildId: string) {
    if (!this.audioService.hasState(guildId)) {
      return { data: { error: "No active connection in this guild" }, status: 404 };
    }

    this.audioService.cleanup(guildId);
    return { data: { success: true }, status: 200 };
  }

  async stopAll() {
    this.audioService.cleanupAll();
    return { data: { success: true }, status: 200 };
  }

  private async buildGuildStatus(
    guildId: string,
    guild: { name: string; iconURL: (opts?: object) => string | null; memberCount: number; channels: { cache: Map<string, { id: string; name: string; type: ChannelType; members?: Map<string, unknown> }> } },
  ): Promise<GuildStatusResponse> {
    const state = this.audioService.getState(guildId);

    let currentStation: { id: number; name: string } | null = null;
    if (state?.currentStationId) {
      const station = await this.stationService.getStationById(state.currentStationId);
      if (station) {
        currentStation = { id: station.id, name: station.name };
      }
    }

    let channelName: string | null = null;
    let listenerCount = 0;
    if (state?.channelId) {
      const channel = guild.channels.cache.get(state.channelId);
      if (channel) {
        channelName = channel.name;
        if (channel.members && channel.members instanceof Map) {
          listenerCount = Math.max(0, channel.members.size - 1); // exclude bot
        }
      }
    }

    const voiceChannels: VoiceChannelInfo[] = [];
    for (const [, channel] of guild.channels.cache) {
      if (channel.type === ChannelType.GuildVoice) {
        voiceChannels.push({ id: channel.id, name: channel.name });
      }
    }

    return {
      guildId,
      name: guild.name,
      iconUrl: guild.iconURL({ size: 128 }),
      memberCount: guild.memberCount,
      audio: {
        isPlaying: state?.isPlaying ?? false,
        currentStation,
        channelId: state?.channelId ?? null,
        channelName,
        listenerCount,
        connectedSince: state?.connectedSince?.toISOString() ?? null,
      },
      voiceChannels,
    };
  }
}
