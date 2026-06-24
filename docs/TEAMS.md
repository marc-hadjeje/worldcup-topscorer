# Post Teams interne — brouillon (Microsoft)

> Pour un canal interne (ex. canal Rayfin / Fabric / communauté). Ton décontracté,
> entre collègues. Joindre `docs/screenshots/app-en.png`.

---

🚀 **Build d'un week-end : une appli « Meilleur Buteur » Coupe du Monde 2026, 100 % Rayfin + Fabric**

Salut à toutes et à tous 👋 — je voulais partager une petite démo de bout en bout que j'ai montée pour tester **Rayfin**, et franchement je suis bluffé par la quantité de plomberie que je n'ai **pas** eu à écrire.

**Ce que ça fait :** un classement en direct des meilleurs buteurs de la CDM 2026, un onglet « toutes éditions », et une feature « favoris » sympa où chacun vote pour son buteur préféré (avec son nom). Bilingue FR/EN. 🇫🇷🇬🇧

**Ce que Rayfin m'a donné en une seule commande (`rayfin up`) :**
- 🗄️ une **base SQL managée sur Fabric**, générée directement depuis mes entités TypeScript
- 🔐 l'auth **Fabric SSO** (Entra ID), sans une ligne de code d'authentification
- 🌐 l'**hébergement statique** du front React/Vite

**Ce que j'ai ajouté sur Fabric pour la donnée live :**
- 📓 un **Notebook** Python + un **Data Pipeline** planifié (toutes les 3h) qui récupère les stats des matchs et fait des UPSERT dans la même base SQL via du T-SQL paramétré
- 🔑 la clé API dans **Azure Key Vault** (lue au runtime par l'identité du notebook) — rien en dur
- un petit piège à signaler : l'API source encode les noms de buteurs avec du bruit (« Havertz 45+5' pen », les csc en « o.g ») — le notebook nettoie donc les noms et exclut les csc avant d'agréger

**Pourquoi ça vaut le coup d'œil :** c'est le chemin « prototype → prod » sans sacrifier l'identité, l'intégrité des données ni la gouvernance. Tout est authentifié via Entra ID de bout en bout.

🔗 App en ligne : https://hasty-tarn-a20bfa49da-swedencentral.webapp.fabricapps.net
💻 Code (open source) : https://github.com/marc-hadjeje/worldcup-topscorer

Avec plaisir pour faire une démo du setup à qui veut, ou partager le repo comme template de départ. Vos retours sont les bienvenus ! 🙌

---

## Variante courte (canal / DM)

J'ai monté une petite appli « top buteur » CDM 2026 pour tester **Rayfin** de bout en bout : une commande m'a donné une base SQL Fabric + Fabric SSO + hébergement, et j'ai ajouté un pipeline Fabric (Notebook + Key Vault) qui rafraîchit les stats toutes les 3h. Idée → prod, authentifié via Entra ID partout.

En ligne : https://hasty-tarn-a20bfa49da-swedencentral.webapp.fabricapps.net · Code : https://github.com/marc-hadjeje/worldcup-topscorer — vos retours sont les bienvenus ! ⚽🚀
