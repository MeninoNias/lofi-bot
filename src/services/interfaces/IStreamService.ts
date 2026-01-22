import type { Subprocess } from "bun";

export interface IStreamService {
  createStream(url: string): Subprocess;
}
