import type { Client } from "discord.js";
import { sql } from "drizzle-orm";
import type { BunSQLiteDatabase } from "drizzle-orm/bun-sqlite";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import type { IAudioService } from "./interfaces/IAudioService";
import type { HealthStatus, IHealthService } from "./interfaces/IHealthService";

type Database = BunSQLiteDatabase | PostgresJsDatabase;

export class HealthService implements IHealthService {
  private readonly startTime: number;

  constructor(
    private readonly client: Client,
    private readonly db: Database,
    private readonly audioService: IAudioService
  ) {
    this.startTime = Date.now();
  }

  async getStatus(): Promise<HealthStatus> {
    const [dbConnected, audioConnections] = await Promise.all([
      this.checkDatabase(),
      this.getAudioConnections(),
    ]);

    const discordConnected = this.client.isReady();
    const isHealthy = discordConnected && dbConnected;

    return {
      status: isHealthy ? "healthy" : "unhealthy",
      timestamp: new Date().toISOString(),
      uptime: Math.floor((Date.now() - this.startTime) / 1000),
      discord: {
        connected: discordConnected,
        ping: this.client.ws.ping,
        guilds: this.client.guilds.cache.size,
      },
      database: {
        connected: dbConnected,
      },
      audio: {
        activeConnections: audioConnections,
      },
    };
  }

  private async checkDatabase(): Promise<boolean> {
    try {
      await (this.db as PostgresJsDatabase).execute(sql`SELECT 1`);
      return true;
    } catch {
      return false;
    }
  }

  private getAudioConnections(): number {
    // Count active guild states from AudioService
    let count = 0;
    // We need to access the internal state - for now we'll use a simple approach
    // by checking if hasState returns true for known guilds
    for (const guild of this.client.guilds.cache.values()) {
      if (this.audioService.hasState(guild.id)) {
        count++;
      }
    }
    return count;
  }
}
