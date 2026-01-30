import { boolean, integer, pgTable, serial, text, timestamp, varchar } from "drizzle-orm/pg-core";

export const stations = pgTable("stations", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull().unique(),
  url: text("url").notNull(),
  description: text("description"),
  isDefault: boolean("is_default").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type Station = typeof stations.$inferSelect;
export type NewStation = typeof stations.$inferInsert;

export const userProfiles = pgTable("user_profiles", {
  userId: varchar("user_id", { length: 255 }).primaryKey(),
  username: varchar("username", { length: 100 }),
  displayName: varchar("display_name", { length: 100 }),
  avatarUrl: text("avatar_url"),
  totalMinutesListened: integer("total_minutes_listened").default(0).notNull(),
  currentLevel: integer("current_level").default(1).notNull(),
  totalXp: integer("total_xp").default(0).notNull(),
  lastActive: timestamp("last_active"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type UserProfile = typeof userProfiles.$inferSelect;
export type NewUserProfile = typeof userProfiles.$inferInsert;

export const guilds = pgTable("guilds", {
  guildId: varchar("guild_id", { length: 255 }).primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  iconUrl: text("icon_url"),
  memberCount: integer("member_count"),
  ownerId: varchar("owner_id", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type Guild = typeof guilds.$inferSelect;
export type NewGuild = typeof guilds.$inferInsert;

export const guildUserStats = pgTable("guild_user_stats", {
  id: serial("id").primaryKey(),
  guildId: varchar("guild_id", { length: 255 }).notNull(),
  userId: varchar("user_id", { length: 255 }).notNull(),
  nickname: varchar("nickname", { length: 100 }),
  minutesListened: integer("minutes_listened").default(0).notNull(),
  xp: integer("xp").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type GuildUserStats = typeof guildUserStats.$inferSelect;
export type NewGuildUserStats = typeof guildUserStats.$inferInsert;
