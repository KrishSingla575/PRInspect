type Delivery = {
  status: 'processing' | 'processed'
  leaseId: string
  expiresAt: number
}

const DELIVERY_KEY = 'delivery:'
export const GITHUB_WEBHOOK_DELIVERY_RETENTION_MS = 7 * 24 * 60 * 60_000
const PROCESSING_LEASE_MS = 5 * 60_000

/** Durable, atomic idempotency records for signature-verified GitHub webhooks. */
export class GithubWebhookDeliveryRoom {
  constructor(private readonly state: DurableObjectState) {}

  async fetch(request: Request): Promise<Response> {
    if (request.method !== 'POST') return new Response('Not found', { status: 404 })
    const path = new URL(request.url).pathname
    if (path === '/claim') return this.claim(request)
    if (path === '/complete') return this.complete(request)
    if (path === '/release') return this.release(request)
    return new Response('Not found', { status: 404 })
  }

  /** Remove expired rows and schedule the next expiry, including after idle periods. */
  async alarm(): Promise<void> {
    await this.state.storage.transaction(async (txn) => {
      const records = await txn.list<Delivery>({ prefix: DELIVERY_KEY })
      const now = Date.now()
      let nextExpiry = Number.POSITIVE_INFINITY
      for (const [key, record] of records) {
        if (record.expiresAt <= now) await txn.delete(key)
        else nextExpiry = Math.min(nextExpiry, record.expiresAt)
      }
      if (Number.isFinite(nextExpiry)) await txn.setAlarm(nextExpiry)
      else await txn.deleteAlarm()
    })
  }

  private async claim(request: Request): Promise<Response> {
    const body = await this.readBody(request)
    if (!body || typeof body.deliveryId !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(body.deliveryId)) {
      return Response.json({ error: 'Invalid delivery id' }, { status: 400 })
    }

    const outcome = await this.state.storage.transaction(async (txn) => {
      const key = DELIVERY_KEY + body.deliveryId!.toLowerCase()
      const existing = await txn.get<Delivery>(key)
      const now = Date.now()
      if (existing && existing.expiresAt > now) {
        return { claimed: false as const }
      }
      const leaseId = crypto.randomUUID()
      await txn.put(key, { status: 'processing', leaseId, expiresAt: now + PROCESSING_LEASE_MS } satisfies Delivery)
      await this.scheduleNextExpiry(txn)
      return { claimed: true as const, leaseId }
    })
    return Response.json(outcome)
  }

  private async complete(request: Request): Promise<Response> {
    const body = await this.readBody(request)
    if (!this.validLeaseBody(body)) return Response.json({ completed: false }, { status: 400 })
    const completed = await this.state.storage.transaction(async (txn) => {
      const key = DELIVERY_KEY + body.deliveryId!.toLowerCase()
      const record = await txn.get<Delivery>(key)
      if (!record || record.status !== 'processing' || record.leaseId !== body.leaseId || record.expiresAt <= Date.now()) return false
      await txn.put(key, {
        status: 'processed',
        leaseId: record.leaseId,
        expiresAt: Date.now() + GITHUB_WEBHOOK_DELIVERY_RETENTION_MS,
      } satisfies Delivery)
      await this.scheduleNextExpiry(txn)
      return true
    })
    return Response.json({ completed })
  }

  private async release(request: Request): Promise<Response> {
    const body = await this.readBody(request)
    if (!this.validLeaseBody(body)) return Response.json({ released: false }, { status: 400 })
    const released = await this.state.storage.transaction(async (txn) => {
      const key = DELIVERY_KEY + body.deliveryId!.toLowerCase()
      const record = await txn.get<Delivery>(key)
      if (!record || record.status !== 'processing' || record.leaseId !== body.leaseId) return false
      await txn.delete(key)
      await this.scheduleNextExpiry(txn)
      return true
    })
    return Response.json({ released })
  }

  private async scheduleNextExpiry(txn: DurableObjectTransaction): Promise<void> {
    const records = await txn.list<Delivery>({ prefix: DELIVERY_KEY })
    let nextExpiry = Number.POSITIVE_INFINITY
    for (const record of records.values()) nextExpiry = Math.min(nextExpiry, record.expiresAt)
    if (Number.isFinite(nextExpiry)) await txn.setAlarm(nextExpiry)
    else await txn.deleteAlarm()
  }

  private async readBody(request: Request): Promise<{ deliveryId?: string; leaseId?: string } | null> {
    try {
      return await request.json() as { deliveryId?: string; leaseId?: string }
    } catch {
      return null
    }
  }

  private validLeaseBody(body: { deliveryId?: string; leaseId?: string } | null): body is { deliveryId: string; leaseId: string } {
    return Boolean(body && typeof body.deliveryId === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(body.deliveryId) && typeof body.leaseId === 'string' && /^[0-9a-f-]{36}$/i.test(body.leaseId))
  }
}
