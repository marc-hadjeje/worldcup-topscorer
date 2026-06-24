import React, { useEffect, useState, useCallback } from "react";
import { client, fabricOptions } from "./rayfinClient.js";
import { ensureSignedInWithFabric, initEmbeddedAuth } from "@microsoft/rayfin-auth-provider-fabric";
import { Leaderboard } from "./Leaderboard.js";
import { TeamFilter } from "./TeamFilter.js";
import { useI18n, LanguageToggle } from "./i18n.js";

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
  team_id: string;
  "team.name"?: string;
  "team.code"?: string;
}

interface Team {
  id: string;
  name: string;
  code: string;
  group: string;
}

interface Favorite {
  id: string;
  userName: string;
  player_id: string;
  "player.firstName"?: string;
  "player.lastName"?: string;
  "player.goals"?: number;
  "player.team_id"?: string;
}

export function App() {
  const { t } = useI18n();
  const [players, setPlayers] = useState<Player[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [signingIn, setSigningIn] = useState(false);
  const [activeTab, setActiveTab] = useState<"2026" | "alltime">("2026");

  // Favorite form
  const [favName, setFavName] = useState("");
  const [favPlayerId, setFavPlayerId] = useState("");

  // Access request form (login screen)
  const ACCESS_EMAIL = "marc.hadjeje@microsoft.com";
  const ACCESS_WEBHOOK = (import.meta as any).env?.VITE_ACCESS_WEBHOOK_URL as string | undefined;
  const [showAccess, setShowAccess] = useState(false);
  const [accessEmail, setAccessEmail] = useState("");
  const [accessMsg, setAccessMsg] = useState("");
  const [accessErr, setAccessErr] = useState<string | null>(null);
  const [accessSending, setAccessSending] = useState(false);
  const [accessSent, setAccessSent] = useState(false);

  const sendAccessRequest = useCallback(async () => {
    const email = accessEmail.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setAccessErr(t("accessEmailRequired"));
      return;
    }
    setAccessErr(null);

    if (ACCESS_WEBHOOK) {
      try {
        setAccessSending(true);
        await fetch(ACCESS_WEBHOOK, {
          method: "POST",
          mode: "no-cors",
          headers: { "Content-Type": "text/plain;charset=UTF-8" },
          body: JSON.stringify({
            email,
            message: accessMsg.trim(),
            app: "worldcup-topscorer",
            requestedAt: new Date().toISOString(),
          }),
        });
        setAccessSent(true);
        return;
      } catch {
        // fall through to mailto if the webhook is unreachable
      } finally {
        setAccessSending(false);
      }
    }

    const lines = [
      t("accessMailIntro"),
      "",
      `${t("accessMailEmailLabel")}: ${email}`,
    ];
    if (accessMsg.trim()) lines.push(`${t("accessMailMsgLabel")}: ${accessMsg.trim()}`);
    const href =
      `mailto:${ACCESS_EMAIL}` +
      `?subject=${encodeURIComponent(t("accessMailSubject"))}` +
      `&body=${encodeURIComponent(lines.join("\n"))}`;
    window.location.href = href;
  }, [accessEmail, accessMsg, t, ACCESS_WEBHOOK]);

  useEffect(() => {
    (async () => {
      try {
        const session = await initEmbeddedAuth(client.auth, fabricOptions);
        if (session) setIsAuthenticated(true);
      } catch {}
      const existing = client.auth.getSession();
      if (existing?.isAuthenticated) setIsAuthenticated(true);
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    if (isAuthenticated) loadData();
  }, [isAuthenticated]);

  const handleSignIn = useCallback(async () => {
    try {
      setSigningIn(true);
      setError(null);
      const session = await ensureSignedInWithFabric(client.auth, fabricOptions);
      if (session) setIsAuthenticated(true);
    } catch (e: any) {
      setError(e.message ?? t("authError"));
    } finally {
      setSigningIn(false);
    }
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      const [playersRes, teamsRes, favsRes] = await Promise.all([
        client.data.Player.select([
          "id", "firstName", "lastName", "number", "position",
          "goals", "assists", "matchesPlayed", "allTimeGoals",
          "team_id", "team.name", "team.code",
        ]).orderBy({ goals: "desc" }).first(1000).execute(),
        client.data.Team.select(["id", "name", "code", "group"])
          .orderBy({ name: "asc" }).first(1000).execute(),
        client.data.Favorite.select([
          "id", "userName", "player_id",
        ]).execute(),
      ]);
      setPlayers(playersRes as any);
      setTeams(teamsRes as any);
      setFavorites(favsRes as any);
    } catch (e: any) {
      setError(e.message ?? t("loadError"));
    } finally {
      setLoading(false);
    }
  }

  async function addFavorite() {
    if (!favName.trim() || !favPlayerId) return;
    try {
      await client.data.Favorite.create({
        userName: favName.trim(),
        player: { id: favPlayerId },
      } as any);
      setFavName("");
      setFavPlayerId("");
      await loadData();
    } catch (e: any) {
      setError(e.message ?? t("addFavError"));
    }
  }

  const filtered = selectedTeam
    ? players.filter((p) => p.team_id === selectedTeam)
    : players;

  // 2026 tab: only real 2026 participants (scored or played this edition), top 30 scorers
  const season2026 = filtered
    .filter((p) => p.goals > 0 || p.matchesPlayed > 0)
    .slice(0, 30);

  // Country filter: only keep teams that have at least one scorer (goals > 0)
  // within the unfiltered top-30 2026 leaderboard.
  const top30TeamIds = new Set(
    players
      .filter((p) => p.goals > 0 || p.matchesPlayed > 0)
      .slice(0, 30)
      .filter((p) => p.goals > 0)
      .map((p) => p.team_id)
  );
  const filterableTeams = teams.filter((tm) => top30TeamIds.has(tm.id));

  // All-time tab: total = historical baseline (allTimeGoals) + live 2026 goals.
  const allTimeTotal = (p: typeof players[number]) =>
    (p.allTimeGoals ?? 0) + (p.goals ?? 0);
  const allTimeSorted = [...filtered]
    .sort((a, b) => allTimeTotal(b) - allTimeTotal(a))
    .slice(0, 20);

  if (!isAuthenticated && !loading) {
    return (
      <div className="app">
        <header>
          <div className="header-top">
            <h1>{t("appTitle")}</h1>
            <LanguageToggle />
          </div>
          <p className="subtitle">{t("subtitleLogin")}</p>
        </header>
        <div className="login-card">
          <p>{t("loginPrompt")}</p>
          {error && <p className="login-error">{error}</p>}
          <button className="login-btn" onClick={handleSignIn} disabled={signingIn}>
            {signingIn ? t("signingIn") : t("signIn")}
          </button>

          {!showAccess ? (
            <button
              type="button"
              className="access-link"
              onClick={() => { setShowAccess(true); setAccessErr(null); }}
            >
              {t("askAccess")}
            </button>
          ) : (
            <div className="access-form">
              {accessSent ? (
                <>
                  <h3>{t("accessSentTitle")}</h3>
                  <p className="access-hint">{t("accessSentMsg")}</p>
                </>
              ) : (
                <>
                  <h3>{t("accessTitle")}</h3>
                  <p className="access-hint">{t("accessHint")}</p>
                  <input
                    type="email"
                    placeholder={t("accessEmailPlaceholder")}
                    value={accessEmail}
                    onChange={(e) => setAccessEmail(e.target.value)}
                  />
                  <textarea
                    placeholder={t("accessMsgPlaceholder")}
                    value={accessMsg}
                    rows={3}
                    onChange={(e) => setAccessMsg(e.target.value)}
                  />
                  {accessErr && <p className="login-error">{accessErr}</p>}
                  <div className="access-actions">
                    <button type="button" className="access-cancel" onClick={() => setShowAccess(false)} disabled={accessSending}>
                      {t("cancel")}
                    </button>
                    <button type="button" className="access-send" onClick={sendAccessRequest} disabled={accessSending}>
                      {accessSending ? t("accessSending") : t("sendRequest")}
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner" />
        <p>{t("loading")}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error">
        <h2>{t("errorTitle")}</h2>
        <p>{error}</p>
        <button onClick={loadData}>{t("retry")}</button>
      </div>
    );
  }

  return (
    <div className="app">
      <header>
        <div className="header-top">
          <h1>{t("appTitle")}</h1>
          <LanguageToggle />
        </div>
        <p className="subtitle">{t("subtitleHost")}</p>
      </header>

      <div className="stats-bar">
        <div className="stat">
          <span className="stat-value">{players.length}</span>
          <span className="stat-label">{t("players")}</span>
        </div>
        <div className="stat">
          <span className="stat-value">{teams.length}</span>
          <span className="stat-label">{t("teams")}</span>
        </div>
        <div className="stat">
          <span className="stat-value">
            {players.reduce((s, p) => s + p.goals, 0)}
          </span>
          <span className="stat-label">{t("goals2026")}</span>
        </div>
      </div>

      {/* Favorites */}
      <div className="favorites-section">
        <h2>{t("favorites")}</h2>
        {favorites.length > 0 && (
          <div className="fav-list">
            {favorites.map((f) => {
              const player = players.find((p) => p.id === f.player_id);
              const team = player ? teams.find((t: any) => t.id === player.team_id || t.id === player["team_id"]) : null;
              const teamCode = player?.["team.code"] ?? team?.code ?? "";
              const teamName = player?.["team.name"] ?? team?.name ?? "";
              return (
              <div key={f.id} className="fav-row">
                <div className="fav-player">
                  <span className="fav-player-name">
                    ⚽ {player ? `${player.firstName} ` : ""}<strong>{player?.lastName ?? t("unknownPlayer")}</strong>
                    {teamCode ? ` (${teamCode})` : teamName ? ` (${teamName})` : ""}
                  </span>
                  {player && player.goals > 0 && (
                    <span className="fav-goals">{player.goals} {t("goalsWord")}</span>
                  )}
                </div>
                <span className="fav-user">{t("pickedBy")} <strong>{f.userName}</strong></span>
              </div>
              );
            })}
          </div>
        )}
        <div className="fav-form">
          <input
            type="text"
            placeholder={t("firstNamePlaceholder")}
            value={favName}
            onChange={(e) => setFavName(e.target.value)}
          />
          <select value={favPlayerId} onChange={(e) => setFavPlayerId(e.target.value)}>
            <option value="">{t("chooseScorer")}</option>
            {players.filter(p => p.goals > 0).map((p) => (
              <option key={p.id} value={p.id}>
                {p.firstName} {p.lastName} — {p.goals} {t("goalsWord")} ({p["team.code"]})
              </option>
            ))}
          </select>
          <button onClick={addFavorite}>{t("vote")}</button>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs">
        <button
          className={activeTab === "2026" ? "tab active" : "tab"}
          onClick={() => setActiveTab("2026")}
        >
          {t("tab2026")}
        </button>
        <button
          className={activeTab === "alltime" ? "tab active" : "tab"}
          onClick={() => setActiveTab("alltime")}
        >
          {t("tabAllTime")}
        </button>
      </div>

      <TeamFilter teams={filterableTeams} selected={selectedTeam} onSelect={setSelectedTeam} />

      {activeTab === "2026" ? (
      <Leaderboard players={season2026} mode="2026" favorites={favorites} teams={teams} />
      ) : (
      <Leaderboard players={allTimeSorted} mode="alltime" favorites={favorites} teams={teams} />
      )}
    </div>
  );
}
