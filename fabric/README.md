# Fabric — Stats update pipeline

Automatically updates `dbo.Players` (goals + matches played) of the Rayfin SQL
database from the **Zafronix World Cup API**, every 3 hours.

## Deployed items (workspace `wks-demo-worldcup`)

| Item | Type | Role |
|---|---|---|
| `update-worldcup-stats` | Notebook | API call → aggregation → `UPDATE dbo.Players` (parameterized T-SQL) |
| `pl-update-worldcup-stats` | Data Pipeline | Runs the notebook · schedule every 3h |
| `zafronix-wc-key` | Key Vault secret | API key (never hard-coded) |

## Source files

| File | Description |
|---|---|
| `build_notebook_zafronix.py` | Generates `notebook-content.ipynb` (notebook source of truth) |
| `build_pipeline.py` | Generates `pipeline-content.json` |
| `notebook-content.ipynb` | Notebook definition (deployed through the Fabric API) |
| `pipeline-content.json` | Pipeline definition + parameters |

## How the notebook works

1. Reads the parameters `apiKey`, `apiHost` (`api.zafronix.com`), `season` (`2026`).
2. If `apiKey` is empty (the **schedule** case), it reads the secret from **Key Vault** via
   `notebookutils.credentials.getSecret(KEYVAULT_URL, "zafronix-wc-key")`.
3. `GET /fifa/worldcup/v1/matches?year=2026` → aggregates goals + appearances per player
   over the `finished` matches.
4. **Scorer-name cleaning**: scorer strings carry noise (`Havertz 45+5' pen`,
   `Kane 12' pen`, `Al-Arab 76' o.g`). The minute/penalty suffix is stripped,
   **own goals are excluded**, and matching is accent-insensitive and tolerant of
   compound surnames and leading initials (`J. David`).
5. Connects to the **Fabric SQL Database** with an AAD token
   (`notebookutils.credentials.getToken('https://database.windows.net/')`, ODBC Driver 18).
6. **Purges** the current 2026 stats (`goals`, `matchesPlayed` reset to 0), then
   `UPDATE dbo.Players SET goals = ?, matchesPlayed = ? WHERE id = ?` — parameterized.
   `allTimeGoals` (historical) is never touched.

## Redeploy after a change

```powershell
# 1. Regenerate the notebook definition
python build_notebook_zafronix.py

# 2. Update the definition in Fabric (REST API)
#    POST /v1/workspaces/{ws}/items/{notebookId}/updateDefinition
#    body: { definition: { format: "ipynb", parts: [{ path, payload(base64), payloadType:"InlineBase64" }] } }
```

## Manual run

In Fabric: open `pl-update-worldcup-stats` → **Run** → paste the key into the
`apiKey` parameter (or leave it empty to use Key Vault).

## Security

- The API key is **neither in the code nor in the repo**: Azure Key Vault only.
- The pipeline `apiKey` parameter is marked `secureInput` (not logged).
- Workspace / SQL Database IDs are not secrets (resources, protected by Entra ID).
