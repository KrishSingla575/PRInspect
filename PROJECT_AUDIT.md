# PRInspect Project Audit

Audit date: 2026-11-25. This is a read-only assessment of the existing checkout. No application code was changed. The existing worktree already contained edits to `src/schemas.ts` and `backend/schemas/index.ts`, plus untracked `backend/src/schemas/*`; those were preserved.

## Summary

This is a DeepSpace app built from the repository root, with the Cloudflare Worker in `worker.ts`, the Vite app in root `src/`, and Wrangler configuration in `wrangler.toml`. There is also a retained `frontend/` tree containing much of the PRInspect UI. Root `src/pages` is the active file router and imports/re-exports some pages from `frontend/pages`; `frontend/src/App.tsx` and `frontend/src/main.tsx` are empty and are not the app entry point.

The DeepSpace scaffold runtime, authentication plumbing, and selected application data schemas exist. The PRInspect-specific workflow is not integrated end to end: there is no GitHub API service or review endpoint, and the visible repository/review screens use hard-coded empty data. An AI chat capability exists in the scaffold but is not a PR review provider implementation.

## Feature status

| Feature | Status | Evidence | Missing work |
|---|---|---|---|
| DeepSpace app entry and Worker | COMPLETE | `vite.config.ts` uses Vite, generouted, Cloudflare and DeepSpace build plugins; `worker.ts` is the Wrangler `main`, exports the DO manifest/classes and assembles routes. | None for the scaffold entry. |
| Frontend routing | PARTIAL | Root `src/pages` is the active generouted route tree. `/` is `src/pages/index.tsx`; `/home`, `/repositories`, `/reviews`, `/settings`, `/api-status`, login and catch-all routes are defined. Protected routes sit under `(app)/(protected)` and some pages re-export `@frontend/pages/...`. | Align route groups and feature page ownership; remove ambiguity only after deciding the intended frontend structure. |
| PRInspect UI | PARTIAL | `frontend/components` includes dashboard, repository, review, diff and finding components; pages include `Dashboard.tsx`, `Repositories.tsx`, `Reviews.tsx`. | Screens are mostly presentational; connect to real state and APIs. `frontend/pages/Repositories.tsx` and `Reviews.tsx` use empty constants; `/home` currently points to scaffold UI. |
| Backend route assembly | PARTIAL | `worker.ts` mounts `registerAuthAndIntegrationRoutes`, `customRoutes` from `backend/src/routes/index.ts`, realtime, actions, AI agent, platform proxy and static handlers. `customRoutes` currently defines only `GET /api/me`. | Implement and mount application routes for repository, pull request, review, findings, validation and errors. Existing scaffold route modules in `backend/routes/server` are compatibility/source modules and are not directly mounted by worker; corresponding root `src/server` files are mounted. |
| Server-side identity verification | COMPLETE | `backend/src/middleware/auth.middleware.ts` verifies Bearer JWT with DeepSpace `verifyJwt` using configured public key and issuer, then derives `userId` from verified result. `GET /api/me` uses `requireAuth`. Root HTTP/realtime/action modules also resolve/verify JWTs. | Add ownership checks to future PRInspect data endpoints; no PRInspect resource operations currently exist to verify. |
| Authentication UI and flow | PARTIAL | Root route layouts use DeepSpace auth providers and `AuthGate`; login uses `AuthOverlay`; worker delegates auth routes to platform. | Authentication is scaffold-level. Verify actual sign-in/provider setup in a running environment; GitHub login is identity auth, not evidence of GitHub repository API authorization. |
| `repositories` collection | PARTIAL | `backend/src/schemas/repositories.schema.ts` declares it; modified `src/schemas.ts` imports and includes it in the `schemas` array supplied to `AppRecordRoom`. | No persistence or GitHub synchronization flow uses it; verify deploy/schema migration behavior. |
| `pull_requests` collection | PARTIAL | `backend/src/schemas/pull_requests.schema.ts` declares it and modified root `src/schemas.ts` registers it. | No GitHub PR ingestion or app endpoint uses it; verify schema behavior in runtime. |
| `reviews` collection | PARTIAL | `backend/src/schemas/reviews.schema.ts` declares it and modified root `src/schemas.ts` registers it. | No review lifecycle writer/reader or persistence flow uses it. |
| `findings` collection | PARTIAL | `backend/src/schemas/findings.schema.ts` declares it and modified root `src/schemas.ts` registers it. | No validated AI finding output or persistence flow uses it. |
| Schema registry / database model | PARTIAL | `worker.ts` passes imported `schemas` into `AppRecordRoom`; `src/schemas.ts` registers `users`, `settings`, `repositories`, `pull_requests`, `reviews`, `findings`. | Confirm the checked-in edits compile and migrate on current DeepSpace SDK; ownership rules and cross-record access design need end-to-end verification. Schema declarations alone do not prove stored collections are live. |
| GitHub API integration | MISSING | Search found GitHub references in login-provider configuration and URL validation/display text only; no `api.github.com` client, GitHub service, OAuth token use for repository data, or PR retrieval route. | Choose GitHub authorization/token model, implement server-side repository/PR/diff operations, scope and ownership enforcement, pagination/rate-limit/error handling. |
| AI PR review implementation | MISSING | No PR diff review service or PRInspect review route found. Root AI chat route/service is generic scaffold chat with DeepSpace model resolution; it is not connected to PR diff review. | Implement review prompting/provider selection, diff/input limits, untrusted-input handling, output validation, findings and review persistence, consent and failure lifecycle. |
| AI provider configuration | PARTIAL | `backend/routes/ai/chat-routes.ts` uses DeepSpace agent model resolution and user-billed summarization; `src/ai/agent.ts` and `src/ai/tools.ts` register generic agent tooling. No PR-review-specific provider config is present. | Select and configure a supported provider/model for reviews and verify billing, secrets, and behavior. No secret values are included in this audit. |
| Frontend-to-backend PRInspect API | MISSING | `frontend/services/api.ts` is a generic same-origin `fetch` helper but has no callers in the PRInspect pages. `frontend/pages/Repositories.tsx` and `Reviews.tsx` hold local empty values. Only custom app API route is authenticated `/api/me`. | Define typed endpoint contracts and connect repository, PR, diff, review and history flows to authenticated Worker routes. |
| Tests | NEEDS TESTING | Root scripts include DeepSpace Playwright suites `tests/smoke.spec.ts`, `tests/api.spec.ts`, `tests/collab.spec.ts`, Vitest `src/prerender-entry.test.tsx`, `prerender.test.ts`, and test configuration. | Tests were not run in this read-only audit; feature-specific GitHub/review/authz tests are absent. Run exact commands below and add coverage for new workflows. |
| Build, lint and type-check configuration | NEEDS TESTING | Scripts exist: `build`, `validate`, `type-check`, `lint`; Vite checker invokes ESLint. Root `tsconfig.json` and `vite.config.ts` target root app. | Commands were not run; verify current dirty schema changes against installed package/types. |
| Deployment configuration | PARTIAL | `wrangler.toml` names `worker.ts`, serves `dist`, defines DeepSpace app id, Worker assets, DO bindings/migrations and local API-first routing; package has `deploy` script. | Deployment not exercised; configure required runtime secrets/bindings through DeepSpace and verify a deployment only after tests and a clean/committed source state per repo instructions. |
| Git ignore rules | COMPLETE | `.gitignore` ignores `node_modules`, `dist`, `.wrangler`, `.dev.vars*`, `.env*`, `.deepspace`, worker bundle and test results. | None identified for requested `dist`/`node_modules`/generated output. `src/router.ts` is tracked, so generated-router handling is not currently ignored. |
| Duplicate / unused source | PARTIAL | The active root `src/` and retained `frontend/` overlap in components/pages. `frontend/src/App.tsx` and `frontend/src/App.css` are empty; `frontend/src/main.tsx` is empty. Root pages re-export frontend pages, and `vite.config.ts` scans both route trees for optimizeDeps. `backend/` includes both older scaffold-style modules and newer `backend/src` modules. | Confirm intended canonical layout before any consolidation. `frontend/src/types`, `frontend/src/components/layout`, `frontend/src/components/repositories`, `frontend/src/components/dashboard`, `frontend/src/components/reviews`, `frontend/src/pages`, and `frontend/src/services` are empty directories. |

