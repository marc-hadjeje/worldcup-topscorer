# Fabric — Pipeline de mise à jour des stats

Met à jour automatiquement `dbo.Players` (buts + matchs joués) de la base SQL Rayfin
à partir de la **Zafronix World Cup API**, toutes les 3 heures.

## Items déployés (workspace `wks-demo-worldcup`)

| Item | Type | Rôle |
|---|---|---|
| `update-worldcup-stats` | Notebook | Appel API → agrégation → `UPDATE dbo.Players` (T-SQL paramétré) |
| `pl-update-worldcup-stats` | Data Pipeline | Exécute le notebook · schedule toutes les 3h |
| `zafronix-wc-key` | Secret Key Vault | Clé API (jamais en dur) |

## Fichiers source

| Fichier | Description |
|---|---|
| `build_notebook_zafronix.py` | Génère `notebook-content.ipynb` (source de vérité du notebook) |
| `build_pipeline.py` | Génère `pipeline-content.json` |
| `notebook-content.ipynb` | Définition du notebook (déployée via l'API Fabric) |
| `pipeline-content.json` | Définition du pipeline + paramètres |

## Fonctionnement du notebook

1. Lit les paramètres `apiKey`, `apiHost` (`api.zafronix.com`), `season` (`2026`).
2. Si `apiKey` est vide (cas du **schedule**), lit le secret depuis **Key Vault** via
   `notebookutils.credentials.getSecret(KEYVAULT_URL, "zafronix-wc-key")`.
3. `GET /fifa/worldcup/v1/matches?year=2026` → agrège buts + apparitions par joueur
   sur les matchs `finished` (matching de noms tolérant aux accents / noms composés).
4. Se connecte à la **Fabric SQL Database** avec un token AAD
   (`notebookutils.credentials.getToken('https://database.windows.net/')`, ODBC Driver 18).
5. `UPDATE dbo.Players SET goals = ?, matchesPlayed = ? WHERE id = ?` — paramétré.
   `allTimeGoals` (historique) n'est jamais touché.

## Redéployer après modification

```powershell
# 1. Régénérer la définition du notebook
python build_notebook_zafronix.py

# 2. Mettre à jour la définition dans Fabric (API REST)
#    POST /v1/workspaces/{ws}/items/{notebookId}/updateDefinition
#    body : { definition: { format: "ipynb", parts: [{ path, payload(base64), payloadType:"InlineBase64" }] } }
```

## Exécution manuelle

Dans Fabric : ouvrir `pl-update-worldcup-stats` → **Run** → coller la clé dans le
paramètre `apiKey` (ou laisser vide pour utiliser Key Vault).

## Sécurité

- La clé API n'est **ni dans le code, ni dans le repo** : Azure Key Vault uniquement.
- Le paramètre `apiKey` du pipeline est marqué `secureInput` (non journalisé).
- Les IDs de workspace / SQL Database ne sont pas des secrets (ressources, protégées par Entra ID).
