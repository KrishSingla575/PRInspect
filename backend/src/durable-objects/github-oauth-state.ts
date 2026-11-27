type StateEntry = { userId: string; expiresAt: number }

/**
 * Internal worker-only storage for GitHub OAuth state values. Cloudflare's
 * Durable Object storage transaction makes callback consumption atomic, so a
 * concurrent/replayed callback cannot reuse the same state.
 */
export class GithubOAuthStateRoom {
  constructor(private readonly state: DurableObjectState) {}

  async fetch(request: Request): Promise<Response> {
    if (request.method !== 'POST') return new Response('Not found', { status: 404 })
    const url = new URL(request.url)
    if (url.pathname === '/create') return this.create(request)
    if (url.pathname === '/consume') return this.consume(request)
    return new Response('Not found', { status: 404 })
  }

  private async create(request: Request): Promise<Response> {
    let body: { state?: unknown; userId?: unknown; expiresAt?: unknown }
    try {
      body = await request.json()
    } catch {
      return Response.json({ error: 'Invalid request' }, { status: 400 })
    }
    if (
      typeof body.state !== 'string' || !/^[A-Za-z0-9_-]{40,100}$/.test(body.state) ||
      typeof body.userId !== 'string' || !body.userId || body.userId.length > 200 ||
      typeof body.expiresAt !== 'number' || !Number.isSafeInteger(body.expiresAt) ||
      body.expiresAt <= Date.now() || body.expiresAt > Date.now() + 15 * 60_000
    ) return Response.json({ error: 'Invalid state transaction' }, { status: 400 })

    await this.state.storage.put(`state:${body.state}`, {
      userId: body.userId,
      expiresAt: body.expiresAt,
    } satisfies StateEntry)
    return Response.json({ success: true })
  }

  private async consume(request: Request): Promise<Response> {
    let body: { state?: unknown }
    try {
      body = await request.json()
    } catch {
      return Response.json({ error: 'Invalid request' }, { status: 400 })
    }
    if (typeof body.state !== 'string' || !/^[A-Za-z0-9_-]{40,100}$/.test(body.state)) {
      return Response.json({ error: 'Invalid state' }, { status: 400 })
    }

    const entry = await this.state.storage.transaction(async (txn) => {
      const key = `state:${body.state}`
      const stored = await txn.get<StateEntry>(key)
      if (!stored) return null
      await txn.delete(key)
      return stored.expiresAt > Date.now() ? stored : null
    })
    return Response.json(entry ? { success: true, userId: entry.userId } : { success: false })
  }
}
