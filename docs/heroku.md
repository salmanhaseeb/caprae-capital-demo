# Deploy Search Memory on Heroku + Neon

Heroku runs the frontend and backend together as one Next.js web process. Neon remains the PostgreSQL provider. This setup uses the classic `heroku/nodejs` buildpack on the `heroku-24` stack; it does not provision any paid services automatically.

## What is configured

- Node.js 22 is pinned in `package.json` and `.nvmrc`.
- `heroku-postbuild` runs `npm run build`, including environment validation and Prisma generation.
- `Procfile` starts `next start` on `0.0.0.0` using Heroku's assigned `$PORT`.
- `next.config.mjs` can be loaded after Heroku removes development dependencies; runtime startup does not require TypeScript to compile the configuration.
- `.slugignore` excludes local environment files, database data, and test reports from build uploads.
- The OpenAI request has a 15-second timeout and no automatic retries. AI failures preserve raw-note saving. Heroku's router has a 30-second initial-response deadline; the Vercel-specific `maxDuration` export does not extend it. Slow database operations or contention can still exceed that deadline. A background-job design would be needed for reliably longer AI work. [Heroku request timeouts](https://devcenter.heroku.com/articles/request-timeout).

## 1. Prepare Neon once

### Existing Heroku Postgres Essential deployments

If your app already uses Heroku Postgres Essential, it has only an owner credential. For this fictional demo, set `DATABASE_SSL_MODE=heroku` and `DEMO_ALLOW_DATABASE_OWNER=true` alongside `DEMO_MODE=true`. The application still rejects superuser/BYPASSRLS/role-administration privileges and requires enabled **and forced** row-level security on all three private tables. Organization context remains transaction-local and every application query remains tenant-scoped. The owner can alter its own schema, so this mode is less privileged separation than a dedicated runtime role and must not be used for private customer deployments.

Heroku SSL mode encrypts the PostgreSQL connection using Heroku Common Runtime's certificate policy; it is restricted to Heroku/AWS endpoints and does not change TLS behavior for OpenAI or other services. Migrate using the same database URL in a private release environment with `sslmode=require&sslaccept=accept_invalid_certs`; seed with `DATABASE_SSL_MODE=heroku`, `DIRECT_URL` set privately, and `NODE_ENV=production ALLOW_DEMO_SEED=true`. Never log the URL or put it in a command committed to Git. The migrations and seed are repeatable; no reset is needed.

Continue below only if provisioning Neon instead.

If your Neon database is already migrated, seeded, and has the restricted runtime role, skip creation and run `npm run db:check` against it.

Otherwise follow steps 2–4 of the [Neon setup guide](deployment.md):

1. Create the Neon project/database.
2. Put the direct owner URL in `DIRECT_URL` in an ignored local `.env`.
3. Run `npm run db:deploy` to install tables, constraints, and RLS policies.
4. Create `search_memory_app` using the SQL in that guide, with SELECT grants on company/user/organization/interaction tables and INSERT on interactions. Do not use a Neon administrative role as the runtime user.
5. Put the pooled TLS URL for that restricted role in `DATABASE_URL`.
6. Seed the fictional data and verify access:

```sh
NODE_ENV=production ALLOW_DEMO_SEED=true npm run db:seed
npm run db:check
```

Both URLs must target the same Neon database/branch. Keep the admin URL in your local or trusted release environment only. Database data persists in Neon, not on Heroku's temporary filesystem. Do not attach Heroku Postgres to this setup, since that can replace `DATABASE_URL`.

## 2. Create the Heroku application

Push your project and lockfile to GitHub without `.env` or credentials. With the Heroku CLI installed, run:

```sh
heroku login
heroku create YOUR_UNIQUE_APP_NAME --stack heroku-24
heroku buildpacks:set heroku/nodejs --app YOUR_UNIQUE_APP_NAME
```

Replace `YOUR_UNIQUE_APP_NAME` everywhere with the name you choose. Creating an app does not configure Neon. Choose a Heroku region close to Neon when creating the app if region selection is available for your account.

In the Heroku dashboard open the app → **Settings → Reveal Config Vars**. Enter these before deploying:

