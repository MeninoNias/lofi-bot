import type { CommandContext, CommandResult } from "@/models/types";
import type { IStationService } from "@/services/interfaces/IStationService";
import { MessageView } from "@/views/MessageView";
import type { ICommand } from "./interfaces/ICommand";

export class StationsCommand implements ICommand {
  readonly name = "stations";
  readonly description = "List all available radio stations";
  readonly usage = "!stations";
  readonly adminOnly = false;

  private readonly view = new MessageView();

  constructor(private readonly stationService: IStationService) {}

  async execute(_context: CommandContext): Promise<CommandResult> {
    const stations = await this.stationService.getAllStations();
    return { success: true, message: this.view.stationList(stations) };
  }
}
