import type { Client } from "discord.js";
import type { CommandContext, CommandResult } from "@/models/types";
import type { IProfileService } from "@/services/interfaces/IProfileService";
import { MessageView } from "@/views/MessageView";
import type { ICommand } from "./interfaces/ICommand";

export class RankCommand implements ICommand {
  readonly name = "rank";
  readonly description = "View server leaderboard";
  readonly usage = "!rank";
  readonly adminOnly = false;

  private readonly view = new MessageView();

  constructor(
    private readonly profileService: IProfileService,
    private readonly client: Client
  ) {}

  async execute(context: CommandContext): Promise<CommandResult> {
    const { message } = context;
    const guildId = message.guild?.id;
    const guildName = message.guild?.name || "Server";

    if (!guildId) {
      return { success: false, message: "This command can only be used in a server." };
    }

    const topStats = await this.profileService.getTopByGuild(guildId, 10);

    if (topStats.length === 0) {
      return {
        success: true,
        message: "No one has earned XP in this server yet! Use `!play` to start listening.",
      };
    }

    const lines = [`🏆 **Lofi Leaderboard - ${guildName}**`, ""];

    for (let i = 0; i < topStats.length; i++) {
      const stats = topStats[i];
      const medal = this.view.getMedalEmoji(i);
      const profile = await this.profileService.getProfile(stats.userId);
      const level = profile?.currentLevel || 1;
      const timeStr = this.view.formatTime(stats.minutesListened);

      // Try to get username
      let username = stats.nickname || profile?.displayName || profile?.username;
      if (!username) {
        try {
          const user = await this.client.users.fetch(stats.userId);
          username = user.displayName;
        } catch {
          username = `User ${stats.userId.slice(-4)}`;
        }
      }

      lines.push(`${medal} **${username}** - Level ${level} (${timeStr})`);
    }

    // Find current user's rank
    const userId = message.author.id;
    const allStats = await this.profileService.getTopByGuild(guildId, 100);
    const userRank = allStats.findIndex((s) => s.userId === userId) + 1;

    if (userRank > 10) {
      lines.push("");
      lines.push(`Your rank: #${userRank}`);
    }

    return { success: true, message: lines.join("\n") };
  }
}
