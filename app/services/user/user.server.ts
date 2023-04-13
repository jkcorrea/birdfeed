import { db } from '~/database'
import { AppError } from '~/lib/utils'
import { createEmailAuthAccount, deleteAuthAccount, signInWithPassword } from '~/services/auth'
import { stripe } from '~/services/billing'

import { deleteAuthAccountByEmail } from '../auth/auth.server'
import type { SubscriptionStatus, User } from './types'

const tag = '🧑 User service'

type UserCreatePayload = {
  password: string
  email: string
} & Partial<Pick<User, 'avatarUrl' | 'twitterId' | 'twitterHandle'>>

type UserWithSubscription = Partial<User> & Pick<User, 'stripeSubscriptionId' | 'isAdmin'>

async function getSubscriptionStatus(user: UserWithSubscription) {
  if (user.isAdmin) return 'active'

  if (!user.stripeSubscriptionId) return 'never_subscribed'

  const subscription = await stripe.subscriptions.retrieve(user.stripeSubscriptionId)
  return subscription.status
}

export async function userSubscriptionStatus(userOrId: User['id'] | UserWithSubscription): Promise<SubscriptionStatus> {
  if (typeof userOrId === 'object') return getSubscriptionStatus(userOrId)

  try {
    const user = await db.user.findUniqueOrThrow({
      where: { id: userOrId },
      select: { stripeSubscriptionId: true, isAdmin: true },
    })

    return getSubscriptionStatus(user)
  } catch (cause) {
    throw new AppError({
      cause,
      message: 'Unable to determine if user is subscribed.  Maybe stripe subscription is missing?',
      status: 404,
      tag,
    })
  }
}

export async function assertUserIsSubscribed(id: User['id']) {
  const status = await userSubscriptionStatus(id)

  if (status !== 'active' && status !== 'trialing') {
    throw new AppError({
      message: 'User is not subscribed',
      status: 403,
      tag,
    })
  }

  return status
}

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

export async function createUserAccount(payload: UserCreatePayload) {
  const { email, password, ...rest } = payload

  try {
    const { id: userId } = await createEmailAuthAccount(email, password)
    const authSession = await signInWithPassword(email, password)
    const { id } = await stripe.customers.create()

    await db.user.create({
      data: {
        email,
        id: userId,
        stripeCustomerId: id,
        ...rest,
      },
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

export async function updateUser(
  id: User['id'],
  data: Partial<Omit<User, 'id' | 'customerId' | 'createdAt' | 'updatedAt' | 'featureFlags'>>
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

export async function deleteUser(id: User['id']) {
  try {
    const { stripeCustomerId } = await db.user.findUniqueOrThrow({ where: { id }, select: { stripeCustomerId: true } })

    await stripe.customers.del(stripeCustomerId)
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
