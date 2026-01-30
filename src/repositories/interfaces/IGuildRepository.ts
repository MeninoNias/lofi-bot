import type { Guild, NewGuild } from "@/database/schema";

export interface IGuildRepository {
  findByGuildId(guildId: string): Promise<Guild | undefined>;
  findAll(): Promise<Guild[]>;
  create(guild: NewGuild): Promise<Guild>;
  update(guildId: string, guild: Partial<NewGuild>): Promise<Guild | undefined>;
  upsert(guild: NewGuild): Promise<Guild>;
}
