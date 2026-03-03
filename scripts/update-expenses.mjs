const BASE = "https://noco.biznex.uz";

async function main() {
  // Auth
  const authRes = await fetch(`${BASE}/api/admins/auth-with-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      identity: "biznexw@gmail.com",
      password: "LCjky16vVOxA5BF35bq74aLLHDtTwjIV",
    }),
  });
  const { token } = await authRes.json();
  console.log("Auth OK");

  const headers = { "Content-Type": "application/json", Authorization: token };

  // Get expenses collection
  const expRes = await fetch(`${BASE}/api/collections/expenses`, { headers });
  const expenses = await expRes.json();
  console.log("Current fields:", expenses.schema.map((f) => `${f.name}:${f.type}`).join(", "));

  // Build new schema
  const schema = expenses.schema.filter((f) => f.name !== "category");

  // Add category as text
  schema.push({
    name: "category",
    type: "text",
    required: false,
    options: {},
  });

  // Add client relation
  const hasClient = schema.some((f) => f.name === "client");
  if (!hasClient) {
    schema.push({
      name: "client",
      type: "relation",
      required: false,
      options: { collectionId: "fzdcp99jtdm1677", maxSelect: 1 },
    });
  }

  console.log("New fields:", schema.map((f) => `${f.name}:${f.type}`).join(", "));

  // Update
  const updateRes = await fetch(`${BASE}/api/collections/${expenses.id}`, {
    method: "PATCH",
    headers,
    body: JSON.stringify({ schema }),
  });
  const result = await updateRes.json();

  if (result.id) {
    console.log("Updated OK!");
    console.log("Final fields:", result.schema.map((f) => `${f.name}:${f.type}`).join(", "));
  } else {
    console.error("Error:", JSON.stringify(result));
  }
}

main().catch(console.error);
