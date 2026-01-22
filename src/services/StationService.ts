import type { Station } from "@/database/schema";
import type { IStationRepository } from "@/repositories/interfaces/IStationRepository";
import type { IStationService } from "./interfaces/IStationService";

export class StationService implements IStationService {
  constructor(private readonly stationRepository: IStationRepository) {}

  async getAllStations(): Promise<Station[]> {
    return await this.stationRepository.findAll();
  }

  async getStationById(id: number): Promise<Station | undefined> {
    return await this.stationRepository.findById(id);
  }

  async getStationByName(name: string): Promise<Station | undefined> {
    return await this.stationRepository.findByName(name);
  }

  async getDefaultStation(): Promise<Station | undefined> {
    return await this.stationRepository.findDefault();
  }

  async addStation(name: string, url: string, description?: string): Promise<Station> {
    return await this.stationRepository.create({
      name,
      url,
      description: description || null,
    });
  }

  async removeStation(id: number): Promise<boolean> {
    return await this.stationRepository.delete(id);
  }

  async setDefaultStation(id: number): Promise<boolean> {
    return await this.stationRepository.setDefault(id);
  }

  async resolveStation(nameOrId?: string): Promise<Station | undefined> {
    if (!nameOrId) {
      return await this.getDefaultStation();
    }

    // Try to parse as ID first
    const id = parseInt(nameOrId, 10);
    if (!isNaN(id)) {
      const station = await this.getStationById(id);
      if (station) return station;
    }

    // Otherwise search by name
    return await this.getStationByName(nameOrId);
  }
}
