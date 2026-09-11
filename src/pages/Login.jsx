import { useState } from "react"
import { useNavigate } from "react-router-dom"
import {
  Eye,
  EyeOff,
  LoaderCircle,
  Building2,
} from "lucide-react"

import { supabase } from "../lib/supabase"

function Login() {
  const navigate = useNavigate()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e) => {
    e.preventDefault()

    try {
      setLoading(true)
      setError("")

      // Sign in through Supabase Authentication
      const { data, error: loginError } =
        await supabase.auth.signInWithPassword({
          email,
          password,
        })

      if (loginError) {
        throw loginError
      }

      if (!data.user) {
        throw new Error("Unable to sign in.")
      }

      // Find the BNE member connected to this account
      const { data: member, error: memberError } =
        await supabase
          .from("members")
          .select(
            `
              id,
              full_name,
              company_position,
              portal_role,
              account_status
            `
          )
          .eq("account_user_id", data.user.id)
          .maybeSingle()

      if (memberError) {
        throw memberError
      }

      if (!member) {
        await supabase.auth.signOut()

        setError(
          "This account has not been linked to a BNE Construction member."
        )

        return
      }

      if (member.account_status === "pending") {
        await supabase.auth.signOut()

        setError(
          "Your account is waiting for approval by the administrator."
        )

        return
      }

      if (member.account_status === "rejected") {
        await supabase.auth.signOut()

        setError(
          "This account request has been rejected."
        )

        return
      }

      if (member.account_status === "disabled") {
        await supabase.auth.signOut()

        setError(
          "This account has been disabled. Please contact the administrator."
        )

        return
      }

      if (member.account_status !== "approved") {
        await supabase.auth.signOut()

        setError(
          "This account does not currently have portal access."
        )

        return
      }

      navigate("/dashboard")
    } catch (error) {
      console.error("Login error:", error)

      setError(
        error.message || "Unable to sign in. Please try again."
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#111315]">
      <div className="grid min-h-screen lg:grid-cols-2">

        {/* LEFT SIDE */}
        <div className="hidden lg:flex lg:flex-col lg:justify-between p-12 border-r border-white/10">

          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#c5a66a]">
              <Building2
                size={25}
                className="text-[#111315]"
              />
            </div>

            <div>
              <h1 className="font-semibold text-white">
                BNE Construction Ltd
              </h1>

              <p className="text-sm text-slate-500">
                Management Portal
              </p>
            </div>
          </div>

          <div className="max-w-lg">
            <p className="text-sm font-medium uppercase tracking-[0.25em] text-[#c5a66a]">
              Company Management
            </p>

            <h2 className="mt-5 text-5xl font-bold leading-tight text-white">
              One secure place for BNE Construction.
            </h2>

            <p className="mt-6 max-w-md leading-7 text-slate-400">
              Manage members, contributions, projects,
              meetings and company documents.
            </p>
          </div>

          <p className="text-sm text-slate-600">
            BNE Construction Ltd
          </p>
        </div>

        {/* LOGIN SIDE */}
        <div className="flex items-center justify-center px-6 py-12">
          <div className="w-full max-w-md">

            <div className="mb-10 lg:hidden">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#c5a66a]">
                  <Building2
                    size={22}
                    className="text-[#111315]"
                  />
                </div>

                <div>
                  <h1 className="font-semibold text-white">
                    BNE Construction Ltd
                  </h1>

                  <p className="text-xs text-slate-500">
                    Management Portal
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white p-8 shadow-2xl md:p-10">

              <div>
                <p className="text-sm font-semibold text-[#9b7c3f]">
                  Welcome back
                </p>

                <h2 className="mt-2 text-3xl font-bold text-slate-900">
                  Sign in
                </h2>

                <p className="mt-2 text-sm text-slate-500">
                  Sign in to access the BNE Construction portal.
                </p>
              </div>

              {error && (
                <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              <form
                onSubmit={handleSubmit}
                className="mt-8 space-y-5"
              >

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Email Address
                  </label>

                  <input
                    type="email"
                    value={email}
                    onChange={(e) =>
                      setEmail(e.target.value)
                    }
                    placeholder="Enter your email"
                    required
                    autoComplete="email"
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#c5a66a]"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Password
                  </label>

                  <div className="relative">
                    <input
                      type={
                        showPassword
                          ? "text"
                          : "password"
                      }
                      value={password}
                      onChange={(e) =>
                        setPassword(e.target.value)
                      }
                      placeholder="Enter your password"
                      required
                      autoComplete="current-password"
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 pr-12 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#c5a66a]"
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setShowPassword(
                          (previous) => !previous
                        )
                      }
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-700"
                    >
                      {showPassword ? (
                        <EyeOff size={19} />
                      ) : (
                        <Eye size={19} />
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 text-sm text-slate-600">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-slate-300"
                    />

                    Remember me
                  </label>

                  <button
                    type="button"
                    className="text-sm font-semibold text-[#9b7c3f] hover:underline"
                  >
                    Forgot password?
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#c5a66a] px-4 py-3 font-semibold text-[#111315] transition hover:bg-[#d2b77d] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading && (
                    <LoaderCircle
                      size={18}
                      className="animate-spin"
                    />
                  )}

                  {loading
                    ? "Signing in..."
                    : "Sign In"}
                </button>
              </form>

              <div className="mt-8 border-t border-slate-100 pt-6 text-center">

  <p className="text-sm text-slate-500">
    BNE member without an account?{" "}

    <a
      href="/register"
      className="font-semibold text-[#9b7c3f] hover:underline"
    >
      Create Account
    </a>
  </p>

  <p className="mt-4 text-xs text-slate-400">
    Private portal for authorised BNE
    Construction Ltd members only.
  </p>

</div>

            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login