import React from "react";

interface Team {
  id: string;
  name: string;
  code: string;
  group: string;
}

interface Props {
  teams: Team[];
  selected: string | null;
  onSelect: (id: string | null) => void;
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

export function TeamFilter({ teams, selected, onSelect }: Props) {
  return (
    <div className="team-filter">
      <button
        className={selected === null ? "active" : ""}
        onClick={() => onSelect(null)}
      >
        Tous
      </button>
      {teams.map((t) => (
        <button
          key={t.id}
          className={selected === t.id ? "active" : ""}
          onClick={() => onSelect(t.id)}
        >
          {FLAGS[t.code] ?? ""} {t.name}
        </button>
      ))}
    </div>
  );
}
