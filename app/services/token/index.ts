import _ from 'lodash'
import type { ZodSchema } from 'zod'

import type { Prisma, Token } from '@prisma/client'
import { db } from '~/database'
import { AppError } from '~/lib/utils'

export async function getGuardedToken<T = Record<string, any>>(
  where: Prisma.TokenFindUniqueOrThrowArgs['where'],
  schema?: ZodSchema<T>
): Promise<Omit<Token, 'metadata'> & { metadata: T }> {
  const token = await db.token.findUniqueOrThrow({
    where,
  })

  if (!token.metadata || !_.isObject(token.metadata)) {
    throw new Error('Token metadata is missing or not an object')
  }

  if (schema) schema.parse(token.metadata)

  if (!token.active) {
    await db.token.delete({
      where: {
        id: token.id,
      },
    })

    throw new AppError('token is not active')
  }

  if (token.expiresAt && token.expiresAt < new Date(Date.now())) {
    await db.token.delete({
      where: {
        id: token.id,
      },
    })

    throw new AppError('token is expired')
  }

  return token as Omit<Token, 'metadata'> & { metadata: T }
}
