import type { ISessionRepository } from "@/repositories/interfaces/ISessionRepository";
import type { DiscordUserData, IProfileService } from "@/services/interfaces/IProfileService";
import type { ISessionService } from "./interfaces/ISessionService";
import { sessionLogger } from "@/utils/logger";

export class SessionService implements ISessionService {
  constructor(
    private readonly sessionRepository: ISessionRepository,
    private readonly profileService: IProfileService
  ) {}

  async startSession(
    guildId: string,
    userId: string,
    stationId: number,
    discordUser?: DiscordUserData
  ): Promise<void> {
    // Ensure user profile exists
    await this.profileService.getOrCreateProfile(userId, discordUser);

    // End any existing active session for this user in this guild
    const existing = await this.sessionRepository.findActiveByGuildAndUser(guildId, userId);
    if (existing) {
      sessionLogger.warn(
        { guildId, userId, sessionId: existing.id },
        "Found existing active session, ending it before starting new one"
      );
      await this.endSession(guildId, userId);
    }

    await this.sessionRepository.create({ guildId, userId, stationId });
    sessionLogger.info({ guildId, userId, stationId }, "Started listening session");
  }

  async endSession(guildId: string, userId: string): Promise<number> {
    const session = await this.sessionRepository.findActiveByGuildAndUser(guildId, userId);
    if (!session) {
      sessionLogger.debug({ guildId, userId }, "No active session found to end");
      return 0;
    }

    const now = new Date();
    const durationMinutes = Math.floor((now.getTime() - session.startedAt.getTime()) / 60000);

    await this.sessionRepository.endSession(session.id, now, durationMinutes);

    if (durationMinutes > 0) {
      try {
        await this.profileService.addXpAndMinutes(userId, guildId, durationMinutes);
      } catch (error) {
        sessionLogger.error(
          { userId, guildId, durationMinutes, err: error },
          "Failed to add XP for session"
        );
      }
    }

    sessionLogger.info(
      { guildId, userId, durationMinutes, sessionId: session.id },
      "Ended listening session"
    );
    return durationMinutes;
  }

  async endAllGuildSessions(guildId: string): Promise<void> {
    const activeSessions = await this.sessionRepository.findActiveByGuild(guildId);
    for (const session of activeSessions) {
      await this.endSession(guildId, session.userId);
    }
    if (activeSessions.length > 0) {
      sessionLogger.info(
        { guildId, count: activeSessions.length },
        "Ended all guild listening sessions"
      );
    }
  }

  async cleanupOrphanedSessions(): Promise<void> {
    const count = await this.sessionRepository.endOrphanedSessions();
    if (count > 0) {
      sessionLogger.info({ count }, "Cleaned up orphaned listening sessions");
    }
  }
}
