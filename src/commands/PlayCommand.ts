import type { VoiceBasedChannel } from "discord.js";
import type { CommandContext, CommandResult } from "@/models/types";
import type { IAudioService } from "@/services/interfaces/IAudioService";
import type { IStationService } from "@/services/interfaces/IStationService";
import { commandLogger } from "@/utils/logger";
import { MessageView } from "@/views/MessageView";
import type { ICommand } from "./interfaces/ICommand";

export class PlayCommand implements ICommand {
  readonly name = "play";
  readonly description = "Play a radio station in your voice channel";
  readonly usage = "!play [station name or id]";
  readonly adminOnly = false;

  private readonly view = new MessageView();

  constructor(
    private readonly audioService: IAudioService,
    private readonly stationService: IStationService
  ) {}

  async execute(context: CommandContext): Promise<CommandResult> {
    const { message, args } = context;
    const voiceChannel = message.member?.voice.channel as VoiceBasedChannel | null;

    if (!voiceChannel) {
      return { success: false, message: this.view.notInVoiceChannel() };
    }

    const guildId = message.guildId!;

    if (this.audioService.hasState(guildId)) {
      return { success: false, message: this.view.alreadyPlaying() };
    }

    // Resolve the station to play
    const stationQuery = args.join(" ") || undefined;
    const station = await this.stationService.resolveStation(stationQuery);

    if (!station) {
      return { success: false, message: this.view.stationNotFound(stationQuery) };
    }

    try {
      await this.audioService.joinChannel(voiceChannel);
      await this.audioService.startStream(guildId, station.url);

      return { success: true, message: this.view.nowPlaying(station.name) };
    } catch (error) {
      commandLogger.error(
        { command: "play", guildId, stationId: station.id, err: error },
        "Failed to play station"
      );
      this.audioService.cleanup(guildId);
      return { success: false, message: this.view.failedToJoin() };
    }
  }
}
