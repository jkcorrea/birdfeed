import { z } from 'zod'

import type { User } from '@prisma/client'

import { Logger } from './utils'

export const UserFeatureFlag = z.enum(['IDEAS_BIN'])

const UserFeatureSchema = z.discriminatedUnion('flag', [
  z.object({
    flag: z.literal(UserFeatureFlag.Enum.IDEAS_BIN),
  }),
])
export type UserFeature = z.infer<typeof UserFeatureSchema>
const UserFeatureSchemaArray = z.array(UserFeatureSchema)
export type UserFeatures = z.infer<typeof UserFeatureSchemaArray>

type UserWithFlags = (Partial<User> & Pick<User, 'featureFlags'>) | null

export const getUserFeatures = (user: UserWithFlags): UserFeatures => {
  if (!user) return []
  const res = UserFeatureSchemaArray.safeParse(user.featureFlags)
  if (res.success) return res.data

  Logger.error(
    `Unable to parse user feature flags for user ${user.id}
Input: ${JSON.stringify(user.featureFlags)}
Error: ${res.error}`
  )
  return []
}

export const getUserFeature = (user: UserWithFlags, flag: z.infer<typeof UserFeatureFlag>) =>
  getUserFeatures(user).find((f) => f.flag === flag)
