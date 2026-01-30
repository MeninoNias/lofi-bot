import type { Message } from "discord.js";
import type { ICommand } from "@/commands/interfaces/ICommand";
import type {
  DiscordGuildData,
  DiscordMemberData,
  DiscordUserData,
  IProfileService,
} from "@/services/interfaces/IProfileService";
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
        await this.addXpForInteraction(message);
      }
    } catch (error) {
      commandLogger.error({ command: commandName, err: error }, "Error executing command");
      await message.reply("An unexpected error occurred. Please try again.");
    }
  }

  private async addXpForInteraction(message: Message): Promise<void> {
    if (!this.profileService || !message.guild) return;

    const userId = message.author.id;
    const guildId = message.guild.id;

    // Extract Discord user info
    const discordUser: DiscordUserData = {
      userId: message.author.id,
      username: message.author.username,
      displayName: message.author.displayName,
      avatarUrl: message.author.avatarURL(),
    };

    // Extract Discord guild info
    const discordGuild: DiscordGuildData = {
      guildId: message.guild.id,
      name: message.guild.name,
      iconUrl: message.guild.iconURL(),
      memberCount: message.guild.memberCount,
      ownerId: message.guild.ownerId,
    };

    // Extract Discord member info
    const discordMember: DiscordMemberData = {
      nickname: message.member?.nickname ?? null,
    };

    try {
      const { profile, leveledUp, newLevel } = await this.profileService.addXpAndMinutes(
        userId,
        guildId,
        1, // 1 minute of XP per interaction
        discordUser,
        discordGuild,
        discordMember
      );

      profileLogger.debug(
        { userId, guildId, totalXp: profile.totalXp, level: profile.currentLevel },
        "Added XP for interaction"
      );

      if (leveledUp) {
        profileLogger.info({ userId, newLevel }, "User leveled up!");
        await this.sendLevelUpNotification(message, newLevel);
      }
    } catch (error) {
      profileLogger.error({ userId, guildId, err: error }, "Failed to add XP");
    }
  }

  private async sendLevelUpNotification(message: Message, newLevel: number): Promise<void> {
    const notification = this.view.levelUpNotification(message.author.toString(), newLevel);

    try {
      await message.channel.send(notification);
    } catch (error) {
      profileLogger.error({ err: error }, "Failed to send level up notification");
    }
  }
}
