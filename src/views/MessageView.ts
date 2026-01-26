import type { Station } from "@/database/schema";
import type { HealthStatus } from "@/services/interfaces/IHealthService";

export class MessageView {
  notInVoiceChannel(): string {
    return "You need to be in a voice channel to use this command!";
  }

  alreadyPlaying(): string {
    return "Already playing! Use `!stop` first to switch stations.";
  }

  nowPlaying(stationName: string): string {
    return `Now playing **${stationName}**!`;
  }

  failedToJoin(): string {
    return "Failed to join voice channel. Please try again.";
  }

  notPlaying(): string {
    return "Not currently playing anything!";
  }

  stopped(): string {
    return "Stopped playing and left the voice channel.";
  }

  stationNotFound(query?: string): string {
    if (query) {
      return `Station "${query}" not found. Use \`!stations\` to see available stations.`;
    }
    return "No default station configured. Use `!stations` to see available stations.";
  }

  stationList(stations: Station[]): string {
    if (stations.length === 0) {
      return "No stations available.";
    }

    const lines = ["**Available Stations:**"];
    for (const station of stations) {
      const defaultMarker = station.isDefault ? " (default)" : "";
      const desc = station.description ? ` - ${station.description}` : "";
      lines.push(`\`${station.id}\` **${station.name}**${defaultMarker}${desc}`);
    }
    lines.push("");
    lines.push("Use `!play <name>` or `!play <id>` to play a station.");
    return lines.join("\n");
  }

  stationAdded(station: Station): string {
    return `Station **${station.name}** added with ID \`${station.id}\`.`;
  }

  stationRemoved(id: number): string {
    return `Station with ID \`${id}\` has been removed.`;
  }

  stationNotFoundById(id: number): string {
    return `Station with ID \`${id}\` not found.`;
  }

  stationSetDefault(station: Station): string {
    return `**${station.name}** is now the default station.`;
  }

  stationAlreadyExists(name: string): string {
    return `A station with the name "${name}" already exists.`;
  }

  invalidUsage(usage: string): string {
    return `Invalid usage. Usage: \`${usage}\``;
  }

  permissionDenied(): string {
    return "You don't have permission to use this command.";
  }

  healthStatus(status: HealthStatus): string {
    const emoji = status.status === "healthy" ? "✅" : "❌";
    const lines = [
      `${emoji} **Bot Status: ${status.status.toUpperCase()}**`,
      "",
      `⏱️ Uptime: ${this.formatUptime(status.uptime)}`,
      `📡 Discord: ${status.discord.connected ? "Connected" : "Disconnected"} (${status.discord.ping}ms)`,
      `🏠 Guilds: ${status.discord.guilds}`,
      `🔊 Active Streams: ${status.audio.activeConnections}`,
      `🗄️ Database: ${status.database.connected ? "Connected" : "Disconnected"}`,
    ];
    return lines.join("\n");
  }

  private formatUptime(seconds: number): string {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    const parts: string[] = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    parts.push(`${secs}s`);

    return parts.join(" ");
  }
}
