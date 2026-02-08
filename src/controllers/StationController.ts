import type { IStationService } from "@/services/interfaces/IStationService";

export class StationController {
  constructor(private readonly stationService: IStationService) {}

  async getAll() {
    const stations = await this.stationService.getAllStations();
    return { data: stations, status: 200 };
  }

  async getById(id: number) {
    if (isNaN(id)) {
      return { data: { error: "Invalid station ID" }, status: 400 };
    }
    const station = await this.stationService.getStationById(id);
    if (!station) {
      return { data: { error: "Station not found" }, status: 404 };
    }
    return { data: station, status: 200 };
  }

  async create(name?: string, url?: string, description?: string) {
    if (!name || !url) {
      return { data: { error: "Name and URL are required" }, status: 400 };
    }
    const station = await this.stationService.addStation(name, url, description);
    return { data: station, status: 201 };
  }

  async remove(id: number) {
    if (isNaN(id)) {
      return { data: { error: "Invalid station ID" }, status: 400 };
    }
    const deleted = await this.stationService.removeStation(id);
    if (!deleted) {
      return { data: { error: "Station not found" }, status: 404 };
    }
    return { data: { success: true }, status: 200 };
  }

  async setDefault(id: number) {
    if (isNaN(id)) {
      return { data: { error: "Invalid station ID" }, status: 400 };
    }
    const updated = await this.stationService.setDefaultStation(id);
    if (!updated) {
      return { data: { error: "Station not found" }, status: 404 };
    }
    const station = await this.stationService.getStationById(id);
    return { data: station, status: 200 };
  }
}