## Project structure and empty paths

Top-level project areas:

- DeepSpace root: `worker.ts`, `wrangler.toml`, `src/`, `public/`, Vite/TypeScript/Vitest config, package manifest and lockfile.
- Root `src/`: active app routes, auth/provider layouts, Worker route adapters, AI scaffold, schema registry, styles and generated `src/router.ts`.
- `backend/`: auth middleware, service and route modules, schema modules. `worker.ts` currently mounts the custom router at `backend/src/routes/index.ts`; several sibling `backend/routes/*` and `backend/services/*` files are not imported by the Worker's application route assembly.
- `frontend/`: source-only retained PRInspect UI and a nested package manifest with no scripts or dependencies. Some `frontend/pages` are re-exported by active root routes.
- `tests/`: Playwright smoke/API/collaboration suites; root and `src` also contain Vitest tests.

Empty files found (excluding dependency/build internals):

- `frontend/src/App.tsx`
- `frontend/src/App.css`
- `frontend/src/main.tsx`

Empty directories found (excluding dependency/build internals):

- `frontend/src/types/`
- `frontend/src/components/layout/`
- `frontend/src/components/repositories/`
- `frontend/src/components/dashboard/`
- `frontend/src/components/reviews/`
- `frontend/src/pages/`
- `frontend/src/services/`
- `frontend/node_modules/.vite-temp/` (generated tool cache)
- `.wrangler/tmp/` (generated tool cache)

