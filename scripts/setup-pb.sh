#!/bin/bash
BASE="https://noco.biznex.uz"

# 1. Auth as admin
echo "Authenticating..."
TOKEN=$(curl -s -X POST "$BASE/api/admins/auth-with-password" \
  -H "Content-Type: application/json" \
  -d '{"identity":"biznexw@gmail.com","password":"LCjky16vVOxA5BF35bq74aLLHDtTwjIV"}' | node -e "process.stdin.on('data',d=>console.log(JSON.parse(d).token))")

if [ -z "$TOKEN" ]; then
  echo "Auth failed!"
  exit 1
fi
echo "Token: ${TOKEN:0:20}..."

AUTH="Authorization: $TOKEN"

# Helper function
create_collection() {
  local name=$1
  local body=$2

  echo ""
  echo "Creating: $name"
  RESULT=$(curl -s -X POST "$BASE/api/collections" \
    -H "Content-Type: application/json" \
    -H "$AUTH" \
    -d "$body")

  echo "$RESULT" | node -e "process.stdin.on('data',d=>{const r=JSON.parse(d); if(r.id) console.log('  OK: '+r.id); else console.log('  Result: '+JSON.stringify(r).substring(0,200));})"
}

# 2. Get existing collections
echo ""
echo "Getting existing collections..."
COLLECTIONS=$(curl -s "$BASE/api/collections" -H "$AUTH")
echo "$COLLECTIONS" | node -e "process.stdin.on('data',d=>{const items=JSON.parse(d); if(Array.isArray(items)) items.forEach(c=>console.log('  - '+c.name+' ('+c.id+')')); else console.log(JSON.stringify(items).substring(0,300));})"

# 3. Update users collection - add role, phone, is_active fields
echo ""
echo "Updating users collection..."
USERS_COL=$(echo "$COLLECTIONS" | node -e "process.stdin.on('data',d=>{const items=JSON.parse(d); const u=items.find(c=>c.name==='users'); if(u) console.log(JSON.stringify(u)); else console.log('null');})")

USERS_ID=$(echo "$USERS_COL" | node -e "process.stdin.on('data',d=>{const c=JSON.parse(d); if(c) console.log(c.id); else console.log('');})")

if [ -n "$USERS_ID" ]; then
  echo "  Users collection ID: $USERS_ID"

  # Get existing schema and add new fields
  EXISTING_SCHEMA=$(echo "$USERS_COL" | node -e "
    process.stdin.on('data',d=>{
      const c=JSON.parse(d);
      const fields = c.schema || c.fields || [];
      const names = fields.map(f=>f.name);
      const newFields = [...fields];
      if(!names.includes('role')) newFields.push({name:'role',type:'select',required:false,options:{values:['admin','manager','employee'],maxSelect:1}});
      if(!names.includes('phone')) newFields.push({name:'phone',type:'text',required:false});
      if(!names.includes('is_active')) newFields.push({name:'is_active',type:'bool',required:false});
      console.log(JSON.stringify(newFields));
    });
  ")

  # Try updating with 'schema' key (PB <0.23) and 'fields' key (PB >=0.23)
  curl -s -X PATCH "$BASE/api/collections/$USERS_ID" \
    -H "Content-Type: application/json" \
    -H "$AUTH" \
    -d "{\"schema\": $EXISTING_SCHEMA}" | node -e "process.stdin.on('data',d=>{const r=JSON.parse(d); if(r.id) console.log('  Users updated OK'); else console.log('  Update result: '+JSON.stringify(r).substring(0,200));})"
fi

# 4. Get collection IDs for relations
DEVICE_TYPES_ID=""
CLIENTS_ID=""
ASSIGNMENTS_ID=""

get_col_id() {
  echo "$COLLECTIONS" | node -e "process.stdin.on('data',d=>{const items=JSON.parse(d); const c=items.find(x=>x.name==='$1'); console.log(c?c.id:'');})"
}

# Create device_types
create_collection "device_types" '{
  "name": "device_types",
  "type": "base",
  "schema": [
    {"name": "name", "type": "text", "required": true},
    {"name": "description", "type": "text", "required": false},
    {"name": "icon", "type": "text", "required": false},
    {"name": "is_active", "type": "bool", "required": false}
  ],
  "listRule": "@request.auth.id != \"\"",
  "viewRule": "@request.auth.id != \"\"",
  "createRule": "@request.auth.id != \"\"",
  "updateRule": "@request.auth.id != \"\"",
  "deleteRule": ""
}'

