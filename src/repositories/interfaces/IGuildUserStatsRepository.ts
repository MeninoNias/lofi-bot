import type { GuildUserStats, NewGuildUserStats } from "@/database/schema";

export interface IGuildUserStatsRepository {
  findByGuildAndUser(guildId: string, userId: string): Promise<GuildUserStats | undefined>;
  findTopByGuild(guildId: string, limit: number): Promise<GuildUserStats[]>;
  create(stats: NewGuildUserStats): Promise<GuildUserStats>;
  update(id: number, stats: Partial<NewGuildUserStats>): Promise<GuildUserStats | undefined>;
  upsert(stats: NewGuildUserStats): Promise<GuildUserStats>;
  addXpAndMinutes(
    guildId: string,
    userId: string,
    xp: number,
    minutes: number
  ): Promise<GuildUserStats | undefined>;
}
