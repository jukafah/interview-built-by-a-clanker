# Backend plan and implementation map

Track backend functionality, its implementation locations, and functional walkthroughs. This document covers operations only; bug findings are excluded. The mapped functionality already exists, and unchecked items represent pending walkthroughs.

## Small plan

- [x] Inventory backend routes and major operations.
- [x] Map functional areas to implementation files.
- [x] Add and execute one basic-operation test per method/path (14 tests total).
- [x] Walk through catalog browsing and account flows.
- [x] Walk through cart, favorites, and checkout flows.
- [x] Record functional verification status in the tracker below.

## Implementation map

Paths below are relative to the repository root.

| Area | Endpoints | Main operations | Implementation |
| --- | --- | --- | --- |
| Accounts | `POST /auth/register`, `POST /auth/login`, `GET /auth/me` | Create users, issue JWTs, retrieve current user | `apps/api/src/routes/auth.ts`; `packages/shared/src/schemas/auth.ts` |
| Catalog | `GET /personas`, `GET /personas/:id` | Browse, search, filter by specialty/tier/price, sort, retrieve details | `apps/api/src/routes/personas.ts`; `packages/shared/src/schemas/persona.ts` |
| Cart | `GET /cart`, `POST /cart`, `PUT /cart/:itemId`, `DELETE /cart/:itemId` | Retrieve cart, add items, update quantities, remove items, calculate totals | `apps/api/src/routes/cart.ts`; `packages/shared/src/schemas/cart.ts` |
| Favorites | `GET /favorites`, `POST /favorites`, `DELETE /favorites/:personaId` | List, save, and remove favorite personas | `apps/api/src/routes/favorites.ts` |
| Checkout | `POST /checkout` | Accept customer name/email, create and return an order with items, total, and timestamp | `apps/api/src/routes/checkout.ts`; `packages/shared/src/schemas/order.ts` |
| Health | `GET /health` | Report server availability | `apps/api/src/app.ts`; `apps/api/test/health.test.ts` |

## Supporting implementation

- **Server:** `apps/api/src/app.ts` configures Fastify, CORS, JWT, and routes. `apps/api/src/index.ts` starts the server on port `3001` with logging enabled.
- **Authentication:** `apps/api/src/middleware/auth.ts` provides the authentication handler used by account and shopping routes.
- **Data layer:** `apps/api/src/db.ts` contains the seeded persona catalog and in-memory user, cart, favorite, and order storage. It provides lookup and mutation helpers; state resets when the process restarts.
- **Shared contracts:** `packages/shared/src/index.ts` exports TypeScript types and Zod schemas for use by the API and frontend.

## Functional walkthrough tracker

Mark complete after reviewing the flow and recording verification status. A checked row means the walkthrough was executed, not that every assertion passed. Detailed findings remain excluded.

| Done | Area | Walkthrough scope | Verification status |
| --- | --- | --- | --- |
| [x] | Health | Request server status through Fastify injection | Passed: one test checks HTTP 200 and `{ "status": "ok" }` |
| [x] | Catalog | List personas, apply search/filter/sort options, open a persona | Executed: basic tests plus `catalog-browsing.test.ts` |
| [x] | Accounts | Register, log in, retrieve current user using the login token | Executed: basic tests plus account walkthrough |
| [x] | Cart | Add an item, view cart, change quantity, remove item | Executed: basic tests plus cart walkthrough |
| [x] | Favorites | Save a persona, list favorites, remove the favorite | Executed: basic tests plus favorites walkthrough |
| [x] | Checkout | Populate a cart, submit customer details, inspect returned order | Executed: basic tests plus checkout walkthrough |

Run backend tests from the repository root with `pnpm test:backend` after dependencies are installed and the shared package is built.

## Basic-operation test coverage

Tests use Node's test runner and Fastify injection, with authentication enabled by the backend test command. Each test creates a fresh app; account and shopping tests use unique users. Data helpers prepare cart and favorite fixtures so each operation can be exercised independently.

| Test file (under `apps/api/test/`) | Operations covered | Tests |
| --- | --- | --- |
| `health.test.ts` | Server status | 1 |
| `auth.test.ts` | Register, log in, retrieve current user | 3 |
| `personas.test.ts` | List catalog, retrieve persona details | 2 |
| `cart.test.ts` | View cart, add item, update quantity, remove item | 4 |
| `favorites.test.ts` | List favorites, save persona, remove favorite | 3 |
| `checkout.test.ts` | Create an order from cart items | 1 |

All 14 basic-operation tests have been executed. Detailed findings are excluded from this document.

## Connected walkthrough coverage

These tests exercise the real API through Fastify injection. Shopping walkthroughs populate their state through API requests instead of data-layer fixtures.

| Test file (under `apps/api/test/`) | Coverage | Tests |
| --- | --- | --- |
| `catalog-browsing.test.ts` | Case-insensitive search and opening details; specialty, tier, inclusive minimum/maximum prices; all four sort options; combined query options | 10 |
| `walkthroughs.test.ts` | Register → login → current user; add → view → update → remove cart item; save → list → remove favorite; populate a multi-item cart → checkout | 4 |

The 28 basic-operation and walkthrough tests have been executed with authentication enabled. Verification used `ENFORCE_AUTH=true node --import tsx --test test/*.test.ts` from `apps/api`.

The planned functional walkthroughs are complete.

## Validation and error-case coverage

- [x] Cover invalid registration/login input, duplicate email, and incorrect password.
- [x] Check missing authentication on current-user, cart, favorites, and checkout routes.
- [x] Cover empty catalog search and unknown persona details.
- [x] Cover invalid cart quantities and unknown cart items/personas.
- [x] Cover missing/unknown favorite IDs and removal of an unsaved favorite.
- [x] Cover empty-cart checkout and invalid customer details.
- [x] Check that rejected shopping requests preserve relevant stored state.

`apps/api/test/error-cases.test.ts` adds 20 tests. The complete suite now contains **48 tests**, all passing in the latest run with authentication enabled using the direct Node command above. This is an initial validation pass, not exhaustive error or authorization coverage.
