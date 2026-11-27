import type { Env } from '../../../worker.js'

const GITHUB_API = 'https://api.github.com'
const API_VERSION = '2022-11-28'
const ACCEPT_JSON = 'application/vnd.github+json'

type GitHubUser = { id: number; login: string; type?: string }
export type GitHubRepository = {
  id: number
  name: string
  full_name: string
  html_url: string
  description: string | null
  default_branch: string
  private: boolean
  owner: { login: string; type?: string }
}
export type GitHubPullRequest = {
  id: number
  number: number
  title: string
  body: string | null
  state: 'open' | 'closed'
  merged_at: string | null
  html_url: string
  updated_at: string
  user: { login: string }
  head: { ref: string }
  base: { ref: string }
}
export type GitHubPullRequestFile = {
  filename: string
  status: string
  additions: number
  deletions: number
  changes: number
  patch?: string
}

export class GitHubApiError extends Error {
  constructor(readonly status: number, message: string) {
    super(message)
    this.name = 'GitHubApiError'
  }
}

/** Configuration errors contain binding names and format guidance only. */
export class GitHubConfigurationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'GitHubConfigurationError'
  }
}

function required(value: string | undefined, name: string): string {
  if (!value?.trim()) throw new GitHubConfigurationError(`Missing ${name} configuration.`)
  return value.trim()
}

function base64Url(bytes: Uint8Array): string {
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')
}

function pemBytes(pem: string): Uint8Array {
  const trimmed = pem.trim()
  if (/-----BEGIN RSA PRIVATE KEY-----/.test(trimmed)) {
    throw new GitHubConfigurationError(
      'GITHUB_APP_PRIVATE_KEY is PKCS#1. This runtime requires unencrypted PKCS#8 PEM (BEGIN PRIVATE KEY); convert the GitHub key with openssl pkcs8 -topk8 -nocrypt before storing it.',
    )
  }
  if (!trimmed.startsWith('-----BEGIN PRIVATE KEY-----') || !trimmed.endsWith('-----END PRIVATE KEY-----')) {
    throw new GitHubConfigurationError(
      'GITHUB_APP_PRIVATE_KEY must be an unencrypted PKCS#8 PEM with BEGIN/END PRIVATE KEY markers. Key contents are not logged.',
    )
  }
  const body = trimmed
    .slice('-----BEGIN PRIVATE KEY-----'.length, -'-----END PRIVATE KEY-----'.length)
    .replace(/\s/g, '')
  try {
    const binary = atob(body)
    return Uint8Array.from(binary, (char) => char.charCodeAt(0))
  } catch {
    throw new GitHubConfigurationError(
      'GITHUB_APP_PRIVATE_KEY has invalid PKCS#8 PEM encoding. Key contents are not logged.',
    )
  }
}

async function appJwt(env: Env): Promise<string> {
  const appId = required(env.GITHUB_APP_ID, 'GITHUB_APP_ID')
  const header = base64Url(new TextEncoder().encode(JSON.stringify({ alg: 'RS256', typ: 'JWT' })))
  const now = Math.floor(Date.now() / 1000)
  const payload = base64Url(new TextEncoder().encode(JSON.stringify({ iss: appId, iat: now - 30, exp: now + 540 })))
  const message = `${header}.${payload}`
  const keyBytes = pemBytes(required(env.GITHUB_APP_PRIVATE_KEY, 'GITHUB_APP_PRIVATE_KEY'))
  const keyBuffer = new ArrayBuffer(keyBytes.byteLength)
  new Uint8Array(keyBuffer).set(keyBytes)
  let key: CryptoKey
  try {
    key = await crypto.subtle.importKey(
      'pkcs8',
      keyBuffer,
      { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
      false,
      ['sign'],
    )
  } catch {
    throw new GitHubConfigurationError(
      'GITHUB_APP_PRIVATE_KEY could not be imported. Supply a valid unencrypted PKCS#8 RSA PEM (BEGIN PRIVATE KEY); key contents are not logged.',
    )
  }
  const signature = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, new TextEncoder().encode(message))
  return `${message}.${base64Url(new Uint8Array(signature))}`
}

async function githubFetch<T>(path: string, token: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers)
  headers.set('Accept', ACCEPT_JSON)
  headers.set('Authorization', `Bearer ${token}`)
  headers.set('X-GitHub-Api-Version', API_VERSION)
  headers.set('User-Agent', 'PRInspect')
  const response = await fetch(`${GITHUB_API}${path}`, { ...init, headers })
  const text = await response.text()
  let payload: unknown = null
  if (text) {
    try { payload = JSON.parse(text) as unknown } catch { payload = text }
  }
  if (!response.ok) {
    const message = payload && typeof payload === 'object' && 'message' in payload && typeof payload.message === 'string'
      ? payload.message
      : `GitHub returned HTTP ${response.status}`
    throw new GitHubApiError(response.status, message)
  }
  return payload as T
}

