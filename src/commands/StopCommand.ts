import type { CommandContext, CommandResult } from "@/models/types";
import type { IAudioService } from "@/services/interfaces/IAudioService";
import { MessageView } from "@/views/MessageView";
import type { ICommand } from "./interfaces/ICommand";

export class StopCommand implements ICommand {
  readonly name = "stop";
  readonly description = "Stop playing and leave the voice channel";
  readonly usage = "!stop";
  readonly adminOnly = false;

  private readonly view = new MessageView();

  constructor(private readonly audioService: IAudioService) {}

  async execute(context: CommandContext): Promise<CommandResult> {
    const { message } = context;
    const guildId = message.guildId!;

    if (!this.audioService.hasState(guildId)) {
      return { success: false, message: this.view.notPlaying() };
    }

    this.audioService.cleanup(guildId);
    return { success: true, message: this.view.stopped() };
  }
}
