import type { CollectionSchema } from 'deepspace/schema'
import { usersSchema } from './schemas/users-schema.js'
import { settingsSchema } from './schemas/admin-schema.js'
import { repositoriesSchema } from '../backend/src/schemas/repositories.schema.js'
import { pullRequestsSchema } from '../backend/src/schemas/pull_requests.schema.js'
import { reviewsSchema } from '../backend/src/schemas/reviews.schema.js'
import { findingsSchema } from '../backend/src/schemas/findings.schema.js'

export { usersSchema, settingsSchema, repositoriesSchema, pullRequestsSchema, reviewsSchema, findingsSchema }

/**
 * The one schema registry consumed by both the worker and RecordScope.
 * DeepSpace stamps record.createdBy from the authenticated connection; own
 * permissions use that envelope field, so schemas must not accept a client
 * supplied userId/createdBy ownership column.
 */
export const schemas: CollectionSchema[] = [
  usersSchema,
  settingsSchema,
  repositoriesSchema,
  pullRequestsSchema,
  reviewsSchema,
  findingsSchema,
]
