<#
.SYNOPSIS
  One-time setup of the service principal used by the access-approval flow
  (Power Automate / Logic App). Creates an app registration with the Graph
  "User.Invite.All" application permission, grants admin consent, creates a
  client secret, and adds the service principal as Admin of the Fabric
  workspace.

.DESCRIPTION
  Run this ONCE as a tenant admin (the signed-in az identity must be able to
  create app registrations, grant admin consent, and administer the Fabric
  workspace). Copy the printed values into your Power Automate flow's two
  "HTTP" actions (Active Directory OAuth authentication).

  IMPORTANT (Fabric): the tenant admin setting
  "Service principals can use Fabric APIs" must be ENABLED, and the service
  principal must be in an allowed security group. Set this in:
  Fabric admin portal -> Tenant settings -> Developer settings.

.EXAMPLE
  .\setup-access-automation.ps1
#>
param(
  [string]$AppName = "wc-access-automation",
  [string]$WorkspaceId = "8af45ba5-7342-4a36-a332-91120bf9fa9c"
)

$ErrorActionPreference = "Stop"

$GRAPH_APP_ID = "00000003-0000-0000-c000-000000000000"
$USER_INVITE_ALL = "09850681-111b-4a89-9bed-3f2cae46d706"  # Graph app role: User.Invite.All

Write-Host "==> Creating app registration '$AppName'..." -ForegroundColor Cyan
$appId = az ad app create --display-name $AppName --query appId -o tsv
Write-Host "    appId: $appId"

# Ensure a service principal exists for the app
$spId = az ad sp list --filter "appId eq '$appId'" --query "[0].id" -o tsv
if (-not $spId) { $spId = az ad sp create --id $appId --query id -o tsv }
Write-Host "    service principal object id: $spId"

Write-Host "==> Adding Graph 'User.Invite.All' application permission..." -ForegroundColor Cyan
az ad app permission add --id $appId --api $GRAPH_APP_ID `
  --api-permissions "$USER_INVITE_ALL=Role" | Out-Null

Write-Host "==> Granting admin consent (may take a few seconds)..." -ForegroundColor Cyan
Start-Sleep -Seconds 10
az ad app permission admin-consent --id $appId

Write-Host "==> Creating client secret (valid 1 year)..." -ForegroundColor Cyan
$secret = az ad app credential reset --id $appId --append --years 1 --query password -o tsv

Write-Host "==> Adding the service principal as Admin of workspace $WorkspaceId..." -ForegroundColor Cyan
$fabricToken = az account get-access-token --resource https://api.fabric.microsoft.com --query accessToken -o tsv
$body = @{ principal = @{ id = $spId; type = "ServicePrincipal" }; role = "Admin" } | ConvertTo-Json -Depth 5
try {
  Invoke-RestMethod -Method Post `
    -Uri "https://api.fabric.microsoft.com/v1/workspaces/$WorkspaceId/roleAssignments" `
    -Headers @{ Authorization = "Bearer $fabricToken"; "Content-Type" = "application/json" } `
    -Body $body | Out-Null
  Write-Host "    Service principal added as workspace Admin." -ForegroundColor Green
}
catch {
  Write-Host "    Could not add the SP to the workspace automatically:" -ForegroundColor Yellow
  Write-Host "    $($_.ErrorDetails.Message)" -ForegroundColor Yellow
  Write-Host "    Add it manually (Workspace -> Manage access -> Add -> the app name -> Admin)" -ForegroundColor Yellow
}

$tenantId = az account show --query tenantId -o tsv

Write-Host ""
Write-Host "================ COPY INTO YOUR FLOW ================" -ForegroundColor Green
Write-Host "Tenant (Authority) : $tenantId"
Write-Host "Client ID          : $appId"
Write-Host "Client Secret      : $secret"
Write-Host "Graph audience     : https://graph.microsoft.com"
Write-Host "Fabric audience    : https://api.fabric.microsoft.com"
Write-Host "Workspace ID       : $WorkspaceId"
Write-Host "===================================================="
Write-Host "Store the secret in a safe place (e.g. Azure Key Vault). It is shown only once." -ForegroundColor Yellow
