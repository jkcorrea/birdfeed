import { Link, Outlet, useLocation, useSearchParams } from '@remix-run/react'

import animalsHello from 'public/animals_hello.png'
import animalsHooray from 'public/animals_hooray.png'

export default function AuthLayout() {
  const { pathname } = useLocation()
  const step = Number(pathname.split('/').filter(Boolean).pop())
  const [searchParams] = useSearchParams()

  return (
    <main className="flex h-fit min-h-screen flex-row items-center justify-center ">
      <section>
        <div className="m-auto w-full max-w-md rounded-lg bg-base-100 p-8 shadow-xl">
          <Link to="/">
            <img src={step >= 2 ? animalsHooray : animalsHello} alt="greeting animals" className="-ml-2 mb-6 w-fit " />
          </Link>
          <Outlet />
          <div className="mt-6 text-center text-sm text-gray-500">
            Already have an account?{' '}
            <Link
              className="link-info link"
              to={{
                pathname: '/login',
                search: searchParams.toString(),
              }}
            >
              Log in
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}
