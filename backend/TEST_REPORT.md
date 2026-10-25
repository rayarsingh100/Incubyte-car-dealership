# Backend Verification Report

## Milestone 9 safe integration readiness (2026-10-25)

- `npm test`: passed, 6 suites and 25 tests, using the in-memory Prisma mock.
- `npm run db:validate`: passed; Prisma schema is valid.
- Frontend `npm run build`: passed.
- `git diff --check` and `git diff --cached --check`: passed.
- `npm run test:integration`: stopped at the guard because `TEST_DATABASE_URL` is not configured; no database connection or write was attempted.
- Readiness inspection found the configured backend target is PostgreSQL at `localhost:5432/dealership_db`; it was not contacted. No dedicated test URL or exact confirmation is configured. `pg_isready` found no server listening on local port 5432, so a dedicated database could not be independently identified or created.
- The runner now accepts only local `dealership_*_test` targets on port 5432 and exact `CONFIRM_TEST_DATABASE` matches; the legacy `dealership_db` exception is removed. Integration fixtures are tracked and cleanup is limited to purchases, users, and vehicles created by the current run. These integration changes have not been exercised against PostgreSQL.
- No database was changed. Existing database-backed results later in this report are historical and do not verify the updated integration suite or new purchase-history tests.

## Milestone 10 safe verification automation (2026-10-25)

- Added `npm run verify:safe` to run the non-database checks in one command. It excludes migrations and database-backed integration tests.
- The command was run successfully: backend mock/unit suite (6 suites, 25 tests), Prisma validation, JavaScript syntax checks, frontend production build, and both Git diff checks passed.
- `npm run test:integration` with test URL and confirmation explicitly unset exited at the guard with the expected missing-`TEST_DATABASE_URL` message. No database connection was attempted.
- PostgreSQL clusters were stopped in the execution environment; starting the PostgreSQL 18 cluster required root or the cluster owner. No database was inspected, created, migrated, or modified.

## Milestone 11 safe release review (2026-10-25)

- `npm run verify:safe`: passed; 6 mock/unit suites and 25 tests, Prisma validation, syntax checks, frontend build, and Git diff checks passed. A separate frontend `npm run build` also passed.
- The database guard suite passed (7 tests). `npm run test:integration` with test configuration unset exited before connecting because `TEST_DATABASE_URL` is required.
- `npm audit --json` passed for both backend and frontend: 0 vulnerabilities in each dependency tree.
- In the normal local execution context PostgreSQL 18 was online at `127.0.0.1:5432`; only `pg_isready` was used. No database connection, SQL query, migration, or write was made. The restricted workspace view reported the clusters down; no service operation was attempted during this review.
- Updated backend documentation to remove stale statements about persistent integration fixtures and the retired `dealership_db` test exception, and made the future test-database example explicitly target loopback port 5432. The updated integration suite has still not been run against PostgreSQL.

Run these commands from `backend/`.

## Post-fix verification (2026-10-25)

- Red: the focused regression test failed before application code changed. An 18-emoji password occupied exactly 72 UTF-8 bytes; appending one ASCII byte returned HTTP 200, with no error code, and called `bcrypt.compare` once.
- Green: after adding the login byte-length check, `npm test -- --runInBand tests/auth.test.js` passed (1 suite, 2 tests).
- Full unit suite after the fix: `npm test -- --runInBand` passed (4 suites, 14 tests).
- `git diff --check`: passed.
- PostgreSQL integration tests were not rerun for this input-validation change. The previously recorded 8-test integration result predates the fix; no database records were changed and no migrations were run for this change.
- No shared helper was introduced; a one-use length guard did not justify an abstraction.

## Pre-bcrypt-fix verification baseline (2026-10-25)

- `npm ls prisma @prisma/config deepmerge-ts`: passed; Prisma and `@prisma/config` remain `6.19.3`, with the scoped `deepmerge-ts@8.0.2` override resolved.
- `npm audit --json`: passed; 0 vulnerabilities (0 high, 0 moderate, 0 low, 0 critical).
- `npm run db:validate`: passed; Prisma schema is valid.
- `npm run db:generate`: passed; generated Prisma Client `6.19.3`.
- `npm test -- --runInBand`: passed; 4 suites and 13 tests. The initial sandbox attempt could not bind Supertest's local listener (`listen EPERM`); the same command passed with local listener access.
- Guarded PostgreSQL integration run: passed; 1 suite and 8 tests against `localhost:5432/dealership_db`, using the existing exact-target authorization. The runner retained its safety checks and stated that it does not reset or truncate data.
- `npx prisma migrate status`: passed; 2 migrations found and schema up to date. No migration was applied.
- `git diff --check`: passed.
- No Prisma CLI, generation, test, or migration-status failures remain. The audit verifies the current registry advisory data and resolved tree; it cannot rule out future advisories or incompatibilities outside the exercised Prisma behavior.

