# Deploy Search Memory to Vercel + Neon

Vercel runs both the Next.js UI and server actions. Neon stores the shared companies and organization-private interaction history. There is no separate backend deployment.

## 1. Use the same Node.js version locally and on Vercel

The project pins Node.js 22 in `package.json` and `.nvmrc`.

```sh
nvm install
nvm use
npm install
npx prisma generate
```

Commit `package-lock.json`. Vercel will use `npm ci` for a reproducible install. The build script regenerates Prisma before `next build --webpack`; no migrations or seeds run during builds.

## 2. Create the Neon database and migrate it

Create a Neon project with a database (for example `neondb`) in a region close to your Vercel function region. In Neon's **Connect** dialog select the intended branch, database, and owner role, then disable **Connection pooling**. Copy that connection string into `DIRECT_URL` in your ignored local `.env` or trusted release environment. Keep its TLS options.

Use this shape, replacing every placeholder:

```dotenv
DIRECT_URL="postgresql://neondb_owner:ENCODED_PASSWORD@ep-YOUR-ENDPOINT.REGION.aws.neon.tech/neondb?sslmode=require"
```

Keep your existing OpenAI key and session secret when editing `.env`. Never paste actual credentials into documentation, Git, or chat. Passwords embedded in a URL must be URL-encoded.

Apply the committed SQL migrations:

```sh
npm run db:deploy
```

Use `migrate deploy`, not `db push`: the migrations install RLS policies and constraints that are essential to organization isolation.

## 3. Create the restricted runtime role

In Neon's **SQL Editor**, on the same branch and database, run the following as the owner. Replace the password placeholder privately with a unique password-manager-generated password. Run `CREATE ROLE` only once; do not reuse the owner role for the application.

```sql
CREATE ROLE search_memory_app LOGIN
  PASSWORD 'REPLACE_WITH_A_UNIQUE_STRONG_PASSWORD'
  NOSUPERUSER NOBYPASSRLS NOCREATEDB NOCREATEROLE;

GRANT USAGE ON SCHEMA public TO search_memory_app;
GRANT SELECT ON "Company", "Organization", "User", "Interaction"
  TO search_memory_app;
GRANT INSERT ON "Interaction" TO search_memory_app;
```

