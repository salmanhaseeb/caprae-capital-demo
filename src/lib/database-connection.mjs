/**
 * Connection options shared by runtime, seed, and verification scripts.
 * @param {string | undefined} connectionString
 * @param {Record<string, string | undefined>} env
 */
export function databaseConnection(connectionString, env = process.env) {
  if (env.DATABASE_SSL_MODE !== "heroku") return { connectionString };
  if (!connectionString) throw new Error("A database URL is required for Heroku SSL mode.");
  const url = new URL(connectionString);
  if (!url.hostname.endsWith(".amazonaws.com") && !url.hostname.endsWith(".heroku.com")) {
    throw new Error("Heroku SSL mode requires a Heroku database endpoint.");
  }
  // Heroku Common Runtime Postgres uses certificates outside the public CA chain.
  // Keep encryption enabled; do not disable TLS verification globally.
  for (const key of ["sslmode", "sslcert", "sslkey", "sslrootcert"]) url.searchParams.delete(key);
  return { connectionString: url.toString(), ssl: { rejectUnauthorized: false } };
}
