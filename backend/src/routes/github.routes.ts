import { Hono } from 'hono'
import type { Context } from 'hono'
import { createUserToolExecutor } from 'deepspace/worker'
import type { AuthContext } from '../middleware/auth.middleware.js'
import { requireAuth } from '../middleware/auth.middleware.js'
import {
  createInstallationToken,
  fetchPullRequestDiff,
  getInstallationRepository,
  getPullRequest,
  GitHubApiError,
  GitHubConfigurationError,
  listInstallationRepositories,
  listPullRequestFiles,
  listPullRequests,
  verifyAuthorizedInstallation,
  verifyWebhookSignature,
  type GitHubPullRequest,
  type GitHubRepository,
} from '../services/github-app.service.js'
import { consumeOAuthState, createOAuthState } from '../services/github-oauth-state.service.js'
import { githubRecords, stableRecordId, type RecordEnvelope } from '../services/github-records.service.js'
import { claimWebhookDelivery, completeWebhookDelivery, releaseWebhookDelivery } from '../services/github-webhook-delivery.service.js'
import type { Env } from '../../../worker.js'

type GitHubConnection = {
  installationId: string
  accountLogin: string
  accountType: 'User' | 'Organization'
  status: 'connected' | 'suspended' | 'disconnected'
  connectedAt: string
}
type RepositoryData = {
  githubRepositoryId: string
  owner: string
  name: string
  fullName: string
  htmlUrl: string
  description?: string | null
  defaultBranch: string
  selected: boolean
}
type PullRequestData = {
  repositoryId: string
  githubPullRequestId: string
  number: number
  title: string
  description?: string | null
  author: string
  state: 'open' | 'closed' | 'merged'
  sourceBranch: string
  targetBranch: string
  htmlUrl: string
  updatedAt?: string
}

const router = new Hono<AuthContext>()
const connectionRecordId = (userId: string) => stableRecordId('ghc', userId)

function jsonError(c: { json: (body: Record<string, unknown>, status?: number) => Response }, message: string, status = 500) {
  return c.json({ error: message }, status)
}

function githubErrorStatus(error: unknown): number {
  if (error instanceof GitHubConfigurationError) return 503
  if (!(error instanceof GitHubApiError)) return 502
  if (error.status === 401 || error.status === 403 || error.status === 404 || error.status === 422 || error.status === 429) return error.status
  return 502
}

function githubErrorMessage(error: unknown, fallback: string): string {
  return error instanceof GitHubConfigurationError ? error.message : fallback
}

function mapRepository(repo: GitHubRepository, selected: boolean): RepositoryData {
  return {
    githubRepositoryId: String(repo.id),
    owner: repo.owner.login,
    name: repo.name,
    fullName: repo.full_name,
    htmlUrl: repo.html_url,
    description: repo.description,
    defaultBranch: repo.default_branch,
    selected,
  }
}

function mapPullRequest(pr: GitHubPullRequest, repositoryId: string): PullRequestData {
  return {
    repositoryId,
    githubPullRequestId: String(pr.id),
    number: pr.number,
    title: pr.title,
    description: pr.body,
    author: pr.user.login,
    state: pr.merged_at ? 'merged' : pr.state,
    sourceBranch: pr.head.ref,
    targetBranch: pr.base.ref,
    htmlUrl: pr.html_url,
    updatedAt: pr.updated_at,
  }
}

async function findConnection(env: Env, userId: string, signal: AbortSignal) {
  const records = githubRecords(env, userId, signal)
  const recordId = await connectionRecordId(userId)
  const connection = await records.get<GitHubConnection>('github_connections', recordId)
  return connection?.data.status === 'connected' ? { records, connection } : null
}

async function connectionFromCallback(env: Env, userId: string, installationId: string, metadata: { accountLogin: string; accountType: 'User' | 'Organization' }) {
  const records = githubRecords(env, userId, new AbortController().signal)
  const recordId = await connectionRecordId(userId)
  await records.put<GitHubConnection>('github_connections', recordId, {
    installationId,
    accountLogin: metadata.accountLogin,
    accountType: metadata.accountType,
    status: 'connected',
    connectedAt: new Date().toISOString(),
  })
}

