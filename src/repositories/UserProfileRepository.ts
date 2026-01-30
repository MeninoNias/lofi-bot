import { desc, eq, sql } from "drizzle-orm";
import type { Database } from "@/database/connection";
import { userProfiles, type NewUserProfile, type UserProfile } from "@/database/schema";
import type { DiscordUserInfo, IUserProfileRepository } from "./interfaces/IUserProfileRepository";

export class UserProfileRepository implements IUserProfileRepository {
  constructor(private readonly db: Database) {}

  async findByUserId(userId: string): Promise<UserProfile | undefined> {
    const result = await this.db
      .select()
      .from(userProfiles)
      .where(eq(userProfiles.userId, userId))
      .limit(1);
    return result[0];
  }

  async findTopGlobal(limit: number): Promise<UserProfile[]> {
    return await this.db
      .select()
      .from(userProfiles)
      .orderBy(desc(userProfiles.totalXp))
      .limit(limit);
  }

  async create(profile: NewUserProfile): Promise<UserProfile> {
    const result = await this.db.insert(userProfiles).values(profile).returning();
    return result[0]!;
  }

  async update(userId: string, profile: Partial<NewUserProfile>): Promise<UserProfile | undefined> {
    const result = await this.db
      .update(userProfiles)
      .set({ ...profile, updatedAt: new Date() })
      .where(eq(userProfiles.userId, userId))
      .returning();
    return result[0];
  }

  async upsert(profile: NewUserProfile): Promise<UserProfile> {
    const result = await this.db
      .insert(userProfiles)
      .values(profile)
      .onConflictDoUpdate({
        target: userProfiles.userId,
        set: {
          totalMinutesListened: profile.totalMinutesListened,
          currentLevel: profile.currentLevel,
          totalXp: profile.totalXp,
          lastActive: profile.lastActive,
          updatedAt: new Date(),
        },
      })
      .returning();
    return result[0]!;
  }

  async addXpAndMinutes(
    userId: string,
    xp: number,
    minutes: number
  ): Promise<UserProfile | undefined> {
    const result = await this.db
      .update(userProfiles)
      .set({
        totalXp: sql`${userProfiles.totalXp} + ${xp}`,
        totalMinutesListened: sql`${userProfiles.totalMinutesListened} + ${minutes}`,
        lastActive: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(userProfiles.userId, userId))
      .returning();
    return result[0];
  }

  async updateDiscordInfo(userId: string, info: DiscordUserInfo): Promise<UserProfile | undefined> {
    const result = await this.db
      .update(userProfiles)
      .set({
        username: info.username,
        displayName: info.displayName,
        avatarUrl: info.avatarUrl,
        updatedAt: new Date(),
      })
      .where(eq(userProfiles.userId, userId))
      .returning();
    return result[0];
  }
}
