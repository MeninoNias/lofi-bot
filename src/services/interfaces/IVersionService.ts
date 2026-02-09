export interface VersionInfo {
  version: string;
  healthy: boolean;
}

export interface IVersionService {
  getVersion(): Promise<VersionInfo>;
}