// Public to GitHub, but only a one-time state transaction can establish the
// original, verified DeepSpace identity.
router.get('/installations/callback', async (c) => {
  const error = c.req.query('error')
  const state = c.req.query('state') ?? ''
  const userId = await consumeOAuthState(c.env, state)
  const appOrigin = new URL(c.req.url).origin
  if (!userId) return c.redirect(`${appOrigin}/repositories?github=invalid_state`)
  if (error) return c.redirect(`${appOrigin}/repositories?github=authorization_denied`)
  const code = c.req.query('code')
  const installationId = c.req.query('installation_id')
  if (!code || (installationId && !/^\d+$/.test(installationId))) {
    return c.redirect(`${appOrigin}/repositories?github=invalid_callback`)
  }
  try {
    const metadata = await verifyAuthorizedInstallation(c.env, code, installationId)
    await connectionFromCallback(c.env, userId, metadata.installationId, metadata)
    return c.redirect(`${appOrigin}/repositories?github=connected`)
  } catch {
    console.error('[github] installation callback validation failed')
    return c.redirect(`${appOrigin}/repositories?github=connection_failed`)
  }
})

router.post('/installations/start', requireAuth, async (c) => {
  if (!c.env.GITHUB_APP_CLIENT_ID || !c.env.GITHUB_APP_SLUG) return jsonError(c, 'GitHub App is not configured', 503)
  const userId = c.get('auth').userId
  try {
    const state = await createOAuthState(c.env, userId)
    const installUrl = new URL(`https://github.com/apps/${encodeURIComponent(c.env.GITHUB_APP_SLUG)}/installations/new`)
    installUrl.searchParams.set('state', state)
    return c.json({ url: installUrl.toString() })
  } catch {
    return jsonError(c, 'Could not start GitHub authorization', 503)
  }
})

router.get('/connection', requireAuth, async (c) => {
  try {
    const userId = c.get('auth').userId
    const records = githubRecords(c.env, userId, c.req.raw.signal)
    const connection = await records.get<GitHubConnection>('github_connections', await connectionRecordId(userId))
    return c.json({ connected: connection?.data.status === 'connected', account: connection?.data ?? null })
  } catch {
    return jsonError(c, 'Could not load GitHub connection')
  }
})

router.delete('/connection', requireAuth, async (c) => {
  try {
    const userId = c.get('auth').userId
    const records = githubRecords(c.env, userId, c.req.raw.signal)
    const connection = await records.get<GitHubConnection>('github_connections', await connectionRecordId(userId))
    if (connection) await records.remove('github_connections', connection.recordId)
    return c.body(null, 204)
  } catch {
    return jsonError(c, 'Could not disconnect GitHub', 500)
  }
})

router.get('/repositories/available', requireAuth, async (c) => {
  try {
    const userId = c.get('auth').userId
    const connected = await findConnection(c.env, userId, c.req.raw.signal)
    if (!connected) return jsonError(c, 'Connect GitHub first', 409)
    const token = await createInstallationToken(c.env, connected.connection.data.installationId)
    const page = Math.max(1, Math.min(1000, Number(c.req.query('page') ?? 1) || 1))
    const result = await listInstallationRepositories(token, page)
    const selected = await connected.records.query<RepositoryData>('repositories')
    const selectedIds = new Set(selected.filter((record) => record.data.selected).map((record) => record.data.githubRepositoryId))
    return c.json({
      repositories: result.repositories.map((repo) => mapRepository(repo, selectedIds.has(String(repo.id)))),
      page,
      perPage: 100,
      totalCount: result.total_count,
    })
  } catch (error) {
    return jsonError(c, error instanceof GitHubApiError && error.status === 401 ? 'GitHub installation needs to be reconnected' : githubErrorMessage(error, 'Could not load accessible GitHub repositories'), githubErrorStatus(error))
  }
})

router.get('/repositories', requireAuth, async (c) => {
  try {
    const records = githubRecords(c.env, c.get('auth').userId, c.req.raw.signal)
    const repositories = await records.query<RepositoryData>('repositories')
    return c.json({ repositories: repositories.filter((record) => record.data.selected) })
  } catch {
    return jsonError(c, 'Could not load selected repositories')
  }
})

router.post('/repositories', requireAuth, async (c) => {
  const userId = c.get('auth').userId
  let body: { githubRepositoryId?: unknown }
  try { body = await c.req.json() } catch { return jsonError(c, 'Invalid request body', 400) }
  if (typeof body.githubRepositoryId !== 'string' || !/^\d+$/.test(body.githubRepositoryId)) return jsonError(c, 'githubRepositoryId must be a numeric GitHub repository id', 400)
  try {
    const connected = await findConnection(c.env, userId, c.req.raw.signal)
    if (!connected) return jsonError(c, 'Connect GitHub first', 409)
    const token = await createInstallationToken(c.env, connected.connection.data.installationId)
    const repo = await getInstallationRepository(token, body.githubRepositoryId)
    if (!repo) return jsonError(c, 'Repository is not accessible to this GitHub installation', 404)
    const recordId = await stableRecordId('ghr', userId, String(repo.id))
    const data = mapRepository(repo, true)
    await connected.records.put('repositories', recordId, data)
    const record = await connected.records.get<RepositoryData>('repositories', recordId)
    return c.json({ repository: record }, 201)
  } catch (error) {
    return jsonError(c, error instanceof GitHubApiError && error.status === 401 ? 'GitHub installation needs to be reconnected' : githubErrorMessage(error, 'Could not select repository'), githubErrorStatus(error))
  }
})

