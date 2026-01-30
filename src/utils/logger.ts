import pino from "pino";

const isDev = process.env.NODE_ENV !== "production";

export const logger = pino({
  level: process.env.LOG_LEVEL || "info",
  transport: isDev
    ? {
        target: "pino-pretty",
        options: {
          colorize: true,
          translateTime: "SYS:standard",
          ignore: "pid,hostname",
        },
      }
    : undefined,
});

// Child loggers for different modules
export const streamLogger = logger.child({ module: "Stream" });
export const playerLogger = logger.child({ module: "Player" });
export const botLogger = logger.child({ module: "Bot" });
export const configLogger = logger.child({ module: "Config" });
export const commandLogger = logger.child({ module: "Command" });
export const seedLogger = logger.child({ module: "Seed" });
export const voiceLogger = logger.child({ module: "Voice" });
export const healthLogger = logger.child({ module: "Health" });
export const profileLogger = logger.child({ module: "Profile" });
