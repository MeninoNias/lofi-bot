import { Elysia } from "elysia";
import { healthLogger } from "@/utils/logger";
import type { IHealthService } from "./interfaces/IHealthService";

export class HealthServer {
  private app: Elysia;

  constructor(
    private readonly healthService: IHealthService,
    private readonly port: number
  ) {
    this.app = new Elysia()
      .get("/", () => ({
        name: "lofi-bot",
        version: "1.0.0",
        endpoints: ["/health"],
      }))
      .get("/health", async ({ set }) => {
        const status = await this.healthService.getStatus();
        if (status.status === "unhealthy") {
          set.status = 503;
        }
        return status;
      });
  }

  start(): void {
    this.app.listen(this.port);
    healthLogger.info({ port: this.port }, "Health server started");
  }

  stop(): void {
    this.app.stop();
    healthLogger.info("Health server stopped");
  }
}
