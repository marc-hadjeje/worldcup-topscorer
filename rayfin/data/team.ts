import { entity, uuid, text } from "@microsoft/rayfin-core";
import { authenticated } from "@microsoft/rayfin-core";

@entity()
@authenticated('*')
export class Team {
  @uuid() id!: string;
  @text({ max: 100 }) name!: string;
  @text({ max: 10 }) code!: string;
  @text({ max: 100 }) group!: string;
}
