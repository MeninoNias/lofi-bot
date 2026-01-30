import { eq } from "drizzle-orm";
import type { Database } from "@/database/connection";
import { guilds, type Guild, type NewGuild } from "@/database/schema";
import type { IGuildRepository } from "./interfaces/IGuildRepository";

export class GuildRepository implements IGuildRepository {
  constructor(private readonly db: Database) {}

  async findByGuildId(guildId: string): Promise<Guild | undefined> {
    const result = await this.db.select().from(guilds).where(eq(guilds.guildId, guildId)).limit(1);
    return result[0];
  }

  async findAll(): Promise<Guild[]> {
    return await this.db.select().from(guilds).orderBy(guilds.name);
  }

  async create(guild: NewGuild): Promise<Guild> {
    const result = await this.db.insert(guilds).values(guild).returning();
    return result[0]!;
  }

  async update(guildId: string, guild: Partial<NewGuild>): Promise<Guild | undefined> {
    const result = await this.db
      .update(guilds)
      .set({ ...guild, updatedAt: new Date() })
      .where(eq(guilds.guildId, guildId))
      .returning();
    return result[0];
  }

  async upsert(guild: NewGuild): Promise<Guild> {
    const result = await this.db
      .insert(guilds)
      .values(guild)
      .onConflictDoUpdate({
        target: guilds.guildId,
        set: {
          name: guild.name,
          iconUrl: guild.iconUrl,
          memberCount: guild.memberCount,
          ownerId: guild.ownerId,
          updatedAt: new Date(),
        },
      })
      .returning();
    return result[0]!;
  }
}
