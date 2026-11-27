import type { Env } from '../../../worker.js'

const STATE_TTL_MS = 10 * 60_000

function stateRoom(env: Env): DurableObjectStub {
  const id = env.GITHUB_OAUTH_STATES.idFromName(`app:${env.DEEPSPACE_APP_ID}:github-oauth`)
  return env.GITHUB_OAUTH_STATES.get(id)
}

export async function createOAuthState(env: Env, userId: string): Promise<string> {
  const bytes = crypto.getRandomValues(new Uint8Array(32))
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  const state = btoa(binary).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')
  const response = await stateRoom(env).fetch('https://internal/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ state, userId, expiresAt: Date.now() + STATE_TTL_MS }),
  })
  if (!response.ok) throw new Error('Could not create GitHub authorization state')
  return state
}

export async function consumeOAuthState(env: Env, state: string): Promise<string | null> {
  const response = await stateRoom(env).fetch('https://internal/consume', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ state }),
  })
  if (!response.ok) return null
  const result = await response.json() as { success?: boolean; userId?: string }
  return result.success && result.userId ? result.userId : null
}
