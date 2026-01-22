import { Client, Events, GatewayIntentBits } from "discord.js";
import { config, validateConfig } from "@/config";
import { db } from "@/database/connection";
import { stations } from "@/database/schema";
import { StationRepository } from "@/repositories/StationRepository";
import { AudioService } from "@/services/AudioService";
import { StationService } from "@/services/StationService";
import { StreamService } from "@/services/StreamService";
import { PlayCommand } from "@/commands/PlayCommand";
import { StopCommand } from "@/commands/StopCommand";
import { StationsCommand } from "@/commands/StationsCommand";
import { AddStationCommand } from "@/commands/AddStationCommand";
import { RemoveStationCommand } from "@/commands/RemoveStationCommand";
import { SetDefaultCommand } from "@/commands/SetDefaultCommand";
import { CommandController } from "@/controllers/CommandController";

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
const stationService = new StationService(stationRepository);
const streamService = new StreamService();
const audioService = new AudioService(streamService);

// Initialize controller and register commands
const commandController = new CommandController();
commandController.registerCommands([
  new PlayCommand(audioService, stationService),
  new StopCommand(audioService),
  new StationsCommand(stationService),
  new AddStationCommand(stationService),
  new RemoveStationCommand(stationService),
  new SetDefaultCommand(stationService),
]);

// Seed default station if none exist
async function seedDefaultStation(): Promise<void> {
  const existingStations = await stationService.getAllStations();
  if (existingStations.length === 0) {
    console.log("[Seed] No stations found, creating default Lofi station...");
    await db.insert(stations).values({
      name: "Lofi Girl",
      url: "https://play.streamafrica.net/lofiradio",
      description: "Lofi hip hop radio - beats to relax/study to",
      isDefault: true,
    });
    console.log("[Seed] Default station created.");
  }
}

// Event handlers
client.once(Events.ClientReady, async (readyClient) => {
  console.log(`[Bot] Logged in as ${readyClient.user.tag}`);
  await seedDefaultStation();
});

client.on(Events.MessageCreate, async (message) => {
  await commandController.handleMessage(message);
});

// Graceful shutdown
process.on("SIGINT", () => {
  console.log("[Bot] Shutting down...");
  audioService.cleanupAll();
  client.destroy();
  process.exit(0);
});

// Start the bot
client.login(config.discord.token);
