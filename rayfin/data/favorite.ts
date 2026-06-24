import { entity, uuid, text, one } from "@microsoft/rayfin-core";
import { authenticated } from "@microsoft/rayfin-core";
import { Player } from "./player.js";

@entity()
@authenticated('*')
export class Favorite {
  @uuid() id!: string;
  @text({ max: 100 }) userName!: string;
  @one(() => Player) player!: Player;
}
