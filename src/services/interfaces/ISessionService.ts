import type { DiscordUserData } from "@/services/interfaces/IProfileService";

export interface ISessionService {
  startSession(
    guildId: string,
    userId: string,
    stationId: number,
    discordUser?: DiscordUserData
  ): Promise<void>;
  endSession(guildId: string, userId: string): Promise<number>;
  endAllGuildSessions(guildId: string): Promise<void>;
  cleanupOrphanedSessions(): Promise<void>;
}
