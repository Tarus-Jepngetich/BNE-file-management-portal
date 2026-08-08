import { useState } from "react"
import { useNavigate } from "react-router-dom"

function Login() {
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()

    // Temporary navigation until backend authentication is added
    navigate("/dashboard")
  }

  return (
    <div className="min-h-screen bg-[#111315] flex items-center justify-center px-6">
      <div className="w-full max-w-md">
        <div className="mb-10 text-center">
          

          <h1 className="text-3xl font-semibold tracking-tight text-white">
            BNE Construction Ltd
          </h1>

          <p className="mt-3 text-sm text-slate-400">
            Company Management Portal
          </p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-[#181b1e] p-8 shadow-2xl">
          <div className="mb-7">
            <h2 className="text-xl font-semibold text-white">
              Sign in
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-400">
              Access company members, meetings, projects and documents.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-medium text-slate-300"
              >
                Email address
              </label>

              <input
                id="email"
                type="email"
                placeholder="name@bneconstruction.com"
                className="w-full rounded-xl border border-white/10 bg-[#101214] px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-[#c5a66a]"
                required
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-2 block text-sm font-medium text-slate-300"
              >
                Password
              </label>

              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  className="w-full rounded-xl border border-white/10 bg-[#101214] px-4 py-3 pr-20 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-[#c5a66a]"
                  required
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-medium text-[#c5a66a] hover:text-[#ddc38d]"
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 text-slate-400">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-white/20 bg-transparent accent-[#c5a66a]"
                />
                Remember me
              </label>

              <button
                type="button"
                className="text-[#c5a66a] transition hover:text-[#ddc38d]"
              >
                Forgot password?
              </button>
            </div>

            <button
              type="submit"
              className="w-full rounded-xl bg-[#c5a66a] px-4 py-3 font-semibold text-[#111315] transition hover:bg-[#d2b77d]"
            >
              Sign In
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-xs text-slate-600">
          Private access for authorised BNE Construction Ltd members only.
        </p>
      </div>
    </div>
  )
}

export default Login 