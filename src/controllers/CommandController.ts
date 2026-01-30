import type { Message } from "discord.js";
import type { ICommand } from "@/commands/interfaces/ICommand";
import type { IProfileService } from "@/services/interfaces/IProfileService";
import { isAdmin } from "@/utils/permissions";
import { commandLogger, profileLogger } from "@/utils/logger";
import { MessageView } from "@/views/MessageView";

export class CommandController {
  private readonly commands = new Map<string, ICommand>();
  private readonly view = new MessageView();
  private readonly prefix = "!";

  constructor(private readonly profileService?: IProfileService) {}

  registerCommand(command: ICommand): void {
    this.commands.set(command.name.toLowerCase(), command);
  }

  registerCommands(commands: ICommand[]): void {
    for (const command of commands) {
      this.registerCommand(command);
    }
  }

  async handleMessage(message: Message): Promise<void> {
    if (message.author.bot || !message.guild) return;

    const content = message.content.trim();
    if (!content.startsWith(this.prefix)) return;

    const parts = content.slice(this.prefix.length).split(/\s+/);
    const commandName = parts[0]?.toLowerCase();
    if (!commandName) return;
    const args = parts.slice(1);

    const command = this.commands.get(commandName);
    if (!command) return;

    // Check admin permissions
    if (command.adminOnly && !isAdmin(message.member)) {
      await message.reply(this.view.permissionDenied());
      return;
    }

    try {
      const result = await command.execute({ message, args });
      await message.reply(result.message);

      // Add XP for successful command execution
      if (this.profileService && result.success) {
        await this.addXpForInteraction(message.author.id, message.guild.id);
      }
    } catch (error) {
      commandLogger.error({ command: commandName, err: error }, "Error executing command");
      await message.reply("An unexpected error occurred. Please try again.");
    }
  }

  private async addXpForInteraction(userId: string, guildId: string): Promise<void> {
    if (!this.profileService) return;

    try {
      const { profile, leveledUp, newLevel } = await this.profileService.addXpAndMinutes(
        userId,
        guildId,
        1 // 1 minute of XP per interaction
      );

      profileLogger.debug(
        { userId, guildId, totalXp: profile.totalXp, level: profile.currentLevel },
        "Added XP for interaction"
      );

      if (leveledUp) {
        profileLogger.info({ userId, newLevel }, "User leveled up!");
      }
    } catch (error) {
      profileLogger.error({ userId, guildId, err: error }, "Failed to add XP");
    }
  }
}
