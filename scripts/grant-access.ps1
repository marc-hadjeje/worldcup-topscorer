<#
.SYNOPSIS
  Grant a person access to the World Cup Top Scorer app:
    1) invite them as a guest (B2B) into the tenant via Microsoft Graph,
    2) assign them a role on the Fabric workspace via the Fabric REST API.

.DESCRIPTION
  Uses the Azure CLI logged-in identity to acquire tokens for Microsoft Graph
  and the Fabric API. The signed-in user must be allowed to invite guests
  (Graph "User.Invite.All" / Guest Inviter) and must be an Admin of the
  target Fabric workspace.

.EXAMPLE
  .\grant-access.ps1 -Email someone@microsoft.com
  .\grant-access.ps1 -Email someone@microsoft.com -Role Member -Message "Welcome!"
#>
param(
  [Parameter(Mandatory = $true)]
  [string]$Email,

  [ValidateSet("Viewer", "Contributor", "Member", "Admin")]
  [string]$Role = "Viewer",

  [string]$WorkspaceId = "8af45ba5-7342-4a36-a332-91120bf9fa9c",

  [string]$AppUrl = "https://hasty-tarn-a20bfa49da-swedencentral.webapp.fabricapps.net",

  [string]$Message = "You've been granted access to the World Cup Top Scorer app."
)

$ErrorActionPreference = "Stop"

function Get-Token($resource) {
  $t = az account get-access-token --resource $resource --query accessToken -o tsv
  if (-not $t) { throw "Could not acquire a token for $resource. Run 'az login' first." }
  return $t
}

Write-Host "==> Inviting $Email as a guest..." -ForegroundColor Cyan
$graphToken = Get-Token "https://graph.microsoft.com"

$invitationBody = @{
  invitedUserEmailAddress = $Email
  inviteRedirectUrl       = $AppUrl
  sendInvitationMessage   = $true
  invitedUserMessageInfo  = @{ customizedMessageBody = $Message }
} | ConvertTo-Json -Depth 5

$invitation = Invoke-RestMethod -Method Post `
  -Uri "https://graph.microsoft.com/v1.0/invitations" `
  -Headers @{ Authorization = "Bearer $graphToken"; "Content-Type" = "application/json" } `
  -Body $invitationBody

$userObjectId = $invitation.invitedUser.id
Write-Host "    Guest user object id: $userObjectId" -ForegroundColor Green
Write-Host "    Invite redeem URL    : $($invitation.inviteRedeemUrl)"

Write-Host "==> Assigning '$Role' role on workspace $WorkspaceId..." -ForegroundColor Cyan
$fabricToken = Get-Token "https://api.fabric.microsoft.com"

$roleBody = @{
  principal = @{ id = $userObjectId; type = "User" }
  role      = $Role
} | ConvertTo-Json -Depth 5

try {
  Invoke-RestMethod -Method Post `
    -Uri "https://api.fabric.microsoft.com/v1/workspaces/$WorkspaceId/roleAssignments" `
    -Headers @{ Authorization = "Bearer $fabricToken"; "Content-Type" = "application/json" } `
    -Body $roleBody | Out-Null
  Write-Host "    Role assigned." -ForegroundColor Green
}
catch {
  $msg = $_.ErrorDetails.Message
  if ($msg -match "PrincipalAlreadyHasRoleAssignment" -or $msg -match "already") {
    Write-Host "    User already has a role on this workspace - skipping." -ForegroundColor Yellow
  }
  else { throw }
}

Write-Host ""
Write-Host "[OK] $Email can now sign in at $AppUrl" -ForegroundColor Green
