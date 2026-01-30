// Suppress harmless TimeoutNegativeWarning from @discordjs/voice
process.on("warning", (warning) => {
  if (warning.name === "TimeoutNegativeWarning") return;
  console.warn(warning);
});

import { Client, Events, GatewayIntentBits } from "discord.js";
import { config, validateConfig } from "@/config";
import { db } from "@/database/connection";
import { stations } from "@/database/schema";
import { StationRepository } from "@/repositories/StationRepository";
import { UserProfileRepository } from "@/repositories/UserProfileRepository";
import { GuildUserStatsRepository } from "@/repositories/GuildUserStatsRepository";
import { GuildRepository } from "@/repositories/GuildRepository";
import { AudioService } from "@/services/AudioService";
import { StationService } from "@/services/StationService";
import { StreamService } from "@/services/StreamService";
import { ProfileService } from "@/services/ProfileService";
import { PlayCommand } from "@/commands/PlayCommand";
import { StopCommand } from "@/commands/StopCommand";
import { StationsCommand } from "@/commands/StationsCommand";
import { AddStationCommand } from "@/commands/AddStationCommand";
import { RemoveStationCommand } from "@/commands/RemoveStationCommand";
import { SetDefaultCommand } from "@/commands/SetDefaultCommand";
import { HealthCommand } from "@/commands/HealthCommand";
import { ProfileCommand } from "@/commands/ProfileCommand";
import { RankCommand } from "@/commands/RankCommand";
import { GlobalRankCommand } from "@/commands/GlobalRankCommand";
import { CommandController } from "@/controllers/CommandController";
import { HealthService } from "@/services/HealthService";
import { HealthServer } from "@/services/HealthServer";
import { botLogger, seedLogger } from "@/utils/logger";

// Validate configuration
validateConfig();

// Initialize Discord client
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.MessageContent,
  ],
});

// Dependency Injection - Build the object graph
const stationRepository = new StationRepository(db);
const userProfileRepository = new UserProfileRepository(db);
const guildUserStatsRepository = new GuildUserStatsRepository(db);
const guildRepository = new GuildRepository(db);
const stationService = new StationService(stationRepository);
const streamService = new StreamService();
const audioService = new AudioService(streamService);
const profileService = new ProfileService(
  userProfileRepository,
  guildUserStatsRepository,
  guildRepository
);
const healthService = new HealthService(client, db, audioService);
const healthServer = config.api.enabled
  ? new HealthServer(healthService, config.api.port, config.api.key || undefined)
  : null;

// Initialize controller and register commands
const commandController = new CommandController(profileService);
commandController.registerCommands([
  new PlayCommand(audioService, stationService),
  new StopCommand(audioService),
  new StationsCommand(stationService),
  new AddStationCommand(stationService),
  new RemoveStationCommand(stationService),
  new SetDefaultCommand(stationService),
  new HealthCommand(healthService),
  new ProfileCommand(profileService),
  new RankCommand(profileService, client),
  new GlobalRankCommand(profileService, client),
]);

// Seed default station if none exist
async function seedDefaultStation(): Promise<void> {
  const existingStations = await stationService.getAllStations();
  if (existingStations.length === 0) {
    seedLogger.info("No stations found, creating default Lofi station...");
    await db.insert(stations).values({
      name: "Lofi Girl",
      url: "https://play.streamafrica.net/lofiradio",
      description: "Lofi hip hop radio - beats to relax/study to",
      isDefault: true,
    });
    seedLogger.info("Default station created");
  }
}

// Event handlers
client.once(Events.ClientReady, async (readyClient) => {
  botLogger.info({ tag: readyClient.user.tag }, "Logged in");
  await seedDefaultStation();
  healthServer?.start();
});

client.on(Events.MessageCreate, async (message) => {
  await commandController.handleMessage(message);
});

client.on(Events.VoiceStateUpdate, (oldState, newState) => {
  audioService.handleVoiceStateUpdate(oldState, newState);
});

// Graceful shutdown
process.on("SIGINT", () => {
  botLogger.info("Shutting down...");
  healthServer?.stop();
  audioService.cleanupAll();
  client.destroy();
  process.exit(0);
});

// Start the bot
client.login(config.discord.token);
