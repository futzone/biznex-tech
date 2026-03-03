// PocketBase Collections Setup Script
// Uses fetch API (Node 18+)

const BASE = "https://noco.biznex.uz";

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, options);
  return res.json();
}

async function main() {
  // 1. Auth
  console.log("Authenticating...");
  const authRes = await request("/api/admins/auth-with-password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      identity: "biznexw@gmail.com",
      password: "LCjky16vVOxA5BF35bq74aLLHDtTwjIV",
    }),
  });
  const TOKEN = authRes.token;
  if (!TOKEN) {
    console.error("Auth failed:", authRes);
    process.exit(1);
  }
  console.log("Authenticated OK");

  const headers = {
    "Content-Type": "application/json",
    Authorization: TOKEN,
  };

  // 2. Get existing collections
  const colsRes = await request("/api/collections?perPage=50", { headers });
  const existing = colsRes.items || [];
  const existingNames = existing.map((c) => c.name);
  console.log("Existing:", existingNames.join(", "));

  // Helper
  const getColId = (name) => existing.find((c) => c.name === name)?.id;
  const USERS_ID = getColId("users") || "_pb_users_auth_";

  // 3. Update users - add role, phone, is_active
  console.log("\nUpdating users collection...");
  const usersCol = existing.find((c) => c.name === "users");
  if (usersCol) {
    const fieldNames = usersCol.schema.map((f) => f.name);
    const newSchema = [...usersCol.schema];

    if (!fieldNames.includes("role")) {
      newSchema.push({
        name: "role",
        type: "select",
        required: false,
        options: { values: ["admin", "manager", "employee"], maxSelect: 1 },
      });
    }
    if (!fieldNames.includes("phone")) {
      newSchema.push({ name: "phone", type: "text", required: false });
    }
    if (!fieldNames.includes("is_active")) {
      newSchema.push({ name: "is_active", type: "bool", required: false });
    }

    const updateRes = await request(`/api/collections/${usersCol.id}`, {
      method: "PATCH",
      headers,
      body: JSON.stringify({ schema: newSchema }),
    });
    console.log("  Users updated:", updateRes.id ? "OK" : JSON.stringify(updateRes).substring(0, 200));
  }

  // 4. Create collections
  async function createCol(name, schema, rules = {}) {
    if (existingNames.includes(name)) {
      console.log(`Skipped: ${name} (exists)`);
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
    if (res.id) {
      console.log(`Created: ${name} (${res.id})`);
      return res.id;
    } else {
      console.error(`FAILED: ${name}`, JSON.stringify(res).substring(0, 300));
      return null;
    }
  }

  // device_types
  const deviceTypesId = await createCol("device_types", [
    { name: "name", type: "text", required: true },
    { name: "description", type: "text", required: false },
    { name: "icon", type: "text", required: false },
    { name: "is_active", type: "bool", required: false },
  ]);

  // clients
  const clientsId = await createCol("clients", [
    { name: "name", type: "text", required: true },
    { name: "contact_person", type: "text", required: false },
    { name: "phone", type: "text", required: false },
    { name: "address", type: "text", required: false },
    { name: "notes", type: "editor", required: false },
    { name: "is_active", type: "bool", required: false },
  ]);

  // warehouse_stock
  await createCol("warehouse_stock", [
    {
      name: "device_type",
      type: "relation",
      required: true,
      options: { collectionId: deviceTypesId, maxSelect: 1 },
    },
    { name: "quantity", type: "number", required: true, options: { min: 0 } },
  ], { deleteRule: null });

  // employee_stock
  await createCol("employee_stock", [
    {
      name: "employee",
      type: "relation",
      required: true,
      options: { collectionId: USERS_ID, maxSelect: 1 },
    },
    {
      name: "device_type",
      type: "relation",
      required: true,
      options: { collectionId: deviceTypesId, maxSelect: 1 },
    },
    { name: "quantity", type: "number", required: true, options: { min: 0 } },
  ], { deleteRule: null });

  // client_stock
  await createCol("client_stock", [
    {
      name: "client",
      type: "relation",
      required: true,
      options: { collectionId: clientsId, maxSelect: 1 },
    },
    {
      name: "device_type",
      type: "relation",
      required: true,
      options: { collectionId: deviceTypesId, maxSelect: 1 },
    },
    { name: "quantity", type: "number", required: true, options: { min: 0 } },
  ], { deleteRule: null });

  // transactions
  await createCol("transactions", [
    {
      name: "type",
      type: "select",
      required: true,
      options: {
        values: [
          "warehouse_to_employee",
          "employee_to_client",
          "client_to_employee",
          "employee_to_warehouse",
          "adjustment",
        ],
        maxSelect: 1,
      },
    },
    {
      name: "device_type",
      type: "relation",
      required: true,
      options: { collectionId: deviceTypesId, maxSelect: 1 },
    },
    { name: "quantity", type: "number", required: true, options: { min: 1 } },
    {
      name: "from_employee",
      type: "relation",
      required: false,
      options: { collectionId: USERS_ID, maxSelect: 1 },
    },
    {
      name: "to_employee",
      type: "relation",
      required: false,
      options: { collectionId: USERS_ID, maxSelect: 1 },
    },
    {
      name: "client",
      type: "relation",
      required: false,
      options: { collectionId: clientsId, maxSelect: 1 },
    },
    { name: "serial_numbers", type: "text", required: false },
    { name: "notes", type: "text", required: false },
    {
      name: "performed_by",
      type: "relation",
      required: true,
      options: { collectionId: USERS_ID, maxSelect: 1 },
    },
  ], { updateRule: null });

  // assignments
  const assignmentsId = await createCol("assignments", [
    {
      name: "employee",
      type: "relation",
      required: true,
      options: { collectionId: USERS_ID, maxSelect: 1 },
    },
    {
      name: "client",
      type: "relation",
      required: true,
      options: { collectionId: clientsId, maxSelect: 1 },
    },
    {
      name: "status",
      type: "select",
      required: true,
      options: {
        values: ["assigned", "in_progress", "completed", "cancelled"],
        maxSelect: 1,
      },
    },
    { name: "assigned_date", type: "date", required: true },
    { name: "completed_date", type: "date", required: false },
    { name: "notes", type: "text", required: false },
  ]);

  // expenses
  await createCol("expenses", [
    {
      name: "employee",
      type: "relation",
      required: true,
      options: { collectionId: USERS_ID, maxSelect: 1 },
    },
    {
      name: "assignment",
      type: "relation",
      required: false,
      options: { collectionId: assignmentsId, maxSelect: 1 },
    },
    {
      name: "category",
      type: "select",
      required: true,
      options: {
        values: ["transport", "material", "hotel", "food", "other"],
        maxSelect: 1,
      },
    },
    { name: "amount", type: "number", required: true, options: { min: 0 } },
    { name: "description", type: "text", required: true },
    {
      name: "receipt",
      type: "file",
      required: false,
      options: { maxSelect: 1, maxSize: 10485760 },
    },
    { name: "date", type: "date", required: true },
    {
      name: "status",
      type: "select",
      required: true,
      options: {
        values: ["pending", "approved", "rejected"],
        maxSelect: 1,
      },
    },
    {
      name: "approved_by",
      type: "relation",
      required: false,
      options: { collectionId: USERS_ID, maxSelect: 1 },
    },
  ]);

  // Final check
  console.log("\n=== Final collections ===");
  const finalCols = await request("/api/collections?perPage=50", { headers });
  for (const c of finalCols.items || []) {
    console.log(`  ${c.name} (${c.id})`);
  }
  console.log("\nDone!");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
