# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository layout

This is a monorepo with two independent projects, each with its own `package.json` and `node_modules`:

- `BE/` — Express + MongoDB API, deployable both as a local server and as an AWS Lambda (via CDK).
- `FE/` — Expo / React Native app (iOS, Android, web) that talks to the BE over HTTP.

There is no root `package.json`; all commands are run from inside `BE/` or `FE/`.

## Commands

### Backend (`BE/`)

- `npm run dev` — run the API locally with hot reload (`ts-node-dev`) on `server/local.ts`, default port 4000.
- `npm run build` — type-check and compile to `dist/` via `tsc`.
- `npm run synth` — CDK synth (renders the CloudFormation template without deploying).
- `npm run deploy` — CDK deploy (`cdk deploy`) of `ConstructionInventoryApiStack`.
- No test runner or linter is configured — there are no test scripts in `package.json`.
- Local env vars live in `BE/.env.local` (see `BE/.env.example`): `PORT`, `MONGODB_URI`, plus a `JWT_SECRET` (and optionally `JWT_EXPIRES_IN`) required by `utils/jwt.ts` but not present in the example file.

### Frontend (`FE/`)

- `npm run start` — start the Expo dev server.
- `npm run android` / `npm run ios` / `npm run web` — start the dev server targeting a specific platform.
- No test runner or linter is configured.
- API base URL is read from `EXPO_PUBLIC_API_BASE_URL` (falls back to `http://localhost:4000`), set in `FE/.env.local`.
- `FE/AGENTS.md` (pulled in via `FE/CLAUDE.md`) has a standing instruction: Expo has changed significantly — read the versioned docs at https://docs.expo.dev/versions/v57.0.0/ before writing any Expo-related code in this project.

## Backend architecture (`BE/`)

Layered, one set of files per domain (auth, site, contractor, dailyLog, workLog, wage, inventory, inventoryTransaction, dashboard, enterpriseSettings):

```
routes/*.routes.ts        Express Router — wires middleware + handler functions to paths
handlers/*.handler.ts     req/res glue: validate input, call service, validate+shape output, map errors via next(err)
services/*.service.ts     business logic, orchestrates repositories
repositories/*.repo.ts    the only layer that talks to Mongoose models directly
models/*.ts               Mongoose schemas
schema/<domain>/          Zod request/response schemas, validated at the handler boundary
```

Entry points (`BE/server/`):
- `index.ts` builds the shared `app` (Express instance, CORS, JSON body parsing, `/health`, DB-connect middleware, all routers, error handler) — mounted at `/auth`, `/sites`, `/contractors`, `/daily-logs`, `/work-logs`, `/wages`, `/inventory`, `/dashboard`, `/enterprise`.
- `local.ts` runs `app` with `app.listen` for local dev.
- `lambda.ts` wraps `app` with `@codegenie/serverless-express` for the Lambda handler; `app.ts` + `lib/api-stack.ts` define the CDK stack that deploys it.

Cross-cutting pieces to know before touching a handler:
- **Auth**: `middleware/auth.ts` (`requireAuth`) verifies the JWT and loads `req.user = { id, role, assignedSites }`. Roles are `super_admin | admin | engineer` (`utils/jwt.ts`). `middleware/requireRole.ts` gates specific routes; `middleware/requireSignupKey.ts` gates signup behind an `x-api-key` header checked against a bcrypt-hashed key in the DB.
- **Site scoping** (`utils/siteAccess.ts`): `assertSiteAccess` and `resolveSiteFilter` are the only path by which a request should get access to site-scoped data. Admins only see sites they created (`site.createdBy`); engineers only see sites in `user.assignedSites`; `super_admin` never touches site data directly. Any new site-scoped endpoint should route through these, not reinvent the check.
- **Ownership** (`utils/ownership.ts`): `assertOwnerOrAdmin` is the shared "you can only edit what you created, unless you're an admin" rule used across domains.
- **Validation**: every handler validates input with `validateRequest(schema, data)` and output with `validateResponse(schema, data)` from `utils/zodValidate.ts` — both throw `HttpError`/`Error`, caught by the handler's `try/catch` → `next(err)` → `middleware/errorHandler.ts`.
- **DB connection**: `middleware/dbConnect.ts` (`ensureDbConnected`) lazily connects Mongoose before any route runs — connection reuse is handled in `db/connect.ts`.
- Route ordering matters where a static path collides with a `:param` route (e.g. `inventory.routes.ts` registers `/ledger` before `/:id`).

## Frontend architecture (`FE/`)

- `App.tsx` is the single root component and contains all top-level navigation as conditional JSX (no React Navigation) driven by `user.role` and local `useState` — there is no router. The shape is: unauthenticated → `AuthScreen`; `super_admin` → `AdminsScreen`; `admin` → Sites/Team/Enterprise tabs, and after "entering" a site, a per-site workspace tab (Dashboard/Contractors/Daily Logs/Wages/Inventory); `engineer` → forced site choice (`SiteChooserScreen`) on every session, then Dashboard/Daily Logs/Inventory tabs.
- `src/context/AuthContext.tsx` owns the logged-in `user`, JWT persistence, and `signOut`; `src/context/SitesContext.tsx` owns the list of sites and `selectedSiteId`, scoped inside `MainApp` (only mounted once authenticated).
- `src/api/client.ts` is the sole HTTP boundary: a `request`/`requestBlob` helper plus one `api.<domain>.<action>` method per BE endpoint, mirroring the BE's route grouping exactly (`api.auth`, `api.sites`, `api.contractors`, `api.dailyLogs`, `api.workLogs`, `api.wages`, `api.inventory`, `api.dashboard`, `api.enterprise`). `setAuthToken` stores the bearer token in module state for all subsequent requests. `src/api/types.ts` holds the response/request TypeScript types — keep these in sync with the BE's Zod response schemas when either side changes.
- `src/screens/` — one screen per feature area, matching the BE domains and the FE's own tab keys in `src/components/TabBar.tsx` (`TABS`, `ADMIN_TOP_TABS`, `SITE_WORKSPACE_TABS`).
- `src/components/ui/` are the generic building blocks (Button, Card, Chip, Modal, Screen, TextField); `src/components/` above it holds feature-agnostic composite widgets (date pickers with platform-specific `.ios`/`.android`/`.web` variants, date range search, export dialog, etc.).
- `src/theme/theme.ts` is the single source of colors/spacing/radius — styles across the app reference it rather than hardcoding values.