export async function verifyAuthorizedInstallation(
  env: Env,
  code: string,
  requestedInstallationId?: string,
): Promise<{ installationId: string; accountLogin: string; accountType: 'User' | 'Organization' }> {
  const appId = required(env.GITHUB_APP_ID, 'GITHUB_APP_ID')
  const clientId = required(env.GITHUB_APP_CLIENT_ID, 'GITHUB_APP_CLIENT_ID')
  const clientSecret = required(env.GITHUB_APP_CLIENT_SECRET, 'GITHUB_APP_CLIENT_SECRET')
  const response = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify({ client_id: clientId, client_secret: clientSecret, code }),
  })
  const tokenResult = await response.json() as { access_token?: string }
  if (!response.ok || !tokenResult.access_token) throw new Error('GitHub authorization code exchange failed')

  const userToken = tokenResult.access_token
  const user = await githubFetch<GitHubUser>('/user', userToken)
  let page = 1
  const matchingInstallations: Array<{ id: number; app_id: number; account: { login: string; type: string } }> = []
  while (page <= 100) {
    const installations = await githubFetch<{ total_count: number; installations: Array<{ id: number; app_id: number; account: { login: string; type: string } }> }>(
      `/user/installations?per_page=100&page=${page}`,
      userToken,
    )
    matchingInstallations.push(...installations.installations.filter((item) => String(item.app_id) === appId))
    if (requestedInstallationId && matchingInstallations.some((item) => String(item.id) === requestedInstallationId)) break
    if (installations.installations.length < 100 || page * 100 >= installations.total_count) break
    page++
  }
  const matches = requestedInstallationId
    ? matchingInstallations.filter((item) => String(item.id) === requestedInstallationId)
    : matchingInstallations
  if (matches.length > 1) throw new Error('More than one GitHub installation is accessible; select one installation explicitly')
  const match = matches[0]
  if (match) {
    const accountType = match.account.type === 'Organization' ? 'Organization' : 'User'
    // Match app_id against trusted app configuration and keep metadata from
    // GitHub's authenticated installations response, never query parameters.
    return { installationId: String(match.id), accountLogin: match.account.login || user.login, accountType }
  }
  throw new Error('The GitHub installation was not found for the authorizing account')
}

export async function createInstallationToken(env: Env, installationId: string): Promise<string> {
  const token = await appJwt(env)
  const response = await githubFetch<{ token: string }>(
    `/app/installations/${encodeURIComponent(installationId)}/access_tokens`,
    token,
    { method: 'POST', body: '{}' },
  )
  return response.token
}

export async function listInstallationRepositories(token: string, page = 1): Promise<{ repositories: GitHubRepository[]; total_count: number }> {
  return githubFetch(`/installation/repositories?per_page=100&page=${page}`, token)
}

export async function getInstallationRepository(token: string, repositoryId: string): Promise<GitHubRepository | null> {
  let page = 1
  for (;;) {
    const result = await listInstallationRepositories(token, page)
    const repository = result.repositories.find((item) => String(item.id) === repositoryId)
    if (repository) return repository
    if (result.repositories.length < 100 || page * 100 >= result.total_count) return null
    page++
  }
}

export async function listPullRequests(token: string, owner: string, repo: string, state: string, page: number): Promise<GitHubPullRequest[]> {
  const query = new URLSearchParams({ state, per_page: '50', page: String(page), sort: 'updated', direction: 'desc' })
  return githubFetch(`/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/pulls?${query}`, token)
}

export async function getPullRequest(token: string, owner: string, repo: string, number: number): Promise<GitHubPullRequest> {
  return githubFetch(`/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/pulls/${number}`, token)
}

export async function listPullRequestFiles(token: string, owner: string, repo: string, number: number, page: number): Promise<GitHubPullRequestFile[]> {
  return githubFetch(`/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/pulls/${number}/files?per_page=100&page=${page}`, token)
}

export async function fetchPullRequestDiff(token: string, owner: string, repo: string, number: number): Promise<string> {
  const headers = new Headers({
    Accept: 'application/vnd.github.diff',
    Authorization: `Bearer ${token}`,
    'X-GitHub-Api-Version': API_VERSION,
    'User-Agent': 'PRInspect',
  })
  const response = await fetch(`${GITHUB_API}/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/pulls/${number}`, { headers })
  const text = await response.text()
  if (!response.ok) throw new GitHubApiError(response.status, `GitHub returned HTTP ${response.status}`)
  return text
}

export async function verifyWebhookSignature(secret: string, body: string, signatureHeader: string | null): Promise<boolean> {
  if (!signatureHeader || !/^sha256=[0-9a-f]{64}$/i.test(signatureHeader)) return false
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  const digest = new Uint8Array(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(body)))
  const actual = `sha256=${Array.from(digest, (byte) => byte.toString(16).padStart(2, '0')).join('')}`
  const encoder = new TextEncoder()
  const a = encoder.encode(actual.toLowerCase())
  const b = encoder.encode(signatureHeader.toLowerCase())
  return a.length === b.length && a.reduce((diff, value, index) => diff | (value ^ b[index]!), 0) === 0
}
