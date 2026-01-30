import type { Client } from "discord.js";
import type { CommandContext, CommandResult } from "@/models/types";
import type { IProfileService } from "@/services/interfaces/IProfileService";
import { MessageView } from "@/views/MessageView";
import type { ICommand } from "./interfaces/ICommand";

export class GlobalRankCommand implements ICommand {
  readonly name = "globalrank";
  readonly description = "View global leaderboard";
  readonly usage = "!globalrank";
  readonly adminOnly = false;

  private readonly view = new MessageView();

  constructor(
    private readonly profileService: IProfileService,
    private readonly client: Client
  ) {}

  async execute(context: CommandContext): Promise<CommandResult> {
    const { message } = context;

    const topProfiles = await this.profileService.getTopGlobal(10);

    if (topProfiles.length === 0) {
      return {
        success: true,
        message: "No one has earned XP yet! Use `!play` to start listening.",
      };
    }

    const lines = ["🌍 **Global Lofi Leaderboard**", ""];

    for (let i = 0; i < topProfiles.length; i++) {
      const profile = topProfiles[i];
      const medal = this.view.getMedalEmoji(i);
      const timeStr = this.view.formatTime(profile.totalMinutesListened);
      const titleEmoji = this.view.getLevelEmoji(profile.currentLevel);

      // Try to get username
      let username = profile.displayName || profile.username;
      if (!username) {
        try {
          const user = await this.client.users.fetch(profile.userId);
          username = user.displayName;
        } catch {
          username = `User ${profile.userId.slice(-4)}`;
        }
      }

      lines.push(
        `${medal} **${username}** ${titleEmoji} - Level ${profile.currentLevel} (${timeStr})`
      );
    }

    // Find current user's rank
    const userId = message.author.id;
    const allProfiles = await this.profileService.getTopGlobal(100);
    const userRank = allProfiles.findIndex((p) => p.userId === userId) + 1;

    if (userRank > 0 && userRank <= 100) {
      lines.push("");
      if (userRank > 10) {
        lines.push(`Your global rank: #${userRank}`);
      } else {
        lines.push(`You're in the top 10! 🎉`);
      }
    }

    return { success: true, message: lines.join("\n") };
  }
}
