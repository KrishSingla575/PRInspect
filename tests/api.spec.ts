import { test, expect } from '@playwright/test'

test.describe('API tests', () => {
  test('auth proxy forwards to auth worker', async ({ request }) => {
    const res = await request.get('/api/auth/ok')
    expect(res.ok()).toBeTruthy()
  })

  test('WebSocket endpoint exists', async ({ page }) => {
    // /home is a dynamic page (under src/pages/(app)/), so mounting it boots
    // the providers and auto-connects the records WebSocket. The static
    // landing at '/' deliberately does neither — see smoke.spec.ts.
    const recordsSocket = page.waitForEvent('websocket', {
      predicate: (socket) => new URL(socket.url()).pathname.startsWith('/ws/'),
      timeout: 15000,
    })
    await page.goto('/home')
    await page.waitForSelector('[data-testid="app-navigation"]', { timeout: 15000 })
    const socket = await recordsSocket
    expect(new URL(socket.url()).pathname).toMatch(/^\/ws\/[^/]+$/)
    expect(socket.isClosed()).toBe(false)
  })
})