| Key | Value |
| --- | --- |
| `DATABASE_URL` | Neon pooled TLS connection URL for `search_memory_app` |
| `DEMO_MODE` | `true` |
| `DEMO_SESSION_SECRET` | A unique random value of at least 32 characters |
| `OPENAI_API_KEY` | Your private OpenAI API key; optional if you only need raw-note saves |
| `OPENAI_MODEL` | Optional; defaults to `gpt-4.1-mini` |

Generate the session secret locally and paste the result privately:

```sh
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

Do not include quotes around dashboard values. Do not add `DIRECT_URL`, `ALLOW_DEMO_SEED`, `TEST_AI_FIXTURE`, `OPENAI_BASE_URL`, or `NEXT_PUBLIC_` credentials. Let Heroku supply `PORT` and production `NODE_ENV`. Do not set `NPM_CONFIG_PRODUCTION=true` or `NPM_CONFIG_OMIT=dev` during installation: Prisma, TypeScript, and Tailwind build tools are required before the buildpack prunes development dependencies.

Config vars are available to both builds and runtime with this classic buildpack. Prisma generation does not need the administrative URL. [Heroku Node.js build lifecycle](https://devcenter.heroku.com/articles/nodejs-classic-buildpack-builds).

## 3. Deploy from GitHub

1. In the Heroku app, open **Deploy**.
2. Select **GitHub** as the deployment method, authorize the connection, and connect this repository.
3. In **Manual deploy**, choose the branch containing these changes and click **Deploy Branch**.
4. Watch the build finish: dependency install → environment validation → Prisma generation → Next.js build → development dependency pruning.
5. In **Resources**, choose the web dyno plan you want and enable one `web` dyno. This can incur Heroku charges; select the plan in your account rather than assuming a free tier.
6. Click **Open app**, or run:

```sh
heroku open --app YOUR_UNIQUE_APP_NAME
```

Alternatively, deploy committed code using Heroku Git:

```sh
heroku git:remote --app YOUR_UNIQUE_APP_NAME
git push heroku HEAD:main
```

No separate frontend deployment, custom buildpack, Vercel configuration, or worker dyno is required for this demo. Heroku uses the Procfile's web command. There is deliberately no `release` migration command: the running app has no admin credential, and Prisma CLI development dependencies are pruned.

## 4. Check the deployment

- Search Leads loads seeded companies.
- A company's history changes with the selected organization; another organization's interactions do not make a lead appear previously contacted.
- Logging fictional notes refreshes the timeline and shows AI information with a valid key.
- With AI unavailable, raw notes still save.
- Do Not Contact remains visible and outbound logging requires confirmation.
- Test using the HTTPS app URL so production secure cookies work.

For startup errors:

```sh
heroku ps --app YOUR_UNIQUE_APP_NAME
heroku logs --tail --app YOUR_UNIQUE_APP_NAME
```

Do not paste logs containing credentials or private interaction notes. Common causes are missing config vars, a privileged database role, the wrong Neon branch, missing migrations/seed data, or a disabled web dyno. H12 indicates a request exceeded the router deadline; check DB latency and AI response times.

## Local verification and later releases

If a build reports Prisma `P1012` about a datasource `url`, verify that the deployed `prisma/schema.prisma` contains only `provider = "postgresql"` in its datasource block. Prisma 7 reads the migration URL from `prisma.config.ts`; the application's PostgreSQL adapter reads `DATABASE_URL`. Do not add `url = env("DATABASE_URL")` to the schema. Commit and push the fix, then deploy that updated branch; retrying an older commit repeats the failure.

```sh
nvm install
nvm use
npm install
npx prisma generate
npm run heroku-postbuild
PORT=5000 npm start -- --hostname 0.0.0.0
```

Configure a valid `DEMO_SESSION_SECRET` before the production build. Keep migrations and seed operations local or in a trusted release job with `DIRECT_URL`; apply compatible migrations before deploying corresponding code. Do not run `db:local`, `migrate dev`, `db push`, or seed automatically on dyno startup. Local PostgreSQL helper paths are not deployable database URLs.

This remains a fictional interview demo. Its organization switcher is not real authentication, and any visitor can choose either demo identity. Do not store private customer data; access controls and AI abuse/rate controls are still required before public customer use. This preparation does not create or deploy a Heroku app or Neon database.
