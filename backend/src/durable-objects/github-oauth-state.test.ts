import { describe, expect, it } from 'vitest'
import { GithubOAuthStateRoom } from './github-oauth-state.js'

function memoryStorage(): DurableObjectStorage {
  const values = new Map<string, unknown>()
  let queue = Promise.resolve()
  const storage = {
    get: async <T>(key: string) => values.get(key) as T | undefined,
    put: async <T>(key: string, value: T) => { values.set(key, value) },
    delete: async (key: string) => values.delete(key),
    transaction: async <T>(callback: (transaction: DurableObjectTransaction) => Promise<T>) => {
      let release!: () => void
      const next = new Promise<void>((resolve) => { release = resolve })
      const previous = queue
      queue = previous.then(() => next)
      await previous
      try {
        const transaction = {
          get: storage.get,
          put: storage.put,
          delete: storage.delete,
        } as DurableObjectTransaction
        return await callback(transaction)
      } finally { release() }
    },
  }
  return storage as unknown as DurableObjectStorage
}

describe('GitHub OAuth state room', () => {
  it('consumes state once and rejects concurrent replay', async () => {
    const room = new GithubOAuthStateRoom({ storage: memoryStorage() } as DurableObjectState)
    const state = 'A'.repeat(43)
    const created = await room.fetch(new Request('https://internal/create', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ state, userId: 'ds-user-1', expiresAt: Date.now() + 60_000 }),
    }))
    expect(created.status).toBe(200)
    const [first, second] = await Promise.all([
      room.fetch(new Request('https://internal/consume', { method: 'POST', body: JSON.stringify({ state }) })),
      room.fetch(new Request('https://internal/consume', { method: 'POST', body: JSON.stringify({ state }) })),
    ])
    const results = await Promise.all([first.json(), second.json()]) as Array<{ success: boolean; userId?: string }>
    expect(results.filter((result) => result.success)).toHaveLength(1)
    expect(results.find((result) => result.success)?.userId).toBe('ds-user-1')
  })

  it('deletes expired state and refuses invalid state data', async () => {
    const room = new GithubOAuthStateRoom({ storage: memoryStorage() } as DurableObjectState)
    const expired = await room.fetch(new Request('https://internal/create', {
      method: 'POST', body: JSON.stringify({ state: 'B'.repeat(43), userId: 'user', expiresAt: Date.now() - 1 }),
    }))
    expect(expired.status).toBe(400)
    const consumed = await room.fetch(new Request('https://internal/consume', {
      method: 'POST', body: JSON.stringify({ state: 'B'.repeat(43) }),
    }))
    expect(await consumed.json()).toEqual({ success: false })
  })
})
