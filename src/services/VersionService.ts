import { healthLogger } from "@/utils/logger";
import type { IHealthService } from "@/services/interfaces/IHealthService";
import type { IVersionService, VersionInfo } from "@/services/interfaces/IVersionService";

const CACHE_TTL = 300_000; // 5 minutes
const GITHUB_API_URL = "https://api.github.com/repos/MeninoNias/lofi-bot/releases/latest";

interface VersionCache {
  version: string;
  fetchedAt: number;
}

export class VersionService implements IVersionService {
  private cache: VersionCache | null = null;

  constructor(private readonly healthService: IHealthService) {}

  async getVersion(): Promise<VersionInfo> {
    const version = await this.fetchVersion();
    const status = await this.healthService.getStatus();

    return {
      version,
      healthy: status.status === "healthy",
    };
  }

  private async fetchVersion(): Promise<string> {
    if (this.cache && Date.now() - this.cache.fetchedAt < CACHE_TTL) {
      return this.cache.version;
    }

    try {
      const response = await fetch(GITHUB_API_URL, {
        headers: { Accept: "application/vnd.github.v3+json" },
      });

      if (!response.ok) {
        throw new Error(`GitHub API returned ${response.status}`);
      }

      const data = (await response.json()) as { tag_name: string };
      const version = data.tag_name;

      this.cache = { version, fetchedAt: Date.now() };
      healthLogger.debug({ version }, "Fetched version from GitHub");

      return version;
    } catch (error) {
      healthLogger.warn({ error }, "Failed to fetch version from GitHub");
      return this.cache?.version ?? "unknown";
    }
  }
}
