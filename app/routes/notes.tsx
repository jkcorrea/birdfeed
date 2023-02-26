import { CloudArrowUpIcon, TrashIcon } from '@heroicons/react/24/outline'
import type { ActionArgs, LoaderArgs } from '@remix-run/node'
import { Form, useActionData, useFetcher, useLoaderData, useTransition } from '@remix-run/react'
import { parseFormAny, useZorm } from 'react-zorm'
import { z } from 'zod'

import { Button, ButtonLink } from '~/components'
import { response } from '~/lib/http.server'
import { AppError, isFormProcessing, parseData, tw } from '~/lib/utils'
import { requireAuthSession } from '~/modules/auth'
import { createNote, deleteNote, getNotes, updateNote } from '~/modules/note'
import { getUserTierLimit } from '~/modules/user'

/**
 * This route is just a simple example to show how to use tier limits
 *
 */

export async function loader({ request }: LoaderArgs) {
  const authSession = await requireAuthSession(request)
  const { userId } = authSession

  try {
    const [notes, { maxUsage }] = await Promise.all([getNotes({ userId }), getUserTierLimit(userId)])

    return response.ok(
      {
        notes,
        isUsageMaxed: Boolean(maxUsage && notes.length >= maxUsage),
        maxUsage,
      },
      { authSession }
    )
  } catch (cause) {
    throw response.error(cause, { authSession })
  }
}

const NoteFormSchema = z.object({
  content: z.string().trim().min(1),
})

export async function action({ request }: ActionArgs) {
  const authSession = await requireAuthSession(request)
  const { userId } = authSession

  try {
    switch (request.method.toLowerCase()) {
      case 'post': {
        const payload = await parseData(parseFormAny(await request.formData()), NoteFormSchema, 'Payload is invalid')

        const [notes, { maxUsage }] = await Promise.all([getNotes({ userId }), getUserTierLimit(userId)])

        if (maxUsage && notes.length >= maxUsage) {
          throw new AppError({
            message: 'Account limit reached',
            metadata: {
              userId,
              maxUsage,
              notesCount: notes.length,
            },
          })
        }

        const { content } = payload

        const createResult = await createNote({
          userId,
          content,
        })

        return response.ok(createResult, { authSession })
      }
      case 'patch': {
        const payload = await parseData(
          parseFormAny(await request.formData()),
          NoteFormSchema.extend({
            id: z.string(),
          }),
          'Payload is invalid'
        )

        const { content, id } = payload

        const updateResult = await updateNote({
          userId,
          content,
          id,
        })

        return response.ok(updateResult, { authSession })
      }
      case 'delete': {
        const payload = await parseData(
          parseFormAny(await request.formData()),
          z.object({
            id: z.string(),
          }),
          'Payload is invalid'
        )

        const { id } = payload

        const deleteResult = await deleteNote({ id, userId })

        return response.ok(deleteResult, { authSession })
      }
      default: {
        return response.error(
          new AppError({
            message: 'Invalid HTTP method',
          }),
          { authSession }
        )
      }
    }
  } catch (cause) {
    return response.error(cause, { authSession })
  }
}

export default function App() {
  const { notes, isUsageMaxed, maxUsage } = useLoaderData<typeof loader>()
  const actionData = useActionData<typeof action>()
  const zo = useZorm('New note', NoteFormSchema)

  const transition = useTransition()
  const isProcessing = isFormProcessing(transition.state)

  return (
    <div className="flex flex-col gap-y-10">
      Transcriptions: {notes.length}/{maxUsage ? maxUsage : '∞'}
      <div className="min-w-0 flex-1">
        <Form key={!actionData?.error ? actionData?.id : 'new-post'} ref={zo.ref} method="post" className="relative">
          <div
            className={tw(
              'overflow-hidden rounded-lg border-2 border-white bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 focus-within:border-black focus-within:ring-1 focus-within:ring-black',
              isUsageMaxed && 'opacity-25'
            )}
          >
            <label htmlFor="comment" className="sr-only">
              Create a Birdfeed
            </label>
            <textarea
              minLength={1}
              rows={2}
              name={zo.fields.content()}
              className="block w-full resize-none border-0 bg-transparent py-3 text-xl text-white placeholder:text-white focus:ring-0"
              placeholder="Add your Birdfeed..."
              disabled={isProcessing || isUsageMaxed}
            />

            <div className="flex justify-end p-3">
              <Button disabled={isProcessing || isUsageMaxed}>{isProcessing ? 'Creating...' : 'Create'}</Button>
            </div>
          </div>
          {isUsageMaxed ? (
            <ButtonLink to="/subscription" className="absolute inset-0 flex items-center justify-center p-3">
              <span className="rounded-md p-3 text-center text-xl font-bold text-white">
                Upgrade your plan to create more Birdfeeds
              </span>
            </ButtonLink>
          ) : null}
        </Form>
        {zo.errors.content()?.message && (
          <div className="pt-1 text-red-700" id="email-error">
            {zo.errors.content()?.message}
          </div>
        )}
      </div>
      <ul className="flex flex-col gap-y-4">
        {notes.map(({ id, content }) => (
          <Note key={id} id={id} content={content} />
        ))}
      </ul>
    </div>
  )
}

function Note({ id, content }: { id: string; content: string }) {
  const noteFetcher = useFetcher<typeof action>()
  const isUpdating = isFormProcessing(noteFetcher.state)

  return (
    <div className="relative">
      <div
        className={tw(
          'overflow-hidden whitespace-pre rounded-lg border-2 border-white bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 p-3 text-white focus-within:border-black focus-within:ring-1 focus-within:ring-black',
          isUpdating && 'opacity-50'
        )}
      >
        <p
          key={id}
          className={'block w-full resize-none border-0 py-3 text-lg focus:outline-none'}
          contentEditable={!isUpdating}
          suppressContentEditableWarning
          onBlur={(e) => {
            const updatedContent = e.target.textContent ?? ''

            if (content === updatedContent) return

            noteFetcher.submit(
              {
                content: updatedContent,
                id,
              },
              { method: 'patch' }
            )
          }}
        >
          {content}
        </p>
        <div className="flex justify-end">
          <button disabled={isUpdating} className="btn-ghost btn-square btn">
            <TrashIcon
              className="h-6 w-6 stroke-2"
              onClick={() => {
                noteFetcher.submit(
                  {
                    id,
                  },
                  { method: 'delete' }
                )
              }}
            />
          </button>
          <button disabled={isUpdating} className="btn-ghost btn-square btn">
            <TrashIcon
              className="h-6 w-6 stroke-2"
              onClick={() => {
                noteFetcher.submit(
                  {
                    id,
                  },
                  { method: 'delete' }
                )
              }}
            />
          </button>
        </div>
      </div>
      {isUpdating ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
          <CloudArrowUpIcon className="h-12 w-12 stroke-2" />
          <span>Saving ...</span>
        </div>
      ) : null}
    </div>
  )
}
