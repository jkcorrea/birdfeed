import { Fragment, useEffect, useState } from 'react'
import { Transition } from '@headlessui/react'
import { XCircleIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { useFetchers } from '@remix-run/react'

import type { CatchResponse } from '~/lib/http.server'

export function NotifyError() {
  const [show, setShow] = useState(false)
  const fetchers = useFetchers()

  const error = fetchers.map((f) => (f.data as CatchResponse | null)?.error)[0]

  useEffect(() => {
    if (error) {
      setShow(true)
    } else {
      setShow(false)
    }
  }, [error])

  return (
    <>
      <div
        aria-live="assertive"
        className="pointer-events-none fixed inset-0 z-50 flex items-end px-4 py-6 sm:items-start sm:p-6"
      >
        <div className="flex w-full flex-col items-center space-y-4 sm:items-end">
          <Transition
            show={show}
            as={Fragment}
            enter="transform ease-out duration-300 transition"
            enterFrom="translate-y-2 opacity-0 sm:translate-y-0 sm:translate-x-2"
            enterTo="translate-y-0 opacity-100 sm:translate-x-0"
            leave="transition ease-in duration-100"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="pointer-events-auto w-full max-w-sm overflow-hidden rounded-lg bg-white shadow-lg ring-1 ring-black/5">
              <div className="p-4">
                <div className="flex items-start">
                  <div className="shrink-0">
                    <XCircleIcon className="h-6 w-6 text-red-400" aria-hidden="true" />
                  </div>
                  <div className="ml-3 w-0 flex-1 pt-0.5">
                    <p className="text-sm font-medium text-gray-900">An error occurred 😫</p>
                    <p className="mt-1 text-sm text-gray-500">{error?.message}</p>
                    {error?.traceId ? <p className="mt-1 text-sm text-gray-500">TraceId: {error.traceId}</p> : null}
                    {error?.metadata ? (
                      <p className="mt-1 text-sm text-gray-500">
                        <span>Metadata:</span>
                        <pre className="overflow-x-auto text-xs">{JSON.stringify(error.metadata, null, 2)}</pre>
                      </p>
                    ) : null}
                  </div>
                  <div className="ml-4 flex shrink-0">
                    <button
                      type="button"
                      className="inline-flex rounded-md bg-white text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 hover:text-gray-500"
                      onClick={() => {
                        setShow(false)
                      }}
                    >
                      <span className="sr-only">Close</span>
                      <XMarkIcon className="h-5 w-5" aria-hidden="true" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </Transition>
        </div>
      </div>
    </>
  )
}
