import type { CommandContext, CommandResult } from "@/models/types";
import type { IStationService } from "@/services/interfaces/IStationService";
import { commandLogger } from "@/utils/logger";
import { MessageView } from "@/views/MessageView";
import type { ICommand } from "./interfaces/ICommand";

export class RemoveStationCommand implements ICommand {
  readonly name = "removestation";
  readonly description = "Remove a radio station";
  readonly usage = "!removestation <id>";
  readonly adminOnly = true;

  private readonly view = new MessageView();

  constructor(private readonly stationService: IStationService) {}

  async execute(context: CommandContext): Promise<CommandResult> {
    const { args } = context;

    if (args.length < 1) {
      return { success: false, message: this.view.invalidUsage(this.usage) };
    }

    const id = parseInt(args[0]!, 10);
    if (isNaN(id)) {
      return { success: false, message: this.view.invalidUsage(this.usage) };
    }

    const station = await this.stationService.getStationById(id);
    if (!station) {
      return { success: false, message: this.view.stationNotFoundById(id) };
    }

    try {
      await this.stationService.removeStation(id);
      return { success: true, message: this.view.stationRemoved(id) };
    } catch (error) {
      commandLogger.error(
        { command: "removestation", stationId: id, err: error },
        "Failed to remove station"
      );
      return { success: false, message: "Failed to remove station. Please try again." };
    }
  }
}
