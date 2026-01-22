import { spawn, type Subprocess } from "bun";
import ffmpegPath from "ffmpeg-static";
import type { IStreamService } from "./interfaces/IStreamService";

export class StreamService implements IStreamService {
  createStream(url: string): Subprocess {
    if (!ffmpegPath) {
      throw new Error("ffmpeg-static path not found");
    }

    return spawn({
      cmd: [
        ffmpegPath,
        "-reconnect",
        "1",
        "-reconnect_streamed",
        "1",
        "-reconnect_delay_max",
        "5",
        "-analyzeduration",
        "0",
        "-loglevel",
        "error",
        "-i",
        url,
        "-f",
        "ogg",
        "-c:a",
        "libopus",
        "-ar",
        "48000",
        "-ac",
        "2",
        "-b:a",
        "96k",
        "-application",
        "lowdelay",
        "-frame_duration",
        "20",
        "-",
      ],
      stdout: "pipe",
      stderr: "ignore",
    });
  }
}
