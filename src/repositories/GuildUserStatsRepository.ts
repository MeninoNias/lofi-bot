import { and, desc, eq, sql } from "drizzle-orm";
import type { Database } from "@/database/connection";
import { guildUserStats, type GuildUserStats, type NewGuildUserStats } from "@/database/schema";
import type { IGuildUserStatsRepository } from "./interfaces/IGuildUserStatsRepository";

export class GuildUserStatsRepository implements IGuildUserStatsRepository {
  constructor(private readonly db: Database) {}

  async findByGuildAndUser(guildId: string, userId: string): Promise<GuildUserStats | undefined> {
    const result = await this.db
      .select()
      .from(guildUserStats)
      .where(and(eq(guildUserStats.guildId, guildId), eq(guildUserStats.userId, userId)))
      .limit(1);
    return result[0];
  }

  async findTopByGuild(guildId: string, limit: number): Promise<GuildUserStats[]> {
    return await this.db
      .select()
      .from(guildUserStats)
      .where(eq(guildUserStats.guildId, guildId))
      .orderBy(desc(guildUserStats.xp))
      .limit(limit);
  }

  async create(stats: NewGuildUserStats): Promise<GuildUserStats> {
    const result = await this.db.insert(guildUserStats).values(stats).returning();
    return result[0]!;
  }

  async update(id: number, stats: Partial<NewGuildUserStats>): Promise<GuildUserStats | undefined> {
    const result = await this.db
      .update(guildUserStats)
      .set({ ...stats, updatedAt: new Date() })
      .where(eq(guildUserStats.id, id))
      .returning();
    return result[0];
  }

  async upsert(stats: NewGuildUserStats): Promise<GuildUserStats> {
    const existing = await this.findByGuildAndUser(stats.guildId, stats.userId);

    if (existing) {
      const updated = await this.update(existing.id, stats);
      return updated!;
    }

    return await this.create(stats);
  }

  async addXpAndMinutes(
    guildId: string,
    userId: string,
    xp: number,
    minutes: number
  ): Promise<GuildUserStats | undefined> {
    const result = await this.db
      .update(guildUserStats)
      .set({
        xp: sql`${guildUserStats.xp} + ${xp}`,
        minutesListened: sql`${guildUserStats.minutesListened} + ${minutes}`,
        updatedAt: new Date(),
      })
      .where(and(eq(guildUserStats.guildId, guildId), eq(guildUserStats.userId, userId)))
      .returning();
    return result[0];
  }
}
