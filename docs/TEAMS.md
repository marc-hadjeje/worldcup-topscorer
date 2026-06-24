# Internal Teams post — draft (Microsoft)

> For an internal channel (e.g. a Rayfin / Fabric / community channel). Casual tone,
> colleague-to-colleague. Attach `docs/screenshots/app-en.png`.

---

🚀 **Weekend build: a World Cup 2026 "Top Scorer" app, fully on Rayfin + Fabric**

Hi all 👋 — I wanted to share a small end-to-end demo I put together to kick the tyres on **Rayfin**, and I'm genuinely impressed by how little plumbing I had to write.

**What it does:** a live leaderboard of the World Cup 2026 top scorers, an all-time tab, and a fun "favourites" feature where people vote for their favourite scorer (with their name). Bilingual FR/EN. 🇫🇷🇬🇧

**What Rayfin gave me in one command (`rayfin up`):**
- 🗄️ a managed **SQL database on Fabric**, scaffolded straight from my TypeScript entities
- 🔐 **Fabric SSO** (Entra ID) auth, no auth code to write
- 🌐 **static hosting** for the React/Vite front-end

**What I added on Fabric for the live data:**
- 📓 a Python **Notebook** + scheduled **Data Pipeline** (every 3h) that pulls match stats and UPSERTs them into the same SQL DB via parameterized T-SQL
- 🔑 the API key in **Azure Key Vault** (read at runtime by the notebook identity) — nothing hard-coded
- a small gotcha worth noting: the source API encodes scorer names with noise ("Havertz 45+5' pen", own goals as "o.g") — so the notebook cleans names and excludes own goals before aggregating

**Why I think it's worth a look:** it's the "prototype → production" path without giving up identity, data integrity or governance. Everything is Entra-authenticated end to end.

🔗 Live app: https://hasty-tarn-a20bfa49da-swedencentral.webapp.fabricapps.net
💻 Code (open source): https://github.com/marc-hadjeje/worldcup-topscorer

Happy to walk anyone through the setup or share the repo as a starting template. Feedback very welcome! 🙌

---

## Short variant (channel / DM)

Built a tiny World Cup 2026 "top scorer" app to try **Rayfin** end to end: one command gave me a Fabric SQL DB + Fabric SSO + hosting, and I added a Fabric pipeline (Notebook + Key Vault) that refreshes the stats every 3h. Idea → prod, Entra-authenticated throughout.

Live: https://hasty-tarn-a20bfa49da-swedencentral.webapp.fabricapps.net · Code: https://github.com/marc-hadjeje/worldcup-topscorer — feedback welcome! ⚽🚀
