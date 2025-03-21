import { Fragment, useEffect, useState } from 'react'
import { Dialog } from '@headlessui/react'
import { Bars3Icon, ChevronDownIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { Form, Link, NavLink, Outlet, useFetcher, useLoaderData, useLocation } from '@remix-run/react'
import type { LoaderArgs } from '@remix-run/server-runtime'
import { posthog } from 'posthog-js'
import type { DetailedHTMLProps, FC } from 'react'
import { toast } from 'react-hot-toast'

import { useSubscribeModal } from '~/components/SubscribeModal'
import { UserProvider } from '~/components/UserContext'
import { db } from '~/database'
import { APP_ROUTES, NAV_ROUTES } from '~/lib/constants'
import { NODE_ENV } from '~/lib/env'
import { getUserFeature, UserFeatureFlag } from '~/lib/feature-flags'
import { useIsSubmitting } from '~/lib/hooks'
import { response } from '~/lib/http.server'
import { celebrate, tw } from '~/lib/utils'
import { isAnonymousSession, requireAuthSession } from '~/services/auth'
import { userSubscriptionStatus } from '~/services/user'

import birdfeedIcon from '~/assets/birdfeed-icon.png'

export async function loader({ request }: LoaderArgs) {
  try {
    const isAnonymous = await isAnonymousSession(request)

    if (isAnonymous) {
      return response.redirect('/', { authSession: null })
    }

    const authSession = await requireAuthSession(request)
    const { userId } = authSession

    const user = await db.user.findUniqueOrThrow({ where: { id: userId } })
    const showNavRoutes = getUserFeature(user, UserFeatureFlag.Enum.IDEAS_BIN)
    const status = await userSubscriptionStatus(user)

    return response.ok(
      {
        activeUser: user,
        status,
        showNavRoutes,
      },
      { authSession }
    )
  } catch (cause) {
    throw response.error(cause, { authSession: null })
  }
}

export default function AppLayout() {
  const location = useLocation()
  const { activeUser, status, showNavRoutes } = useLoaderData<typeof loader>()

  useEffect(() => {
    if (NODE_ENV === 'production') {
      posthog.capture('$pageview')
      posthog.identify(activeUser.email)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.key])

  const { open: openSubscribeModal } = useSubscribeModal()
  const [hasClosedModal, setHasClosedModal] = useState(false) // dont be annoying with the modal popups..
  useEffect(() => {
    if (!hasClosedModal && status !== 'active' && status !== 'trialing') {
      openSubscribeModal('signup', 'automatic', () => {
        setHasClosedModal(true)
      })
    }
  }, [status, hasClosedModal, openSubscribeModal])

  const loc = useLocation()
  useEffect(() => {
    if (loc.hash === '#success') {
      toast.success('Success! Thank you for subscribing!', { id: 'checkout-success' })
      celebrate()
      window.location.hash = ''
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <UserProvider activeUser={{ status, activeUser }}>
      <Navbar showNavRoutes={Boolean(showNavRoutes)} key={location.key} />

      <main className="container mx-auto min-h-[500px] w-full min-w-[300px] max-w-screen-lg grow py-4 px-8 md:px-4 lg:mt-5 2xl:px-0">
        <Outlet />
      </main>
    </UserProvider>
  )
}

function PlanBadge() {
  const { status } = useLoaderData<typeof loader>()
  const { open: openSubscribeModal } = useSubscribeModal()

  switch (status) {
    case 'active':
    case 'trialing':
      // eslint-disable-next-line prettier/prettier
      return <button className="badge-primary badge-outline badge badge-sm uppercase">Pro Plan</button>
    default:
      return (
        <button
          onClick={() => openSubscribeModal('signup', 'badge_click')}
          // eslint-disable-next-line prettier/prettier
          className="badge-accent badge badge-sm font-black uppercase"
        >
          Free Plan
        </button>
      )
  }
}

function Navbar({ showNavRoutes = false }: { showNavRoutes?: boolean }) {
  const { activeUser } = useLoaderData<typeof loader>()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <div>
      <nav className="mx-auto flex h-9 max-w-screen-xl items-center justify-between p-10" aria-label="Global">
        <div className="flex items-center space-x-2 lg:min-w-0 lg:flex-1" aria-label="Global">
          <Link
            to={APP_ROUTES.HOME.href}
            className="-m-1.5 flex items-center whitespace-nowrap p-1.5 text-2xl font-black"
          >
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

        <div className="hidden lg:flex lg:min-w-0 lg:flex-1 lg:justify-center lg:gap-x-12">
          {showNavRoutes &&
            NAV_ROUTES.map(({ title, href }) => (
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

        <div className="hidden gap-2 lg:flex lg:min-w-0 lg:flex-1 lg:items-center lg:justify-end">
          <PlanBadge />
          <div className="dropdown-end dropdown">
            <label tabIndex={0} className="btn-ghost btn-sm btn inline-flex items-center gap-2 normal-case">
              <span className="text-base ">{activeUser.email}</span>
              <ChevronDownIcon className="h-4 w-4" />
            </label>
            <DropdownActions />
          </div>
        </div>
      </nav>

      {/* Mobile dialog */}
      <Dialog as="div" open={mobileMenuOpen} onClose={setMobileMenuOpen}>
        <Dialog.Panel className="fixed inset-0 z-10 overflow-y-auto bg-white p-6 lg:hidden">
          <div className="flex h-9 items-center justify-between">
            <div className="flex">
              <Link
                to={APP_ROUTES.HOME.href}
                className="-m-1.5 p-1.5 text-2xl font-semibold text-gray-900 hover:text-gray-900"
              >
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
            <div className="space-y-3 py-6">
              {NAV_ROUTES.map((item) => (
                <NavLink
                  key={item.title}
                  to={item.href}
                  className={({ isActive }) =>
                    tw('block text-xl font-bold text-gray-900 transition', isActive && 'text-primary')
                  }
                >
                  {item.title}
                </NavLink>
              ))}
            </div>

            <div className="divider" />

            <>
              <span className="text-xl font-light opacity-75">{activeUser.email}</span> <PlanBadge />
              <DropdownActions isMobile />
            </>
          </div>
        </Dialog.Panel>
      </Dialog>
    </div>
  )
}

// eslint-disable-next-line unused-imports/no-unused-vars
const DropdownButton: FC<
  DetailedHTMLProps<React.ButtonHTMLAttributes<HTMLButtonElement>, HTMLButtonElement> & { isMobile?: boolean }
> = ({ children, isMobile, ...props }) => (
  <button
    type="submit"
    {...props}
    className={tw('w-full rounded-full py-2 text-left hover:bg-base-300', !isMobile && 'px-3.5', props.className)}
  >
    {children}
  </button>
)

function DropdownActions({ isMobile }: { isMobile?: boolean }) {
  const portalFetcher = useFetcher()
  const isFetchingPortal = useIsSubmitting(portalFetcher)

  return (
    <ul
      tabIndex={0}
      className={tw(
        isMobile ? 'my-4 flex flex-col gap-4 text-xl' : 'dropdown-content rounded-box mt-3 w-64 bg-base-100 p-2 shadow'
      )}
    >
      <li>
        <portalFetcher.Form method="post" action="/api/billing/customer-portal">
          <DropdownButton disabled={isFetchingPortal} onClick={() => toast.loading('Redirecting...')}>
            💳 Manage subscription
          </DropdownButton>
        </portalFetcher.Form>
      </li>
      <li>
        <Form
          action="/api/delete-account"
          method="post"
          onSubmit={(e) => {
            if (!confirm('Are you sure you want to delete your account?\n\nThis action is PERMANENT!')) {
              e.preventDefault()
            }
          }}
        >
          <DropdownButton>🥲 Delete my account</DropdownButton>
        </Form>
      </li>
      <li className={tw(isMobile ? 'mt-8 text-center' : 'mt-3 ')}>
        <Form action={APP_ROUTES.LOGOUT.href} method="post">
          <DropdownButton onClick={() => posthog.reset()} data-test-id="logout" className="font-medium text-error">
            {APP_ROUTES.LOGOUT.title}
          </DropdownButton>
        </Form>
      </li>
    </ul>
  )
}
