import type { NewUserProfile, UserProfile } from "@/database/schema";

export interface DiscordUserInfo {
  username: string;
  displayName: string;
  avatarUrl: string | null;
}

export interface IUserProfileRepository {
  findByUserId(userId: string): Promise<UserProfile | undefined>;
  findTopGlobal(limit: number): Promise<UserProfile[]>;
  create(profile: NewUserProfile): Promise<UserProfile>;
  update(userId: string, profile: Partial<NewUserProfile>): Promise<UserProfile | undefined>;
  upsert(profile: NewUserProfile): Promise<UserProfile>;
  addXpAndMinutes(userId: string, xp: number, minutes: number): Promise<UserProfile | undefined>;
  updateDiscordInfo(userId: string, info: DiscordUserInfo): Promise<UserProfile | undefined>;
}
