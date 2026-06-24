import React, { useEffect, useState, useCallback } from "react";
import { client, fabricOptions } from "./rayfinClient.js";
import { ensureSignedInWithFabric, initEmbeddedAuth } from "@microsoft/rayfin-auth-provider-fabric";
import { Leaderboard } from "./Leaderboard.js";
import { TeamFilter } from "./TeamFilter.js";

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
      setError(e.message ?? "Erreur d'authentification");
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
        ]).orderBy({ goals: "desc" }).execute(),
        client.data.Team.select(["id", "name", "code", "group"])
          .orderBy({ name: "asc" }).execute(),
        client.data.Favorite.select([
          "id", "userName", "player_id",
        ]).execute(),
      ]);
      setPlayers(playersRes as any);
      setTeams(teamsRes as any);
      setFavorites(favsRes as any);
    } catch (e: any) {
      setError(e.message ?? "Erreur de chargement");
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
      setError(e.message ?? "Erreur lors de l'ajout du favori");
    }
  }

  const filtered = selectedTeam
    ? players.filter((p) => p.team_id === selectedTeam)
    : players;

  // Sort by allTimeGoals for the all-time tab
  const allTimeSorted = [...filtered].sort((a, b) => b.allTimeGoals - a.allTimeGoals);

  if (!isAuthenticated && !loading) {
    return (
      <div className="app">
        <header>
          <h1>🏆 Coupe du Monde 2026</h1>
          <p className="subtitle">Classement des Meilleurs Buteurs</p>
        </header>
        <div className="login-card">
          <p>Connectez-vous avec votre compte Microsoft Fabric pour accéder au classement.</p>
          {error && <p className="login-error">{error}</p>}
          <button className="login-btn" onClick={handleSignIn} disabled={signingIn}>
            {signingIn ? "Connexion en cours..." : "🔐 Se connecter avec Fabric"}
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner" />
        <p>Chargement des données...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error">
        <h2>⚠️ Erreur</h2>
        <p>{error}</p>
        <button onClick={loadData}>Réessayer</button>
      </div>
    );
  }

  return (
    <div className="app">
      <header>
        <h1>🏆 Coupe du Monde 2026</h1>
        <p className="subtitle">USA · Mexique · Canada</p>
      </header>

      <div className="stats-bar">
        <div className="stat">
          <span className="stat-value">{players.length}</span>
          <span className="stat-label">Joueurs</span>
        </div>
        <div className="stat">
          <span className="stat-value">{teams.length}</span>
          <span className="stat-label">Équipes</span>
        </div>
        <div className="stat">
          <span className="stat-value">
            {players.reduce((s, p) => s + p.goals, 0)}
          </span>
          <span className="stat-label">Buts 2026</span>
        </div>
      </div>

      {/* Favorites */}
      <div className="favorites-section">
        <h2>⭐ Favoris</h2>
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
                    ⚽ {player ? `${player.firstName} ` : ""}<strong>{player?.lastName ?? "Joueur inconnu"}</strong>
                    {teamCode ? ` (${teamCode})` : teamName ? ` (${teamName})` : ""}
                  </span>
                  {player && player.goals > 0 && (
                    <span className="fav-goals">{player.goals} buts</span>
                  )}
                </div>
                <span className="fav-user">choisi par <strong>{f.userName}</strong></span>
              </div>
              );
            })}
          </div>
        )}
        <div className="fav-form">
          <input
            type="text"
            placeholder="Ton prénom (ex: Marc)"
            value={favName}
            onChange={(e) => setFavName(e.target.value)}
          />
          <select value={favPlayerId} onChange={(e) => setFavPlayerId(e.target.value)}>
            <option value="">Choisis ton buteur favori</option>
            {players.filter(p => p.goals > 0).map((p) => (
              <option key={p.id} value={p.id}>
                {p.firstName} {p.lastName} — {p.goals} buts ({p["team.code"]})
              </option>
            ))}
          </select>
          <button onClick={addFavorite}>⭐ Voter</button>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs">
        <button
          className={activeTab === "2026" ? "tab active" : "tab"}
          onClick={() => setActiveTab("2026")}
        >
          🏟️ Coupe du Monde 2026
        </button>
        <button
          className={activeTab === "alltime" ? "tab active" : "tab"}
          onClick={() => setActiveTab("alltime")}
        >
          🌍 Historique (toutes éditions)
        </button>
      </div>

      <TeamFilter teams={teams} selected={selectedTeam} onSelect={setSelectedTeam} />

      {activeTab === "2026" ? (
      <Leaderboard players={filtered} mode="2026" favorites={favorites} />
      ) : (
      <Leaderboard players={allTimeSorted} mode="alltime" favorites={favorites} />
      )}
    </div>
  );
}
