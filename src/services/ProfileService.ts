import type { GuildUserStats, UserProfile } from "@/database/schema";
import type { IUserProfileRepository } from "@/repositories/interfaces/IUserProfileRepository";
import type { IGuildUserStatsRepository } from "@/repositories/interfaces/IGuildUserStatsRepository";
import type { IProfileService, LevelInfo } from "./interfaces/IProfileService";

const XP_PER_MINUTE = 10;

export class ProfileService implements IProfileService {
  constructor(
    private readonly userProfileRepository: IUserProfileRepository,
    private readonly guildUserStatsRepository: IGuildUserStatsRepository
  ) {}

  async getOrCreateProfile(userId: string): Promise<UserProfile> {
    const existing = await this.userProfileRepository.findByUserId(userId);
    if (existing) {
      return existing;
    }

    return await this.userProfileRepository.create({
      userId,
      totalMinutesListened: 0,
      currentLevel: 1,
      totalXp: 0,
      lastActive: new Date(),
    });
  }

  async getProfile(userId: string): Promise<UserProfile | undefined> {
    return await this.userProfileRepository.findByUserId(userId);
  }

  async getGuildStats(guildId: string, userId: string): Promise<GuildUserStats | undefined> {
    return await this.guildUserStatsRepository.findByGuildAndUser(guildId, userId);
  }

  async addXpAndMinutes(
    userId: string,
    guildId: string,
    minutes: number
  ): Promise<{ profile: UserProfile; leveledUp: boolean; newLevel: number }> {
    const xpGained = minutes * XP_PER_MINUTE;

    // Ensure profile exists
    let profile = await this.getOrCreateProfile(userId);
    const previousLevel = profile.currentLevel;

    // Update global profile
    const updatedProfile = await this.userProfileRepository.addXpAndMinutes(
      userId,
      xpGained,
      minutes
    );
    if (updatedProfile) {
      profile = updatedProfile;
    }

    // Calculate new level
    const newLevel = this.calculateLevel(profile.totalXp);
    const leveledUp = newLevel > previousLevel;

    // Update level if changed
    if (leveledUp) {
      await this.userProfileRepository.update(userId, { currentLevel: newLevel });
      profile = { ...profile, currentLevel: newLevel };
    }

    // Update guild stats
    const existingGuildStats = await this.guildUserStatsRepository.findByGuildAndUser(
      guildId,
      userId
    );
    if (existingGuildStats) {
      await this.guildUserStatsRepository.addXpAndMinutes(guildId, userId, xpGained, minutes);
    } else {
      await this.guildUserStatsRepository.create({
        guildId,
        userId,
        minutesListened: minutes,
        xp: xpGained,
      });
    }

    return { profile, leveledUp, newLevel };
  }

  async getTopGlobal(limit: number): Promise<UserProfile[]> {
    return await this.userProfileRepository.findTopGlobal(limit);
  }

  async getTopByGuild(guildId: string, limit: number): Promise<GuildUserStats[]> {
    return await this.guildUserStatsRepository.findTopByGuild(guildId, limit);
  }

  getXpForLevel(level: number): number {
    // Exponential curve: 100 * 1.5^(level-1)
    return Math.floor(100 * Math.pow(1.5, level - 1));
  }

  getTotalXpForLevel(level: number): number {
    // Sum of XP required for all levels up to this level
    let total = 0;
    for (let i = 1; i < level; i++) {
      total += this.getXpForLevel(i);
    }
    return total;
  }

  calculateLevel(totalXp: number): number {
    let level = 1;
    let xpRequired = 0;

    while (true) {
      xpRequired += this.getXpForLevel(level);
      if (totalXp < xpRequired) {
        return level;
      }
      level++;
      if (level > 100) break; // Cap at level 100
    }

    return level;
  }

  getLevelInfo(totalXp: number): LevelInfo {
    const level = this.calculateLevel(totalXp);
    const xpForCurrentLevel = this.getTotalXpForLevel(level);
    const xpForNextLevel = this.getXpForLevel(level);
    const currentXp = totalXp - xpForCurrentLevel;
    const progress = Math.min(1, currentXp / xpForNextLevel);

    return {
      level,
      currentXp,
      xpForNextLevel,
      progress,
    };
  }
}
