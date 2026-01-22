import type { Station } from "@/database/schema";

export interface IStationService {
  getAllStations(): Promise<Station[]>;
  getStationById(id: number): Promise<Station | undefined>;
  getStationByName(name: string): Promise<Station | undefined>;
  getDefaultStation(): Promise<Station | undefined>;
  addStation(name: string, url: string, description?: string): Promise<Station>;
  removeStation(id: number): Promise<boolean>;
  setDefaultStation(id: number): Promise<boolean>;
  resolveStation(nameOrId?: string): Promise<Station | undefined>;
}
