import { db } from '~/database'
import { AppError } from '~/lib/utils'
import type { AuthSession } from '~/services/auth'
import { createEmailAuthAccount, deleteAuthAccount, signInWithEmail } from '~/services/auth'
import { stripe } from '~/services/billing'

import { deleteAuthAccountByEmail } from '../auth/auth.server'
import type { User } from './types'

const tag = 'User service 🧑'

type UserCreatePayload = Pick<AuthSession, 'userId' | 'email'>

export async function getUserByEmail(email: User['email']) {
  try {
    const user = await db.user.findUnique({
      where: { email: email.toLowerCase() },
    })

    return user
  } catch (cause) {
    throw new AppError({
      cause,
      message: 'Unable to get user by email',
      status: 404,
      metadata: { email },
      tag,
    })
  }
}

async function createUser({ email, userId }: UserCreatePayload) {
  try {
    const { id: customerId } = await stripe.customers.create({ email })

    const user = await db.user.create({
      data: {
        email,
        id: userId,
        customerId,
        tierId: 'free',
      },
    })

    return user
  } catch (cause) {
    throw new AppError({
      cause,
      message: 'Unable to create user in database or stripe',
      metadata: { email, userId },
      tag,
    })
  }
}

export async function createUserAccount(payload: { email: string; password: string }) {
  const { email, password } = payload

  try {
    const { id: userId } = await createEmailAuthAccount(email, password)
    const authSession = await signInWithEmail(email, password)
    await createUser({
      email,
      userId,
    })

    return authSession
  } catch (cause) {
    // We should delete the user account to allow retry create account again
    // We mostly trust that it will be deleted.
    // If it's not the case, the user will face on a "user already exists" kind of error.
    // It'll require manual intervention to remove the account in Supabase Auth dashboard.
    await deleteAuthAccountByEmail(email)

    throw new AppError({
      cause,
      message: 'Unable to create user account',
      metadata: { email },
      tag,
    })
  }
}

export async function getUserTierLimit(id: User['id']) {
  try {
    const {
      tier: { tierLimit },
    } = await db.user.findUniqueOrThrow({
      where: { id },
      select: {
        tier: {
          include: { tierLimit: { select: { maxUsage: true } } },
        },
      },
    })

    return tierLimit
  } catch (cause) {
    throw new AppError({
      cause,
      message: 'Unable to find user tier limit',
      status: 404,
      metadata: { id },
      tag,
    })
  }
}

export async function getUserTier(id: User['id']) {
  try {
    const { tier } = await db.user.findUniqueOrThrow({
      where: { id },
      select: {
        tier: { select: { id: true, name: true } },
      },
    })

    return tier
  } catch (cause) {
    throw new AppError({
      cause,
      message: 'Unable to find user tier',
      status: 404,
      metadata: { id },
      tag,
    })
  }
}

export async function updateUser(
  id: User['id'],
  data: Partial<Omit<User, 'id' | 'customerId' | 'createdAt' | 'updatedAt'>>
) {
  try {
    return db.user.update({
      where: { id },
      data,
    })
  } catch (cause) {
    throw new AppError({
      cause,
      message: 'Oops, unable to update user',
      metadata: { id },
      tag,
    })
  }
}

export async function getBillingInfo(id: User['id']) {
  try {
    const { customerId, currency } = await db.user.findUniqueOrThrow({
      where: { id },
      select: {
        customerId: true,
        currency: true,
      },
    })

    return { customerId, currency }
  } catch (cause) {
    throw new AppError({
      cause,
      message: 'Unable to get billing info',
      status: 404,
      metadata: { id },
      tag,
    })
  }
}

export async function deleteUser(id: User['id']) {
  try {
    const { customerId } = await getBillingInfo(id)

    await stripe.customers.del(customerId)
    await deleteAuthAccount(id)
    await db.user.delete({ where: { id } })

    return { success: true }
  } catch (cause) {
    throw new AppError({
      cause,
      message: 'Oops, unable to delete your test account',
      metadata: { id },
      tag,
    })
  }
}
