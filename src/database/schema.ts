import { boolean, pgTable, serial, text, timestamp, varchar } from "drizzle-orm/pg-core";

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
