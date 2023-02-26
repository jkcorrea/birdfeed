import { PassThrough } from 'stream'

import type { EntryContext } from '@remix-run/node'
import { Response } from '@remix-run/node'
import { RemixServer } from '@remix-run/react'
import isbot from 'isbot'
import { renderToPipeableStream } from 'react-dom/server'
import { getClientLocales } from 'remix-utils'

import { LocaleProvider } from './lib/locale-provider'
import { getCookie, Logger } from './lib/utils'

const ABORT_DELAY = 5000

export default function handleRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  remixContext: EntryContext
) {
  const locales = getClientLocales(request)
  const timeZone = getCookie('timeZone', request.headers) || 'UTC'

  const callbackName = isbot(request.headers.get('user-agent')) ? 'onAllReady' : 'onShellReady'

  return new Promise((resolve, reject) => {
    let didError = false

    const { pipe, abort } = renderToPipeableStream(
      <LocaleProvider locales={locales} timeZone={timeZone}>
        <RemixServer context={remixContext} url={request.url} />
      </LocaleProvider>,
      {
        [callbackName]() {
          const body = new PassThrough()

          responseHeaders.set('Content-Type', 'text/html')

          resolve(
            new Response(body, {
              status: didError ? 500 : responseStatusCode,
              headers: responseHeaders,
            })
          )
          pipe(body)
        },
        onShellError(err: unknown) {
          reject(err)
        },
        onError(error: unknown) {
          didError = true
          Logger.error(error)
        },
      }
    )
    setTimeout(abort, ABORT_DELAY)
  })
}
