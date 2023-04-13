import { Suspense, useEffect, useState } from 'react'
import { PencilIcon } from '@heroicons/react/20/solid'
import { ClipboardDocumentIcon } from '@heroicons/react/24/outline'
import type { FetcherWithComponents } from '@remix-run/react'
import { Await, Outlet, useFetcher, useLoaderData } from '@remix-run/react'
import type { LoaderArgs } from '@remix-run/server-runtime'
import { toast } from 'react-hot-toast'
import { useZorm } from 'react-zorm'

import { TextAreaField } from '~/components/fields'
import IntentField from '~/components/fields/IntentField'
import FormErrorCatchall from '~/components/FormErrorCatchall'
import FullscreenModal from '~/components/FullscreenModal'
import { TweetGrid, TweetGridLoading } from '~/components/TweetGrid'
import { db } from '~/database'
import { APP_ROUTES } from '~/lib/constants'
import { useIsSubmitting } from '~/lib/hooks'
import { response } from '~/lib/http.server'
import { requireAuthSession } from '~/services/auth'

import type { IActionIntent, IDeleteTranscript, IGenerateTweets, IUpdateTranscript } from './schemas'
import { DeleteTranscriptSchema, GenerateTweetsSchema, UpdateTranscriptSchema } from './schemas'

export async function loader({ request, params }: LoaderArgs) {
  const authSession = await requireAuthSession(request)
  const { userId } = authSession
  const { transcriptId } = params

  const transcript = await db.transcript.findFirst({
    where: { id: transcriptId, userId },
    select: { id: true, name: true, createdAt: true, content: true },
  })
  if (!transcript) {
    throw response.redirect(APP_ROUTES.HOME.href, { authSession })
  }

  const _tweets = db.tweet.findMany({
    where: {
      transcript: { userId, id: transcriptId },
      /** TODO add this back in if we have an ideas bin: **/
      // archived: false ,
    },
    orderBy: [{ updatedAt: 'desc' }],
    take: 100,
  })
  // NOTE: prisma does something funky with promises. Wrap in a native promise
  // see: https://github.com/remix-run/remix/issues/5153
  const tweets = Promise.resolve(_tweets)

  return response.defer({ transcript, tweets }, { authSession })
}

export { action } from './actions'

const toastId = 'transcript-loading-toast'

