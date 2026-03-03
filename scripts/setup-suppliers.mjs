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
console.log("Admin auth OK");

const headers = {
  "Content-Type": "application/json",
  Authorization: token,
};

// 1. Create suppliers collection
console.log("\n--- Creating suppliers collection ---");
const suppliersRes = await fetch(`${PB_URL}/api/collections`, {
  method: "POST",
  headers,
  body: JSON.stringify({
    name: "suppliers",
    type: "base",
    schema: [
      { name: "name", type: "text", required: true },
      { name: "phone", type: "text", required: false },
      { name: "address", type: "text", required: false },
      { name: "is_active", type: "bool" },
    ],
    listRule: '@request.auth.id != ""',
    viewRule: '@request.auth.id != ""',
    createRule: '@request.auth.id != ""',
    updateRule: '@request.auth.id != ""',
  }),
});
const suppliersData = await suppliersRes.json();
if (suppliersRes.ok) {
  console.log("Created suppliers:", suppliersData.id);
} else {
  console.log("Suppliers error:", JSON.stringify(suppliersData));
}

// 2. Add supplier relation to transactions collection
console.log("\n--- Adding supplier field to transactions ---");
const txColRes = await fetch(`${PB_URL}/api/collections/y54ztnxp2k20ts3`, {
  headers,
});
const txCol = await txColRes.json();

// Check if supplier field already exists
const hasSupplier = txCol.schema?.some((f) => f.name === "supplier");
if (hasSupplier) {
  console.log("supplier field already exists in transactions");
} else {
  const suppliersColId = suppliersData.id;
  const updatedSchema = [
    ...txCol.schema,
    {
      name: "supplier",
      type: "relation",
      required: false,
      options: {
        collectionId: suppliersColId,
        cascadeDelete: false,
        maxSelect: 1,
      },
    },
  ];

  const updateRes = await fetch(
    `${PB_URL}/api/collections/y54ztnxp2k20ts3`,
    {
      method: "PATCH",
      headers,
      body: JSON.stringify({ schema: updatedSchema }),
    }
  );
  const updateData = await updateRes.json();
  if (updateRes.ok) {
    console.log("Added supplier field to transactions");
  } else {
    console.log("Error:", JSON.stringify(updateData));
  }
}

console.log("\nDONE!");
