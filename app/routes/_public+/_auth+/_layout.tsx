import { Link, Outlet } from '@remix-run/react'

import birdfeedIcon from '~/assets/birdfeed-icon.png'

export default function AuthLayout() {
  return (
    <div className="flex min-h-full flex-col justify-center p-4 md:px-0">
      <div className="mb-10 flex justify-center">
        <Link to="/" className="inline-flex items-center gap-2">
          <img src={birdfeedIcon} alt="Birdfeed" className="mx-auto w-16" />
          <span className="text-4xl font-bold">Birdfeed</span>
        </Link>
      </div>

      <div className="mx-auto w-full max-w-md rounded-lg bg-base-100 p-4 shadow md:py-6 md:px-8">
        <Outlet />
      </div>
    </div>
  )
}
