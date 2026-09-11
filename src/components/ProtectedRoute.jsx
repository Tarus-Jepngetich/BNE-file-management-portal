import {
  Navigate,
  Outlet,
} from "react-router-dom"

import {
  LoaderCircle,
  ShieldX,
} from "lucide-react"

import { useAuth } from "../context/AuthContext"

function ProtectedRoute() {
  const {
    user,
    member,
    loading,
    isApproved,
  } = useAuth()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#111315]">

        <div className="text-center">

          <LoaderCircle
            size={36}
            className="mx-auto animate-spin text-[#c5a66a]"
          />

          <p className="mt-4 text-sm text-slate-400">
            Checking portal access...
          </p>

        </div>

      </div>
    )
  }

  // No Supabase login
  if (!user) {
    return (
      <Navigate
        to="/"
        replace
      />
    )
  }

  // Logged in but not connected
  // to a BNE member profile
  if (!member) {
    return (
      <AccessDenied
        title="Account not linked"
        message="Your login account is not linked to a BNE Construction member profile."
      />
    )
  }

  // Account exists but is not approved
  if (!isApproved) {
    return (
      <AccessDenied
        title="Access pending"
        message="Your account has not yet been approved for portal access."
      />
    )
  }

  return <Outlet />
}

function AccessDenied({
  title,
  message,
}) {
  const { signOut } = useAuth()

  const handleSignOut = async () => {
    await signOut()
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#111315] px-6">

      <div className="w-full max-w-md rounded-3xl bg-white p-10 text-center">

        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-50">
          <ShieldX
            size={30}
            className="text-red-500"
          />
        </div>

        <h1 className="mt-6 text-2xl font-bold text-slate-900">
          {title}
        </h1>

        <p className="mt-3 leading-7 text-slate-500">
          {message}
        </p>

        <button
          onClick={handleSignOut}
          className="mt-8 rounded-xl bg-[#c5a66a] px-6 py-3 font-semibold text-[#111315]"
        >
          Back to Sign In
        </button>

      </div>

    </div>
  )
}

export default ProtectedRoute