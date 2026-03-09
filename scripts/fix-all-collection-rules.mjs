const BASE = "https://noco.biznex.uz";

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, options);
  return { ok: res.ok, data: await res.json() };
}

async function main() {
  const auth = await request("/api/admins/auth-with-password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      identity: "biznexw@gmail.com",
      password: "LCjky16vVOxA5BF35bq74aLLHDtTwjIV",
    }),
  });
  const TOKEN = auth.data.token;
  if (!TOKEN) { console.error("Auth failed"); process.exit(1); }
  console.log("Auth OK\n");

  const headers = { "Content-Type": "application/json", Authorization: TOKEN };

  // Get all collections
  const colsRes = await request("/api/collections?perPage=100", { headers });
  const collections = colsRes.data.items || colsRes.data || [];

  const authRule = '@request.auth.id != ""';
  const adminRule = '@request.auth.role = "admin"';

  // Collections that should be admin-only
  const adminOnly = ["installation_settlement"];

  // Collections that should be open to all authenticated users
  const allAuth = [
    "material_types", "installations", "installation_devices",
    "installation_materials", "employee_materials", "material_purchases",
    "employee_cash", "monthly_payments",
    "device_types", "clients", "warehouse_stock", "employee_stock",
    "client_stock", "transactions", "assignments", "expenses", "suppliers",
  ];

  for (const col of collections) {
    let targetRules = null;

    if (adminOnly.includes(col.name)) {
      targetRules = {
        listRule: adminRule,
        viewRule: adminRule,
        createRule: adminRule,
        updateRule: adminRule,
        deleteRule: adminRule,
      };
    } else if (allAuth.includes(col.name)) {
      targetRules = {
        listRule: authRule,
        viewRule: authRule,
        createRule: authRule,
        updateRule: authRule,
        deleteRule: authRule,
      };
    }

    if (!targetRules) continue;

    // Check if rules need updating
    const needsUpdate =
      col.listRule !== targetRules.listRule ||
      col.viewRule !== targetRules.viewRule ||
      col.createRule !== targetRules.createRule ||
      col.updateRule !== targetRules.updateRule ||
      col.deleteRule !== targetRules.deleteRule;

    if (!needsUpdate) {
      console.log(`  OK: ${col.name} (rules correct)`);
      continue;
    }

    const res = await request(`/api/collections/${col.id}`, {
      method: "PATCH",
      headers,
      body: JSON.stringify(targetRules),
    });

    if (res.ok) {
      console.log(`  FIXED: ${col.name}`);
    } else {
      console.log(`  ERR: ${col.name}`, JSON.stringify(res.data).substring(0, 200));
    }
  }

  console.log("\nDONE");
}

main().catch(console.error);
