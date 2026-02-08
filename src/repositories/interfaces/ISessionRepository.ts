import type { ListeningSession, NewListeningSession } from "@/database/schema";

export interface ISessionRepository {
  create(session: NewListeningSession): Promise<ListeningSession>;
  findActiveByGuildAndUser(guildId: string, userId: string): Promise<ListeningSession | undefined>;
  findActiveByGuild(guildId: string): Promise<ListeningSession[]>;
  endSession(
    id: number,
    finishedAt: Date,
    durationMinutes: number
  ): Promise<ListeningSession | undefined>;
  endOrphanedSessions(): Promise<number>;
}
