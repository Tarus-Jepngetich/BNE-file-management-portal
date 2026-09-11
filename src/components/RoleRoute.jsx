import { Outlet } from "react-router-dom"
import { ShieldX } from "lucide-react"

import { useAuth } from "../context/AuthContext"

function RoleRoute({
  allowedRoles,
}) {
  const {
    member,
  } = useAuth()

  if (
    !allowedRoles.includes(
      member?.portal_role
    )
  ) {
    return (
      <div className="flex min-h-[500px] items-center justify-center">
        <div className="max-w-md rounded-2xl border border-red-200 bg-white p-10 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-50">
            <ShieldX
              size={27}
              className="text-red-500"
            />
          </div>

          <h1 className="mt-5 text-xl font-bold text-slate-900">
            Access Denied
          </h1>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            Your portal role does not have permission to access this page.
          </p>
        </div>
      </div>
    )
  }

  return <Outlet />
}

export default RoleRoute