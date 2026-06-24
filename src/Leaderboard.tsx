import React from "react";
import { useI18n } from "./i18n.js";

interface Player {
  id: string;
  firstName: string;
  lastName: string;
  number: string;
  position: string;
  goals: number;
  assists: number;
  matchesPlayed: number;
  allTimeGoals: number;
  "team.name"?: string;
  "team.code"?: string;
}

interface Favorite {
  id: string;
  userName: string;
  player_id: string;
}

interface Team {
  id: string;
  name: string;
  code: string;
}

interface Props {
  players: Player[];
  mode: "2026" | "alltime";
  favorites?: Favorite[];
  teams?: Team[];
}

const FLAGS: Record<string, string> = {
  FRA: "🇫🇷",
  ARG: "🇦🇷",
  BRA: "🇧🇷",
  ENG: "🏴󠁧󠁢󠁥󠁮󠁧󠁿",
  GER: "🇩🇪",
  ESP: "🇪🇸",
  POR: "🇵🇹",
  NED: "🇳🇱",
  USA: "🇺🇸",
  MEX: "🇲🇽",
  CAN: "🇨🇦",
  MAR: "🇲🇦",
  JPN: "🇯🇵",
  COL: "🇨🇴",
  URU: "🇺🇾",
  SEN: "🇸🇳",
  NOR: "🇳🇴",
  HUN: "🇭🇺",
  POL: "🇵🇱",
  PER: "🇵🇪",
};

const TEAM_COLORS: Record<string, string> = {
  FRA: "#1e3a8a",
  ARG: "#7dd3fc",
  BRA: "#facc15",
  ENG: "#dc2626",
  GER: "#1f2937",
  ESP: "#dc2626",
  POR: "#16a34a",
  NED: "#f97316",
  USA: "#1d4ed8",
  MEX: "#15803d",
  CAN: "#ef4444",
  MAR: "#dc2626",
  JPN: "#1d4ed8",
  COL: "#eab308",
  URU: "#0ea5e9",
  SEN: "#16a34a",
  NOR: "#ba2025",
  HUN: "#477050",
  POL: "#dc143c",
  PER: "#d91023",
};

// Player headshots from TheSportsDB
const PLAYER_IMAGES: Record<string, string> = {
  "Messi": "https://r2.thesportsdb.com/images/media/player/cutout/e0i2051750317027.png",
  "Mbappé": "https://r2.thesportsdb.com/images/media/player/cutout/h9u9vz1733653583.png",
  "Haaland": "https://r2.thesportsdb.com/images/media/player/cutout/un3jr11769182465.png",
  "Kane": "https://r2.thesportsdb.com/images/media/player/cutout/j4ouvd1756408895.png",
  "Gakpo": "https://r2.thesportsdb.com/images/media/player/cutout/lwkl5n1757088091.png",
  "David": "https://r2.thesportsdb.com/images/media/player/cutout/nyd9d91759225738.png",
  "Undav": "https://r2.thesportsdb.com/images/media/player/cutout/hcxx8s1763586492.png",
  "Balogun": "https://r2.thesportsdb.com/images/media/player/cutout/ic7kq51781348516.png",
  "Sarr": "https://r2.thesportsdb.com/images/media/player/cutout/1abo611761492444.png",
  "Júnior": "https://r2.thesportsdb.com/images/media/player/cutout/ejuxsh1750271859.png",
  "Havertz": "https://r2.thesportsdb.com/images/media/player/cutout/hem4r91694204364.png",
  "Brobbey": "https://r2.thesportsdb.com/images/media/player/cutout/q3qz441762198721.png",
  "Cunha": "https://r2.thesportsdb.com/images/media/player/cutout/29x61e1762020281.png",
  "Summerville": "https://r2.thesportsdb.com/images/media/player/cutout/b51rjk1756984653.png",
  "Oyarzabal": "https://r2.thesportsdb.com/images/media/player/cutout/9apeaz1762709253.png",
  "Ueda": "https://r2.thesportsdb.com/images/media/player/cutout/5ezc8v1758188908.png",
  "Kamada": "https://r2.thesportsdb.com/images/media/player/cutout/xajscx1761492482.png",
  "Larin": "https://r2.thesportsdb.com/images/media/player/cutout/bgse2n1777485421.png",
  "Saibari": "https://r2.thesportsdb.com/images/media/player/cutout/3y277g1764595447.png",
  "Araújo": "https://r2.thesportsdb.com/images/media/player/cutout/3u12tv1762290711.png",
  "Álvarez": "https://r2.thesportsdb.com/images/media/player/cutout/91pla41762288186.png",
  "Griezmann": "https://r2.thesportsdb.com/images/media/player/cutout/tiqhh41762288400.png",
  "Saka": "https://r2.thesportsdb.com/images/media/player/cutout/xfwok41769331816.png",
  "Morata": "https://r2.thesportsdb.com/images/media/player/cutout/5cci4b1764278358.png",
  "Ramos": "https://r2.thesportsdb.com/images/media/player/cutout/47dx051766335509.png",
};

