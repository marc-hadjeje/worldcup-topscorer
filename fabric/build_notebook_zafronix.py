"""Builds the Fabric notebook ipynb for update-worldcup-stats using the Zafronix
World Cup API (2026 finished matches). No secrets are included in this file."""
import json, base64, os

cells_src = []

# 0. Parameters cell (tagged 'parameters' so the pipeline can override these)
cells_src.append(("parameters", r'''# PARAMETERS CELL -- values here are overridden by the pipeline at runtime.
# apiKey is a SECRET (Zafronix read key, e.g. zwc_free_...) supplied by the pipeline.
apiKey  = ""                    # injected by pipeline (Fabric pipeline parameter)
apiHost = "api.zafronix.com"    # Zafronix host
league  = "WC"                  # unused for Zafronix; kept for pipeline compatibility
season  = "2026"                # tournament year
'''))

# 1. Constants
cells_src.append((None, r'''# --- Target Fabric SQL Database (worldcup-topscorer) ---
SERVER      = "filsoiygbkaulmvzrvxodo4zyy-uvn7jcscom3evizssejax6p2tq.database.fabric.microsoft.com,1433"
DATABASE    = "worldcup-topscorer-06832c9e-ac5d-4b2f-a7a0-eb698a6913c8"
DB_RESOURCE = "https://database.windows.net/"
ODBC_DRIVER = "ODBC Driver 18 for SQL Server"

# --- Secret source (used when the apiKey parameter is left empty, e.g. scheduled runs) ---
KEYVAULT_URL = "https://kv-wc-kf2pj4.vault.azure.net/"
SECRET_NAME  = "zafronix-wc-key"
'''))

# 2. Imports
cells_src.append((None, r'''import json, struct, unicodedata, sys
import requests
try:
    import pyodbc
except ImportError:
    import subprocess
    subprocess.check_call([sys.executable, "-m", "pip", "install", "pyodbc"])
    import pyodbc
print("imports ok")
'''))

# 3. Call Zafronix matches for the tournament year
cells_src.append((None, r'''if not apiKey:
    # No key passed as a parameter (e.g. scheduled run) -> read it from Key Vault
    # using the notebook's runtime identity. The secret is never stored in code.
    apiKey = notebookutils.credentials.getSecret(KEYVAULT_URL, SECRET_NAME)
    print("apiKey loaded from Key Vault")
if not apiKey:
    raise ValueError("apiKey is empty and could not be read from Key Vault.")

url = f"https://{apiHost}/fifa/worldcup/v1/matches"
headers = {"X-API-Key": apiKey}
resp = requests.get(url, headers=headers, params={"year": season}, timeout=90)
resp.raise_for_status()
data = resp.json()
matches = data.get("data", []) or []
finished = [m for m in matches if (m.get("status") == "finished")]
print(f"Tournament {season}: {len(matches)} matches, {len(finished)} finished")
'''))

# 4. Normalize + aggregate appearances and goals per player
cells_src.append((None, r'''def normalize(s):
    if not s:
        return ""
    s = unicodedata.normalize("NFKD", str(s))
    s = "".join(c for c in s if not unicodedata.combining(c))
    return s.strip().lower()

def last_token(norm_name):
    parts = [p for p in norm_name.split(" ") if p]
    return parts[-1] if parts else ""

def clean_scorer(s):
    # Zafronix scorer strings carry noise: "Havertz 45+5' pen", "Kane 12' pen",
    # "Al-Arab 76' o.g". Keep only the name part; drop own goals entirely.
    if not s:
        return None
    low = s.lower()
    if "o.g" in low or "(og)" in low or low.endswith(" og"):
        return None
    out = []
    for tk in s.split():
        if any(c.isdigit() for c in tk) or "'" in tk or "+" in tk:
            break
        if tk.lower() in ("pen", "pen.", "p.", "o.g", "og"):
            break
        out.append(tk)
    return " ".join(out) if out else None

# appearances: how many finished matches each lineup player featured in (started or named)
appearances = {}          # normFull -> count
display_name = {}         # normFull -> original display name
goals_by_full = {}        # normFull -> goal count (resolved via lineup)
goals_by_surname = {}     # normSurname -> goal count (fallback when not resolved)

for m in finished:
    lineups = m.get("lineups") or {}
    side_norm = {"home": [], "away": []}
    for side in ("home", "away"):
        for pl in (lineups.get(side) or []):
            nm = pl.get("player")
            if not nm:
                continue
            nf = normalize(nm)
            appearances[nf] = appearances.get(nf, 0) + 1
            display_name.setdefault(nf, nm)
            side_norm[side].append(nf)
    for g in (m.get("goals") or []):
        scorer = clean_scorer(g.get("scorer"))
        if scorer is None:                 # empty or own goal -> not credited
            continue
        ns = normalize(scorer)
        ns_last = last_token(ns)
        team_side = g.get("team")  # "home" | "away"
        candidates = side_norm.get(team_side, []) if team_side in side_norm else (side_norm["home"] + side_norm["away"])
        # match the surname against the scoring side's lineup by last token (or as a token)
        hits = [nf for nf in candidates if last_token(nf) == ns_last or ns_last in nf.split(" ")]
        # if the scorer is given as "J. David", disambiguate by the leading initial
        if len(hits) > 1 and len(ns.split(" ")[0].replace(".", "")) == 1:
            ini = ns.split(" ")[0][0]
            f = [nf for nf in hits if nf and nf[0] == ini]
            if f:
                hits = f
        if hits:
            goals_by_full[hits[0]] = goals_by_full.get(hits[0], 0) + 1
        else:
            goals_by_surname[ns_last] = goals_by_surname.get(ns_last, 0) + 1

print(f"Aggregated appearances for {len(appearances)} players; goal-scorers (resolved): {len(goals_by_full)}, (unresolved surnames): {len(goals_by_surname)}")
'''))