The duplicate-looking trees are not interchangeable: root `src/` is the production entry; selected UI files in `frontend/` are imported from it. Do not remove or relocate either tree without first resolving imports and intended ownership.

## Package dependencies and scripts

Root declared runtime dependencies: `@base-ui/react`, `ai`, `class-variance-authority`, `clsx`, `deepspace` (pinned `0.44.2`), `hono`, `lucide-react`, `react`, `react-dom`, `react-router`, `react-router-dom`, `tailwind-merge`, `yjs`, `zod`.

Root declared development dependencies: `@generouted/react-router`, `@playwright/test`, `@cloudflare/vite-plugin`, `@cloudflare/workers-types`, React type packages, Vite React plugin, Tailwind/PostCSS packages, ESLint and hooks plugin, TypeScript and typescript-eslint, Vitest, Vite, Vite checker, Wrangler.

Available scripts: `dev`, `build`, `login`, `deploy`, `undeploy`, `add`, `test`, `test:smoke`, `test:api`, `test:e2e`, `test:unit`, `test:watch`, `validate`, `screenshot`, `type-check`, `lint`. `frontend/package.json` is source-only and declares no scripts/dependencies; root scripts own build/deploy.

## Exact verification commands

Run from the repository root with the installed supported Node/npm versions (`package.json` requires Node 22.15.x, 24.x or 26.x and npm 11.6+):

```sh
npm run type-check
npm run lint
npm run build
npm run test:unit
npm test
npm run test:smoke
npm run test:api
npm run test:e2e
```

`npm test` runs the DeepSpace test runner's configured suites; the named commands run the corresponding smoke, API and E2E groups. Build/test commands have not been run as part of this audit. Deployment verification, when authorized and ready, is separate: `npx deepspace dev start` for local runtime and `npx deepspace deploy` for release; deploy requires the repo's source/version-control preconditions and credentials.

## Recommended MVP implementation order

1. Confirm the canonical frontend layout and route map; keep the existing root DeepSpace app and remove no source until imports are understood.
2. Define the GitHub authorization model, token storage/billing boundary, repository ownership rules, and server API contracts.
3. Implement authenticated backend GitHub operations: connect/list accessible repositories, list PRs, fetch changed files/diffs, with validation, pagination, rate-limit handling and per-request authorization.
4. Connect the active repository and review pages to these endpoints; add loading, empty, error and selected-PR states.
5. Implement PR review orchestration with explicit user action, bounded diff context, provider/model configuration, validated structured findings, and review status/error handling.
6. Persist reviews/findings using the registered schemas; verify user scoping, references, migrations and history retrieval.
7. Connect dashboard and review history to persisted API data and make the end-to-end flow resilient to retries and duplicate submissions.
8. Add unit, API and browser tests for auth boundaries, GitHub access, diff handling, AI output validation and persisted history; run all verification commands above.
9. Configure deployment secrets/integrations and verify the deployed sign-in → repository → PR diff → AI review → saved findings workflow.