// Nationality fallback for historical legends (and players) whose record has no
// team relation in the data. Keyed by "firstName lastName" (trimmed). Used only
// when team.code is empty, to fill the Team column (esp. in the all-time view).
const LEGEND_NATION: Record<string, string> = {
  "Lionel Messi": "ARG",
  "Kylian Mbappé": "FRA",
  "Miroslav Klose": "GER",
  "Ronaldo Nazário": "BRA",
  "Gerd Müller": "GER",
  "Just Fontaine": "FRA",
  "Pelé": "BRA",
  "Jürgen Klinsmann": "GER",
  "Sándor Kocsis": "HUN",
  "Thomas Müller": "GER",
  "Grzegorz Lato": "POL",
  "Gary Lineker": "ENG",
  "Teófilo Cubillas": "PER",
  "Gabriel Batistuta": "ARG",
  "Harry Kane": "ENG",
  "Cody Gakpo": "NED",
  "Julián Álvarez": "ARG",
  "Erling Haaland": "NOR",
  "Antoine Griezmann": "FRA",
  "Jonathan David": "CAN",
  "Bukayo Saka": "ENG",
  "Deniz Undav": "GER",
  "Gonçalo Ramos": "POR",
  "Álvaro Morata": "ESP",
  "Daichi Kamada": "JPN",
  "Crysencio Summerville": "NED",
  "Ismael Saibari": "MAR",
  "Vinícius Júnior": "BRA",
  "Folarin Balogun": "USA",
  "Neymar Jr": "BRA",
  "Richarlison de Andrade": "BRA",
  "Matheus Cunha": "BRA",
  "Mikel Oyarzabal": "ESP",
  "Cyle Larin": "CAN",
  "Ismaïla Sarr": "SEN",
  "Brian Brobbey": "NED",
  "Maxi Araújo": "URU",
  "Ayase Ueda": "JPN",
  "Kai Havertz": "GER",
  "Youssef En-Nesyri": "MAR",
  "Jamal Musiala": "GER",
};

// Built-in French nation names, fallback when the code is not in the loaded teams.
const NATION_NAMES: Record<string, string> = {
  FRA: "France", ARG: "Argentine", BRA: "Brésil", ENG: "Angleterre",
  GER: "Allemagne", ESP: "Espagne", POR: "Portugal", NED: "Pays-Bas",
  USA: "États-Unis", MEX: "Mexique", CAN: "Canada", MAR: "Maroc",
  JPN: "Japon", COL: "Colombie", URU: "Uruguay", SEN: "Sénégal",
  NOR: "Norvège", HUN: "Hongrie", POL: "Pologne", PER: "Pérou",
};

