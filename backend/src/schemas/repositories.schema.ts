import type { CollectionSchema } from 'deepspace/schema'

export const repositoriesSchema: CollectionSchema = {
  name: 'repositories',
  columns: [
    { name: 'githubRepositoryId', storage: 'text', interpretation: 'plain', required: true },
    { name: 'owner', storage: 'text', interpretation: 'plain', required: true },
    { name: 'name', storage: 'text', interpretation: 'plain', required: true },
    { name: 'fullName', storage: 'text', interpretation: 'plain', required: true },
    { name: 'htmlUrl', storage: 'text', interpretation: { kind: 'url' }, required: true },
    { name: 'description', storage: 'text', interpretation: 'plain' },
    { name: 'defaultBranch', storage: 'text', interpretation: 'plain', required: true },
  ],
  permissions: {
    '*': { read: false, create: false, update: false, delete: false },
    viewer: { read: false, create: false, update: false, delete: false },
    member: { read: 'own', create: true, update: 'own', delete: 'own' },
    admin: { read: true, create: true, update: true, delete: true },
  },
}
