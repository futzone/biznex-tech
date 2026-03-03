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

// Allow admin/manager to list/view all users; employees can only see themselves
const rule =
  'id = @request.auth.id || @request.auth.role = "admin" || @request.auth.role = "manager"';

const updateRes = await fetch(`${PB_URL}/api/collections/_pb_users_auth_`, {
  method: "PATCH",
  headers: {
    "Content-Type": "application/json",
    Authorization: token,
  },
  body: JSON.stringify({
    listRule: rule,
    viewRule: rule,
  }),
});

const result = await updateRes.json();
if (updateRes.ok) {
  console.log("Updated listRule:", result.listRule);
  console.log("Updated viewRule:", result.viewRule);
  console.log("SUCCESS - users collection rules updated");
} else {
  console.log("Error:", JSON.stringify(result));
  process.exit(1);
}
