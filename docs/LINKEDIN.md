# Post LinkedIn — brouillon

> Copie-colle prête à l'emploi. Visuel suggéré : le schéma `docs/architecture.excalidraw`
> exporté en PNG (ou une capture du leaderboard de l'app).

---

⚽ J'ai construit une app « Meilleur Buteur de la Coupe du Monde 2026 » — de l'idée à la prod — sur **Rayfin** + **Microsoft Fabric**. Et honnêtement, le plus impressionnant c'est ce que je n'ai PAS eu à faire. 👇

Avec **Rayfin**, une seule commande me donne :
🗄️ une base de données SQL managée sur Fabric (générée depuis mes entités TypeScript)
🔐 l'authentification Fabric SSO
🌐 l'hébergement statique de mon front React

Zéro infra à provisionner. Je définis mon modèle (`Player`, `Team`, `Goal`…), je code mon UI, Rayfin déploie le reste sur Fabric. C'est exactement le pont « prototype → production » qui manque d'habitude.

Puis j'ai ajouté la couche temps réel avec **Microsoft Fabric** :
🔄 un Data Pipeline planifié (toutes les 3h)
📓 un Notebook Python qui récupère les stats des matchs via une API foot et fait des UPSERT en T-SQL
🔑 la clé API sécurisée dans Azure Key Vault — aucun secret dans le code

Le tout authentifié de bout en bout via Entra ID : SSO côté front, token AAD pour la base, access policy pour Key Vault.

Résultat : une app complète, sécurisée et auto-rafraîchissante, construite en mode « vibe-coding avec garde-fous ». La vraie valeur de Rayfin, ce n'est pas d'aller vite — c'est d'aller vite SANS sacrifier l'identité, l'intégrité des données et la gouvernance.

Le code est open source 👇
https://github.com/marc-hadjeje/worldcup-topscorer

#MicrosoftFabric #Rayfin #DataEngineering #React #Azure #VibeCoding #WorldCup2026

---

## Variante courte

⚽ Une app « Top Buteur Coupe du Monde 2026 » buildée sur **Rayfin** + **Microsoft Fabric**.

En une commande, Rayfin m'a donné base de données SQL, auth Fabric SSO et hébergement — déployés sur Fabric, sans infra à gérer. J'ai ajouté un pipeline Fabric (Notebook Python + Key Vault) qui rafraîchit les stats toutes les 3h en T-SQL.

Idée → prod, sécurisé de bout en bout via Entra ID. 🚀

Repo 👉 https://github.com/marc-hadjeje/worldcup-topscorer

#MicrosoftFabric #Rayfin #Azure #DataEngineering
