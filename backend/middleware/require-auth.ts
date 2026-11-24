import type { MiddlewareHandler } from 'hono'
import { resolveAuth } from '../routes/server/http-routes.js'
import type { AppContext } from '../types/env.js'

/** Gate a route on a verified DeepSpace bearer token. */
export const requireAuth: MiddlewareHandler<AppContext> = async (context, next) => {
  const auth = await resolveAuth(context.req.raw, context.env)
  if (!auth) return context.json({ error: 'Sign in required' }, 401)
  await next()
}
