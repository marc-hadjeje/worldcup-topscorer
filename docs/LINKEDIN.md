# LinkedIn post — draft

> Copy-paste ready. Suggested visual: `docs/screenshots/app-en.png` (leaderboard + votes)
> or `docs/architecture.png`.

---

⚽ I built a **"World Cup 2026 Top Scorer"** web app — from idea to production — on **Rayfin** + **Microsoft Fabric**. And honestly, the most impressive part is everything I did NOT have to do. 👇

With **Rayfin**, a single command gave me:
🗄️ a managed SQL database on Fabric (generated from my TypeScript entities)
🔐 Fabric SSO authentication
🌐 static hosting for my React front-end

Zero infrastructure to provision. I define my model (`Player`, `Team`, `Goal`…), I write my UI, and Rayfin deploys the rest on Fabric. That's exactly the "prototype → production" bridge that's usually missing.

Then I added the live-data layer with **Microsoft Fabric**:
🔄 a scheduled Data Pipeline (every 3h)
📓 a Python Notebook that pulls match stats from a football API and UPSERTs them in T-SQL
🔑 the API key secured in Azure Key Vault — no secret in the code

Everything authenticated end-to-end through Entra ID: SSO on the front, AAD token for the database, access policy for Key Vault.

The result: a complete, secure, self-refreshing app, built in "vibe-coding with guardrails" mode. The real value of Rayfin isn't just going fast — it's going fast WITHOUT sacrificing identity, data integrity and governance.

The code is open source 👇
https://github.com/marc-hadjeje/worldcup-topscorer

#MicrosoftFabric #Rayfin #DataEngineering #React #Azure #VibeCoding #WorldCup2026

---

## Short variant

⚽ A "World Cup 2026 Top Scorer" app built on **Rayfin** + **Microsoft Fabric**.

In one command, Rayfin gave me a SQL database, Fabric SSO auth and hosting — deployed on Fabric, no infra to manage. I added a Fabric pipeline (Python Notebook + Key Vault) that refreshes the stats every 3h in T-SQL.

Idea → production, secured end-to-end through Entra ID. 🚀

Repo 👉 https://github.com/marc-hadjeje/worldcup-topscorer

#MicrosoftFabric #Rayfin #Azure #DataEngineering
