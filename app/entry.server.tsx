import { PassThrough } from 'stream'

import type { HandleDataRequestFunction, HandleDocumentRequestFunction } from '@remix-run/node'
import { Response } from '@remix-run/node'
import { RemixServer } from '@remix-run/react'
import etag from 'etag'
import isbot from 'isbot'
import { renderToPipeableStream } from 'react-dom/server'
import { getClientLocales } from 'remix-utils'

import { NODE_ENV } from './lib/env'
import { LocaleProvider } from './lib/locale-provider'
import { getCookie, Logger } from './lib/utils'

const ABORT_DELAY = 5000

const handleRequest: HandleDocumentRequestFunction = (request, responseStatusCode, responseHeaders, remixContext) => {
  const locales = getClientLocales(request)
  const timeZone = getCookie('timeZone', request.headers) || 'UTC'

  const callbackName = isbot(request.headers.get('user-agent')) ? 'onAllReady' : 'onShellReady'

  if (NODE_ENV !== 'production') {
    // just flat out disable caching in dev to prevent any weird issues
    responseHeaders.set('Cache-Control', 'no-store')
  }

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

export default handleRequest

export const handleDataRequest: HandleDataRequestFunction = async (response, { request }) => {
  const body = await response.clone().text()
  const isGet = request.method.toLowerCase() === 'get'
  const purpose =
    request.headers.get('Purpose') ||
    request.headers.get('X-Purpose') ||
    request.headers.get('Sec-Purpose') ||
    request.headers.get('Sec-Fetch-Purpose') ||
    request.headers.get('Moz-Purpose')
  const isPrefetch = purpose === 'prefetch'

  // We can do some caching magic for GET data requests
  if (isGet) {
    // Prevents duplicate prefetch requests
    if (isPrefetch && !response.headers.has('Cache-Control')) {
      // we will cache for 5 seconds only on the browser
      response.headers.set('Cache-Control', 'private, max-age=5')
    }

    response.headers.set('etag', etag(body))
    // As with document requests, check the `If-None-Match` header
    // and compare it with the Etag, if they match, send the empty 304 Response
    if (request.headers.get('If-None-Match') === response.headers.get('ETag')) {
      return new Response('', { status: 304, headers: response.headers })
    }
  }

  return response
}