function PlayerAvatar({ player, teamCode }: { player: Player; teamCode?: string }) {
  const code = teamCode || player["team.code"] || "";
  const bgColor = TEAM_COLORS[code] ?? "#374151";
  const initials = `${player.firstName[0]}${player.lastName[0]}`;
  const imgUrl = PLAYER_IMAGES[player.lastName];

  if (imgUrl) {
    return (
      <div className="player-avatar" style={{ background: bgColor }}>
        <img
          src={imgUrl}
          alt={`${player.firstName} ${player.lastName}`}
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = "none";
            (e.target as HTMLImageElement).nextElementSibling?.classList.remove("hidden");
          }}
        />
        <span className="avatar-initials hidden">{initials}</span>
      </div>
    );
  }

  return (
    <div className="player-avatar" style={{ background: bgColor }}>
      <span className="avatar-initials">{initials}</span>
    </div>
  );
}

export function Leaderboard({ players, mode, favorites = [], teams = [] }: Props) {
  const { t } = useI18n();
  const isAllTime = mode === "alltime";
  // Count votes per player
  const voteCounts: Record<string, number> = {};
  favorites.forEach((f) => {
    voteCounts[f.player_id] = (voteCounts[f.player_id] || 0) + 1;
  });
  // Resolve a display team (code + name) for a player, falling back to the
  // legend nationality map when the record has no team relation.
  const teamNameByCode: Record<string, string> = {};
  teams.forEach((tm) => { if (tm.code) teamNameByCode[tm.code] = tm.name; });
  const resolveTeam = (p: Player): { code: string; name: string } => {
    let code = p["team.code"] ?? "";
    let name = p["team.name"] ?? "";
    if (!code) {
      const fallback = LEGEND_NATION[`${p.firstName} ${p.lastName}`.trim()];
      if (fallback) {
        code = fallback;
        name = teamNameByCode[fallback] ?? NATION_NAMES[fallback] ?? "";
      }
    }
    return { code, name };
  };
  return (
    <div className="leaderboard">
      <table>
        <thead>
          <tr>
            <th className="rank">#</th>
            <th className="player">{t("colPlayer")}</th>
            <th className="team">{t("colTeam")}</th>
            <th className="num">{isAllTime ? t("colGoalsTotal") : t("colGoals2026")}</th>
            {!isAllTime && <th className="num">{t("colAssists")}</th>}
            {!isAllTime && <th className="num">{t("colMatches")}</th>}
            {!isAllTime && <th className="num">{t("colRatio")}</th>}
            <th className="num">{t("colVotes")}</th>
          </tr>
        </thead>
        <tbody>
          {players.map((p, i) => {
            const goalsDisplay = isAllTime ? p.allTimeGoals : p.goals;
            const team = resolveTeam(p);
            return (
            <tr key={p.id} className={i < 3 ? `top-${i + 1}` : ""}>
              <td className="rank">
                {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : i + 1}
              </td>
              <td className="player-cell">
                <PlayerAvatar player={p} teamCode={team.code} />
                <div className="player-info">
                  <span className="player-name">
                    {p.firstName} <strong>{p.lastName}</strong>
                  </span>
                  <span className="player-meta">
                    #{p.number} · {p.position}
                  </span>
                </div>
              </td>
              <td className="team">
                {FLAGS[team.code] ?? ""} {team.name}
              </td>
              <td className="num goals-cell">{goalsDisplay}</td>
              {!isAllTime && <td className="num">{p.assists}</td>}
              {!isAllTime && <td className="num">{p.matchesPlayed}</td>}
              {!isAllTime && (
                <td className="num">
                  {p.matchesPlayed > 0
                    ? (goalsDisplay / p.matchesPlayed).toFixed(2)
                    : "–"}
                </td>
              )}
              <td className="num votes-cell">
                {voteCounts[p.id] ? "⭐".repeat(voteCounts[p.id]) : ""}
              </td>
            </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
