import { Hono } from 'hono'
import { requireAuth } from '../middleware/auth.middleware.js'
import type { AuthContext } from '../middleware/auth.middleware.js'
import githubRoutes from './github.routes.js'

const routes = new Hono<AuthContext>()

/** Identity is derived only from the server-verified DeepSpace JWT. */
routes.get('/api/me', requireAuth, (c) => {
  const { userId } = c.get('auth')
  return c.json({ userId })
})

routes.route('/api/github', githubRoutes)

export default routes
