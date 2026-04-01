import { createClient } from "@neondatabase/neon-js";

const authUrl = process.env.VITE_NEON_AUTH_URL;
const dataApiUrl = process.env.VITE_NEON_DATA_API_URL;

if (!authUrl || !dataApiUrl) {
  console.error("Missing env vars: VITE_NEON_AUTH_URL and/or VITE_NEON_DATA_API_URL");
  process.exit(2);
}

const client = createClient({
  auth: { url: authUrl },
  dataApi: { url: dataApiUrl },
});

const origin = process.env.SMOKE_TEST_ORIGIN || "http://localhost:3000";
const callbackURL = `${origin}/#/auth/callback`;

const email = `smoke+${Date.now()}@example.com`;
const password = `SmokeTest-${Math.random().toString(16).slice(2)}-${Date.now()}`;

async function main() {
  console.log("Signing up test user", email);
  const signUp = await client.auth.signUp.email({
    email,
    password,
    name: "Smoke Test",
    callbackURL,
  });
  if (signUp.error) throw new Error(`signUp failed: ${signUp.error.message}`);

  const session = await client.auth.getSession();
  if (session.error) throw new Error(`getSession failed: ${session.error.message}`);
  const authUserId = session.data?.session?.user?.id ?? session.data?.session?.userId;
  if (!authUserId) throw new Error("No authUserId in session");
  console.log("Got session for authUserId", authUserId);

  // Insert user profile row (app table) - should satisfy NOT NULL id now.
  const userInsert = await client
    .from("users")
    .insert({
      id: authUserId,
      auth_user_id: authUserId,
      name: "Smoke Test",
      email,
      photo_url: null,
    })
    .select();
  if (userInsert.error) throw new Error(`users insert failed: ${userInsert.error.message}`);
  console.log("Inserted users row");

  const userSelect = await client.from("users").select("*").eq("auth_user_id", authUserId).limit(1);
  if (userSelect.error) throw new Error(`users select failed: ${userSelect.error.message}`);
  console.log("Selected users row ok");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

