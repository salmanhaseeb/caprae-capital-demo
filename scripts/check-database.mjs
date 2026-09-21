import "dotenv/config";
import pg from "pg";
const client = new pg.Client({ connectionString: process.env.DATABASE_URL, connectionTimeoutMillis: 10_000, query_timeout: 10_000 });
try {
  if (!process.env.DATABASE_URL) throw new Error();
  await client.connect();
  const role = await client.query(`SELECT EXISTS (
    SELECT 1 FROM pg_roles WHERE (rolsuper OR rolbypassrls OR rolcreaterole OR rolcreatedb OR rolname = 'neon_superuser')
    AND pg_has_role(current_user, oid, 'MEMBER')
  ) AS unsafe`);
  if (role.rows[0].unsafe) throw new Error("unsafe-role");
  const tables = await client.query(`SELECT relname, relrowsecurity, relforcerowsecurity,
    pg_has_role(current_user, relowner, 'MEMBER') AS owner
    FROM pg_class WHERE relnamespace = 'public'::regnamespace AND relname IN ('Organization','User','Interaction')`);
  if (tables.rows.length !== 3 || tables.rows.some(t => !t.relrowsecurity || !t.relforcerowsecurity || t.owner)) throw new Error("unsafe-schema");
  await client.query('SELECT 1 FROM "Company" LIMIT 1');
  const visible = await client.query('SELECT 1 FROM "Interaction" LIMIT 1');
  if (visible.rowCount) throw new Error("default-deny");
  console.log("Database checks passed: reachable, restricted runtime role, forced RLS, default-deny interactions.");
} catch {
  console.error("Database verification failed. Check connectivity, migrations, SELECT grants, forced RLS, and that the runtime role is neither owner nor privileged. No credentials were printed.");
  process.exitCode = 1;
} finally { await client.end().catch(() => {}); }