## Scoped dependency override validation at change time (2026-10-25; pre-bcrypt-fix baseline)

- Before the change, `prisma`, `@prisma/config`, and `@prisma/client` were all `6.19.3`; `@prisma/config` resolved `deepmerge-ts@7.1.5`. No existing npm overrides were present.
- Added only the scoped override `@prisma/config` → `deepmerge-ts@8.0.2`. `npm install` completed and reported one package changed. Prisma, Prisma Client, and unrelated direct dependencies were not upgraded.
- `npm ls prisma @prisma/config deepmerge-ts`: passed; `prisma@6.19.3` → `@prisma/config@6.19.3` → `deepmerge-ts@8.0.2 overridden`.
- `npm audit --json`: passed with 0 vulnerabilities (0 high, 0 moderate, 0 low, 0 critical). This clears the previous `GHSA-ggr8-5vv4-36mx` / `CVE-2026-40345` finding in the resolved dependency tree.
- npm reported lifecycle scripts were not allowed during install. `npm run db:generate` was run explicitly and passed, generating Prisma Client `6.19.3`.
- `npm run db:validate`: passed. `npm test -- --runInBand`: 4 suites, 13 tests passed.
- Guarded integration suite: 1 suite, 8 tests passed against the verified `dealership_db` target. Successful purchase, insufficient stock, transaction rollback, and concurrent overselling checks passed.
- This integration run created two uniquely named users, six vehicles, and three purchases. Its CRUD test deleted only its own vehicle; five vehicles and three purchases from this run remain. No reset or migration was run.
- `npx prisma migrate status`: passed; 2 migrations found and schema up to date.
- `git diff --check`: passed.

## Current audit run (2026-10-24)

- Read-only Prisma identity query confirmed database `dealership_db`, user `dealership_app`, server `127.0.0.1:5432`.
- `npx prisma migrate status`: passed; 2 migrations found and schema up to date. No migration was applied.
- The guard preserves default `_test` enforcement and permits `dealership_db` only with `ALLOW_EXISTING_DATABASE_TESTS=dealership_db`, exact URL match and confirmation, loopback host, port 5432, and user `dealership_app`. The integration test file was not changed. Seven guard acceptance/rejection checks passed.
- `npm run test:integration`: passed, 1 suite and 8 tests against the verified target. Successful purchase, insufficient stock, transaction rollback, and concurrent overselling checks all passed.
- The suite created two uniquely named users, six vehicles (one CRUD vehicle was deleted), and three purchases. Five test vehicles and three purchases remain. No reset or cleanup of other records occurred.
- The first integration attempt stopped before Jest or database writes because the runner resolved the Prisma CLI even in integration mode. `runTestDatabase.js` now resolves Prisma only in migration mode; the guarded retry passed.
- `npm test -- --runInBand`: passed, 4 suites and 13 tests. `tests/auth.test.js` mocks `../src/lib/prisma` before loading the app, so the unit test uses the in-memory Prisma double and cannot use the configured PostgreSQL client.
- `npm run db:validate`: passed; Prisma schema is valid.
- `npm ping`: sandbox DNS failed; an outside-sandbox connectivity check succeeded. `npm audit --json` reported 3 high-severity dependency entries in the Prisma CLI chain, stemming from `deepmerge-ts` (<8.0.0). No dependencies were changed.
- `git diff --check`: passed.

An earlier `npm test` run occurred before the registration test was isolated from Prisma. That test used the real Prisma client and could have inserted a uniquely named test account in the configured database. The test passed, but no database cleanup or account modification was attempted. Current and subsequent unit runs use the mock.

## Automated checks (pre-bcrypt-fix historical snapshot)