router.delete('/repositories/:recordId', requireAuth, async (c) => {
  try {
    const records = githubRecords(c.env, c.get('auth').userId, c.req.raw.signal)
    const repository = await records.get<RepositoryData>('repositories', c.req.param('recordId'))
    if (!repository || repository.createdBy !== c.get('auth').userId) return jsonError(c, 'Repository not found', 404)
    await records.patch('repositories', repository.recordId, { selected: false })
    return c.body(null, 204)
  } catch {
    return jsonError(c, 'Could not remove selected repository')
  }
})

async function ownedRepository(env: Env, userId: string, recordId: string, signal: AbortSignal) {
  const records = githubRecords(env, userId, signal)
  const repository = await records.get<RepositoryData>('repositories', recordId)
  if (!repository || repository.createdBy !== userId || !repository.data.selected) return null
  return { records, repository }
}

router.get('/repositories/:recordId/pull-requests', requireAuth, async (c) => {
  const userId = c.get('auth').userId
  const state = c.req.query('state') ?? 'open'
  if (!['open', 'closed', 'all'].includes(state)) return jsonError(c, 'state must be open, closed, or all', 400)
  try {
    const selected = await ownedRepository(c.env, userId, c.req.param('recordId'), c.req.raw.signal)
    if (!selected) return jsonError(c, 'Repository not found', 404)
    const connection = await findConnection(c.env, userId, c.req.raw.signal)
    if (!connection) return jsonError(c, 'Connect GitHub first', 409)
    const token = await createInstallationToken(c.env, connection.connection.data.installationId)
    const repoData = selected.repository.data
    const page = Math.max(1, Math.min(1000, Number(c.req.query('page') ?? 1) || 1))
    const pullRequests = await listPullRequests(token, repoData.owner, repoData.name, state, page)
    const saved = await Promise.all(pullRequests.map(async (pr) => {
      const recordId = await stableRecordId('ghp', selected.repository.recordId, String(pr.number))
      await selected.records.put('pull_requests', recordId, mapPullRequest(pr, selected.repository.recordId))
      return selected.records.get<PullRequestData>('pull_requests', recordId)
    }))
    return c.json({ pullRequests: saved.filter((item): item is RecordEnvelope<PullRequestData> => Boolean(item)), page, perPage: 50 })
  } catch (error) {
    return jsonError(c, error instanceof GitHubApiError && error.status === 401 ? 'GitHub installation needs to be reconnected' : githubErrorMessage(error, 'Could not load pull requests'), githubErrorStatus(error))
  }
})

async function ownedPullRequest(c: Context<AuthContext>) {
  const userId = c.get('auth').userId
  const records = githubRecords(c.env, userId, c.req.raw.signal)
  const recordId = c.req.param('recordId')
  if (!recordId) return null
  const pullRequest = await records.get<PullRequestData>('pull_requests', recordId)
  if (!pullRequest || pullRequest.createdBy !== userId) return null
  const repository = await records.get<RepositoryData>('repositories', pullRequest.data.repositoryId)
  if (!repository || repository.createdBy !== userId || !repository.data.selected) return null
  const connection = await findConnection(c.env, userId, c.req.raw.signal)
  if (!connection) return null
  return { userId, records, pullRequest, repository, connection }
}

router.get('/pull-requests/:recordId', requireAuth, async (c) => {
  try {
    const owned = await ownedPullRequest(c)
    if (!owned) return jsonError(c, 'Pull request not found', 404)
    const token = await createInstallationToken(c.env, owned.connection.connection.data.installationId)
    const { owner, name } = owned.repository.data
    const pr = await getPullRequest(token, owner, name, owned.pullRequest.data.number)
    await owned.records.put('pull_requests', owned.pullRequest.recordId, mapPullRequest(pr, owned.repository.recordId))
    return c.json({ pullRequest: await owned.records.get<PullRequestData>('pull_requests', owned.pullRequest.recordId) })
  } catch (error) {
    return jsonError(c, githubErrorMessage(error, 'Could not load pull request details'), githubErrorStatus(error))
  }
})

