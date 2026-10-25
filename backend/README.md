# Car Dealership API

Express and Prisma REST API for account authentication, vehicle inventory, and purchases.

## Setup

Requirements: Node.js 18.18 or newer and PostgreSQL.

1. From `backend/`, install dependencies with `npm install`.
2. Copy `.env.example` to `.env`, set `DATABASE_URL`, and replace `JWT_SECRET` with a private randomly generated value of at least 32 bytes.
3. Generate the Prisma client with `npm run db:generate`.
4. Apply migrations with `npm run db:migrate`.
5. Start the API with `npm start` (or `npm run dev` for development).

The server loads `backend/.env`. `DATABASE_URL` and `JWT_SECRET` are required for database access and login; the secret must be at least 32 bytes and should be generated randomly. The server refuses to start if `JWT_SECRET` is missing or too short. If the app is mounted without the server bootstrap, login returns a sanitized `503` configuration error instead of attempting to sign a token. Never commit `.env` or share its values. Login attempts are limited per client IP by `LOGIN_RATE_LIMIT_MAX` during `LOGIN_RATE_LIMIT_WINDOW_MS` (defaults: 5 attempts per 15 minutes). The default in-memory limiter is per process; multi-instance deployments should configure a shared rate-limit store and trust proxy settings only for known proxies. Public registration always creates `USER` accounts.

## Commands

From `backend/`, run `npm run verify:safe` for the non-database regression checks: mocked unit tests (including database-guard tests), Prisma schema validation, JavaScript syntax checks, frontend production build, and Git diff checks. This command does not connect to PostgreSQL, run migrations, or execute database-backed tests. Separately, use `npm run db:generate` to generate Prisma Client, `npx prisma migrate status` to check migration state, and `npm run db:migrate` only when you intend to apply checked-in migrations to the configured database.

`npm test` runs mocked Jest/Supertest unit tests. PostgreSQL integration tests run separately and require `TEST_DATABASE_URL` plus an exact `CONFIRM_TEST_DATABASE` value. The target must be a local PostgreSQL database on port 5432 named `dealership_*_test`; the runner rejects `dealership_db`, remote hosts, missing confirmation, and conflicting `DATABASE_URL` values. It never falls back to `DATABASE_URL` and prints only the target host and database name before connecting. The suite does not reset or truncate tables. It tracks its unique user and vehicle IDs, deletes only purchases tied to those fixtures, then removes only those users and vehicles.

To configure a new dedicated database, first create it with a name reserved for this suite. `createdb` fails if that database already exists, so do not use a pre-existing database unless you have independently confirmed that it is dedicated and disposable. Verify the selected identity before migration:

```sh
createdb -h 127.0.0.1 -p 5432 dealership_integration_test || exit 1
test "$(psql -h 127.0.0.1 -p 5432 -d dealership_integration_test -Atqc 'SELECT current_database()')" = dealership_integration_test || exit 1
read -rsp 'Dedicated local test database URL: ' TEST_DATABASE_URL
export TEST_DATABASE_URL
printf '\n'
export CONFIRM_TEST_DATABASE=dealership_integration_test
unset DATABASE_URL
npm run db:migrate:test
npm run test:integration
```

The confirmation value must exactly match the database name. The example assumes local PostgreSQL authentication is configured. Never use the development database URL for these commands. Integration tests remove only records tied to their unique fixtures; they never reset or truncate the database. See `TEST_REPORT.md` for completed checks and limitations.

## Production deployment notes

The public Render frontend and backend were reachable on 2026-10-25. Read-only checks confirmed the frontend's API base, backend health response, vehicle-list response, and exact-origin CORS preflight. The owner reports the Neon image URL migration is applied and Prisma reports the schema up to date. These checks do not reveal all Render or Neon dashboard settings, the configured proxy-hop count, or backup and retention policies; verify those settings in their dashboards before changing or relying on them.

