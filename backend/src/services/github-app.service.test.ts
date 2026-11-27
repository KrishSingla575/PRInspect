import { afterEach, describe, expect, it, vi } from 'vitest'
import type { Env } from '../../../worker.js'
import {
  createInstallationToken,
  GitHubConfigurationError,
  listInstallationRepositories,
  listPullRequestFiles,
  verifyAuthorizedInstallation,
  verifyWebhookSignature,
} from './github-app.service.js'

const jsonResponse = (payload: unknown, status = 200) => new Response(JSON.stringify(payload), { status })

function toPem(bytes: ArrayBuffer): string {
  const binary = Array.from(new Uint8Array(bytes), (byte) => String.fromCharCode(byte)).join('')
  const base64 = btoa(binary).match(/.{1,64}/g)?.join('\n') ?? ''
  return `-----BEGIN PRIVATE KEY-----\n${base64}\n-----END PRIVATE KEY-----`
}

afterEach(() => vi.unstubAllGlobals())

describe('GitHub App service', () => {
  it('rejects GitHub PKCS#1 PEM with safe conversion guidance and no key material in the error', async () => {
    const unsupportedPem = '-----BEGIN RSA PRIVATE KEY-----\nSENSITIVE-PRIVATE-KEY-BYTES\n-----END RSA PRIVATE KEY-----'
    const caught = await createInstallationToken({ GITHUB_APP_ID: '77', GITHUB_APP_PRIVATE_KEY: unsupportedPem } as Env, '9001').then(() => null, (cause: unknown) => cause)
    expect(caught).toBeInstanceOf(Error)
    const error = caught as Error
    expect(error).toMatchObject({
      name: 'GitHubConfigurationError',
      message: expect.stringContaining('convert the GitHub key with openssl pkcs8 -topk8 -nocrypt'),
    })
    expect(error.message).not.toContain('SENSITIVE-PRIVATE-KEY-BYTES')
  })

  it('imports valid PKCS#8 PEM and signs an app JWT without logging or returning the key', async () => {
    const generated = await crypto.subtle.generateKey({ name: 'RSASSA-PKCS1-v1_5', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' }, true, ['sign', 'verify'])
    const privateKey = toPem(await crypto.subtle.exportKey('pkcs8', generated.privateKey))
    const fetchMock = vi.fn().mockResolvedValueOnce(jsonResponse({ token: 'short-lived-installation-token' }))
    vi.stubGlobal('fetch', fetchMock)
    await expect(createInstallationToken({ GITHUB_APP_ID: '77', GITHUB_APP_PRIVATE_KEY: privateKey } as Env, '9001'))
      .resolves.toBe('short-lived-installation-token')
    const authorization = new Headers(fetchMock.mock.calls[0]?.[1]?.headers).get('Authorization')
    expect(authorization).toMatch(/^Bearer [A-Za-z0-9_.-]+$/)
    expect(authorization).not.toContain(privateKey)
  })

  it('rejects malformed PKCS#8 PEM with sanitized diagnostic text', async () => {
    const malformed = '-----BEGIN PRIVATE KEY-----\nnot-base64!\n-----END PRIVATE KEY-----'
    const caught = await createInstallationToken({ GITHUB_APP_ID: '77', GITHUB_APP_PRIVATE_KEY: malformed } as Env, '9001').then(() => null, (cause: unknown) => cause)
    expect(caught).toBeInstanceOf(Error)
    const error = caught as Error
    expect(error).toMatchObject({ name: 'GitHubConfigurationError', message: expect.stringContaining('invalid PKCS#8 PEM encoding') })
    expect(error.message).not.toContain('not-base64!')
  })

  it('exchanges the OAuth code and confirms the installation belongs to the authorizing GitHub user', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(jsonResponse({ access_token: 'temporary-user-token' }))
      .mockResolvedValueOnce(jsonResponse({ id: 71, login: 'krish' }))
      .mockResolvedValueOnce(jsonResponse({ total_count: 1, installations: [{ id: 9001, app_id: 77, account: { login: 'my-org', type: 'Organization' } }] }))
    vi.stubGlobal('fetch', fetchMock)
    const result = await verifyAuthorizedInstallation({ GITHUB_APP_ID: '77', GITHUB_APP_CLIENT_ID: 'client', GITHUB_APP_CLIENT_SECRET: 'client-secret' } as Env, 'oauth-code', '9001')
    expect(result).toEqual({ installationId: '9001', accountLogin: 'my-org', accountType: 'Organization' })
    expect(fetchMock.mock.calls[0]?.[0]).toBe('https://github.com/login/oauth/access_token')
    expect(fetchMock.mock.calls[1]?.[0]).toBe('https://api.github.com/user')
    expect(fetchMock.mock.calls[2]?.[0]).toBe('https://api.github.com/user/installations?per_page=100&page=1')
    expect(JSON.stringify(fetchMock.mock.calls)).not.toContain('temporary-user-token')
  })

  it('rejects an installation that is not present in the authorizing user account', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(jsonResponse({ access_token: 'temporary-user-token' }))
      .mockResolvedValueOnce(jsonResponse({ id: 71, login: 'krish' }))
      .mockResolvedValueOnce(jsonResponse({ total_count: 1, installations: [{ id: 9002, app_id: 88, account: { login: 'other', type: 'User' } }] }))
    vi.stubGlobal('fetch', fetchMock)
    await expect(verifyAuthorizedInstallation({ GITHUB_APP_ID: '77', GITHUB_APP_CLIENT_ID: 'client', GITHUB_APP_CLIENT_SECRET: 'secret' } as Env, 'code', '9001'))
      .rejects.toThrow('installation was not found')
  })

  it('identifies the app installation from the authorized account when GitHub omits installation_id', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(jsonResponse({ access_token: 'temporary-user-token' }))
      .mockResolvedValueOnce(jsonResponse({ id: 71, login: 'krish' }))
      .mockResolvedValueOnce(jsonResponse({ total_count: 2, installations: [
        { id: 9001, app_id: 77, account: { login: 'my-org', type: 'Organization' } },
        { id: 9002, app_id: 88, account: { login: 'other', type: 'User' } },
      ] }))
    vi.stubGlobal('fetch', fetchMock)
    const result = await verifyAuthorizedInstallation({ GITHUB_APP_ID: '77', GITHUB_APP_CLIENT_ID: 'client', GITHUB_APP_CLIENT_SECRET: 'secret' } as Env, 'code')
    expect(result).toEqual({ installationId: '9001', accountLogin: 'my-org', accountType: 'Organization' })
  })

  it('uses paginated installation and pull request file endpoints', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(jsonResponse({ total_count: 1, repositories: [{ id: 1 }] }))
      .mockResolvedValueOnce(jsonResponse([{ filename: 'src/a.ts', patch: '@@ -1 +1 @@' }]))
    vi.stubGlobal('fetch', fetchMock)
    await expect(listInstallationRepositories('installation-token', 2)).resolves.toMatchObject({ total_count: 1 })
    await expect(listPullRequestFiles('installation-token', 'owner', 'repo', 17, 2)).resolves.toMatchObject([{ filename: 'src/a.ts' }])
    expect(fetchMock.mock.calls[0]?.[0]).toBe('https://api.github.com/installation/repositories?per_page=100&page=2')
    expect(fetchMock.mock.calls[1]?.[0]).toBe('https://api.github.com/repos/owner/repo/pulls/17/files?per_page=100&page=2')
    expect(new Headers(fetchMock.mock.calls[1]?.[1]?.headers).get('Authorization')).toBe('Bearer installation-token')
  })

  it('validates GitHub webhook HMAC signatures', async () => {
    const body = '{"action":"deleted"}'
    const key = await crypto.subtle.importKey('raw', new TextEncoder().encode('hook-secret'), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
    const digest = new Uint8Array(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(body)))
    const signature = `sha256=${Array.from(digest, (byte) => byte.toString(16).padStart(2, '0')).join('')}`
    await expect(verifyWebhookSignature('hook-secret', body, signature)).resolves.toBe(true)
    await expect(verifyWebhookSignature('hook-secret', `${body} `, signature)).resolves.toBe(false)
    await expect(verifyWebhookSignature('hook-secret', body, null)).resolves.toBe(false)
  })
})
