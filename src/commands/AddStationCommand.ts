import type { CommandContext, CommandResult } from "@/models/types";
import type { IStationService } from "@/services/interfaces/IStationService";
import { commandLogger } from "@/utils/logger";
import { MessageView } from "@/views/MessageView";
import type { ICommand } from "./interfaces/ICommand";

export class AddStationCommand implements ICommand {
  readonly name = "addstation";
  readonly description = "Add a new radio station";
  readonly usage = "!addstation <name> <url> [description]";
  readonly adminOnly = true;

  private readonly view = new MessageView();

  constructor(private readonly stationService: IStationService) {}

  async execute(context: CommandContext): Promise<CommandResult> {
    const { args } = context;

    if (args.length < 2) {
      return { success: false, message: this.view.invalidUsage(this.usage) };
    }

    const name = args[0]!;
    const url = args[1]!;
    const description = args.slice(2).join(" ") || undefined;

    // Check if station with same name already exists
    const existing = await this.stationService.getStationByName(name);
    if (existing) {
      return { success: false, message: this.view.stationAlreadyExists(name) };
    }

    try {
      const station = await this.stationService.addStation(name, url, description);
      return { success: true, message: this.view.stationAdded(station) };
    } catch (error) {
      commandLogger.error(
        { command: "addstation", name, url, err: error },
        "Failed to add station"
      );
      return { success: false, message: "Failed to add station. Please try again." };
    }
  }
}
