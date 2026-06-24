import { entity, uuid, text, int, one } from "@microsoft/rayfin-core";
import { authenticated } from "@microsoft/rayfin-core";
import { Team } from "./team.js";

@entity()
@authenticated('*')
export class Player {
  @uuid() id!: string;
  @text({ max: 100 }) firstName!: string;
  @text({ max: 100 }) lastName!: string;
  @text({ max: 10 }) number!: string;
  @text({ max: 50 }) position!: string;
  @int() goals!: number;
  @int() assists!: number;
  @int() matchesPlayed!: number;
  @int() allTimeGoals!: number;
  @one(() => Team) team!: Team;
}