export default function TranscriptPage() {
  const data = useLoaderData<typeof loader>()

  const fetcher = useFetcher()
  const zoGenerate = useZorm('generate', GenerateTweetsSchema)
  const zoUpdate = useZorm('update', UpdateTranscriptSchema)
  const zoDelete = useZorm('delete', DeleteTranscriptSchema, {
    async onValidSubmit(event) {
      // Confirm with user if they want to delete
      const confirmed = confirm('This transcript and all related tweets will be deleted. Are you sure?')
      if (!confirmed) {
        event.preventDefault()
        return
      }
    },
  })
  const isSubmitting = useIsSubmitting(fetcher)

  const [showTranscript, setShowTranscript] = useState(false)

  useEffect(() => {
    if (isSubmitting) {
      let msg = 'Loading...'
      switch (fetcher.formData?.get('intent') as IActionIntent) {
        case 'generate-tweets':
          msg = 'Generating more tweets...'
          break
        case 'update-transcript':
          msg = 'Saving...'
          break
        case 'delete-transcript':
          msg = 'Deleting...'
          break
      }
      toast.loading(msg, { id: toastId })
    } else {
      toast.dismiss(toastId)
    }
  }, [isSubmitting, fetcher.formData])

  return (
    <>
      <div className="mx-auto flex w-full flex-col items-center justify-center gap-2">
        <input readOnly type="hidden" name="transcriptId" value={data.transcript.id} />

        <div className="inline-flex text-2xl font-bold">
          Viewing tweets for{' '}
          <InlineNameForm name={data.transcript.name} transcriptId={data.transcript.id} fetcher={fetcher} />
        </div>

        <div className="flex items-center justify-center gap-2">
          <fetcher.Form ref={zoGenerate.ref} method="post">
            <IntentField<IGenerateTweets> value="generate-tweets" />
            <input type="hidden" name={zoGenerate.fields.transcriptId()} value={data.transcript.id} />

            <button className="btn-outline btn-primary btn-xs btn">Generate More</button>
          </fetcher.Form>

          <button
            type="button"
            className="btn-outline btn-secondary btn-xs btn"
            onClick={() => setShowTranscript(true)}
          >
            View Transcript
          </button>

          <fetcher.Form ref={zoDelete.ref} method="post">
            <IntentField<IDeleteTranscript> value="delete-transcript" />
            <input type="hidden" name={zoGenerate.fields.transcriptId()} value={data.transcript.id} />

            <button className="btn-outline btn-error btn-xs btn">Delete</button>
          </fetcher.Form>
        </div>

        <FormErrorCatchall schema={GenerateTweetsSchema} zorm={zoGenerate} />
        <FormErrorCatchall schema={UpdateTranscriptSchema} zorm={zoUpdate} />
        <FormErrorCatchall schema={DeleteTranscriptSchema} zorm={zoDelete} />
      </div>

      <Suspense fallback={<TweetGridLoading />}>
        <Await resolve={data.tweets} errorElement={<Error />}>
          {(tweets) =>
            tweets.length === 0 ? <Empty /> : <TweetGrid isAuthed tweets={tweets} className="max-w-screen-lg" />
          }
        </Await>
      </Suspense>

      {showTranscript && (
        <FullscreenModal
          title="Transcript Preview"
          isOpen={showTranscript}
          onClose={() => setShowTranscript(false)}
          rightAction={
            <button
              type="button"
              className="btn-ghost btn-sm btn-circle btn flex items-center justify-center"
              onClick={() => {
                navigator.clipboard.writeText(data.transcript.content)
                toast.success('Copied to clipboard!')
              }}
            >
              <ClipboardDocumentIcon className="h-5 w-5" />
            </button>
          }
        >
          <TextAreaField
            id="transcript-content"
            readOnly
            rows={15}
            className="resize-none rounded text-xs"
            value={data.transcript.content}
          />
        </FullscreenModal>
      )}

      <Outlet />
    </>
  )
}

function InlineNameForm({
  name,
  transcriptId,
  fetcher,
}: {
  name: string
  transcriptId: string
  fetcher: FetcherWithComponents<any>
}) {
  const zo = useZorm('update', UpdateTranscriptSchema)

  return (
    <fetcher.Form ref={zo.ref} method="post">
      <IntentField<IUpdateTranscript> value="update-transcript" />
      <input type="hidden" name={zo.fields.transcriptId()} value={transcriptId} />

      <div className="mx-2 inline-flex items-center gap-2 border-b border-base-content/80 px-2">
        <label htmlFor="update-name" className="cursor-pointer">
          <PencilIcon className="h-5 w-5" />
        </label>
        <input
          type="text"
          id="update-name"
          name={zo.fields.name()}
          defaultValue={name}
          className="inline bg-transparent focus-visible:outline-none"
          onFocus={(e) => e.target.select()}
          onBlur={(e) => {
            if (e.target.value !== name) fetcher.submit(zo.form!)
          }}
        />
      </div>
    </fetcher.Form>
  )
}

const Empty = () => (
  <div className="mx-auto flex h-40 w-full max-w-screen-lg items-center justify-center rounded-lg bg-base-300 p-4 text-center shadow-inner">
    <h2 className="text-2xl font-bold">
      No tweets for this transcript.
      <br />
      Try generating some!
    </h2>
  </div>
)

const Error = () => (
  <div className="mx-auto flex h-40 w-full max-w-screen-lg items-center justify-center rounded-lg bg-base-300 p-4 text-center shadow-inner">
    <h2 className="text-2xl font-bold">Couldn't get data. Try reloading?</h2>
  </div>
)
