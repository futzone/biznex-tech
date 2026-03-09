const BASE = "https://noco.biznex.uz";

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, options);
  return { ok: res.ok, data: await res.json() };
}

async function main() {
  console.log("Authenticating...");
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

  // Get existing
  const colsRes = await request("/api/collections?perPage=100", { headers });
  const existing = colsRes.data.items || colsRes.data || [];
  const existingNames = existing.map((c) => c.name);
  const getColId = (name) => existing.find((c) => c.name === name)?.id;

  const USERS_ID = getColId("users") || "_pb_users_auth_";
  const CLIENTS_ID = getColId("clients") || "fzdcp99jtdm1677";
  const DEVICE_TYPES_ID = getColId("device_types") || "n1xdo9mb3yxq3c0";

  async function createCol(name, schema, rules = {}) {
    if (existingNames.includes(name)) {
      console.log(`  SKIP: ${name} (exists: ${getColId(name)})`);
      return getColId(name);
    }
    const body = {
      name,
      type: "base",
      schema,
      listRule: '@request.auth.id != ""',
      viewRule: '@request.auth.id != ""',
      createRule: '@request.auth.id != ""',
      updateRule: '@request.auth.id != ""',
      ...rules,
    };
    const res = await request("/api/collections", {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });
    if (res.ok) {
      console.log(`  OK: ${name} → ${res.data.id}`);
      return res.data.id;
    } else {
      console.error(`  ERR: ${name}`, JSON.stringify(res.data).substring(0, 400));
      return null;
    }
  }

  // 1. material_types
  console.log("1. material_types");
  const materialTypesId = await createCol("material_types", [
    { name: "name", type: "text", required: true },
    { name: "unit", type: "select", required: false, options: { values: ["meter", "piece", "roll", "kg"], maxSelect: 1 } },
    { name: "is_active", type: "bool", required: false },
  ]);

  // 2. installations
  console.log("2. installations");
  const installationsId = await createCol("installations", [
    { name: "client", type: "relation", required: true, options: { collectionId: CLIENTS_ID, maxSelect: 1 } },
    { name: "installer_employee", type: "relation", required: false, options: { collectionId: USERS_ID, maxSelect: 1 } },
    { name: "contract_number", type: "text", required: false },
    { name: "installation_date", type: "date", required: false },
    { name: "payment_type", type: "select", required: false, options: { values: ["purchased", "rented"], maxSelect: 1 } },
    { name: "monthly_payment_usd", type: "number", required: false },
    { name: "travel_expense_usd", type: "number", required: false },
    { name: "additional_expenses_usd", type: "number", required: false },
    { name: "installation_fee_usd", type: "number", required: false },
    { name: "total_received_usd", type: "number", required: false },
    { name: "exchange_rate", type: "number", required: false },
    { name: "notes", type: "text", required: false },
    { name: "status", type: "select", required: false, options: { values: ["draft", "submitted", "accepted"], maxSelect: 1 } },
    { name: "submitted_by", type: "relation", required: false, options: { collectionId: USERS_ID, maxSelect: 1 } },
    { name: "accepted_by", type: "relation", required: false, options: { collectionId: USERS_ID, maxSelect: 1 } },
  ]);

  // 3. installation_devices
  console.log("3. installation_devices");
  await createCol("installation_devices", [
    { name: "installation", type: "relation", required: true, options: { collectionId: installationsId, maxSelect: 1 } },
    { name: "device_type", type: "relation", required: true, options: { collectionId: DEVICE_TYPES_ID, maxSelect: 1 } },
    { name: "quantity", type: "number", required: true },
  ]);

  // 4. installation_materials
  console.log("4. installation_materials");
  await createCol("installation_materials", [
    { name: "installation", type: "relation", required: true, options: { collectionId: installationsId, maxSelect: 1 } },
    { name: "material_type", type: "relation", required: true, options: { collectionId: materialTypesId, maxSelect: 1 } },
    { name: "quantity_used", type: "number", required: true },
  ]);

  // 5. employee_materials
  console.log("5. employee_materials");
  await createCol("employee_materials", [
    { name: "employee", type: "relation", required: true, options: { collectionId: USERS_ID, maxSelect: 1 } },
    { name: "material_type", type: "relation", required: true, options: { collectionId: materialTypesId, maxSelect: 1 } },
    { name: "quantity", type: "number", required: true },
  ]);

  // 6. material_purchases
  console.log("6. material_purchases");
  await createCol("material_purchases", [
    { name: "employee", type: "relation", required: true, options: { collectionId: USERS_ID, maxSelect: 1 } },
    { name: "material_type", type: "relation", required: true, options: { collectionId: materialTypesId, maxSelect: 1 } },
    { name: "quantity", type: "number", required: true },
    { name: "cost_usd", type: "number", required: true },
    { name: "for_client", type: "relation", required: false, options: { collectionId: CLIENTS_ID, maxSelect: 1 } },
    { name: "date", type: "date", required: false },
    { name: "notes", type: "text", required: false },
  ]);

  // 7. employee_cash
  console.log("7. employee_cash");
  await createCol("employee_cash", [
    { name: "employee", type: "relation", required: true, options: { collectionId: USERS_ID, maxSelect: 1 } },
    { name: "type", type: "select", required: true, options: { values: ["received_from_client", "spent_on_material", "returned_to_company", "given_by_company"], maxSelect: 1 } },
    { name: "amount_usd", type: "number", required: true },
    { name: "installation", type: "relation", required: false, options: { collectionId: installationsId, maxSelect: 1 } },
    { name: "description", type: "text", required: false },
    { name: "date", type: "date", required: false },
    { name: "recorded_by", type: "relation", required: true, options: { collectionId: USERS_ID, maxSelect: 1 } },
  ]);

  // 8. installation_settlement (ADMIN ONLY)
  console.log("8. installation_settlement (admin only)");
  await createCol("installation_settlement", [
    { name: "installation", type: "relation", required: true, options: { collectionId: installationsId, maxSelect: 1 } },
    { name: "money_returned_usd", type: "number", required: true },
    { name: "employee_salary_usd", type: "number", required: true },
    { name: "notes", type: "text", required: false },
    { name: "settled_by", type: "relation", required: true, options: { collectionId: USERS_ID, maxSelect: 1 } },
  ], {
    listRule: '@request.auth.role = "admin"',
    viewRule: '@request.auth.role = "admin"',
    createRule: '@request.auth.role = "admin"',
    updateRule: '@request.auth.role = "admin"',
  });

  // 9. monthly_payments
  console.log("9. monthly_payments");
  await createCol("monthly_payments", [
    { name: "installation", type: "relation", required: true, options: { collectionId: installationsId, maxSelect: 1 } },
    { name: "month", type: "date", required: true },
    { name: "amount_usd", type: "number", required: true },
    { name: "paid", type: "bool", required: false },
    { name: "paid_date", type: "date", required: false },
  ]);

  console.log("\n=== DONE ===");
}

main().catch((e) => console.error(e));
