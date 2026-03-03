const PB_URL = "https://noco.biznex.uz";
const EMAIL = "biznexw@gmail.com";
const PASS = "LCjky16vVOxA5BF35bq74aLLHDtTwjIV";

const authRes = await fetch(`${PB_URL}/api/admins/auth-with-password`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ identity: EMAIL, password: PASS }),
});
const authData = await authRes.json();
const token = authData.token;
if (!token) {
  console.log("Auth failed:", JSON.stringify(authData));
  process.exit(1);
}
console.log("Admin auth OK\n");

// Get all collections and show their rules
const colRes = await fetch(`${PB_URL}/api/collections`, {
  headers: { Authorization: token },
});
const colData = await colRes.json();
const collections = colData.items || colData;

for (const col of collections) {
  console.log(`${col.name} (${col.id}):`);
  console.log(`  listRule: ${JSON.stringify(col.listRule)}`);
  console.log(`  viewRule: ${JSON.stringify(col.viewRule)}`);
  console.log(`  createRule: ${JSON.stringify(col.createRule)}`);
  console.log(`  updateRule: ${JSON.stringify(col.updateRule)}`);
  console.log();
}
