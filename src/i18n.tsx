import React, { createContext, useContext, useState, useCallback } from "react";

export type Lang = "fr" | "en";

type Dict = Record<string, string>;

const fr: Dict = {
  appTitle: "🏆 Coupe du Monde 2026",
  subtitleLogin: "Classement des Meilleurs Buteurs",
  subtitleHost: "USA · Mexique · Canada",
  loginPrompt: "Connectez-vous avec votre compte Microsoft Fabric pour accéder au classement.",
  signingIn: "Connexion en cours...",
  signIn: "🔐 Se connecter avec Fabric",
  authError: "Erreur d'authentification",
  loading: "Chargement des données...",
  loadError: "Erreur de chargement",
  errorTitle: "⚠️ Erreur",
  retry: "Réessayer",
  players: "Joueurs",
  teams: "Équipes",
  goals2026: "Buts 2026",
  favorites: "⭐ Favoris",
  unknownPlayer: "Joueur inconnu",
  goalsWord: "buts",
  pickedBy: "choisi par",
  firstNamePlaceholder: "Ton prénom (ex: Marc)",
  chooseScorer: "Choisis ton buteur favori",
  vote: "⭐ Voter",
  addFavError: "Erreur lors de l'ajout du favori",
  tab2026: "🏟️ Coupe du Monde 2026",
  tabAllTime: "🌍 Historique (toutes éditions)",
  colPlayer: "Joueur",
  colTeam: "Équipe",
  colGoalsTotal: "Buts (total)",
  colGoals2026: "Buts 2026",
  colAssists: "Passes D.",
  colMatches: "Matchs",
  colRatio: "Ratio",
  colVotes: "Votes",
  filterAll: "Tous",
};

const en: Dict = {
  appTitle: "🏆 World Cup 2026",
  subtitleLogin: "Top Scorers Leaderboard",
  subtitleHost: "USA · Mexico · Canada",
  loginPrompt: "Sign in with your Microsoft Fabric account to access the leaderboard.",
  signingIn: "Signing in...",
  signIn: "🔐 Sign in with Fabric",
  authError: "Authentication error",
  loading: "Loading data...",
  loadError: "Loading error",
  errorTitle: "⚠️ Error",
  retry: "Retry",
  players: "Players",
  teams: "Teams",
  goals2026: "2026 Goals",
  favorites: "⭐ Favorites",
  unknownPlayer: "Unknown player",
  goalsWord: "goals",
  pickedBy: "picked by",
  firstNamePlaceholder: "Your first name (e.g. Marc)",
  chooseScorer: "Choose your favorite scorer",
  vote: "⭐ Vote",
  addFavError: "Error while adding favorite",
  tab2026: "🏟️ World Cup 2026",
  tabAllTime: "🌍 All-time (all editions)",
  colPlayer: "Player",
  colTeam: "Team",
  colGoalsTotal: "Goals (total)",
  colGoals2026: "2026 Goals",
  colAssists: "Assists",
  colMatches: "Matches",
  colRatio: "Ratio",
  colVotes: "Votes",
  filterAll: "All",
};

const translations: Record<Lang, Dict> = { fr, en };

interface I18nContextValue {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: keyof typeof fr, vars?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    const stored = (typeof localStorage !== "undefined" && localStorage.getItem("lang")) as Lang | null;
    return stored === "en" || stored === "fr" ? stored : "fr";
  });

  const setLang = useCallback((l: Lang) => {
    try { localStorage.setItem("lang", l); } catch {}
    setLangState(l);
    if (typeof document !== "undefined") document.documentElement.lang = l;
  }, []);

  const t = useCallback(
    (key: keyof typeof fr, vars?: Record<string, string | number>) => {
      let s = translations[lang][key] ?? translations.fr[key] ?? String(key);
      if (vars) {
        for (const k of Object.keys(vars)) s = s.replace(`{${k}}`, String(vars[k]));
      }
      return s;
    },
    [lang]
  );

  return <I18nContext.Provider value={{ lang, setLang, t }}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within a LanguageProvider");
  return ctx;
}

export function LanguageToggle() {
  const { lang, setLang } = useI18n();
  return (
    <div className="lang-toggle" role="group" aria-label="Language">
      <button
        type="button"
        className={lang === "fr" ? "active" : ""}
        onClick={() => setLang("fr")}
        aria-pressed={lang === "fr"}
      >
        🇫🇷 FR
      </button>
      <button
        type="button"
        className={lang === "en" ? "active" : ""}
        onClick={() => setLang("en")}
        aria-pressed={lang === "en"}
      >
        🇬🇧 EN
      </button>
    </div>
  );
}
