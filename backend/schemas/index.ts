import type { CollectionSchema } from 'deepspace/schema'
import { usersSchema } from './users-schema.js'
import { settingsSchema } from './admin-schema.js'

/** Canonical registry used by the DeepSpace worker adapter. */
export const schemas: CollectionSchema[] = [usersSchema, settingsSchema]