Create this role with SQL. Neon Console/API role creation grants `neon_superuser` membership; the application deliberately rejects that role or any table-owner/privileged connection. See [Neon's role documentation](https://neon.com/docs/manage/roles).

Use the same endpoint/database with **Connection pooling enabled** and your new runtime role credentials for `DATABASE_URL`. Its hostname contains `-pooler`:

```dotenv
DATABASE_URL="postgresql://search_memory_app:ENCODED_PASSWORD@ep-YOUR-ENDPOINT-pooler.REGION.aws.neon.tech/neondb?sslmode=require"
```

If the Connect dialog does not offer the SQL-created role, replace only the username/password in the pooled URL with the new role credentials. Preserve the endpoint, database, and TLS parameters. The two URLs must target the same database and branch.

Prisma 7 uses `@prisma/adapter-pg` with this pooled PostgreSQL connection in the Node.js runtime. The singleton has a maximum of three connections per process and explicit timeouts. Statement and idle-transaction timeouts are applied with `SET LOCAL` inside each tenant transaction, rather than relying on startup parameters surviving Neon's proxy. CLI migrations and seeding use only `DIRECT_URL`. Transaction-local tenant context works with transaction pooling; the app does not rely on persistent session state between requests. Do not add legacy Prisma `connection_limit` or `pgbouncer` URL flags; pool settings live in the driver adapter.

## 4. Seed and verify Neon before deployment

With both Neon URLs configured in your ignored `.env`:

```sh
NODE_ENV=production ALLOW_DEMO_SEED=true npm run db:seed
npm run db:check
```

This intentionally creates fictional demo data. Repeat seeds preserve existing records and logged interactions. Do not add `ALLOW_DEMO_SEED` to Vercel.

`db:check` must succeed. It verifies the runtime role is restricted, private tables use forced RLS, and interactions are invisible without an organization context. A successful build alone does not verify database connectivity.

## 5. Configure exactly these Vercel environment variables

Enter values without surrounding quotes in **Project Settings → Environment Variables** (or the import screen):

| Variable | Value | Required? |
| --- | --- | --- |
| `DATABASE_URL` | Neon pooled TLS URL for `search_memory_app` | Yes |
| `DEMO_MODE` | `true` | Yes; explicitly enables fictional demo identities |
| `DEMO_SESSION_SECRET` | Unique random secret of at least 32 characters | Yes |
| `OPENAI_API_KEY` | Your private OpenAI project API key | For live AI; raw-note saves work without it |
| `OPENAI_MODEL` | `gpt-4.1-mini` | Optional; this is the default |

Generate the session secret locally:

```sh
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

Do **not** add `DIRECT_URL` to Vercel: it is the administrative credential for local/release migration and seed operations only. Do not set `NODE_ENV`, `PORT`, `PG_BIN`, `ALLOW_DEMO_SEED`, `TEST_AI_FIXTURE`, or `OPENAI_BASE_URL`. No `NEXT_PUBLIC_` variables or frontend API URL are needed. The frontend and backend run in the same deployment.

Select **Production** for the production values. If you enable Preview deployments, configure the same variable names for **Preview**, with a separate Neon branch/database and a separate session secret; migrate, grant, and seed that branch too. Preview builds also require production-grade configuration. Environment changes require a new deployment to take effect. See [Vercel environment variables](https://vercel.com/docs/environment-variables).

Before the first deployment, verify locally with a configured session secret:

```sh
npm run check:env
npx prisma generate
npm run build
```

The build succeeds without `DIRECT_URL` and does not contact Neon or OpenAI. Prisma's generated client is included through server imports in the Next.js build.

## 6. Import and deploy on Vercel

1. Push the source, migrations, `.env.example`, `.nvmrc`, and lockfile to GitHub. Never commit `.env`, `.local`, or credentials.
2. Open Vercel → **Add New → Project**, import the GitHub repository.
3. Set **Framework Preset: Next.js** and **Root Directory** to the folder containing `package.json` (the repository root for this project).
4. Set **Install Command: `npm ci`** and **Build Command: `npm run build`**. Leave **Output Directory** at the Next.js default. Do not configure a static export or custom start command.
5. Use **Node.js 22.x**. The package engine pins this version; verify it in **Settings → Build and Deployment → Node.js Version**. [Vercel Node.js configuration](https://vercel.com/docs/functions/runtimes/node-js/node-js-versions).
6. Enter the environment variables above. Choose a function region near Neon. The company route exports `maxDuration = 60`; ensure your hosting configuration permits that duration.
7. Enable deployment access protection for this interview demo, then click **Deploy**. Both UI and backend are deployed together.
8. Open the deployment URL. Check search results, filters, company pages, and the organization switcher. Log fictional notes and confirm the timeline refreshes. With a valid API key, verify the AI card; without one, confirm raw notes still save.
9. Verify a company with history in one organization remains **New** in the other when that organization has no history. Check the Do Not Contact warning and required outbound confirmation.

For later schema changes, apply compatible migrations with `npm run db:deploy` in a trusted release environment before deploying the corresponding code. Do not put migration or seed commands into the Vercel build command.

## Troubleshooting and scope

- **Build requests a session secret:** set `DEMO_SESSION_SECRET` for the correct Vercel environment and redeploy.
- **Companies cannot load:** verify the URLs target the migrated branch, the runtime role has grants, and `npm run db:check` passes. An owner/admin URL is intentionally rejected.
- **No demo users:** seed the same database/branch used by the runtime.
- **Raw notes save but AI is unavailable:** check `OPENAI_API_KEY`, model access, and API billing; redeploy after changing environment variables. Do not log notes or keys while debugging.
- **Local install engine warning:** run `nvm use` to select Node.js 22.

The organization switcher is intentionally public demo functionality, not customer authentication. Use fictional data and access protection. Real customer use requires authentication, verified organization membership, and AI abuse/rate controls. Live Neon connectivity and Vercel hosting can only be verified after those accounts and credentials are configured; local builds do not prove a cloud deployment works.
