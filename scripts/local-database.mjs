import "dotenv/config";
import { existsSync, mkdirSync, chmodSync } from "node:fs";
import { resolve, join } from "node:path";
import { spawnSync } from "node:child_process";
import pg from "pg";

const prisma = resolve("node_modules/prisma/build/index.js");
function run(command, args, options = {}) {
  const result = spawnSync(command, args, { stdio: "inherit", ...options });
  if (result.error || result.status !== 0) {
    throw new Error(`Local database setup failed at ${command.split("/").pop()}. ${result.error?.message ?? "See output above."}`);
  }
}

async function main() {
  // Preserve client generation for every configuration, including Neon.
  run(process.execPath, [prisma, "generate"]);
  const runtime = new URL(process.env.DATABASE_URL || "postgresql://unconfigured");
  const admin = new URL(process.env.DIRECT_URL || "postgresql://unconfigured");
  const socket = "/tmp/search-memory-pg-socket";
  const isDemo = url => url.hostname === "localhost" && url.port === "55439" && url.pathname === "/search_memory" && url.searchParams.get("host") === socket;
  if (!isDemo(runtime) || !isDemo(admin) || runtime.username !== "search_memory_app" || admin.username !== "postgres") {
    console.log("Using your configured database; local PostgreSQL startup skipped.");
    return;
  }
  const bin = process.env.PG_BIN || "/usr/lib/postgresql/14/bin";
  if (!existsSync(join(bin, "pg_ctl"))) throw new Error("PostgreSQL binaries not found. Set PG_BIN to their directory, or configure an external database.");
  const data = resolve(".local/postgres");
  mkdirSync(resolve(".local"), { recursive: true, mode: 0o700 });
  mkdirSync(socket, { recursive: true, mode: 0o700 });
  chmodSync(socket, 0o700);
  if (!existsSync(join(data, "PG_VERSION"))) {
    // Never replace an older temporary cluster that might contain user notes.
    if (existsSync("/tmp/search-memory-pg-data/PG_VERSION")) throw new Error("An older temporary database exists. Migrate it before initializing persistent storage.");
    run(join(bin, "initdb"), ["-D", data, "-U", "postgres", "--auth-local=trust", "--auth-host=reject", "--no-locale", "-E", "UTF8"]);
  }
  const running = spawnSync(join(bin, "pg_ctl"), ["-D", data, "status"], { stdio: "ignore" });
  if (running.status !== 0) {
    // Unix socket only, accessible to this OS user. No TCP listener or remote trust auth.
    run(join(bin, "pg_ctl"), ["-D", data, "-l", resolve(".local/postgres.log"), "-o", `-k ${socket} -p 55439 -h ''`, "-w", "start"]);
  }
  const maintenance = new URL(admin);
  maintenance.pathname = "/postgres";
  const client = new pg.Client({ connectionString: maintenance.href });
  await client.connect();
  try {
    if (!(await client.query("SELECT 1 FROM pg_database WHERE datname = 'search_memory'")).rowCount)
      await client.query('CREATE DATABASE search_memory');
    if (!(await client.query("SELECT 1 FROM pg_roles WHERE rolname = 'search_memory_app'")).rowCount)
      await client.query('CREATE ROLE search_memory_app LOGIN NOSUPERUSER NOBYPASSRLS');
  } finally { await client.end(); }
  run(process.execPath, [prisma, "migrate", "deploy"]);
  const grants = new pg.Client({ connectionString: admin.href });
  await grants.connect();
  try {
    await grants.query('GRANT USAGE ON SCHEMA public TO search_memory_app; GRANT SELECT ON "Company", "Organization", "User", "Interaction" TO search_memory_app; GRANT INSERT ON "Interaction" TO search_memory_app');
  } finally { await grants.end(); }
  run(process.execPath, [prisma, "db", "seed"]);
  console.log("Local database ready. Data persists in .local/postgres; existing interactions are preserved.");
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });
