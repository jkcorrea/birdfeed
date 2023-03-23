import { Fragment, useState } from 'react'
import { Dialog } from '@headlessui/react'
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline'
import { Form, Link, NavLink, useLoaderData } from '@remix-run/react'
import posthog from 'posthog-js'

import { APP_ROUTES, NAV_ROUTES } from '~/lib/constants'
import { tw } from '~/lib/utils'
import type { AppLayoutLoaderData } from '~/routes/_app+/_layout'

import birdfeedIcon from '~/assets/birdfeed-icon.png'

export function Navbar() {
  const { email } = useLoaderData<AppLayoutLoaderData>()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <div>
      <nav className="flex h-9 items-center justify-between p-10" aria-label="Global">
        <div className="flex items-center space-x-2 lg:min-w-0 lg:flex-1" aria-label="Global">
          <Link to="/" className="-m-1.5 flex items-center whitespace-nowrap p-1.5 text-2xl font-black">
            <img src={birdfeedIcon} alt="Birdfeed AI" className="inline h-10 w-10" /> Birdfeed
          </Link>
        </div>

        <div className="flex lg:hidden">
          <button
            type="button"
            className="-m-2.5 inline-flex items-center justify-center rounded-md p-2.5 text-gray-700"
            onClick={() => setMobileMenuOpen(true)}
          >
            <span className="sr-only">Open main menu</span>
            <Bars3Icon className="h-6 w-6" aria-hidden="true" />
          </button>
        </div>

        {email ? (
          <div className="hidden lg:flex lg:min-w-0 lg:flex-1 lg:justify-center lg:gap-x-12">
            {NAV_ROUTES.map(({ title, href }) => (
              <NavLink
                prefetch="intent"
                key={title}
                to={href}
                className={({ isActive }) =>
                  tw('font-bold text-gray-900 transition hover:text-primary', isActive && 'text-primary')
                }
              >
                {title}
              </NavLink>
            ))}
          </div>
        ) : null}

        <div className="hidden lg:flex lg:min-w-0 lg:flex-1 lg:items-center lg:justify-end lg:space-x-4">
          {email ? (
            <>
              <Form action={APP_ROUTES.LOGOUT.href} method="post">
                <button
                  onClick={() => posthog.reset()}
                  data-test-id="logout"
                  type="submit"
                  className="btn-outline btn-error btn-sm btn"
                >
                  {APP_ROUTES.LOGOUT.title}
                </button>
              </Form>
            </>
          ) : (
            <Link to={APP_ROUTES.LOGIN.href} className="btn-outline btn-sm btn">
              {APP_ROUTES.LOGIN.title}
            </Link>
          )}
        </div>
      </nav>
      <Dialog as="div" open={mobileMenuOpen} onClose={setMobileMenuOpen}>
        <Dialog.Panel className="fixed inset-0 z-10 overflow-y-auto bg-white p-6 lg:hidden">
          <div className="flex h-9 items-center justify-between">
            <div className="flex">
              <Link to="/" className="-m-1.5 p-1.5 text-2xl font-semibold text-gray-900 hover:text-gray-900">
                Birdfeed
              </Link>
            </div>
            <div className="flex">
              <button
                type="button"
                className="-m-2.5 inline-flex items-center justify-center rounded-md p-2.5 text-gray-700"
                onClick={() => setMobileMenuOpen(false)}
              >
                <span className="sr-only">Close menu</span>
                <XMarkIcon className="h-6 w-6" aria-hidden="true" />
              </button>
            </div>
          </div>
          <div className="mt-6 flow-root">
            <div className="-my-6 divide-y divide-gray-500/10">
              {email ? (
                <div className="space-y-2 py-6">
                  {NAV_ROUTES.map((item) => (
                    <NavLink
                      key={item.title}
                      to={item.href}
                      className={({ isActive }) =>
                        tw(
                          '-mx-3 block rounded-lg py-2 px-3 text-base font-semibold leading-7 text-gray-900 hover:bg-gray-400/10',
                          isActive && 'text-primary'
                        )
                      }
                    >
                      {item.title}
                    </NavLink>
                  ))}
                </div>
              ) : null}
              <div className="py-6">
                {email ? (
                  <>
                    <span className="text-base font-light">{email}</span>

                    <Form action="/logout" method="post">
                      <button
                        onClick={() => posthog.reset()}
                        data-test-id="logout"
                        type="submit"
                        className="-mx-3 block rounded-lg py-2.5 px-3 text-base font-semibold leading-6 text-error"
                      >
                        Log out
                      </button>
                    </Form>
                  </>
                ) : (
                  <Link
                    to="/login"
                    className="-mx-3 block rounded-lg py-2.5 px-3 text-base font-semibold leading-6 text-gray-900 hover:bg-gray-400/10"
                  >
                    Log in
                  </Link>
                )}
              </div>
            </div>
          </div>
        </Dialog.Panel>
      </Dialog>
    </div>
  )
}
