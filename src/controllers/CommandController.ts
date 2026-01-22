import type { Message } from "discord.js";
import type { ICommand } from "@/commands/interfaces/ICommand";
import { isAdmin } from "@/utils/permissions";
import { MessageView } from "@/views/MessageView";

export class CommandController {
  private readonly commands = new Map<string, ICommand>();
  private readonly view = new MessageView();
  private readonly prefix = "!";

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
    const commandName = parts[0].toLowerCase();
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
    } catch (error) {
      console.error(`[CommandController] Error executing ${commandName}:`, error);
      await message.reply("An unexpected error occurred. Please try again.");
    }
  }
}
