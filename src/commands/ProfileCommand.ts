import type { CommandContext, CommandResult } from "@/models/types";
import type { IProfileService } from "@/services/interfaces/IProfileService";
import type { ICommand } from "./interfaces/ICommand";

export class ProfileCommand implements ICommand {
  readonly name = "profile";
  readonly description = "View your lofi profile";
  readonly usage = "!profile";
  readonly adminOnly = false;

  constructor(private readonly profileService: IProfileService) {}

  async execute(context: CommandContext): Promise<CommandResult> {
    const { message } = context;
    const userId = message.author.id;
    const guildId = message.guild?.id;

    const profile = await this.profileService.getProfile(userId);

    if (!profile) {
      return {
        success: true,
        message:
          "You haven't started your lofi journey yet! Use `!play` to start listening and earn XP.",
      };
    }

    const levelInfo = this.profileService.getLevelInfo(profile.totalXp);
    const progressBar = this.createProgressBar(levelInfo.progress);
    const title = this.getLevelTitle(profile.currentLevel);

    // Get guild stats if in a guild
    let guildRankText = "";
    if (guildId) {
      const guildStats = await this.profileService.getGuildStats(guildId, userId);
      if (guildStats) {
        const topInGuild = await this.profileService.getTopByGuild(guildId, 100);
        const guildRank = topInGuild.findIndex((s) => s.userId === userId) + 1;
        if (guildRank > 0) {
          guildRankText = `\n🏆 Server Rank: #${guildRank}`;
        }
      }
    }

    // Get global rank
    const topGlobal = await this.profileService.getTopGlobal(100);
    const globalRank = topGlobal.findIndex((p) => p.userId === userId) + 1;
    const globalRankText = globalRank > 0 ? `\n🌍 Global Rank: #${globalRank}` : "";

    const displayName = profile.displayName || profile.username || message.author.displayName;
    const totalTime = this.formatTime(profile.totalMinutesListened);

    const lines = [
      `🎧 **Lofi Profile: ${displayName}**`,
      "",
      `${title}`,
      `📊 Level ${profile.currentLevel} ${progressBar} (${levelInfo.currentXp} / ${levelInfo.xpForNextLevel} XP)`,
      `⏱️ Total Time: ${totalTime}`,
      `✨ Total XP: ${profile.totalXp.toLocaleString()}`,
      guildRankText,
      globalRankText,
      "",
      "Keep listening to level up! 🎵",
    ];

    return { success: true, message: lines.filter((l) => l !== "").join("\n") };
  }

  private createProgressBar(progress: number): string {
    const filled = Math.round(progress * 10);
    const empty = 10 - filled;
    return "█".repeat(filled) + "░".repeat(empty);
  }

  private formatTime(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  }

  private getLevelTitle(level: number): string {
    if (level >= 50) return "👑 **Lofi Legend**";
    if (level >= 25) return "🎹 **Lofi Addict**";
    if (level >= 10) return "🎼 **Dedicated Listener**";
    if (level >= 5) return "🎵 **Regular**";
    return "🎧 **Newcomer**";
  }
}
