import { afterEach, describe, expect, it, vi } from 'vitest'
import type { Env } from '../../../worker.js'
import { GithubWebhookDeliveryRoom } from '../durable-objects/github-webhook-delivery.js'
import githubRoutes from './github.routes.js'

function memoryStorage(): DurableObjectStorage {
  const values = new Map<string, unknown>()
  let alarm: number | null = null
  let queue = Promise.resolve()
  const storage = {
    get: async <T>(key: string) => values.get(key) as T | undefined,
    put: async <T>(key: string, value: T) => { values.set(key, value) },
    delete: async (key: string) => values.delete(key),
    list: async <T>(options?: { prefix?: string }) => new Map(
      [...values.entries()].filter(([key]) => key.startsWith(options?.prefix ?? '')).map(([key, value]) => [key, value as T]),
    ),
    setAlarm: async (value: number | Date) => { alarm = value instanceof Date ? value.getTime() : value },
    deleteAlarm: async () => { alarm = null },
    getAlarm: async () => alarm,
    transaction: async <T>(callback: (transaction: DurableObjectTransaction) => Promise<T>) => {
      let release!: () => void
      const next = new Promise<void>((resolve) => { release = resolve })
      const previous = queue
      queue = previous.then(() => next)
      await previous
      try {
        return await callback({
          get: storage.get,
          put: storage.put,
          delete: storage.delete,
          list: storage.list,
          setAlarm: storage.setAlarm,
          deleteAlarm: storage.deleteAlarm,
          getAlarm: storage.getAlarm,
        } as unknown as DurableObjectTransaction)
      } finally { release() }
    },
  }
  return storage as unknown as DurableObjectStorage
}

async function signature(secret: string, body: string): Promise<string> {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  const digest = new Uint8Array(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(body)))
  return `sha256=${Array.from(digest, (byte) => byte.toString(16).padStart(2, '0')).join('')}`
}

const deliveryIds = [
  '81d8c70f-7796-42e6-ae22-93f18d9188a0',
  '81d8c70f-7796-42e6-ae22-93f18d9188a1',
  '81d8c70f-7796-42e6-ae22-93f18d9188a2',
]

describe('GitHub webhook delivery integration', () => {
  afterEach(() => vi.useRealTimers())

  function environment() {
    const room = new GithubWebhookDeliveryRoom({ storage: memoryStorage() } as DurableObjectState)
    const namespace = {
      idFromName: () => ({}) as DurableObjectId,
      get: () => ({ fetch: (input: RequestInfo | URL, init?: RequestInit) => room.fetch(new Request(input, init)) }) as DurableObjectStub,
    }
    return { room, env: { GITHUB_APP_WEBHOOK_SECRET: 'integration-secret', GITHUB_WEBHOOK_DELIVERIES: namespace } as unknown as Env }
  }

  async function send(env: Env, deliveryId: string, signatureHeader: string) {
    const body = JSON.stringify({ action: 'ping' })
    return githubRoutes.request('/webhook', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-GitHub-Event': 'ping',
        'X-GitHub-Delivery': deliveryId,
        'X-Hub-Signature-256': signatureHeader,
      },
      body,
    }, env)
  }

  it('does not claim a delivery ID until its signature is valid', async () => {
    const { env } = environment()
    const deliveryId = deliveryIds[0]!
    const invalid = await send(env, deliveryId, 'sha256=' + '0'.repeat(64))
    expect(invalid.status).toBe(401)

    const valid = await send(env, deliveryId, await signature('integration-secret', JSON.stringify({ action: 'ping' })))
    expect(valid.status).toBe(200)
    expect(await valid.json()).toEqual({ received: true })
  })

  it('acknowledges repeated signed deliveries without processing twice', async () => {
    const { env } = environment()
    const deliveryId = deliveryIds[1]!
    const signed = await signature('integration-secret', JSON.stringify({ action: 'ping' }))
    expect((await send(env, deliveryId, signed)).status).toBe(200)
    const duplicate = await send(env, deliveryId, signed)
    expect(duplicate.status).toBe(202)
    expect(await duplicate.json()).toEqual({ received: true, duplicate: true })
  })

  it('allows only one concurrent signed request to claim a delivery', async () => {
    const { env } = environment()
    const deliveryId = deliveryIds[2]!
    const signed = await signature('integration-secret', JSON.stringify({ action: 'ping' }))
    const responses = await Promise.all([send(env, deliveryId, signed), send(env, deliveryId, signed)])
    expect(responses.map((response) => response.status).sort()).toEqual([200, 202])
    const bodies = await Promise.all(responses.map((response) => response.json())) as Array<{ duplicate?: boolean }>
    expect(bodies.filter((body) => body.duplicate)).toHaveLength(1)
  })
})
