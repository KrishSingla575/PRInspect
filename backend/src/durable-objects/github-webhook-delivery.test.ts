import { afterEach, describe, expect, it, vi } from 'vitest'
import { GithubWebhookDeliveryRoom, GITHUB_WEBHOOK_DELIVERY_RETENTION_MS } from './github-webhook-delivery.js'

function memoryStorage(): DurableObjectStorage {
  const values = new Map<string, unknown>()
  let alarmAt: number | null = null
  let queue = Promise.resolve()
  const storage = {
    get: async <T>(key: string) => values.get(key) as T | undefined,
    put: async <T>(key: string, value: T) => { values.set(key, value) },
    delete: async (key: string) => values.delete(key),
    list: async <T>(options?: { prefix?: string }) => new Map(
      [...values.entries()].filter(([key]) => key.startsWith(options?.prefix ?? '')).map(([key, value]) => [key, value as T]),
    ),
    getAlarm: async () => alarmAt,
    setAlarm: async (value: number | Date) => { alarmAt = value instanceof Date ? value.getTime() : value },
    deleteAlarm: async () => { alarmAt = null },
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
          list: storage.list,
          getAlarm: storage.getAlarm,
          setAlarm: storage.setAlarm,
          deleteAlarm: storage.deleteAlarm,
        } as unknown as DurableObjectTransaction
        return await callback(transaction)
      } finally { release() }
    },
  }
  return storage as unknown as DurableObjectStorage
}

const post = (room: GithubWebhookDeliveryRoom, path: string, body: unknown) => room.fetch(new Request(`https://internal${path}`, {
  method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
}))

describe('GitHub webhook delivery room', () => {
  afterEach(() => vi.useRealTimers())

  it('atomically grants one claim to concurrent deliveries', async () => {
    const room = new GithubWebhookDeliveryRoom({ storage: memoryStorage() } as DurableObjectState)
    const deliveryId = '72d8c70f-7796-42e6-ae22-93f18d9188a0'
    const responses = await Promise.all([
      post(room, '/claim', { deliveryId }),
      post(room, '/claim', { deliveryId }),
    ])
    const claims = await Promise.all(responses.map((response) => response.json() as Promise<{ claimed: boolean; leaseId?: string }>))
    expect(claims.filter((claim) => claim.claimed)).toHaveLength(1)
    expect(claims.filter((claim) => !claim.claimed)).toHaveLength(1)
  })

  it('retains completed deliveries for seven days, then allows an expired id to be claimed again', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-01-01T00:00:00Z'))
    const storage = memoryStorage()
    const room = new GithubWebhookDeliveryRoom({ storage } as DurableObjectState)
    const deliveryId = '72d8c70f-7796-42e6-ae22-93f18d9188a1'
    const claimed = await (await post(room, '/claim', { deliveryId })).json() as { claimed: boolean; leaseId: string }
    const completed = await post(room, '/complete', { deliveryId, leaseId: claimed.leaseId })
    expect(await completed.json()).toEqual({ completed: true })
    const duringRetention = await post(room, '/claim', { deliveryId })
    expect(await duringRetention.json()).toEqual({ claimed: false })

    vi.advanceTimersByTime(GITHUB_WEBHOOK_DELIVERY_RETENTION_MS + 1)
    await room.alarm()
    const afterExpiry = await post(room, '/claim', { deliveryId })
    expect(await afterExpiry.json()).toMatchObject({ claimed: true })
  })

  it('releases only the matching processing lease after a failed delivery attempt', async () => {
    const room = new GithubWebhookDeliveryRoom({ storage: memoryStorage() } as DurableObjectState)
    const deliveryId = '72d8c70f-7796-42e6-ae22-93f18d9188a2'
    const claimed = await (await post(room, '/claim', { deliveryId })).json() as { leaseId: string }
    expect(await (await post(room, '/release', { deliveryId, leaseId: 'wrong-lease' })).json()).toEqual({ released: false })
    expect(await (await post(room, '/release', { deliveryId, leaseId: claimed.leaseId })).json()).toEqual({ released: true })
    expect(await (await post(room, '/claim', { deliveryId })).json()).toMatchObject({ claimed: true })
  })
})
