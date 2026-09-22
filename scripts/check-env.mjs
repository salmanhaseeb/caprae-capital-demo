import { config } from "dotenv";
const production = process.argv.includes("--production") || process.env.NODE_ENV === "production";
// Match Next's precedence, while preserving variables injected by the host.
for (const file of production ? [".env.production.local", ".env.local", ".env.production", ".env"] : [".env.development.local", ".env.local", ".env.development", ".env"])
  config({ path: file, quiet: true });
const errors = [];
if (process.env.DEMO_ALLOW_DATABASE_OWNER === "true" && process.env.DEMO_MODE !== "true") errors.push("Database owner mode is permitted only for fictional DEMO_MODE=true deployments.");
if (process.env.DATABASE_SSL_MODE && process.env.DATABASE_SSL_MODE !== "heroku") errors.push("DATABASE_SSL_MODE must be heroku or unset.");
function database(name, required) {
  const value = process.env[name];
  if (!value) { if (required) errors.push(`${name} is required.`); return; }
  try {
    const url = new URL(value);
    if (!["postgres:", "postgresql:"].includes(url.protocol) || !url.hostname || url.pathname.length < 2) throw new Error();
    if (url.hostname.endsWith("neon.tech") && !["require", "verify-full"].includes(url.searchParams.get("sslmode"))) errors.push(`${name} must enable TLS for Neon (sslmode=require or verify-full).`);
    if (name === "DIRECT_URL" && url.hostname.includes("-pooler.")) errors.push("DIRECT_URL must use the direct, non-pooler endpoint.");
  } catch { errors.push(`${name} must be a valid PostgreSQL connection URL.`); }
}
database("DATABASE_URL", true);
database("DIRECT_URL", process.argv.includes("--migrations"));
if (process.env.DATABASE_URL && process.env.DATABASE_URL === process.env.DIRECT_URL) errors.push("Runtime and migration connections must use separate roles.");
if (production && process.env.DEMO_MODE !== "true") errors.push("This demo requires DEMO_MODE=true. Real authentication is not implemented.");
if (production && (!process.env.DEMO_SESSION_SECRET || process.env.DEMO_SESSION_SECRET.trim().length < 32 || /^(change|replace|example)/i.test(process.env.DEMO_SESSION_SECRET))) errors.push("DEMO_SESSION_SECRET must be a unique random secret of at least 32 characters.");
if (production && (process.env.TEST_AI_FIXTURE || process.env.OPENAI_BASE_URL)) errors.push("Remove TEST_AI_FIXTURE and OPENAI_BASE_URL from production configuration.");
for (const name of ["NEXT_PUBLIC_OPENAI_API_KEY", "NEXT_PUBLIC_DATABASE_URL", "NEXT_PUBLIC_DIRECT_URL", "NEXT_PUBLIC_DEMO_SESSION_SECRET"])
  if (process.env[name]) errors.push(`${name} must not expose a secret to the browser.`);
if (errors.length) { for (const error of errors) console.error(error); process.exitCode = 1; }
else {
  console.log("Environment configuration validated (values are not printed).");
  if (!process.env.OPENAI_API_KEY) console.log("OpenAI is not configured; interactions will save raw notes without AI analysis.");
}
