import type { Env } from '../../../worker.js'

function deliveryRoom(env: Env): DurableObjectStub {
  const id = env.GITHUB_WEBHOOK_DELIVERIES.idFromName(`app:${env.DEEPSPACE_APP_ID}:github-webhook-deliveries`)
  return env.GITHUB_WEBHOOK_DELIVERIES.get(id)
}

async function post(env: Env, path: string, body: Record<string, string>): Promise<Record<string, unknown>> {
  const response = await deliveryRoom(env).fetch(`https://internal${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!response.ok) throw new Error('GitHub webhook delivery storage failed')
  return await response.json() as Record<string, unknown>
}

export async function claimWebhookDelivery(env: Env, deliveryId: string): Promise<string | null> {
  const result = await post(env, '/claim', { deliveryId })
  return result.claimed === true && typeof result.leaseId === 'string' ? result.leaseId : null
}

export async function completeWebhookDelivery(env: Env, deliveryId: string, leaseId: string): Promise<boolean> {
  const result = await post(env, '/complete', { deliveryId, leaseId })
  return result.completed === true
}

export async function releaseWebhookDelivery(env: Env, deliveryId: string, leaseId: string): Promise<void> {
  await post(env, '/release', { deliveryId, leaseId })
}
