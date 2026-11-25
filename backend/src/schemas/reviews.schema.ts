import type { CollectionSchema } from 'deepspace/schema'

export const reviewsSchema: CollectionSchema = {
  name: 'reviews',
  columns: [
    {
      name: 'repositoryId',
      storage: 'text',
      interpretation: { kind: 'reference', targetTable: 'repositories', displayColumn: 'fullName' },
      required: true,
    },
    {
      name: 'pullRequestId',
      storage: 'text',
      interpretation: { kind: 'reference', targetTable: 'pull_requests', displayColumn: 'title' },
      required: true,
    },
    {
      name: 'status',
      storage: 'text',
      interpretation: { kind: 'select', options: ['queued', 'running', 'completed', 'failed'] },
      required: true,
      default: 'queued',
    },
    { name: 'summary', storage: 'text', interpretation: 'plain' },
    { name: 'totalFindings', storage: 'number', interpretation: 'plain', required: true, default: 0 },
    { name: 'criticalCount', storage: 'number', interpretation: 'plain', required: true, default: 0 },
    { name: 'highCount', storage: 'number', interpretation: 'plain', required: true, default: 0 },
    { name: 'mediumCount', storage: 'number', interpretation: 'plain', required: true, default: 0 },
    { name: 'lowCount', storage: 'number', interpretation: 'plain', required: true, default: 0 },
    { name: 'aiProvider', storage: 'text', interpretation: 'plain' },
  ],
  permissions: {
    '*': { read: false, create: false, update: false, delete: false },
    viewer: { read: false, create: false, update: false, delete: false },
    member: { read: 'own', create: true, update: 'own', delete: 'own' },
    admin: { read: true, create: true, update: true, delete: true },
  },
}
