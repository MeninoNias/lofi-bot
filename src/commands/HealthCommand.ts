import type { CommandContext, CommandResult } from "@/models/types";
import type { IHealthService } from "@/services/interfaces/IHealthService";
import { MessageView } from "@/views/MessageView";
import type { ICommand } from "./interfaces/ICommand";

export class HealthCommand implements ICommand {
  readonly name = "health";
  readonly description = "Check bot health status";
  readonly usage = "!health";
  readonly adminOnly = false;

  private readonly view = new MessageView();

  constructor(private readonly healthService: IHealthService) {}

  async execute(_context: CommandContext): Promise<CommandResult> {
    const status = await this.healthService.getStatus();
    return { success: true, message: this.view.healthStatus(status) };
  }
}
