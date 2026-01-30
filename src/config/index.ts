import { configLogger } from "@/utils/logger";

export const config = {
  discord: {
    token: process.env.DISCORD_TOKEN || "",
    adminRoleId: process.env.ADMIN_ROLE_ID || "",
  },
  database: {
    url: process.env.DATABASE_URL || "",
  },
  stream: {
    reconnectDelayMs: 5000,
    maxReconnectAttempts: 5,
  },
  api: {
    port: parseInt(process.env.API_PORT || "3000", 10),
    enabled: process.env.API_ENABLED !== "false",
    key: process.env.API_KEY || "",
  },
} as const;

export function validateConfig(): void {
  if (!config.discord.token) {
    configLogger.fatal("DISCORD_TOKEN environment variable is required");
    process.exit(1);
  }
  if (!config.database.url) {
    configLogger.fatal("DATABASE_URL environment variable is required");
    process.exit(1);
  }
}
