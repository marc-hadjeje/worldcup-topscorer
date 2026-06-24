# ⚽ World Cup Top Scorer

Application web temps réel du **classement des meilleurs buteurs de la Coupe du Monde 2026**, construite de bout en bout sur **[Rayfin](https://aka.ms/rayfin)** et **Microsoft Fabric**.

Rayfin fournit en une commande **la base de données, l'authentification (Fabric SSO) et l'hébergement** — toute l'infra est managée sur Fabric. Un pipeline Fabric planifié garde les statistiques à jour automatiquement.

📐 **Architecture détaillée → [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)**

## Fonctionnalités

- 🏆 Classement des buteurs **CDM 2026** + classement **all-time** (légendes incluses)
- 🖼️ Photos et drapeaux des joueurs
- ⭐ Système de favoris avec vote nominatif
- 🔄 Stats rafraîchies **automatiquement toutes les 3h** via un pipeline Fabric
- 🔐 Authentification **Fabric SSO**, aucun secret dans le code

## Stack

React 19 · Vite · TypeScript · **Rayfin** (BaaS SQL + Auth + Hosting) · Microsoft Fabric (SQL Database, Data Pipeline, Notebook) · Azure Key Vault

## Structure

```
.
├── src/                 # Frontend React (App, Leaderboard, TeamFilter, rayfinClient)
├── rayfin/
│   ├── data/            # Entités du modèle (Team, Player, Goal, Favorite)
│   └── rayfin.yml       # Config Rayfin : auth, data (mssql), static hosting
├── scripts/seed.ts      # Seed des données via l'API Rayfin
├── fabric/              # Pipeline + Notebook Fabric de mise à jour des stats
└── docs/                # Architecture + schéma
```

## Démarrer

> Prérequis : Node 18+, Rayfin CLI (`npx @microsoft/rayfin-cli`), accès à un workspace Microsoft Fabric.

```bash
npm install

# Génère les variables d'env Rayfin (.env.local) depuis rayfin/.env
npx rayfin env --framework vite

# Lance le frontend en dev
npm run dev

# Build de production (servi par Rayfin Static Hosting)
npm run build
```

Déploiement de l'app (data + auth + hosting) sur Fabric via la Rayfin CLI :

```bash
npx rayfin deploy
```

## Mise à jour automatique des stats (Fabric)

Le dossier [`fabric/`](fabric) contient le **Notebook** et le **Data Pipeline** qui rafraîchissent `dbo.Players` (buts, matchs joués) depuis la Zafronix World Cup API, planifiés toutes les 3h, avec la clé API stockée dans **Azure Key Vault**. Détails et redéploiement : [`fabric/README.md`](fabric/README.md).

## Sécurité

Aucun secret n'est versionné. Les clés API vivent dans Azure Key Vault, les fichiers `.env*`, `rayfin/.env*`, `rayfin/.deployments.json` et `*.local` sont ignorés par git. Le `publishableKey` Rayfin (`pk-…`) est une clé publique côté client, sans risque.
