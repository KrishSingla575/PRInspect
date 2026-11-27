import type { CollectionSchema } from 'deepspace/schema'

/** Stores only the user's installation relationship; no GitHub credentials. */
export const githubConnectionsSchema: CollectionSchema = {
  name: 'github_connections',
  columns: [
    { name: 'installationId', storage: 'text', interpretation: 'plain', required: true },
    { name: 'accountLogin', storage: 'text', interpretation: 'plain', required: true },
    { name: 'accountType', storage: 'text', interpretation: { kind: 'select', options: ['User', 'Organization'] }, required: true },
    { name: 'status', storage: 'text', interpretation: { kind: 'select', options: ['connected', 'suspended', 'disconnected'] }, required: true },
    { name: 'connectedAt', storage: 'text', interpretation: { kind: 'datetime' }, required: true },
  ],
  permissions: {
    '*': { read: false, create: false, update: false, delete: false },
    viewer: { read: false, create: false, update: false, delete: false },
    member: { read: 'own', create: true, update: 'own', delete: 'own' },
    admin: { read: true, create: true, update: true, delete: true },
  },
}
