import { ArrowPathIcon, TrashIcon } from '@heroicons/react/24/outline'
import { Form } from '@remix-run/react'
import { useZorm } from 'react-zorm'

import { APP_ROUTES } from '~/lib/constants'
import { tw } from '~/lib/utils'

import IntentField from '../../../../components/fields/IntentField'
import type { IHomeAction } from '../schemas'
import { DeleteTweetSchema, RegenerateTweetSchema, useIsSubmitting } from '../schemas'

function TweetActionBar({ tweetId, onDelete }: { tweetId: string; onDelete?: () => void }) {
  const zoRegen = useZorm('regenerate', RegenerateTweetSchema)
  const zoDelete = useZorm('delete', DeleteTweetSchema, { onValidSubmit: onDelete })
  const isRegenerating = useIsSubmitting('regenerate-tweet', (f) => f.get('tweetId') === tweetId)

  return (
    <div className="inline-flex items-center gap-2">
      <Form action={APP_ROUTES.HOME.href} replace method="post" ref={zoDelete.ref} className="flex items-center">
        <IntentField<IHomeAction> value="delete-tweet" />
        <input name={zoDelete.fields.tweetId()} type="hidden" value={tweetId} />
        <button className="tooltip tooltip-right" data-tip="Delete">
          <TrashIcon className="h-5 w-5" />
          <span className="sr-only">Delete</span>
        </button>
      </Form>

      <Form action={APP_ROUTES.HOME.href} replace method="post" ref={zoRegen.ref} className="flex items-center">
        <IntentField<IHomeAction> value="regenerate-tweet" />
        <input name={zoRegen.fields.tweetId()} type="hidden" value={tweetId} />
        <button className="tooltip tooltip-right" data-tip="Re-generate" disabled={isRegenerating}>
          <ArrowPathIcon className={tw('h-5 w-5', isRegenerating && 'animate-spin')} />
          <span className="sr-only">Re-generate</span>
        </button>
      </Form>
    </div>
  )
}

export default TweetActionBar
