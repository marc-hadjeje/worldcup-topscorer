# ⚽ World Cup Top Scorer

A real-time web app showing the **World Cup 2026 top-scorers leaderboard**, built end to end on **[Rayfin](https://aka.ms/rayfin)** and **Microsoft Fabric**.

Rayfin provides the **database, authentication (Fabric SSO) and hosting** in a single command — the whole infrastructure is managed on Fabric. A scheduled Fabric pipeline keeps the statistics up to date automatically.

🌐 The UI is **bilingual (FR / EN)** with a one-click language toggle.

📐 **Detailed architecture → [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)**

## Preview

![World Cup Top Scorer — leaderboard, votes and favourites](docs/screenshots/app-en.png)

<sub>Live leaderboard with the favourites / voting panel and the **Votes** column · bilingual FR / EN · all-time tab.</sub>

## Architecture

![Architecture](docs/architecture.png)

> Editable diagram: [`docs/architecture.excalidraw`](docs/architecture.excalidraw) · full write-up in [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

## 🗣️ The prompts behind this app

This whole app was built conversationally on **Rayfin** — from idea to a deployed Fabric app — starting with a single prompt:

> 💬 *"I want to create a Rayfin app in a new workspace on the theme of the World Cup — say, who will be the top scorer."*

…then refined with a few follow-up prompts:

- *"Add the World Cup 2026 data and let me add my favourite with my name."*
- *"Add thumbnail images of the top scorers."*
- *"I only want the 2026 top scorers plus an all-time top-scorers section; in the favourites, show who the favourite is and the name of the person who voted."*
- *"Build a Fabric pipeline that updates the match stats in my SQL database."*
- *"Add an FR / EN button and translate the docs to English."*

No infrastructure was provisioned by hand: Rayfin scaffolded the SQL database, Fabric SSO and hosting, and a Fabric pipeline keeps the stats fresh.

## Features

- 🏆 **WC 2026** scorers leaderboard + **all-time** leaderboard (legends included)
- 🌐 **FR / EN** language switch (persisted in `localStorage`)
- 🖼️ Player photos and flags
- ⭐ Favourites with named voting
- 🔄 Stats refreshed **automatically every 3 hours** through a Fabric pipeline
- 🔐 **Fabric SSO** authentication, no secret in the code

## Stack

React 19 · Vite · TypeScript · **Rayfin** (SQL BaaS + Auth + Hosting) · Microsoft Fabric (SQL Database, Data Pipeline, Notebook) · Azure Key Vault

## Structure

```
.
├── src/                 # React frontend (App, Leaderboard, TeamFilter, i18n, rayfinClient)
├── rayfin/
│   ├── data/            # Data model entities (Team, Player, Goal, Favorite)
│   └── rayfin.yml       # Rayfin config: auth, data (mssql), static hosting
├── scripts/seed.ts      # Data seeding through the Rayfin API
├── fabric/              # Fabric Pipeline + Notebook that refresh the stats
└── docs/                # Architecture + diagram + screenshots
```

## Getting started

> Prerequisites: Node 18+, Rayfin CLI (`npx @microsoft/rayfin-cli`), access to a Microsoft Fabric workspace.

```bash
npm install

# Generate the Rayfin env variables (.env.local) from rayfin/.env
npx rayfin env --framework vite

# Run the frontend in dev mode
npm run dev

# Production build (served by Rayfin Static Hosting)
npm run build
```

Deploy the app (data + auth + hosting) to Fabric with the Rayfin CLI:

```bash
npx rayfin deploy
```

## Automatic stats update (Fabric)

The [`fabric/`](fabric) folder contains the **Notebook** and **Data Pipeline** that refresh `dbo.Players` (goals, matches played) from the Zafronix World Cup API, scheduled every 3 hours, with the API key stored in **Azure Key Vault**. Details and redeployment: [`fabric/README.md`](fabric/README.md).

## Security

No secret is committed. API keys live in Azure Key Vault; the `.env*`, `rayfin/.env*`, `rayfin/.deployments.json` and `*.local` files are git-ignored. The Rayfin `publishableKey` (`pk-…`) is a public client-side key and is safe to commit.
