import type { NewStation, Station } from "@/database/schema";

export interface IStationRepository {
  findAll(): Promise<Station[]>;
  findById(id: number): Promise<Station | undefined>;
  findByName(name: string): Promise<Station | undefined>;
  findDefault(): Promise<Station | undefined>;
  create(station: NewStation): Promise<Station>;
  update(id: number, station: Partial<NewStation>): Promise<Station | undefined>;
  delete(id: number): Promise<boolean>;
  setDefault(id: number): Promise<boolean>;
}
