# PRInspect MVP Plan

> Current-state audit: see [PROJECT_AUDIT.md](PROJECT_AUDIT.md). This project already has a root DeepSpace Vite/Worker app, scaffold authentication, and registered PRInspect collection schemas. Keep that app; do not rebuild it or treat the retained `frontend/` tree as a separate deployable application. The PRInspect GitHub/review workflow is not yet connected end to end.

This plan tracks work from repository discovery through a verified deployment. Keep the existing repository and origin; make changes incrementally and review them before each phase is considered complete.

## Phase 0 — Repository audit and planning

- [x] Inspect the existing repository, working tree, frontend source, package manifests, and Git remotes.
- [x] Record the current structure, implemented behavior, and gaps in `PROJECT_AUDIT.md`.
- [x] Define the remaining phases and safe next steps.
- [ ] Agree on product scope, initial GitHub access model, and review workflow before implementation.

## Phase 1 — Confirm active structure and API contracts

- [ ] Keep root `src/` and `worker.ts` as the DeepSpace app entry; map active routes and decide canonical ownership for re-exported `frontend/` pages.
- [ ] Define typed frontend API contracts and error behavior for repositories, pull requests, diffs, review runs and history.
- [ ] Run the existing build, lint and type-check commands; fix issues without replacing the app architecture.

## Phase 2 — Dashboard UI

- [ ] Build the signed-in dashboard shell and review activity summary.
- [ ] Add clear first-use guidance and repository connection entry points.

## Phase 3 — Repository and pull request UI

- [ ] Build repository selection and pull request list/detail views.
- [ ] Render changed files and diffs with accessible loading and error handling.
- [ ] Add review status and findings presentation.

## Phase 4 — GitHub access and backend workflow

- [ ] Select and document the GitHub authorization approach, scopes and secure token handling.
- [ ] Add Hono application routes and GitHub service under `backend/`, assembled by the existing root DeepSpace Worker.
- [ ] Protect user-scoped routes using verified DeepSpace identity and enforce repository ownership on every operation.
- [ ] Validate request payloads and define consistent API errors; add pagination and rate-limit handling.
- [ ] Keep provider credentials and privileged operations on the server.

## Phase 5 — Data model and persistence

- [ ] Define and document repository, pull request, review, and finding records.
- [ ] Enforce ownership and access rules for every user-scoped read and write.
- [ ] Add persistence for review history and status transitions.

## Phase 6 — GitHub integration

- [ ] Securely connect/list authorized repositories and list pull requests through backend routes.
- [ ] Retrieve changed files and diff data with pagination, rate-limit, and error handling.
- [ ] Verify repository access on the server for every requested resource.

## Phase 7 — AI code review

- [ ] Define review input limits, supported diff formats, and finding schema.
- [ ] Send only the necessary user-authorized code context to the configured AI provider.
- [ ] Treat source code and repository metadata as untrusted input; validate model output.
- [ ] Present actionable findings with file and line references and clear review limitations.

## Phase 8 — End-to-end integration

- [ ] Connect the active frontend routes and pages to authenticated backend endpoints.
- [ ] Persist review lifecycle and findings and display prior reviews.
- [ ] Handle retries, duplicate requests, cancellation, and long-running review status.

## Phase 9 — Quality, security, and verification

- [ ] Add appropriate unit, integration, and end-to-end coverage.
- [ ] Verify authorization boundaries, secret handling, input validation, and failure paths.
- [ ] Run lint, type checks, build, and the selected test suite; address findings.

## Phase 10 — Deployment and operations

- [ ] Configure the single DeepSpace Worker/Vite app environment and deployment settings; keep frontend and backend source in the same app.
- [ ] Document setup, required environment variables, migrations, and release steps.
- [ ] Deploy and verify authentication, repository access, review execution, and history.
- [ ] Document monitoring, rate limits, data retention, and support procedures.

## MVP acceptance criteria

- [ ] A user can sign in and access only their own connected resources.
- [ ] A user can connect an authorized GitHub repository and list its pull requests.
- [ ] A user can inspect changed files and diffs.
- [ ] A user can request an AI review and see validated findings.
- [ ] Reviews and findings are saved and visible in review history.
- [ ] Production deployment is verified against the end-to-end workflow.

## Verification commands

Run from the repository root:

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
