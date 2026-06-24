import { Team } from "./team.js";
import { Player } from "./player.js";
import { Goal } from "./goal.js";
import { Favorite } from "./favorite.js";

export type AppSchema = {
  Team: Team;
  Player: Player;
  Goal: Goal;
  Favorite: Favorite;
};
