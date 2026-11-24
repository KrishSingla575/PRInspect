import type { MiddlewareHandler } from 'hono'
import { verifyJwt } from 'deepspace/worker'
import type { JwtVerifierConfig, VerifyResult } from 'deepspace/worker'
import type { Env } from '../../../worker.js'

export type AuthContext = {
  Bindings: Env
  Variables: { auth: VerifyResult }
}

function jwtConfig(env: Env): JwtVerifierConfig {
  return { publicKey: env.AUTH_JWT_PUBLIC_KEY, issuer: env.AUTH_JWT_ISSUER }
}

/** Verify the bearer JWT and expose only its verified identity to the route. */
export const requireAuth: MiddlewareHandler<AuthContext> = async (c, next) => {
  const authorization = c.req.header('Authorization')
  const match = authorization?.match(/^Bearer\s+(.+)$/i)
  const token = match?.[1]?.trim()
  if (!token) return c.json({ error: 'Sign in required' }, 401)

  const { result } = await verifyJwt(jwtConfig(c.env), token)
  if (!result?.userId) return c.json({ error: 'Sign in required' }, 401)

  c.set('auth', result)
  await next()
}