# Create clients
create_collection "clients" '{
  "name": "clients",
  "type": "base",
  "schema": [
    {"name": "name", "type": "text", "required": true},
    {"name": "contact_person", "type": "text", "required": false},
    {"name": "phone", "type": "text", "required": false},
    {"name": "address", "type": "text", "required": false},
    {"name": "notes", "type": "editor", "required": false},
    {"name": "is_active", "type": "bool", "required": false}
  ],
  "listRule": "@request.auth.id != \"\"",
  "viewRule": "@request.auth.id != \"\"",
  "createRule": "@request.auth.id != \"\"",
  "updateRule": "@request.auth.id != \"\"",
  "deleteRule": ""
}'

# Re-fetch collections to get new IDs
sleep 1
COLLECTIONS=$(curl -s "$BASE/api/collections" -H "$AUTH")

DEVICE_TYPES_ID=$(get_col_id "device_types")
CLIENTS_ID=$(get_col_id "clients")

echo ""
echo "device_types ID: $DEVICE_TYPES_ID"
echo "clients ID: $CLIENTS_ID"
echo "users ID: $USERS_ID"

# Create warehouse_stock
create_collection "warehouse_stock" "{
  \"name\": \"warehouse_stock\",
  \"type\": \"base\",
  \"schema\": [
    {\"name\": \"device_type\", \"type\": \"relation\", \"required\": true, \"options\": {\"collectionId\": \"$DEVICE_TYPES_ID\", \"maxSelect\": 1}},
    {\"name\": \"quantity\", \"type\": \"number\", \"required\": true, \"options\": {\"min\": 0}}
  ],
  \"listRule\": \"@request.auth.id != \\\"\\\"\",
  \"viewRule\": \"@request.auth.id != \\\"\\\"\",
  \"createRule\": \"@request.auth.id != \\\"\\\"\",
  \"updateRule\": \"@request.auth.id != \\\"\\\"\"
}"

