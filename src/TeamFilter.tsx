import React from "react";
import { useI18n } from "./i18n.js";

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
  const { t } = useI18n();
  return (
    <div className="team-filter">
      <button
        className={selected === null ? "active" : ""}
        onClick={() => onSelect(null)}
      >
        {t("filterAll")}
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
