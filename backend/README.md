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

Vehicle create requires exactly these fields: `make`, `model`, `category`, `price`, and `quantity`. Patch accepts one or more of the same fields; unknown fields are rejected. `make`, `model`, and `category` must be strings, are trimmed, and must contain 1–100 characters. `price` must be a JSON number greater than zero, no greater than `9999999999.99`, with at most two decimal places. Create/update `quantity` must be an integer from 0 through `2147483647`; purchase/restock `quantity` must be an integer from 1 through `2147483647`, and total stock cannot exceed `2147483647`. IDs must be UUIDs.

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

`GET /api/health` returns `200` with `{ "status": "ok" }`.
