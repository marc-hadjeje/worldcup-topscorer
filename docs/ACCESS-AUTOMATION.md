# Self-service access with approval

How a Microsoft employee can request access to the **World Cup Top Scorer** app
and be onboarded automatically **after Marc approves** — no manual steps.

```
Login screen "Send request"
        │  POST { email, message }
        ▼
Power Automate  ── "When an HTTP request is received"
        │
        ├─ Start and wait for an approval  ──▶  Marc (Teams / email)
        │        ├─ Rejected → (optional) notify requester
        │        └─ Approved ▼
        ├─ HTTP → Microsoft Graph : invite guest (B2B)
        └─ HTTP → Fabric REST     : assign Viewer role on the workspace
```

The two API calls are exactly what [`scripts/grant-access.ps1`](../scripts/grant-access.ps1)
does manually; the flow just runs them after approval, as a service principal.

---

## 1. One-time setup — service principal

Run once, as a tenant admin:

```powershell
.\scripts\setup-access-automation.ps1
```

It creates an app registration with the Graph **`User.Invite.All`** application
permission (admin-consented), a client secret, and adds the service principal as
**Admin** of the Fabric workspace. It prints the values to paste into the flow.

> **Fabric prerequisite:** enable **"Service principals can use Fabric APIs"** in
> the Fabric admin portal → *Tenant settings* → *Developer settings*, and make
> sure the SP is in an allowed security group.

Store the client secret in **Azure Key Vault** (e.g. `kv-wc-*`), not in code.

---

## 2. The Power Automate flow

**Trigger — "When an HTTP request is received"** with this JSON schema:

```json
{
  "type": "object",
  "properties": {
    "email":   { "type": "string" },
    "message": { "type": "string" },
    "app":     { "type": "string" }
  }
}
```

Save the flow once to generate the trigger **HTTP POST URL** — you'll put it in
the app (step 3).

**Action — "Start and wait for an approval"**
- Approval type: *Approve/Reject – First to respond*
- Assigned to: `marc.hadjeje@microsoft.com`
- Title: `Access request — World Cup Top Scorer`
- Details: `Requester: @{triggerBody()?['email']}  —  @{triggerBody()?['message']}`

**Condition** — `Outcome` is equal to `Approve`. In the **If yes** branch:

**Action — HTTP (invite guest via Graph)**
- Method: `POST`
- URI: `https://graph.microsoft.com/v1.0/invitations`
- Headers: `Content-Type: application/json`
- Body:
  ```json
  {
    "invitedUserEmailAddress": "@{triggerBody()?['email']}",
    "inviteRedirectUrl": "https://hasty-tarn-a20bfa49da-swedencentral.webapp.fabricapps.net",
    "sendInvitationMessage": true
  }
  ```
- Authentication: **Active Directory OAuth**
  - Authority `https://login.microsoftonline.com`, Tenant = *tenant id*
  - Audience `https://graph.microsoft.com`
  - Client ID / Secret = from the setup script

Capture the new user's object id from the response: `@{body('HTTP_invite')?['invitedUser']?['id']}`.

**Action — HTTP (assign Fabric role)**
- Method: `POST`
- URI: `https://api.fabric.microsoft.com/v1/workspaces/8af45ba5-7342-4a36-a332-91120bf9fa9c/roleAssignments`
- Headers: `Content-Type: application/json`
- Body:
  ```json
  {
    "principal": { "id": "@{body('HTTP_invite')?['invitedUser']?['id']}", "type": "User" },
    "role": "Viewer"
  }
  ```
- Authentication: **Active Directory OAuth**, Audience `https://api.fabric.microsoft.com`,
  same Client ID / Secret.

> If the app's data plane doesn't load for a Viewer, use `Member` instead.

(Optional) In the **If no** branch, send the requester a "request declined" mail.

---

## 3. Wire the app to the flow

The "Send request" button posts to the flow when `VITE_ACCESS_WEBHOOK_URL` is set;
otherwise it falls back to a `mailto:` to Marc.

Set the trigger URL at build time, e.g. in `rayfin/.env` (git-ignored):

```
VITE_ACCESS_WEBHOOK_URL=https://prod-xx.westeurope.logic.azure.com:443/workflows/.../triggers/manual/paths/invoke?...
```

Then redeploy:

```powershell
npx rayfin up -y
```

The browser sends the request with `mode: "no-cors"` (fire-and-forget), so the
flow URL doesn't need CORS configuration. The user sees a confirmation and is
emailed an invitation once Marc approves.

---

## Security notes

- The service principal is the only identity that can invite/grant — scoped to
  `User.Invite.All` + workspace Admin. No personal credentials in the flow.
- Keep the client secret in Key Vault; rotate it before expiry.
- The trigger URL contains a SAS signature — treat it as a secret (it's only a
  request intake; nothing is granted without approval).
