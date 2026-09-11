import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import {
  UserRound,
  Search,
  Plus,
  LoaderCircle,
} from "lucide-react"

import { supabase } from "../lib/supabase"

function Members() {
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [search, setSearch] = useState("")

  useEffect(() => {
    fetchMembers()
  }, [])

  const fetchMembers = async () => {
    try {
      setLoading(true)
      setError("")

      const { data, error } = await supabase
        .from("members")
        .select("*")
        .order("full_name", { ascending: true })

      if (error) {
        throw error
      }

      setMembers(data || [])
    } catch (error) {
      console.error("Error fetching members:", error)
      setError("Unable to load members.")
    } finally {
      setLoading(false)
    }
  }

  const filteredMembers = members.filter((member) =>
    member.full_name
      .toLowerCase()
      .includes(search.toLowerCase())
  )

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <LoaderCircle
            size={32}
            className="mx-auto animate-spin text-[#9b7c3f]"
          />

          <p className="mt-3 text-sm text-slate-500">
            Loading members...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">
            Members
          </h1>

          <p className="mt-2 text-slate-500">
            Manage BNE Construction Ltd members and contributions.
          </p>
        </div>

        <button className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#c5a66a] px-4 py-3 font-semibold text-[#111315] transition hover:bg-[#d2b77d]">
          <Plus size={18} />
          Add Member
        </button>
      </div>

      {error && (
        <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="mt-8 flex max-w-md items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3">
        <Search
          size={18}
          className="text-slate-400"
        />

        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search members..."
          className="w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
        />
      </div>

      <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
        {filteredMembers.map((member) => (
          <div
            key={member.id}
            className="rounded-2xl border border-slate-200 bg-white p-6"
          >
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#f1eadc] text-[#9b7c3f]">
              <UserRound size={34} />
            </div>

            <h2 className="mt-5 text-lg font-semibold text-slate-900">
              {member.full_name}
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              {member.company_position}
            </p>

            <div className="mt-3">
              {member.portal_role === "treasurer" && (
                <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                  Treasurer
                </span>
              )}

              {member.portal_role === "main_admin" && (
                <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white">
                  Main Admin
                </span>
              )}
            </div>

            <div className="mt-6 border-t border-slate-100 pt-5">
              <p className="text-xs uppercase tracking-wide text-slate-400">
                Account
              </p>

              <p className="mt-1 text-sm font-medium capitalize text-slate-700">
                {member.account_status.replaceAll("_", " ")}
              </p>
            </div>

            <Link
              to={`/members/${member.id}`}
              className="mt-5 block w-full rounded-xl border border-slate-200 px-4 py-3 text-center text-sm font-semibold text-slate-700 transition hover:border-[#c5a66a] hover:text-[#9b7c3f]"
            >
              View Profile
            </Link>
          </div>
        ))}
      </div>

      {!error && filteredMembers.length === 0 && (
        <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-12 text-center">
          <p className="text-sm text-slate-500">
            No members found.
          </p>
        </div>
      )}
    </div>
  )
}

export default Members