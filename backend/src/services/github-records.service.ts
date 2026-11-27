import { createUserToolExecutor } from 'deepspace/worker'
import type { Env } from '../../../worker.js'

export type RecordEnvelope<T extends Record<string, unknown> = Record<string, unknown>> = {
  recordId: string
  createdBy: string
  data: T
}

function unwrap<T>(result: unknown): T {
  if (!result || typeof result !== 'object' || !('success' in result) || result.success !== true || !('data' in result)) {
    const message = result && typeof result === 'object' && 'error' in result && typeof result.error === 'string'
      ? result.error
      : 'Record storage request failed'
    throw new Error(message)
  }
  return result.data as T
}

export function githubRecords(env: Env, userId: string, signal: AbortSignal) {
  const execute = createUserToolExecutor(env, userId, signal)

  async function get<T extends Record<string, unknown>>(collection: string, recordId: string): Promise<RecordEnvelope<T> | null> {
    const response = await execute('records.get', { collection, recordId })
    if (response && typeof response === 'object' && 'success' in response && response.success === false) {
      if ('error' in response && typeof response.error === 'string' && response.error.startsWith('Record not found')) return null
      throw new Error('Record lookup failed')
    }
    const result = unwrap<{ record: RecordEnvelope<T> }>(response)
    const record = result.record
    if (!record || record.createdBy !== userId) return null
    return record
  }

  async function query<T extends Record<string, unknown>>(collection: string, where: Record<string, unknown> = {}): Promise<Array<RecordEnvelope<T>>> {
    const result = unwrap<{ records: Array<RecordEnvelope<T>> }>(await execute('records.query', { collection, where, limit: 100 }))
    return result.records.filter((record) => record.createdBy === userId)
  }

  async function put<T extends Record<string, unknown>>(collection: string, recordId: string, data: T): Promise<void> {
    unwrap(await execute('records.create', { collection, recordId, data }))
  }

  async function patch<T extends Record<string, unknown>>(collection: string, recordId: string, data: Partial<T>): Promise<void> {
    unwrap(await execute('records.update', { collection, recordId, data }))
  }

  async function remove(collection: string, recordId: string): Promise<void> {
    unwrap(await execute('records.delete', { collection, recordId }))
  }

  return { get, query, put, patch, remove }
}

export async function stableRecordId(prefix: string, ...parts: string[]): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(parts.join('\0')))
  const hex = Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('')
  return `${prefix}_${hex}`
}
