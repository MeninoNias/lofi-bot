import { and, eq, isNull } from "drizzle-orm";
import type { Database } from "@/database/connection";
import {
  listeningSessions,
  type ListeningSession,
  type NewListeningSession,
} from "@/database/schema";
import type { ISessionRepository } from "./interfaces/ISessionRepository";

export class SessionRepository implements ISessionRepository {
  constructor(private readonly db: Database) {}

  async create(session: NewListeningSession): Promise<ListeningSession> {
    const result = await this.db.insert(listeningSessions).values(session).returning();
    return result[0]!;
  }

  async findActiveByGuildAndUser(
    guildId: string,
    userId: string
  ): Promise<ListeningSession | undefined> {
    const result = await this.db
      .select()
      .from(listeningSessions)
      .where(
        and(
          eq(listeningSessions.guildId, guildId),
          eq(listeningSessions.userId, userId),
          isNull(listeningSessions.finishedAt)
        )
      )
      .limit(1);
    return result[0];
  }

  async findActiveByGuild(guildId: string): Promise<ListeningSession[]> {
    return await this.db
      .select()
      .from(listeningSessions)
      .where(and(eq(listeningSessions.guildId, guildId), isNull(listeningSessions.finishedAt)));
  }

  async endSession(
    id: number,
    finishedAt: Date,
    durationMinutes: number
  ): Promise<ListeningSession | undefined> {
    const result = await this.db
      .update(listeningSessions)
      .set({ finishedAt, durationMinutes, updatedAt: new Date() })
      .where(eq(listeningSessions.id, id))
      .returning();
    return result[0];
  }

  async endOrphanedSessions(): Promise<number> {
    const now = new Date();
    const result = await this.db
      .update(listeningSessions)
      .set({ finishedAt: now, durationMinutes: 0, updatedAt: now })
      .where(isNull(listeningSessions.finishedAt))
      .returning();
    return result.length;
  }
}