router.get('/pull-requests/:recordId/files', requireAuth, async (c) => {
  try {
    const owned = await ownedPullRequest(c)
    if (!owned) return jsonError(c, 'Pull request not found', 404)
    const token = await createInstallationToken(c.env, owned.connection.connection.data.installationId)
    const { owner, name } = owned.repository.data
    const page = Math.max(1, Math.min(1000, Number(c.req.query('page') ?? 1) || 1))
    const files = await listPullRequestFiles(token, owner, name, owned.pullRequest.data.number, page)
    return c.json({ files, page, perPage: 100 })
  } catch (error) {
    return jsonError(c, githubErrorMessage(error, 'Could not load pull request files'), githubErrorStatus(error))
  }
})

router.get('/pull-requests/:recordId/diff', requireAuth, async (c) => {
  try {
    const owned = await ownedPullRequest(c)
    if (!owned) return jsonError(c, 'Pull request not found', 404)
    const token = await createInstallationToken(c.env, owned.connection.connection.data.installationId)
    const { owner, name } = owned.repository.data
    const diff = await fetchPullRequestDiff(token, owner, name, owned.pullRequest.data.number)
    return c.json({ diff, contentType: 'application/vnd.github.diff' })
  } catch (error) {
    return jsonError(c, githubErrorMessage(error, 'Could not load pull request diff'), githubErrorStatus(error))
  }
})

router.post('/webhook', async (c) => {
  const secret = c.env.GITHUB_APP_WEBHOOK_SECRET
  if (!secret) return jsonError(c, 'GitHub webhook is not configured', 503)
  const rawBody = await c.req.text()
  if (!(await verifyWebhookSignature(secret, rawBody, c.req.header('X-Hub-Signature-256') ?? null))) return jsonError(c, 'Invalid webhook signature', 401)
  // The delivery id is not acted on until its body has passed HMAC validation.
  const deliveryId = c.req.header('X-GitHub-Delivery')
  if (!deliveryId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(deliveryId)) return jsonError(c, 'Invalid GitHub delivery id', 400)
  let leaseId: string | null
  try {
    leaseId = await claimWebhookDelivery(c.env, deliveryId)
  } catch {
    return jsonError(c, 'Could not reserve GitHub webhook delivery', 503)
  }
  if (!leaseId) return c.json({ received: true, duplicate: true }, 202)

  let shouldRelease = true
  let payload: { action?: string; installation?: { id?: number }; repositories_removed?: Array<{ id: number }> }
  try {
    try { payload = JSON.parse(rawBody) as typeof payload } catch { return jsonError(c, 'Invalid webhook payload', 400) }
    const event = c.req.header('X-GitHub-Event')
    if (event !== 'installation' && event !== 'installation_repositories') {
      if (!(await completeWebhookDelivery(c.env, deliveryId, leaseId))) return jsonError(c, 'Could not finalize GitHub webhook delivery', 503)
      shouldRelease = false
      return c.json({ received: true })
    }
    const installationId = payload.installation?.id
    if (!installationId) return jsonError(c, 'Missing installation id', 400)

    // The webhook has no end-user JWT. The verified app owner can locate rows;
    // each mutation is then executed as that row's creator, preserving own RBAC.
    const admin = createUserToolExecutor(c.env, c.env.OWNER_USER_ID, c.req.raw.signal)
    const query = await admin('records.query', { collection: 'github_connections', where: { installationId: String(installationId) }, limit: 500 }) as {
      success?: boolean; data?: { records?: Array<RecordEnvelope<GitHubConnection>> }
    }
    if (!query.success) return jsonError(c, 'Could not process installation event', 500)
    for (const connection of query.data?.records ?? []) {
      const userRecords = githubRecords(c.env, connection.createdBy, c.req.raw.signal)
      if (event === 'installation' && (payload.action === 'deleted' || payload.action === 'suspend' || payload.action === 'unsuspend')) {
        const status: GitHubConnection['status'] = payload.action === 'deleted' ? 'disconnected' : payload.action === 'suspend' ? 'suspended' : 'connected'
        await userRecords.patch('github_connections', connection.recordId, { status })
      }
      if (event === 'installation_repositories' && payload.action === 'removed') {
        for (const removed of payload.repositories_removed ?? []) {
          const repositories = await userRecords.query<RepositoryData>('repositories', { githubRepositoryId: String(removed.id) })
          for (const repository of repositories) {
            if (repository.createdBy === connection.createdBy) await userRecords.patch('repositories', repository.recordId, { selected: false })
          }
        }
      }
    }
    if (!(await completeWebhookDelivery(c.env, deliveryId, leaseId))) return jsonError(c, 'Could not finalize GitHub webhook delivery', 503)
    shouldRelease = false
    return c.json({ received: true })
  } catch {
    return jsonError(c, 'Could not process GitHub webhook', 500)
  } finally {
    if (shouldRelease) {
      try { await releaseWebhookDelivery(c.env, deliveryId, leaseId) } catch { /* The delivery lease expires automatically. */ }
    }
  }
})

export default router
