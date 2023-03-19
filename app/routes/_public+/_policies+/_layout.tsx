import { Outlet } from '@remix-run/react'

const PoliciesLayout = () => (
  <article className="container prose mx-auto py-10 lg:prose-lg">
    <Outlet />
  </article>
)
export default PoliciesLayout
