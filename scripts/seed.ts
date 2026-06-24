/**
 * Seed script — Injects World Cup 2022 data via raw GraphQL mutations.
 * Uses Azure CLI token for Fabric auth.
 * Run: npx tsx scripts/seed.ts
 */

const FABRIC_API_URL =
  "https://0a90751b9e0a40d0aec000b9e5b81e97.pbidedicated.windows.net/webapi/capacities/0a90751b-9e0a-40d0-aec0-00b9e5b81e97/workloads/BaaS/BaaSService/automatic/v1/workspaces/8af45ba5-7342-4a36-a332-91120bf9fa9c/appbackends/d68334ad-184a-40f6-9ad4-28e7906a54c3";

async function getToken(): Promise<string> {
  const { execSync } = await import("child_process");
  const result = execSync("az account get-access-token --resource https://analysis.windows.net/powerbi/api --query accessToken -o tsv", { encoding: "utf-8" });
  return result.trim();
}

async function gql(query: string, variables: Record<string, any>, token: string) {
  const res = await fetch(`${FABRIC_API_URL}/api/graphql`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ query, variables }),
  });
  const json = await res.json();
  if (json.errors) {
    throw new Error(JSON.stringify(json.errors, null, 2));
  }
  return json.data;
}

const teams = [
  { name: "France", code: "FRA", group: "Groupe D" },
  { name: "Argentine", code: "ARG", group: "Groupe C" },
  { name: "Brésil", code: "BRA", group: "Groupe G" },
  { name: "Angleterre", code: "ENG", group: "Groupe B" },
  { name: "Allemagne", code: "GER", group: "Groupe E" },
  { name: "Espagne", code: "ESP", group: "Groupe E" },
  { name: "Portugal", code: "POR", group: "Groupe H" },
  { name: "Pays-Bas", code: "NED", group: "Groupe A" },
];

const playersByTeam: Record<string, Array<{ firstName: string; lastName: string; number: string; position: string; goals: number; assists: number; matchesPlayed: number }>> = {
  FRA: [
    { firstName: "Kylian", lastName: "Mbappé", number: "10", position: "Attaquant", goals: 8, assists: 2, matchesPlayed: 7 },
    { firstName: "Olivier", lastName: "Giroud", number: "9", position: "Attaquant", goals: 4, assists: 0, matchesPlayed: 7 },
    { firstName: "Antoine", lastName: "Griezmann", number: "7", position: "Milieu", goals: 2, assists: 3, matchesPlayed: 7 },
    { firstName: "Ousmane", lastName: "Dembélé", number: "11", position: "Attaquant", goals: 1, assists: 2, matchesPlayed: 5 },
  ],
  ARG: [
    { firstName: "Lionel", lastName: "Messi", number: "10", position: "Attaquant", goals: 7, assists: 3, matchesPlayed: 7 },
    { firstName: "Julián", lastName: "Álvarez", number: "9", position: "Attaquant", goals: 4, assists: 0, matchesPlayed: 7 },
    { firstName: "Enzo", lastName: "Fernández", number: "24", position: "Milieu", goals: 1, assists: 1, matchesPlayed: 7 },
  ],
  BRA: [
    { firstName: "Richarlison", lastName: "de Andrade", number: "9", position: "Attaquant", goals: 3, assists: 1, matchesPlayed: 5 },
    { firstName: "Neymar", lastName: "Jr", number: "10", position: "Attaquant", goals: 1, assists: 1, matchesPlayed: 3 },
  ],
  ENG: [
    { firstName: "Harry", lastName: "Kane", number: "9", position: "Attaquant", goals: 2, assists: 1, matchesPlayed: 5 },
    { firstName: "Bukayo", lastName: "Saka", number: "17", position: "Milieu", goals: 3, assists: 0, matchesPlayed: 5 },
  ],
  GER: [
    { firstName: "Niclas", lastName: "Füllkrug", number: "9", position: "Attaquant", goals: 2, assists: 0, matchesPlayed: 3 },
    { firstName: "Jamal", lastName: "Musiala", number: "14", position: "Milieu", goals: 1, assists: 1, matchesPlayed: 3 },
  ],
  ESP: [
    { firstName: "Álvaro", lastName: "Morata", number: "7", position: "Attaquant", goals: 3, assists: 0, matchesPlayed: 5 },
    { firstName: "Ferran", lastName: "Torres", number: "11", position: "Attaquant", goals: 1, assists: 1, matchesPlayed: 4 },
  ],
  POR: [
    { firstName: "Gonçalo", lastName: "Ramos", number: "26", position: "Attaquant", goals: 3, assists: 0, matchesPlayed: 4 },
    { firstName: "Cristiano", lastName: "Ronaldo", number: "7", position: "Attaquant", goals: 1, assists: 0, matchesPlayed: 5 },
  ],
  NED: [
    { firstName: "Cody", lastName: "Gakpo", number: "8", position: "Attaquant", goals: 3, assists: 0, matchesPlayed: 5 },
    { firstName: "Memphis", lastName: "Depay", number: "10", position: "Attaquant", goals: 1, assists: 1, matchesPlayed: 4 },
  ],
};

async function seed() {
  const token = await getToken();
  console.log("🔑 Token acquired\n");
  console.log("🌱 Seeding World Cup data...\n");

  const CREATE_TEAM = `mutation createTeam($item: CreateTeamInput!) {
    createTeam(item: $item) { id name code group }
  }`;

  const CREATE_PLAYER = `mutation createPlayer($item: CreatePlayerInput!) {
    createPlayer(item: $item) { id firstName lastName }
  }`;

  // Create teams
  const teamMap: Record<string, string> = {};
  for (const t of teams) {
    console.log(`  ⚽ Creating team: ${t.name}`);
    const data = await gql(CREATE_TEAM, { item: t }, token);
    teamMap[t.code] = data.createTeam.id;
  }
  console.log(`\n✅ ${teams.length} teams created\n`);

  // Create players
  let playerCount = 0;
  for (const [code, players] of Object.entries(playersByTeam)) {
    for (const p of players) {
      console.log(`  👤 ${p.firstName} ${p.lastName} (${code})`);
      await gql(CREATE_PLAYER, {
        item: { ...p, team_id: teamMap[code] },
      }, token);
      playerCount++;
    }
  }
  console.log(`\n✅ ${playerCount} players created\n`);

  console.log("🏆 Seed complete!");
}

seed().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
