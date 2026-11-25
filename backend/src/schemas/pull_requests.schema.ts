import type { CollectionSchema } from 'deepspace/schema'

export const pullRequestsSchema: CollectionSchema = {
  name: 'pull_requests',
  columns: [
    {
      name: 'repositoryId',
      storage: 'text',
      interpretation: { kind: 'reference', targetTable: 'repositories', displayColumn: 'fullName' },
      required: true,
    },
    { name: 'githubPullRequestId', storage: 'text', interpretation: 'plain', required: true },
    { name: 'number', storage: 'number', interpretation: 'plain', required: true },
    { name: 'title', storage: 'text', interpretation: 'plain', required: true, maxLength: 500 },
    { name: 'description', storage: 'text', interpretation: 'plain' },
    { name: 'author', storage: 'text', interpretation: 'plain', required: true },
    { name: 'state', storage: 'text', interpretation: { kind: 'select', options: ['open', 'closed', 'merged'] }, required: true },
    { name: 'sourceBranch', storage: 'text', interpretation: 'plain', required: true },
    { name: 'targetBranch', storage: 'text', interpretation: 'plain', required: true },
    { name: 'htmlUrl', storage: 'text', interpretation: { kind: 'url' }, required: true },
  ],
  permissions: {
    '*': { read: false, create: false, update: false, delete: false },
    viewer: { read: false, create: false, update: false, delete: false },
    member: { read: 'own', create: true, update: 'own', delete: 'own' },
    admin: { read: true, create: true, update: true, delete: true },
  },
}
