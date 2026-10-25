# Incubyte Car Dealership Inventory System

Public repository: [github.com/rayarsingh100/Incubyte-car-dealership](https://github.com/rayarsingh100/Incubyte-car-dealership)

This project is a REST API for dealership accounts, vehicle inventory, and purchases. I completed the assessment backend under a two-day deadline while also managing college responsibilities.

## Project overview

- Register accounts and log in with bcrypt password hashing and JWT authentication.
- List and view vehicles publicly, with pagination, search, and filters.
- Restrict vehicle creation, updates, deletion, and restocking to administrators.
- Allow authenticated purchases that decrement stock transactionally and prevent overselling.
- Validate request data, return consistent JSON errors, and rate-limit login attempts.
- Expose `GET /api/health` for a basic health check.

## Tech stack and structure

- Node.js and Express provide the HTTP API.
- PostgreSQL stores accounts, vehicles, and purchases; Prisma 6.19.3 provides the schema, migrations, and client.
- bcrypt hashes and checks account passwords. JWTs authenticate requests, while middleware checks the account's stored role for administrator-only routes.
- Jest and Supertest run the mocked unit suite and the separate guarded PostgreSQL integration suite.

The API is organized into Express routes, controllers, middleware, validation and error helpers, and a Prisma client wrapper under `backend/src/`. The purchase controller conditionally decrements stock and creates the purchase record inside a Prisma transaction. The integration suite exercises insufficient stock, transaction rollback, and concurrent purchase attempts against PostgreSQL.

See [backend/README.md](backend/README.md) for endpoint details, request examples, configuration, and database test safeguards.

## Setup

Requirements: Node.js 18.18 or newer and PostgreSQL.

1. In a terminal, change to `backend/` and install packages with `npm install`.
2. Copy `.env.example` to `.env`. Set `DATABASE_URL` for your PostgreSQL instance and replace the short `JWT_SECRET` placeholder with a randomly generated secret of at least 32 bytes. The server intentionally refuses to start with the example placeholder.
3. Generate Prisma Client with `npm run db:generate`.
4. Apply the checked-in migrations to the configured database with `npm run db:migrate`.
5. Start the API with `npm start` (or `npm run dev` during development).

The server loads `backend/.env`. Do not commit `.env` or share its values. Before running PostgreSQL integration tests, read the guarded database instructions in [backend/README.md](backend/README.md). The runner requires explicit target confirmation and does not reset or truncate tables.

## Verification results

The results below distinguish the latest post-fix checks from the earlier database integration run. Full command history and caveats are in [backend/TEST_REPORT.md](backend/TEST_REPORT.md).

### Latest checks after the bcrypt login fix — 2026-10-25

| Command or check | Result |
| --- | --- |
| `npm test -- --runInBand tests/auth.test.js` | Passed: 1 suite, 2 tests |
| `npm test -- --runInBand` | Passed: 4 suites, 14 tests |
| `npm run db:validate` | Passed: Prisma schema valid |
| `npm ls prisma @prisma/config deepmerge-ts` | Prisma 6.19.3; scoped `deepmerge-ts@8.0.2` override resolved |
| `npm audit --json` | Passed: 0 vulnerabilities reported |
| `npx prisma migrate status` | Passed: 2 migrations found; schema up to date; no migrations applied during the check |
| `git diff --check` | Passed |

Prisma Client generation passed in the earlier verification before the bcrypt-only change; it was not rerun for that change.

### Earlier PostgreSQL integration result — before the bcrypt login fix

The guarded integration suite passed with 1 suite and 8 tests against the explicitly authorized local `dealership_db`. This result predates the login validation fix and the integration suite was not rerun afterward. The run did not reset or truncate data. Test-created records persist except for the vehicle deleted by its own CRUD test. Future integration runs should use a dedicated disposable database ending in `_test`.

Unit tests use an in-memory Prisma mock and do not establish PostgreSQL behavior. Passing tests show the exercised scenarios passed; they do not prove the system is free of defects.

## My AI-Assisted Development Journey

I had two days to complete this assessment while managing my college responsibilities. Completing the backend manually in that period would have been difficult, so I used AI coding agents extensively to accelerate implementation. AI assistance was substantial; I do not present all of the code as manually written.

The project disclosure in [backend/PROMPTS.md](backend/PROMPTS.md) says AI assistance was used for backend API implementation based on requirements for authentication, vehicle inventory, purchases, stock safety, testing, and documentation. The workspace does not retain per-file authorship records, so I cannot reliably assign individual files or lines to me or an AI agent.

My role was to inspect the resulting implementation, run tests, investigate failures, and validate selected security and database behaviors. The recorded work includes fixing a test runner issue that stopped integration testing before Jest ran, isolating unit tests from PostgreSQL with a Prisma mock, reviewing a dependency advisory and applying a scoped override, and checking schema and migration status. I also reported manual API smoke checks; the verification report labels those results as user-reported rather than independently rerun.

### Example: bcrypt's 72-byte password boundary

Registration already limited passwords by UTF-8 byte length, but login initially accepted any nonempty string. bcrypt uses only the first 72 UTF-8 bytes, so additional bytes are ignored. An 18-emoji password occupies 72 UTF-8 bytes despite having a shorter JavaScript string length. Appending one more character therefore reached bcrypt with 73 bytes and was accepted as the same credential.

I addressed this with a test-first change. The regression test registered the 72-byte password, appended one character during login, and expected `400 INVALID_INPUT` without calling `bcrypt.compare`. Before the application change, the test failed: login returned `200` and bcrypt comparison ran once. I then added a `Buffer.byteLength(password, "utf8") > 72` check before the database lookup and comparison. The focused auth suite passed with 2 tests, and the full unit suite passed with 14 tests afterward. The integration suite was not rerun for this input-validation change. This is evidence for one specific Red–Green cycle, not for project-wide TDD.

### Security and correctness checks

The source and recorded tests support these specific behaviors: public registration assigns the default `USER` role; authenticated requests verify JWTs and load the account's stored role; administrator routes reject regular users; purchases update stock and create purchase records transactionally; and the guarded integration runner requires an explicit test database target. The dependency audit reported zero vulnerabilities with the scoped Prisma dependency override. These checks cover selected behavior and do not amount to exhaustive security testing or a production deployment review.

### Limitations and next improvements

- The integration result is from before the bcrypt fix and used the explicitly authorized local database. Rerun the guarded suite against a dedicated disposable `_test` database before relying on post-fix PostgreSQL verification; integration tests leave most test records behind.
- Jest does not have dedicated tests for missing or short JWT configuration or startup refusal, although the application implements those checks.
- The login rate limiter uses an in-memory per-process store. A multi-instance deployment needs a shared store and careful proxy configuration.
- The available `backend/PROMPTS.md` is an AI-use summary, not raw session logs. Complete raw AI prompts and assistant-response logs were not found in the workspace. Recent prompts visible in this chat are not a complete project transcript.
- No genuine application screenshots are available yet.
- The existing Git history does not demonstrate frequent small commits or project-wide Red–Green–Refactor development. I will not claim that history shows a process it does not record.

With more time, I would add edge-case tests for JWT configuration and other input boundaries, run the full integration suite on an isolated disposable database after the final code change, capture genuine API screenshots, preserve authentic AI session logs if required, and perform deployment-specific configuration and security checks. I would use and record test-first cycles throughout future work rather than infer them afterward.

## Screenshots

No genuine application screenshots were available in the workspace when this README was prepared. No screenshots are represented here; real captures can be added when available.
