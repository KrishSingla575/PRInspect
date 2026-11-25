import type { CollectionSchema } from 'deepspace/schema'

export const findingsSchema: CollectionSchema = {
  name: 'findings',
  columns: [
    {
      name: 'reviewId',
      storage: 'text',
      interpretation: { kind: 'reference', targetTable: 'reviews', displayColumn: 'status' },
      required: true,
    },
    {
      name: 'category',
      storage: 'text',
      interpretation: { kind: 'select', options: ['bug', 'security', 'performance', 'quality', 'maintainability'] },
      required: true,
    },
    {
      name: 'severity',
      storage: 'text',
      interpretation: { kind: 'select', options: ['critical', 'high', 'medium', 'low'] },
      required: true,
    },
    { name: 'title', storage: 'text', interpretation: 'plain', required: true, maxLength: 500 },
    { name: 'description', storage: 'text', interpretation: 'plain', required: true },
    { name: 'filePath', storage: 'text', interpretation: 'plain', required: true },
    { name: 'lineNumber', storage: 'number', interpretation: 'plain' },
    { name: 'suggestion', storage: 'text', interpretation: 'plain' },
    { name: 'confidence', storage: 'number', interpretation: 'plain' },
  ],
  permissions: {
    '*': { read: false, create: false, update: false, delete: false },
    viewer: { read: false, create: false, update: false, delete: false },
    member: { read: 'own', create: true, update: 'own', delete: 'own' },
    admin: { read: true, create: true, update: true, delete: true },
  },
}
