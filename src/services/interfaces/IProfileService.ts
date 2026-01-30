import type { GuildUserStats, UserProfile } from "@/database/schema";

export interface LevelInfo {
  level: number;
  currentXp: number;
  xpForNextLevel: number;
  progress: number;
}

export interface IProfileService {
  getOrCreateProfile(userId: string): Promise<UserProfile>;
  getProfile(userId: string): Promise<UserProfile | undefined>;
  getGuildStats(guildId: string, userId: string): Promise<GuildUserStats | undefined>;
  addXpAndMinutes(
    userId: string,
    guildId: string,
    minutes: number
  ): Promise<{ profile: UserProfile; leveledUp: boolean; newLevel: number }>;
  getTopGlobal(limit: number): Promise<UserProfile[]>;
  getTopByGuild(guildId: string, limit: number): Promise<GuildUserStats[]>;
  calculateLevel(totalXp: number): number;
  getLevelInfo(totalXp: number): LevelInfo;
  getXpForLevel(level: number): number;
}