# 5. Connect + load players (runtime AAD identity -> db token)
cells_src.append((None, r'''token = notebookutils.credentials.getToken(DB_RESOURCE)
SQL_COPT_SS_ACCESS_TOKEN = 1256
tb = token.encode("utf-16-le")
token_struct = struct.pack(f"<I{len(tb)}s", len(tb), tb)
conn = pyodbc.connect(
    f"Driver={{{ODBC_DRIVER}}};Server={SERVER};Database={DATABASE};Encrypt=yes;TrustServerCertificate=no",
    attrs_before={SQL_COPT_SS_ACCESS_TOKEN: token_struct}, timeout=60)
cur = conn.cursor()
cur.execute("SELECT id, firstName, lastName FROM dbo.Players")
players = cur.fetchall()
print(f"Loaded {len(players)} players from dbo.Players")
'''))

# 6. Match Zafronix players to dbo.Players and UPDATE
cells_src.append((None, r'''# Build a Zafronix index by surname last-token -> list of normalized full names.
zaf_by_last = {}
for nf in appearances:
    zaf_by_last.setdefault(last_token(nf), []).append(nf)

updated, unmatched = [], []
# PURGE: reset 2026 stats so stale/removed values are cleared before re-aggregation.
# allTimeGoals (historical) and assists are left untouched.
cur.execute("UPDATE dbo.Players SET goals = 0, matchesPlayed = 0")
for r in players:
    db_first = normalize(r.firstName)
    db_last_full = normalize(r.lastName)          # e.g. "de andrade"
    db_last = last_token(db_last_full)            # e.g. "andrade"
    cands = zaf_by_last.get(db_last, [])
    if not cands and db_last_full:
        # try the leading token of a compound surname too (rare)
        cands = zaf_by_last.get(db_last_full.split(" ")[0], [])
    target = None
    if len(cands) == 1:
        target = cands[0]
    elif len(cands) > 1:
        # disambiguate by first name token present in the Zafronix full name
        fm = [nf for nf in cands if db_first and db_first in nf.split(" ")]
        target = fm[0] if len(fm) == 1 else cands[0]
    if target is None:
        # fallback: surname-only goals with no lineup appearance (still update goals, keep matchesPlayed)
        if db_last in goals_by_surname:
            cur.execute("UPDATE dbo.Players SET goals = ? WHERE id = ?", goals_by_surname[db_last], r.id)
            updated.append((f"{r.firstName} {r.lastName}", goals_by_surname[db_last], None))
        else:
            unmatched.append(f"{r.firstName} {r.lastName}")
        continue
    apps = appearances.get(target, 0)
    g = goals_by_full.get(target, 0)
    if not g and db_last in goals_by_surname:
        g = goals_by_surname[db_last]
    # Parameterized UPDATE -- never string-concatenate API data. allTimeGoals left untouched.
    cur.execute("UPDATE dbo.Players SET goals = ?, matchesPlayed = ? WHERE id = ?", g, apps, r.id)
    updated.append((f"{r.firstName} {r.lastName}", g, apps))

conn.commit()
print(f"Updated: {len(updated)} | Unmatched (left unchanged): {len(unmatched)}")
for n, g, a in sorted(updated, key=lambda x: -(x[1] or 0)):
    print(f"  UPDATED {n}: goals={g}, matchesPlayed={a}")
if unmatched:
    print("  NO MATCH in Zafronix 2026 lineups/goals:", unmatched)
conn.close()
print("done")
'''))

def make_cell(tag, src):
    lines = src.splitlines(keepends=True)
    md = {}
    if tag:
        md["tags"] = [tag]
    return {"cell_type": "code", "source": lines, "metadata": md,
            "execution_count": None, "outputs": []}

nb = {
    "nbformat": 4,
    "nbformat_minor": 5,
    "cells": [make_cell(t, s) for t, s in cells_src],
    "metadata": {
        "language_info": {"name": "python"},
        "kernelspec": {"name": "synapse_pyspark", "display_name": "Synapse PySpark"},
        "microsoft": {"language": "python"},
    },
}

out = os.path.join(os.path.dirname(__file__), "notebook-content.ipynb")
with open(out, "w", encoding="utf-8") as f:
    json.dump(nb, f, indent=1)
print("wrote", out)
b64 = base64.b64encode(json.dumps(nb).encode("utf-8")).decode("ascii")
with open(os.path.join(os.path.dirname(__file__), "notebook.b64"), "w") as f:
    f.write(b64)
print("payload bytes:", len(b64))
