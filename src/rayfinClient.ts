import { RayfinClient } from "@microsoft/rayfin-client";
import "@microsoft/rayfin-auth-provider-fabric";
import type { Team } from "../rayfin/data/team.js";
import type { Player } from "../rayfin/data/player.js";
import type { Goal } from "../rayfin/data/goal.js";
import type { Favorite } from "../rayfin/data/favorite.js";

export type AppSchema = { Team: Team; Player: Player; Goal: Goal; Favorite: Favorite };

export const client = new RayfinClient<AppSchema>({
  baseUrl: import.meta.env.VITE_RAYFIN_API_URL ?? "http://localhost:5168",
  publishableKey: import.meta.env.VITE_RAYFIN_PUBLISHABLE_KEY ?? "pk-WSWtRA71LBh9AtvkcTBn",
});

export const fabricOptions = {
  workspaceId: import.meta.env.VITE_FABRIC_WORKSPACE_ID ?? "",
  projectId: import.meta.env.VITE_FABRIC_ITEM_ID ?? "",
  fabricPortalUrl: import.meta.env.VITE_FABRIC_PORTAL_URL ?? "https://app.fabric.microsoft.com",
  returnOrigin: window.location.origin,
};
