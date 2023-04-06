import type { ActionArgs } from '@remix-run/node'
import { z } from 'zod'

import { TokenType } from '@prisma/client'
import { db } from '~/database'
import { STRIPE_ENDPOINT_SECRET } from '~/lib/env'
import { response } from '~/lib/http.server'
import { AppError, getGuardedToken, parseData, sendSlackEventMessage } from '~/lib/utils'
import { stripe } from '~/services/billing'

const tag = 'Stripe webhook 🎣'

async function getStripeEvent(request: Request) {
  try {
    // Get the signature sent by Stripe
    const signature = request.headers.get('stripe-signature')

    if (!signature) {
      throw new AppError({
        cause: null,
        message: 'Missing Stripe signature',
        tag,
      })
    }

    const stripePayload = await request.text()

    const event = stripe.webhooks.constructEvent(stripePayload, signature, STRIPE_ENDPOINT_SECRET)

    return event
  } catch (cause) {
    throw response.error(
      new AppError({
        cause,
        message: 'Unable to construct Strip event',
        tag,
      }),
      { authSession: null }
    )
  }
}

export async function action({ request }: ActionArgs) {
  const event = await getStripeEvent(request)
  const eventId = event.id

  try {
    switch (event.type) {
      case 'customer.subscription.created': {
        const { id: stripeId, metadata: stripeMetadata } = await parseData(
          event.data.object,
          z.object({
            id: z.string(),
            metadata: z.object({
              token: z.string(),
              tokenType: z.nativeEnum(TokenType),
            }),
          }),
          `${event.type} payload is malformed`
        )

        const { token, tokenType } = stripeMetadata

        const { metadata, id } = await getGuardedToken({
          token_type: {
            token,
            type: tokenType,
          },
        })

        await db.token.update({
          where: {
            id,
          },
          data: {
            active: true,
            metadata: {
              ...metadata,
              stripeSubscriptionId: stripeId,
            },
          },
        })

        return response.ok({}, { authSession: null })
      }
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const {
          customer: stripeCustomerId,
          status,
          cancel_at_period_end,
        } = await parseData(
          event.data.object,
          z.object({
            customer: z.string(),
            status: z.string(),
            cancel_at_period_end: z.boolean(),
          }),
          `${event.type} payload is malformed`
        )

        const user = await db.user.findUnique({
          where: {
            customerId: stripeCustomerId,
          },
          select: {
            email: true,
          },
        })

        sendSlackEventMessage(
          `Subscription ${event.type.split('.')[2]} for ${user?.email || 'unknown user'} 
          
          Status: ${status}
          Cancel at period end: ${cancel_at_period_end}`
        )

        return response.ok({}, { authSession: null })
      }

      default:
        return response.ok({}, { authSession: null })
    }
  } catch (cause) {
    const reason = new AppError({
      cause,
      message: 'An error occurred while handling Stripe webhook',
      metadata: { eventId },
      tag,
    })

    return response.error(reason, { authSession: null })
  }
}
