# PRInspect Architecture

PRInspect is one DeepSpace full-stack Vite + React + Hono Worker application. The repository root owns the package manifest, Vite build, and Cloudflare Worker deployment. `frontend/` and `backend/` organize source code; they are not separate deployable apps.

## Source layout

```text
PRInspect/
├── worker.ts                 # DeepSpace Worker entry and assembly
├── wrangler.toml             # Worker name, bindings, assets, and deployment config
├── package.json              # Single app's scripts and dependencies
├── vite.config.ts            # React, route generation, Cloudflare, and DeepSpace plugins
├── frontend/                 # Reusable browser source
│   ├── components/            # Shared UI and application components
│   ├── pages/                 # Page implementations imported by route adapters
│   ├── services/              # Browser-to-Worker API clients
│   ├── types/                 # Frontend-facing data types
│   └── lib/                   # Frontend utilities
├── backend/                  # Server source
│   ├── routes/                # Hono route registration modules
│   ├── services/              # Server-side integration and task services
│   ├── middleware/            # Hono middleware
│   ├── schemas/               # DeepSpace collection schemas by feature
│   ├── utils/                 # Shared backend helpers
│   └── types/                 # Worker binding types and shared server types
└── src/                      # DeepSpace-required adapters, routes, and shared app assets
    ├── pages/                 # Required route discovery tree; thin page adapters
    ├── schemas.ts             # Required schema registry adapter
    └── server/                # Required worker module-path adapters
```

The former Vite-only frontend scaffold remains under `frontend/src/` as legacy source, but it has no independent scripts or deployment. `frontend/package.json` is source-only. Build, lint, dev, and deployment commands run from the repository root.

## DeepSpace entry points

- `worker.ts` constructs the Hono app, registers routes and Durable Object classes, wires app schemas, and exports the Worker app. Its imports point through the expected thin adapters in `src/` to implementations under `backend/`.
- `wrangler.toml` names `worker.ts` as `main`, configures static assets and Worker bindings, and holds the DeepSpace app identity.
- Root `package.json` is the only application manifest and provides the DeepSpace/Vite scripts.
- Root `vite.config.ts` composes React, generated routing, Cloudflare Worker, DeepSpace, prerender, and type/lint plugins.
- `src/pages/` must remain for DeepSpace route discovery. Each route file re-exports its page implementation from `frontend/pages/`. The generated `src/router.ts` and other starter-generated files must remain under the starter's control.
- `src/schemas.ts` remains the schema entry expected by the worker and adapts to `backend/schemas/index.ts`.

## Frontend responsibilities

The frontend owns page and component rendering, navigation, user interaction, loading and error states, and same-origin API calls. It does not hold provider secrets or make authorization decisions. Current route implementations and UI primitives originate from the official starter; PRInspect-specific repository, pull request, diff, and review workflows still need to be implemented.

## Backend responsibilities

The backend owns Hono routes, authentication and authorization checks, input validation, GitHub and AI provider access, persistence, and background work. Route implementations and services stay under `backend/`; `worker.ts` remains the single Worker assembly point. Never trust a frontend-supplied `userId`; derive identity from verified server-side credentials. Keep secrets in server-side environment bindings.

The starter's existing auth, integration proxy, realtime, actions, and AI chat routes are retained through backend modules and thin `src/server` / `src/ai` adapters. App collection schemas are in `backend/schemas/`, with `src/schemas.ts` as the required registry adapter.

## Data and security

The current starter includes `users` and `settings` collection schemas. PRInspect repository, pull request, review, and finding schemas and their ownership rules remain to be designed. Treat diffs, PR descriptions, repository files, and AI output as untrusted input. Validate data before storage or display; do not execute repository or model-generated code. Send only the code context needed for a user-requested AI review, and avoid logging tokens or unnecessary source content.
