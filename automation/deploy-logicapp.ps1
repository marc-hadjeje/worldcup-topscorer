<#
.SYNOPSIS
  Deploy the access-approval Logic App and wire its managed identity.

.DESCRIPTION
  1) Deploys automation/access-approval.logicapp.json into a resource group.
  2) Grants the Logic App's system-assigned managed identity the Microsoft
     Graph "User.Invite.All" application permission.
  3) Adds the managed identity as a member of the Fabric workspace.
  4) Prints the HTTP trigger URL to put in VITE_ACCESS_WEBHOOK_URL.

  Run as a tenant admin (must be able to grant Graph app roles and administer
  the Fabric workspace). Requires the Azure CLI, logged in (az login).

.EXAMPLE
  .\deploy-logicapp.ps1 -ResourceGroup rg-worldcup -Location westeurope
#>
param(
  [Parameter(Mandatory = $true)] [string]$ResourceGroup,
  [string]$Location = "westeurope",
  [string]$LogicAppName = "la-wc-access-approval",
  [string]$WorkspaceId = "8af45ba5-7342-4a36-a332-91120bf9fa9c",
  [ValidateSet("Viewer", "Contributor", "Member", "Admin")] [string]$FabricRole = "Viewer"
)

$ErrorActionPreference = "Stop"
$templatePath = Join-Path $PSScriptRoot "access-approval.logicapp.json"
$GRAPH_APP_ID = "00000003-0000-0000-c000-000000000000"
$USER_INVITE_ALL = "09850681-111b-4a89-9bed-3f2cae46d706"  # Graph app role: User.Invite.All

Write-Host "==> Ensuring resource group '$ResourceGroup' ($Location)..." -ForegroundColor Cyan
az group create --name $ResourceGroup --location $Location | Out-Null

Write-Host "==> Deploying Logic App '$LogicAppName'..." -ForegroundColor Cyan
$deploy = az deployment group create `
  --resource-group $ResourceGroup `
  --template-file $templatePath `
  --parameters logicAppName=$LogicAppName location=$Location workspaceId=$WorkspaceId fabricRole=$FabricRole `
  -o json | ConvertFrom-Json

$miId = $deploy.properties.outputs.principalId.value
Write-Host "    Managed identity object id: $miId" -ForegroundColor Green

Write-Host "==> Granting Graph 'User.Invite.All' to the managed identity..." -ForegroundColor Cyan
$graphSpId = az ad sp show --id $GRAPH_APP_ID --query id -o tsv
$roleBody = @{ principalId = $miId; resourceId = $graphSpId; appRoleId = $USER_INVITE_ALL } | ConvertTo-Json -Compress
# Retry: the managed identity SP can take a few seconds to propagate
for ($i = 0; $i -lt 6; $i++) {
  try {
    az rest --method post `
      --uri "https://graph.microsoft.com/v1.0/servicePrincipals/$miId/appRoleAssignments" `
      --headers "Content-Type=application/json" --body $roleBody | Out-Null
    Write-Host "    Graph permission granted." -ForegroundColor Green
    break
  }
  catch {
    if ($i -eq 5) { Write-Host "    Could not grant Graph permission automatically: $($_.Exception.Message)" -ForegroundColor Yellow }
    else { Start-Sleep -Seconds 10 }
  }
}

Write-Host "==> Adding the managed identity to workspace $WorkspaceId ($FabricRole)..." -ForegroundColor Cyan
$fabricToken = az account get-access-token --resource https://api.fabric.microsoft.com --query accessToken -o tsv
$wsBody = @{ principal = @{ id = $miId; type = "ServicePrincipal" }; role = $FabricRole } | ConvertTo-Json -Depth 5
try {
  Invoke-RestMethod -Method Post `
    -Uri "https://api.fabric.microsoft.com/v1/workspaces/$WorkspaceId/roleAssignments" `
    -Headers @{ Authorization = "Bearer $fabricToken"; "Content-Type" = "application/json" } `
    -Body $wsBody | Out-Null
  Write-Host "    Added to workspace." -ForegroundColor Green
}
catch {
  Write-Host "    Could not add to workspace automatically: $($_.ErrorDetails.Message)" -ForegroundColor Yellow
  Write-Host "    Add it manually (Workspace -> Manage access -> Add '$LogicAppName')." -ForegroundColor Yellow
}

Write-Host "==> Reading the HTTP trigger URL..." -ForegroundColor Cyan
$sub = az account show --query id -o tsv
$cb = az rest --method post `
  --uri "https://management.azure.com/subscriptions/$sub/resourceGroups/$ResourceGroup/providers/Microsoft.Logic/workflows/$LogicAppName/triggers/manual/listCallbackUrl?api-version=2016-06-01" `
  -o json | ConvertFrom-Json
$triggerUrl = $cb.value

Write-Host ""
Write-Host "================ NEXT STEPS ================" -ForegroundColor Green
Write-Host "1) Authorize the Office 365 connection (one click):"
Write-Host "   Azure portal -> Resource group '$ResourceGroup' -> API Connection 'office365-wc-approval' -> Edit API connection -> Authorize -> Save"
Write-Host "   (sign in as the approver mailbox owner)"
Write-Host ""
Write-Host "2) Enable 'Service principals can use Fabric APIs' in the Fabric admin portal"
Write-Host "   (Tenant settings -> Developer settings) and include the managed identity."
Write-Host ""
Write-Host "3) Set the app webhook and redeploy:"
Write-Host "   VITE_ACCESS_WEBHOOK_URL=$triggerUrl"
Write-Host "   (put it in rayfin/.env, then: npx rayfin up -y)"
Write-Host "==========================================="
