import type { CommandContext, CommandResult } from "@/models/types";

export interface ICommand {
  readonly name: string;
  readonly description: string;
  readonly usage: string;
  readonly adminOnly: boolean;

  execute(context: CommandContext): Promise<CommandResult>;
}
