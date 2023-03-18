import type { Tier, TierId } from '@prisma/client'
import { db } from '~/database'
import { AppError } from '~/lib/utils'

const tag = 'Tier service 📊'

export async function updateTier(
  tierId: TierId,
  { name, active, description }: Pick<Tier, 'name' | 'active' | 'description'>
) {
  try {
    const { id, updatedAt } = await db.tier.update({
      where: {
        id: tierId,
      },
      data: {
        name,
        active,
        description,
      },
      select: { updatedAt: true, id: true },
    })

    return { id, updatedAt }
  } catch (cause) {
    throw new AppError({
      cause,
      message: 'Unable to update tier',
      metadata: { tierId, name, active, description },
      tag,
    })
  }
}
