import type { Guild, GuildUserStats, UserProfile } from "@/database/schema";

export interface LevelInfo {
  level: number;
  currentXp: number;
  xpForNextLevel: number;
  progress: number;
}

export interface DiscordUserData {
  userId: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
}

export interface DiscordGuildData {
  guildId: string;
  name: string;
  iconUrl: string | null;
  memberCount: number | null;
  ownerId: string | null;
}

export interface DiscordMemberData {
  nickname: string | null;
}

export interface IProfileService {
  getOrCreateProfile(userId: string, discordUser?: DiscordUserData): Promise<UserProfile>;
  getProfile(userId: string): Promise<UserProfile | undefined>;
  getGuild(guildId: string): Promise<Guild | undefined>;
  getGuildStats(guildId: string, userId: string): Promise<GuildUserStats | undefined>;
  addXpAndMinutes(
    userId: string,
    guildId: string,
    minutes: number,
    discordUser?: DiscordUserData,
    discordGuild?: DiscordGuildData,
    discordMember?: DiscordMemberData
  ): Promise<{ profile: UserProfile; leveledUp: boolean; newLevel: number }>;
  getTopGlobal(limit: number): Promise<UserProfile[]>;
  getTopByGuild(guildId: string, limit: number): Promise<GuildUserStats[]>;
  calculateLevel(totalXp: number): number;
  getLevelInfo(totalXp: number): LevelInfo;
  getXpForLevel(level: number): number;
}
