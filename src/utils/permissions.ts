import type { GuildMember } from "discord.js";
import { config } from "@/config";

export function isAdmin(member: GuildMember | null): boolean {
  if (!member) return false;

  // Check if user has administrator permission
  if (member.permissions.has("Administrator")) {
    return true;
  }

  // Check if user has the configured admin role
  if (config.discord.adminRoleId) {
    return member.roles.cache.has(config.discord.adminRoleId);
  }

  return false;
}
