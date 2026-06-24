import { entity, uuid, text, int, date, one } from "@microsoft/rayfin-core";
import { authenticated } from "@microsoft/rayfin-core";
import { Player } from "./player.js";

@entity()
@authenticated('*')
export class Goal {
  @uuid() id!: string;
  @one(() => Player) scorer!: Player;
  @int() minute!: number;
  @text({ max: 200 }) matchDescription!: string;
  @text({ max: 50 }) goalType!: string;
  @date() matchDate!: Date;
}
