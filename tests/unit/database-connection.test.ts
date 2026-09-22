import { test } from "node:test";
import assert from "node:assert/strict";
import { databaseConnection } from "../../src/lib/database-connection.mjs";

test("Heroku TLS is explicit and cannot disable verification on unrelated hosts", () => {
  const local = "postgresql://demo:placeholder@localhost/demo";
  assert.deepEqual(databaseConnection(local, {}), { connectionString: local });
  assert.throws(() => databaseConnection(local, { DATABASE_SSL_MODE: "heroku" }));
  const neon = "postgresql://demo:placeholder@ep-example.neon.tech/demo?sslmode=verify-full";
  assert.deepEqual(databaseConnection(neon, {}), { connectionString: neon });
  const heroku = databaseConnection("postgresql://demo:placeholder@db.amazonaws.com/demo?sslmode=disable", { DATABASE_SSL_MODE: "heroku" });
  assert.deepEqual(heroku.ssl, { rejectUnauthorized: false });
  assert.equal(new URL(heroku.connectionString!).searchParams.has("sslmode"), false);
});
