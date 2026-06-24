"""Builds the Fabric Data Pipeline definition (pipeline-content.json). No secrets included."""
import json, base64, os

WS = "8af45ba5-7342-4a36-a332-91120bf9fa9c"
NB = "7e1dcfb1-f24e-477e-a46c-bc64f54e840a"

pipeline = {
    "properties": {
        "activities": [
            {
                "name": "Run update-worldcup-stats",
                "type": "TridentNotebook",
                "dependsOn": [],
                "policy": {
                    "timeout": "0.02:00:00",
                    "retry": 1,
                    "retryIntervalInSeconds": 60,
                    "secureInput": True,
                    "secureOutput": False,
                },
                "typeProperties": {
                    "notebookId": NB,
                    "workspaceId": WS,
                    "parameters": {
                        "apiKey":  {"value": "@pipeline().parameters.apiKey",  "type": "string"},
                        "apiHost": {"value": "@pipeline().parameters.apiHost", "type": "string"},
                        "league":  {"value": "@pipeline().parameters.league",  "type": "string"},
                        "season":  {"value": "@pipeline().parameters.season",  "type": "string"},
                    },
                },
            }
        ],
        "parameters": {
            "apiKey":  {"type": "string", "defaultValue": ""},
            "apiHost": {"type": "string", "defaultValue": "v3.football.api-sports.io"},
            "league":  {"type": "string", "defaultValue": "1"},
            "season":  {"type": "string", "defaultValue": "2026"},
        },
    }
}

out = os.path.join(os.path.dirname(__file__), "pipeline-content.json")
with open(out, "w", encoding="utf-8") as f:
    json.dump(pipeline, f, indent=2)
b64 = base64.b64encode(json.dumps(pipeline).encode("utf-8")).decode("ascii")
with open(os.path.join(os.path.dirname(__file__), "pipeline.b64"), "w") as f:
    f.write(b64)
print("wrote", out, "payload bytes:", len(b64))