- **Hosting and API routing:** Host the Vite build as static files and run Express as a Node.js web service. The Vite proxy only works during development. For separate frontend and backend origins, set `FRONTEND_ORIGIN` on the backend to the exact frontend origin. The API allows only that origin, the application's `GET`, `POST`, `PATCH`, and `DELETE` methods, and the `Authorization` and `Content-Type` headers; preflight requests outside that contract are rejected. CORS controls browser access and is not an authorization boundary. Same-origin deployments can leave `FRONTEND_ORIGIN` unset if the host routes `/api` to Express.
- **Frontend configuration:** Set `VITE_API_BASE_URL` at frontend build time. `/api` is suitable only when the hosting layer routes that path to the backend. A separately hosted API requires its HTTPS origin in this variable.
- **Backend configuration:** Provide `DATABASE_URL` for the production PostgreSQL connection, `JWT_SECRET` for token signing (at least 32 random bytes), `FRONTEND_ORIGIN` when the browser frontend uses a separate origin, and `TRUST_PROXY_HOPS` after verifying the production proxy chain. Render supplies `PORT`; the server binds to `0.0.0.0` and uses port `3000` for local development when `PORT` is absent. `LOGIN_RATE_LIMIT_WINDOW_MS` and `LOGIN_RATE_LIMIT_MAX` configure login throttling; their current defaults are 15 minutes and 5 attempts. Keep backend secrets in the host's secret manager, not in frontend build variables or committed files. `TEST_DATABASE_URL`, `CONFIRM_TEST_DATABASE`, and `TEST_JWT_SECRET` are test-only and must not be used as production settings.
- **PostgreSQL and migrations:** Use a managed PostgreSQL service with TLS, backups, network restrictions, and limited database privileges. Apply the checked-in Prisma migrations as a controlled release step by running `npm run db:migrate` from `backend/` against the verified production target. Do not run migrations automatically from every application instance. The repository currently uses the same `DATABASE_URL` for runtime queries and Prisma migrations; ensure the release migration connection has DDL privileges. Separate runtime and migration identities are not configured. The repository does not configure a production database, backup policy, or connection pooler.
- **JWT operations:** Generate `JWT_SECRET` with a cryptographically secure random generator and provision it through a secret manager. The backend checks only that it is at least 32 UTF-8 bytes; that check does not establish randomness. Tokens expire after one hour. There is no refresh or server-side revocation mechanism, so secret rotation invalidates existing sessions.
- **Rate limiting and proxies:** Login throttling uses an in-memory per-process store and defaults to 5 attempts per 15 minutes. Render sends requests through its proxy chain, so without explicit proxy trust the app may see a shared proxy IP for all visitors. `TRUST_PROXY_HOPS` accepts only an integer from 1 through 5 and is unset by default; configure it only after verifying the actual hop count. Never set Express trust proxy to `true` or `*`. Multi-instance deployment needs a shared rate-limit store.
- **Health and readiness:** `GET /api/health` is a liveness response and does not connect to PostgreSQL. `GET /api/ready` performs only `SELECT 1`, returns `200 { "status": "ready" }` when PostgreSQL responds, and returns a sanitized `503 { "status": "not_ready" }` otherwise. Keep Render's health check on `/api/health` so a database outage does not cause a liveness restart loop; use `/api/ready` for explicit readiness checks after migration.
- **Admin provisioning:** Public registration always creates `USER` accounts. `npm run provision:demo-admin` is a one-time CLI that creates a new ADMIN only after explicit Neon hostname/database confirmation, an interactive database-name confirmation, and private hidden password entry. It never promotes an existing account and refuses local databases or a conflicting `DATABASE_URL`. Run it only after the user explicitly approves the verified demo target; do not add public admin registration or reuse `scripts/create-admin-test-user.js`, which is restricted to the local test database.
- **Automated checks:** `npm run verify:safe` runs mocked unit tests, Prisma schema validation, syntax checks, and the frontend build without database integration. `npm run preflight:deploy` checks required deployment environment variable shape without connecting to Neon or printing values. `npm run smoke:deploy` calls only health/readiness/vehicle/purchase-history reads, an optional CORS preflight, and optionally one login POST; it never registers accounts or mutates inventory. Use a dedicated demo account, since login is rate limited.
- **Build and start:** Build the frontend with `npm ci && npm run build` from `frontend/`, then serve `frontend/dist`. Install backend dependencies with `npm ci`, generate Prisma Client with `npm run db:generate`, apply migrations in the controlled release step, then start the service with `npm start` from `backend/`.
- **Deployment smoke checks:** Run `npm run preflight:deploy` in the backend deployment environment, then set `SMOKE_API_BASE_URL` to the backend's HTTPS `/api` URL. Optionally set `SMOKE_FRONTEND_ORIGIN` for a CORS preflight and both `SMOKE_TEST_EMAIL` and `SMOKE_TEST_PASSWORD` for a single demo-account login and read-only purchase-history check. The script does not print URLs, credentials, tokens, or API response bodies. Do not use real customer credentials or perform purchase/inventory mutations as smoke tests.

Choose hosting regions, domains, and any paid capacity only after comparing current plans and operational requirements; this repository does not include provider configuration or cost estimates.

### Render + Neon portfolio demo procedure

The following checklist documents the current Render/Neon deployment settings and safe update procedure. It is not a record of new resource creation. The current public service URLs are `https://incubyte-car-dealership-2x0e.onrender.com` and `https://incubyte-car-dealership-api.onrender.com`; verify dashboard values before changing them.

