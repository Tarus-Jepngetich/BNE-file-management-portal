import { useState } from "react"
import { Link } from "react-router-dom"
import {
  Building2,
  Eye,
  EyeOff,
  LoaderCircle,
  CheckCircle2,
} from "lucide-react"

import { supabase } from "../lib/supabase"

function Register() {
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] =
    useState("")

  const [showPassword, setShowPassword] =
    useState(false)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()

    try {
      setError("")

      if (!fullName.trim()) {
        setError("Please enter your full name.")
        return
      }

      if (password.length < 8) {
        setError(
          "Your password must be at least 8 characters."
        )
        return
      }

      if (password !== confirmPassword) {
        setError("The passwords do not match.")
        return
      }

      setLoading(true)

      const { error: signUpError } =
        await supabase.auth.signUp({
          email: email.trim(),
          password,

          options: {
            data: {
              full_name: fullName.trim(),
            },
          },
        })

      if (signUpError) {
        throw signUpError
      }

      // We deliberately do not navigate to the dashboard.
      // Registration must first be approved by Main Admin.
      await supabase.auth.signOut()

      setSuccess(true)
    } catch (error) {
      console.error("Registration error:", error)

      setError(
        error.message ||
          "Unable to create your account."
      )
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#111315] px-6">
        <div className="w-full max-w-lg rounded-3xl bg-white p-10 text-center shadow-2xl">

          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-50">
            <CheckCircle2
              size={34}
              className="text-green-600"
            />
          </div>

          <h1 className="mt-6 text-2xl font-bold text-slate-900">
            Account request submitted
          </h1>

          <p className="mt-3 leading-7 text-slate-500">
            Your BNE Construction portal account has
            been created and is waiting for approval
            from the administrator.
          </p>

          <p className="mt-4 text-sm text-slate-500">
            Once your account has been approved and
            linked to your member profile, you will be
            able to sign in.
          </p>

          <Link
            to="/"
            className="mt-8 inline-flex rounded-xl bg-[#c5a66a] px-6 py-3 font-semibold text-[#111315] transition hover:bg-[#d2b77d]"
          >
            Back to Sign In
          </Link>

        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#111315]">
      <div className="grid min-h-screen lg:grid-cols-2">

        {/* LEFT */}
        <div className="hidden border-r border-white/10 p-12 lg:flex lg:flex-col lg:justify-between">

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
              Member Registration
            </p>

            <h2 className="mt-5 text-5xl font-bold leading-tight text-white">
              Create your portal account.
            </h2>

            <p className="mt-6 max-w-md leading-7 text-slate-400">
              Registration is available to BNE
              Construction Ltd members. Every new
              account must be approved before access
              is granted.
            </p>
          </div>

          <p className="text-sm text-slate-600">
            BNE Construction Ltd
          </p>
        </div>

        {/* FORM */}
        <div className="flex items-center justify-center px-6 py-12">

          <div className="w-full max-w-md">

            <div className="rounded-3xl border border-white/10 bg-white p-8 shadow-2xl md:p-10">

              <div>
                <p className="text-sm font-semibold text-[#9b7c3f]">
                  BNE Members
                </p>

                <h2 className="mt-2 text-3xl font-bold text-slate-900">
                  Create Account
                </h2>

                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Your account will require administrator
                  approval before you can access the portal.
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
                    Full Name
                  </label>

                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) =>
                      setFullName(e.target.value)
                    }
                    placeholder="Enter your full name"
                    required
                    autoComplete="name"
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-[#c5a66a]"
                  />
                </div>

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
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-[#c5a66a]"
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
                      placeholder="Minimum 8 characters"
                      required
                      minLength="8"
                      autoComplete="new-password"
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 pr-12 text-sm outline-none transition focus:border-[#c5a66a]"
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setShowPassword(
                          (previous) => !previous
                        )
                      }
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
                    >
                      {showPassword ? (
                        <EyeOff size={19} />
                      ) : (
                        <Eye size={19} />
                      )}
                    </button>

                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Confirm Password
                  </label>

                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) =>
                      setConfirmPassword(e.target.value)
                    }
                    placeholder="Enter password again"
                    required
                    autoComplete="new-password"
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-[#c5a66a]"
                  />
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
                    ? "Creating account..."
                    : "Create Account"}
                </button>

              </form>

              <div className="mt-7 border-t border-slate-100 pt-6 text-center">

                <p className="text-sm text-slate-500">
                  Already have an account?{" "}

                  <Link
                    to="/"
                    className="font-semibold text-[#9b7c3f] hover:underline"
                  >
                    Sign In
                  </Link>
                </p>

              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Register