| Command | Result |
| --- | --- |
| `npm test` | Passed: 4 suites, 13 tests. All unit suites use the in-memory Prisma test double. |
| `npm run db:validate` | Passed: Prisma schema is valid. |
| `npm run db:generate` | Passed: generated Prisma Client 6.19.3. |
| `npx prisma migrate status` | Passed: 2 migrations found; schema up to date. |
| `npm run test:integration` | Passed: 1 suite, 8 tests against the explicitly authorized database. |
| `npm audit --json` | Passed: 0 vulnerabilities after the scoped override; see Security and dependency findings. |

`npm run db:migrate:test` was not run because migration status showed the schema was up to date. Integration used the guarded runner with the explicit exact-target authorization described above; default `_test` protection remains in place.

The current tests exercise bcrypt-backed login during the vehicle suite setup, invalid credentials through the rate-limit suite, and JWT authentication on protected routes. The checked-in Jest tests do not include dedicated cases for missing or short JWT configuration or server startup refusal; those behaviors are implemented but are not established by the current Jest coverage. The database-backed login check is separately covered by the integration suite.

## Real database HTTP checks performed by the agent

The backend was started on a temporary local port with a process-only random JWT key. Read-only requests against the configured local PostgreSQL database returned:

- `GET /api/health`: `200`, `{ "status": "ok" }`.
- `GET /api/vehicles?page=1&limit=2`: `200`; valid pagination response; database currently returned zero vehicles.
- `GET /api/vehicles/00000000-0000-4000-8000-000000000001`: `404`, `VEHICLE_NOT_FOUND`.
- `POST /api/auth/login` with a deliberately nonexistent test address: `401`, `INVALID_CREDENTIALS`.

Those HTTP checks did not send registration or inventory write requests. However, before this audit isolated `tests/auth.test.js`, the first `npm test` run could have inserted a uniquely named registration into the configured database. No cleanup was attempted. The current Jest/Supertest unit suite uses an in-memory Prisma test double and does not establish PostgreSQL transaction behavior.

## User-reported manual smoke checks

The user reports these later checks against the local development database; they were not independently rerun by the agent:

- `GET /api/health`: `200`.
- `GET /api/vehicles`: `200`, empty inventory.
- `POST /api/auth/register`: `201`.
- Valid `POST /api/auth/login`: `200` with JWT.
- Invalid `POST /api/auth/login`: `401`.
- A valid `USER` token attempting `POST /api/vehicles`: `403 FORBIDDEN`.

These earlier reports did not verify admin CRUD, restocking, purchases, insufficient stock, transaction rollback, or PostgreSQL concurrency; the later integration run recorded above covers these cases.

The database-backed suite is implemented at `tests/integration/api.test.js`. The historical Milestone 8 run used the then-authorized `dealership_db` exception described above; Milestone 9 removed that exception. The current runner accepts only a local `dealership_*_test` target with an exact confirmation and refuses conflicting `DATABASE_URL` values. It does not reset or truncate tables, and its cleanup deletes only purchases, vehicles, and users tracked as fixtures from the current run. The updated suite has not yet been verified against PostgreSQL.

## Security and dependency findings

- A current presence-only diagnostic finds `JWT_SECRET` configured in the Node process after dotenv loading; the value and source were not printed. The prior HTTP smoke server used a separate random, process-only key. The value is not recorded here.
- Root cause of the reported `500`: the prior login path performed the user lookup and bcrypt comparison, then threw a generic `Error` when `JWT_SECRET` was absent, immediately before `jwt.sign`. The generic error middleware converted that to `INTERNAL_ERROR`. Invalid credentials take the earlier `401` path. The successful-login test uses a real bcrypt hash/compare with the in-memory Prisma test double. The code now validates JWT configuration before credential lookup, returns a sanitized `503` from a mounted app, and fails normal server startup with a safe message.
- The pre-override audit reported 3 high-severity entries in the Prisma CLI dependency chain, caused by `deepmerge-ts` versions below 8.0.0. The advisory describes stack exhaustion when merging recursive object graphs ([GHSA-ggr8-5vv4-36mx](https://github.com/advisories/GHSA-ggr8-5vv4-36mx)). After the scoped override, the current audit reports zero vulnerabilities. Prisma remains at 6.19.3; no major upgrade was applied.
- Login rate limiting is enabled with `LOGIN_RATE_LIMIT_MAX` and `LOGIN_RATE_LIMIT_WINDOW_MS`. The in-memory store is per process, so production deployments with multiple instances need a shared store; this repository currently configures the package default store.