1. **Verify the Neon target before any migration.** In the dashboard, confirm the intended project, branch, and database before supplying its URL. Keep credentials private. Use a separately verified disposable local database for guarded integration tests; do not repurpose the application database for those tests.
2. **Apply a pending migration as a deliberate release step.** The owner reports the `20261025000000_add_vehicle_image_url` migration has already been applied and Prisma reports the Neon schema up to date. Do not rerun migrations unnecessarily. For a future pending migration, first verify the project, branch, database, and Prisma migration status. Then from `backend/` in a trusted Bash terminal, install dependencies with `npm ci` and use the private target-confirmation command below. It prompts for the URL without echoing it, confirms the expected Neon host and database name, and runs only checked-in migrations. The subshell keeps the URL out of the parent shell environment; Prisma dotenv loading does not override the explicitly exported value.

   Before running it for the production branch, verify the project, branch, and database in the Neon dashboard. A read-only column check for the manually added vehicle image column is:

   ```sql
   SELECT data_type, is_nullable
   FROM information_schema.columns
   WHERE table_schema = 'public'
     AND table_name = 'Vehicle'
     AND column_name = 'imageUrl';
   ```

   The `20261025000000_add_vehicle_image_url` migration adds the nullable `TEXT` column when absent. If the manually created column is already nullable `TEXT`, it leaves that column intact while Prisma records the migration. If the existing column has a different type or nullability, the migration aborts; stop and review rather than altering the production schema manually.

   ```bash
   cd ~/projects/incubyte-car-dealership/backend
   npm ci
   (
     set -eu
     read -rsp 'Neon DATABASE_URL: ' DATABASE_URL
     printf '\n'
     export DATABASE_URL
     read -rp 'Expected Neon database name from the dashboard: ' EXPECTED_DEMO_DATABASE
     export EXPECTED_DEMO_DATABASE
     node -e 'try { const u = new URL(process.env.DATABASE_URL); const db = decodeURIComponent(u.pathname.slice(1).split("/")[0]); if (!u.hostname.endsWith(".neon.tech") || db !== process.env.EXPECTED_DEMO_DATABASE) throw new Error(); console.log(`Verified Neon migration target: ${u.hostname}/${db}`); } catch { console.error("Refusing migration: invalid URL, Neon host, or expected database name did not match."); process.exit(1); }'
     npm run db:migrate
   )
   ```

   Do not run this command until the displayed target matches the intended Neon project and database. It does not modify `backend/.env`; it applies schema migrations, not seed data.
3. **Verify the backend Render Web Service.** The documented settings are Root Directory `backend`, Node runtime, Build Command `npm ci && npm run db:generate`, Start Command `npm start`, Health Check Path `/api/health`, and `NODE_VERSION=22.22.0`. Verify backend environment variables privately: `DATABASE_URL`, `JWT_SECRET`, exact `FRONTEND_ORIGIN=https://incubyte-car-dealership-2x0e.onrender.com`, and an evidence-based `TRUST_PROXY_HOPS` from 1 through 5. Render supplies `PORT`. Never place backend secrets in the static site's environment.
4. **Verify the frontend Render Static Site.** The documented settings are Root Directory `frontend`, Build Command `npm ci && npm run build`, Publish Directory `dist`, and `NODE_VERSION=22.22.0`. The current frontend bundle uses `VITE_API_BASE_URL=https://incubyte-car-dealership-api.onrender.com/api`; this value is public and compiled into the browser bundle. If the backend URL changes, update the API URL and rebuild the static site.
5. **Verify cross-origin configuration and smoke checks.** A public `OPTIONS` check on 2026-10-25 returned an allowed preflight for the frontend origin. Confirm the Render `FRONTEND_ORIGIN` matches that exact origin. Run `npm run preflight:deploy`, then `npm run smoke:deploy` with an HTTPS `SMOKE_API_BASE_URL`; optionally provide a dedicated demo account and `SMOKE_FRONTEND_ORIGIN`. The script checks liveness, database readiness, read-only inventory and purchase-history routes, and CORS without creating inventory or purchase data.

For a demo requiring administrator inventory controls, after migrations and separate approval, set `DEMO_DATABASE_URL`, `CONFIRM_DEMO_HOST`, and `CONFIRM_DEMO_DATABASE` privately and run `npm run provision:demo-admin` in an interactive terminal. The script asks for the database name again and hides password input. It creates only a new ADMIN account; it does not seed vehicles. Public registration remains USER-only. Free services can sleep, and Neon can scale its compute to zero; expect delayed first requests and verify current provider quotas, backup/restore options, and usage limits before treating the demo as durable production data.

## API

All responses use JSON. Errors have the shape `{ "error": { "code": "...", "message": "..." } }`. Authentication uses `Authorization: Bearer <JWT>`; tokens expire after one hour. Vehicle listing and reads are public. Vehicle mutations and restocking require an administrator. Purchases require any authenticated account.

