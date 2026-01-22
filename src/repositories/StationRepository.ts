import { eq, ilike } from "drizzle-orm";
import type { Database } from "@/database/connection";
import { stations, type NewStation, type Station } from "@/database/schema";
import type { IStationRepository } from "./interfaces/IStationRepository";

export class StationRepository implements IStationRepository {
  constructor(private readonly db: Database) {}

  async findAll(): Promise<Station[]> {
    return await this.db.select().from(stations).orderBy(stations.name);
  }

  async findById(id: number): Promise<Station | undefined> {
    const result = await this.db.select().from(stations).where(eq(stations.id, id)).limit(1);
    return result[0];
  }

  async findByName(name: string): Promise<Station | undefined> {
    const result = await this.db.select().from(stations).where(ilike(stations.name, name)).limit(1);
    return result[0];
  }

  async findDefault(): Promise<Station | undefined> {
    const result = await this.db
      .select()
      .from(stations)
      .where(eq(stations.isDefault, true))
      .limit(1);
    return result[0];
  }

  async create(station: NewStation): Promise<Station> {
    const result = await this.db.insert(stations).values(station).returning();
    return result[0]!;
  }

  async update(id: number, station: Partial<NewStation>): Promise<Station | undefined> {
    const result = await this.db
      .update(stations)
      .set({ ...station, updatedAt: new Date() })
      .where(eq(stations.id, id))
      .returning();
    return result[0];
  }

  async delete(id: number): Promise<boolean> {
    const result = await this.db.delete(stations).where(eq(stations.id, id)).returning();
    return result.length > 0;
  }

  async setDefault(id: number): Promise<boolean> {
    // First, unset all defaults
    await this.db.update(stations).set({ isDefault: false });

    // Then set the new default
    const result = await this.db
      .update(stations)
      .set({ isDefault: true, updatedAt: new Date() })
      .where(eq(stations.id, id))
      .returning();

    return result.length > 0;
  }
}
