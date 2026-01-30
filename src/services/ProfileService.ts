import type { Guild, GuildUserStats, UserProfile } from "@/database/schema";
import type { IUserProfileRepository } from "@/repositories/interfaces/IUserProfileRepository";
import type { IGuildUserStatsRepository } from "@/repositories/interfaces/IGuildUserStatsRepository";
import type { IGuildRepository } from "@/repositories/interfaces/IGuildRepository";
import type {
  DiscordGuildData,
  DiscordMemberData,
  DiscordUserData,
  IProfileService,
  LevelInfo,
} from "./interfaces/IProfileService";

const XP_PER_MINUTE = 10;

export class ProfileService implements IProfileService {
  constructor(
    private readonly userProfileRepository: IUserProfileRepository,
    private readonly guildUserStatsRepository: IGuildUserStatsRepository,
    private readonly guildRepository: IGuildRepository
  ) {}

  async getOrCreateProfile(userId: string, discordUser?: DiscordUserData): Promise<UserProfile> {
    const existing = await this.userProfileRepository.findByUserId(userId);
    if (existing) {
      // Update Discord info if provided
      if (discordUser) {
        await this.userProfileRepository.updateDiscordInfo(userId, {
          username: discordUser.username,
          displayName: discordUser.displayName,
          avatarUrl: discordUser.avatarUrl,
        });
      }
      return existing;
    }

    return await this.userProfileRepository.create({
      userId,
      username: discordUser?.username,
      displayName: discordUser?.displayName,
      avatarUrl: discordUser?.avatarUrl,
      totalMinutesListened: 0,
      currentLevel: 1,
      totalXp: 0,
      lastActive: new Date(),
    });
  }

  async getProfile(userId: string): Promise<UserProfile | undefined> {
    return await this.userProfileRepository.findByUserId(userId);
  }

  async getGuild(guildId: string): Promise<Guild | undefined> {
    return await this.guildRepository.findByGuildId(guildId);
  }

  async getGuildStats(guildId: string, userId: string): Promise<GuildUserStats | undefined> {
    return await this.guildUserStatsRepository.findByGuildAndUser(guildId, userId);
  }

  async addXpAndMinutes(
    userId: string,
    guildId: string,
    minutes: number,
    discordUser?: DiscordUserData,
    discordGuild?: DiscordGuildData,
    discordMember?: DiscordMemberData
  ): Promise<{ profile: UserProfile; leveledUp: boolean; newLevel: number }> {
    const xpGained = minutes * XP_PER_MINUTE;

    // Ensure profile exists and update Discord info
    let profile = await this.getOrCreateProfile(userId, discordUser);
    const previousLevel = profile.currentLevel;

    // Update global profile XP
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

    // Upsert guild info if provided
    if (discordGuild) {
      await this.guildRepository.upsert({
        guildId: discordGuild.guildId,
        name: discordGuild.name,
        iconUrl: discordGuild.iconUrl,
        memberCount: discordGuild.memberCount,
        ownerId: discordGuild.ownerId,
      });
    }

    // Update guild user stats
    const existingGuildStats = await this.guildUserStatsRepository.findByGuildAndUser(
      guildId,
      userId
    );
    if (existingGuildStats) {
      await this.guildUserStatsRepository.addXpAndMinutes(guildId, userId, xpGained, minutes);
      // Update nickname if provided
      if (discordMember?.nickname) {
        await this.guildUserStatsRepository.update(existingGuildStats.id, {
          nickname: discordMember.nickname,
        });
      }
    } else {
      await this.guildUserStatsRepository.create({
        guildId,
        userId,
        nickname: discordMember?.nickname,
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