# Create employee_stock
create_collection "employee_stock" "{
  \"name\": \"employee_stock\",
  \"type\": \"base\",
  \"schema\": [
    {\"name\": \"employee\", \"type\": \"relation\", \"required\": true, \"options\": {\"collectionId\": \"$USERS_ID\", \"maxSelect\": 1}},
    {\"name\": \"device_type\", \"type\": \"relation\", \"required\": true, \"options\": {\"collectionId\": \"$DEVICE_TYPES_ID\", \"maxSelect\": 1}},
    {\"name\": \"quantity\", \"type\": \"number\", \"required\": true, \"options\": {\"min\": 0}}
  ],
  \"listRule\": \"@request.auth.id != \\\"\\\"\",
  \"viewRule\": \"@request.auth.id != \\\"\\\"\",
  \"createRule\": \"@request.auth.id != \\\"\\\"\",
  \"updateRule\": \"@request.auth.id != \\\"\\\"\"
}"

# Create client_stock
create_collection "client_stock" "{
  \"name\": \"client_stock\",
  \"type\": \"base\",
  \"schema\": [
    {\"name\": \"client\", \"type\": \"relation\", \"required\": true, \"options\": {\"collectionId\": \"$CLIENTS_ID\", \"maxSelect\": 1}},
    {\"name\": \"device_type\", \"type\": \"relation\", \"required\": true, \"options\": {\"collectionId\": \"$DEVICE_TYPES_ID\", \"maxSelect\": 1}},
    {\"name\": \"quantity\", \"type\": \"number\", \"required\": true, \"options\": {\"min\": 0}}
  ],
  \"listRule\": \"@request.auth.id != \\\"\\\"\",
  \"viewRule\": \"@request.auth.id != \\\"\\\"\",
  \"createRule\": \"@request.auth.id != \\\"\\\"\",
  \"updateRule\": \"@request.auth.id != \\\"\\\"\"
}"

# Create transactions
create_collection "transactions" "{
  \"name\": \"transactions\",
  \"type\": \"base\",
  \"schema\": [
    {\"name\": \"type\", \"type\": \"select\", \"required\": true, \"options\": {\"values\": [\"warehouse_to_employee\",\"employee_to_client\",\"client_to_employee\",\"employee_to_warehouse\",\"adjustment\"], \"maxSelect\": 1}},
    {\"name\": \"device_type\", \"type\": \"relation\", \"required\": true, \"options\": {\"collectionId\": \"$DEVICE_TYPES_ID\", \"maxSelect\": 1}},
    {\"name\": \"quantity\", \"type\": \"number\", \"required\": true, \"options\": {\"min\": 1}},
    {\"name\": \"from_employee\", \"type\": \"relation\", \"required\": false, \"options\": {\"collectionId\": \"$USERS_ID\", \"maxSelect\": 1}},
    {\"name\": \"to_employee\", \"type\": \"relation\", \"required\": false, \"options\": {\"collectionId\": \"$USERS_ID\", \"maxSelect\": 1}},
    {\"name\": \"client\", \"type\": \"relation\", \"required\": false, \"options\": {\"collectionId\": \"$CLIENTS_ID\", \"maxSelect\": 1}},
    {\"name\": \"serial_numbers\", \"type\": \"text\", \"required\": false},
    {\"name\": \"notes\", \"type\": \"text\", \"required\": false},
    {\"name\": \"performed_by\", \"type\": \"relation\", \"required\": true, \"options\": {\"collectionId\": \"$USERS_ID\", \"maxSelect\": 1}}
  ],
  \"listRule\": \"@request.auth.id != \\\"\\\"\",
  \"viewRule\": \"@request.auth.id != \\\"\\\"\",
  \"createRule\": \"@request.auth.id != \\\"\\\"\"
}"

# Create assignments
create_collection "assignments" "{
  \"name\": \"assignments\",
  \"type\": \"base\",
  \"schema\": [
    {\"name\": \"employee\", \"type\": \"relation\", \"required\": true, \"options\": {\"collectionId\": \"$USERS_ID\", \"maxSelect\": 1}},
    {\"name\": \"client\", \"type\": \"relation\", \"required\": true, \"options\": {\"collectionId\": \"$CLIENTS_ID\", \"maxSelect\": 1}},
    {\"name\": \"status\", \"type\": \"select\", \"required\": true, \"options\": {\"values\": [\"assigned\",\"in_progress\",\"completed\",\"cancelled\"], \"maxSelect\": 1}},
    {\"name\": \"assigned_date\", \"type\": \"date\", \"required\": true},
    {\"name\": \"completed_date\", \"type\": \"date\", \"required\": false},
    {\"name\": \"notes\", \"type\": \"text\", \"required\": false}
  ],
  \"listRule\": \"@request.auth.id != \\\"\\\"\",
  \"viewRule\": \"@request.auth.id != \\\"\\\"\",
  \"createRule\": \"@request.auth.id != \\\"\\\"\",
  \"updateRule\": \"@request.auth.id != \\\"\\\"\"
}"

# Re-fetch to get assignments ID
sleep 1
COLLECTIONS=$(curl -s "$BASE/api/collections" -H "$AUTH")
ASSIGNMENTS_ID=$(get_col_id "assignments")
echo ""
echo "assignments ID: $ASSIGNMENTS_ID"

# Create expenses
create_collection "expenses" "{
  \"name\": \"expenses\",
  \"type\": \"base\",
  \"schema\": [
    {\"name\": \"employee\", \"type\": \"relation\", \"required\": true, \"options\": {\"collectionId\": \"$USERS_ID\", \"maxSelect\": 1}},
    {\"name\": \"assignment\", \"type\": \"relation\", \"required\": false, \"options\": {\"collectionId\": \"$ASSIGNMENTS_ID\", \"maxSelect\": 1}},
    {\"name\": \"category\", \"type\": \"select\", \"required\": true, \"options\": {\"values\": [\"transport\",\"material\",\"hotel\",\"food\",\"other\"], \"maxSelect\": 1}},
    {\"name\": \"amount\", \"type\": \"number\", \"required\": true, \"options\": {\"min\": 0}},
    {\"name\": \"description\", \"type\": \"text\", \"required\": true},
    {\"name\": \"receipt\", \"type\": \"file\", \"required\": false, \"options\": {\"maxSelect\": 1, \"maxSize\": 10485760}},
    {\"name\": \"date\", \"type\": \"date\", \"required\": true},
    {\"name\": \"status\", \"type\": \"select\", \"required\": true, \"options\": {\"values\": [\"pending\",\"approved\",\"rejected\"], \"maxSelect\": 1}},
    {\"name\": \"approved_by\", \"type\": \"relation\", \"required\": false, \"options\": {\"collectionId\": \"$USERS_ID\", \"maxSelect\": 1}}
  ],
  \"listRule\": \"@request.auth.id != \\\"\\\"\",
  \"viewRule\": \"@request.auth.id != \\\"\\\"\",
  \"createRule\": \"@request.auth.id != \\\"\\\"\",
  \"updateRule\": \"@request.auth.id != \\\"\\\"\"
}"

echo ""
echo "=== DONE ==="
echo ""
echo "Final collections:"
curl -s "$BASE/api/collections" -H "$AUTH" | node -e "process.stdin.on('data',d=>{const items=JSON.parse(d); if(Array.isArray(items)) items.forEach(c=>console.log('  - '+c.name)); else console.log(JSON.stringify(items).substring(0,300));})"