### Authentication

| Method | Path | Access | Success |
| --- | --- | --- | --- |
| POST | `/api/auth/register` | Public | `201` with `{ "user": { "id", "name", "email", "role", "createdAt" } }` |
| POST | `/api/auth/login` | Public | `200` with `{ "token": "...", "user": { ... } }` |

Example registration body: `{ "name": "Sam Driver", "email": "sam@example.com", "password": "a-long-password" }`. Passwords must have a JavaScript string length of at least 8 and a UTF-8 byte length of no more than 72; multibyte characters can reach the byte limit before 72 visible characters. Login applies the same 72-byte UTF-8 maximum. Emails are trimmed and lowercased. Duplicate email returns `409`; invalid input returns `400`; incorrect login credentials return `401`.

### Vehicles

| Method | Path | Access | Success |
| --- | --- | --- | --- |
| GET | `/api/vehicles` | Public | `200` with `{ "vehicles": [...], "pagination": { "page", "limit", "total", "pages" } }` |
| GET | `/api/vehicles/:id` | Public | `200` with `{ "vehicle": { ... } }` |
| POST | `/api/vehicles` | Admin | `201` with `{ "vehicle": { ... } }` |
| PATCH | `/api/vehicles/:id` | Admin | `200` with `{ "vehicle": { ... } }` |
| DELETE | `/api/vehicles/:id` | Admin | `200` with `{ "message": "Vehicle deleted." }` |
| POST | `/api/vehicles/:id/restock` | Admin | `200` with `{ "vehicle": { ... } }` |
| POST | `/api/vehicles/:id/purchases` | Authenticated | `201` with `{ "purchase": { ... }, "vehicle": { ... } }` |

### Purchase history

| Method | Path | Access | Success |
| --- | --- | --- | --- |
| GET | `/api/purchases` | Authenticated | `200` with `{ "purchases": [...], "pagination": { "page", "limit", "total", "pages" } }` |

Purchase history accepts `page` (default 1) and `limit` (default 20, maximum 100). It always filters by the authenticated user's ID and orders records by `createdAt` descending, then `id` descending. Each item contains the purchase `id`, `vehicleId`, `quantity`, `unitPrice`, and `createdAt`, a computed `totalAmount`, and the vehicle's `id`, `make`, `model`, and `category`. It does not return user records or password data. Missing, invalid, and expired bearer tokens return `401`.

Vehicle create requires `make`, `model`, `category`, `price`, and `quantity`; optional `imageUrl` may be an HTTP/HTTPS URL up to 2,048 characters or `null`. Patch accepts one or more of those fields; `imageUrl: null` clears the image. Unknown fields are rejected. `make`, `model`, and `category` must be strings, are trimmed, and must contain 1–100 characters. `price` must be a JSON number greater than zero, no greater than `9999999999.99`, with at most two decimal places. Create/update `quantity` must be an integer from 0 through `2147483647`; purchase/restock `quantity` must be an integer from 1 through `2147483647`, and total stock cannot exceed `2147483647`. IDs must be UUIDs.

For admin testing, use the guarded integration suite on a separate disposable `dealership_*_test` database. It registers unique test accounts and elevates only its newly registered test account inside that database. Do not change the role of an existing development account. After the run, it deletes only purchases, vehicles, and users identified as fixtures created by that run; it never resets or truncates tables.

List query parameters include `page` (default 1), `limit` (default 20, maximum 100), `search` (matches make/model/category), exact `make`, `model`, and `category`, `minPrice`, `maxPrice`, and `inStock=true|false`.

Example create request:

```sh
curl -X POST http://localhost:3000/api/vehicles \
  -H 'Authorization: Bearer <admin-jwt>' -H 'Content-Type: application/json' \
  -d '{"make":"Toyota","model":"Corolla","category":"Sedan","price":25000,"quantity":4}'
```

Example purchase request:

```sh
curl -X POST http://localhost:3000/api/vehicles/<vehicle-id>/purchases \
  -H 'Authorization: Bearer <jwt>' -H 'Content-Type: application/json' \
  -d '{"quantity":1}'
```

Purchases decrement stock and record the unit price in one Prisma transaction. A missing vehicle returns `404`; insufficient stock returns `409`. Vehicles with purchase history cannot be deleted and return `409`. Invalid request/query/ID returns `400`, missing or invalid authentication returns `401`, and non-admin writes return `403`. Unexpected failures return a generic `500` without internal details.

## Health

`GET /api/health` returns `200` with `{ "status": "ok" }` without connecting to PostgreSQL. `GET /api/ready` performs a read-only `SELECT 1` and returns `200 { "status": "ready" }` or a sanitized `503 { "status": "not_ready" }`; it never returns connection details.
