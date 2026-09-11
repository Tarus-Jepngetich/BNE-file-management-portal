import {
  useEffect,
  useState,
} from "react"

import {
  Link,
} from "react-router-dom"

import {
  UserRound,
  Search,
  LoaderCircle,
  ShieldCheck,
  Landmark,
  XCircle,
} from "lucide-react"

import { supabase } from "../lib/supabase"
import { useAuth } from "../context/AuthContext"

function Members() {
  const {
    isMainAdmin,
  } = useAuth()

  const [members, setMembers] =
    useState([])

  const [loading, setLoading] =
    useState(true)

  const [processingId, setProcessingId] =
    useState(null)

  const [error, setError] =
    useState("")

  const [message, setMessage] =
    useState("")

  const [search, setSearch] =
    useState("")

  useEffect(() => {
    fetchMembers()
  }, [])

  const fetchMembers =
    async () => {
      try {
        setLoading(true)
        setError("")

        const {
          data,
          error,
        } = await supabase
          .from("members")
          .select(`
            id,
            full_name,
            email,
            company_position,
            portal_role,
            account_status,
            account_user_id
          `)
          .order(
            "full_name",
            {
              ascending: true,
            }
          )

        if (error) {
          throw error
        }

        setMembers(
          data || []
        )
      } catch (error) {
        console.error(
          "Members error:",
          error
        )

        setError(
          error.message ||
          "Unable to load members."
        )
      } finally {
        setLoading(false)
      }
    }


  const handleAssignTreasurer =
    async (member) => {
      const confirmed =
        window.confirm(
          `Assign ${member.full_name} as the BNE Construction Treasurer?`
        )

      if (!confirmed) {
        return
      }

      try {
        setProcessingId(
          member.id
        )

        setError("")
        setMessage("")

        const {
          error,
        } = await supabase.rpc(
          "assign_treasurer",
          {
            target_member_id:
              member.id,
          }
        )

        if (error) {
          throw error
        }

        setMessage(
          `${member.full_name} is now the Treasurer.`
        )

        await fetchMembers()
      } catch (error) {
        console.error(
          "Treasurer assignment error:",
          error
        )

        setError(
          error.message ||
          "Unable to assign Treasurer."
        )
      } finally {
        setProcessingId(null)
      }
    }


  const handleRemoveTreasurer =
    async (member) => {
      const confirmed =
        window.confirm(
          `Remove ${member.full_name} from the Treasurer role?`
        )

      if (!confirmed) {
        return
      }

      try {
        setProcessingId(
          member.id
        )

        setError("")
        setMessage("")

        const {
          error,
        } = await supabase.rpc(
          "remove_treasurer",
          {
            target_member_id:
              member.id,
          }
        )

        if (error) {
          throw error
        }

        setMessage(
          `${member.full_name} is no longer the Treasurer.`
        )

        await fetchMembers()
      } catch (error) {
        console.error(
          "Remove Treasurer error:",
          error
        )

        setError(
          error.message ||
          "Unable to remove Treasurer."
        )
      } finally {
        setProcessingId(null)
      }
    }


  const filteredMembers =
    members.filter(
      (member) =>
        member.full_name
          .toLowerCase()
          .includes(
            search.toLowerCase()
          )
    )


  const treasurer =
    members.find(
      (member) =>
        member.portal_role ===
        "treasurer"
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
      <div>
        <p className="text-sm font-semibold uppercase tracking-wider text-[#9b7c3f]">
          Company
        </p>

        <h1 className="mt-1 text-3xl font-bold text-slate-900">
          Members
        </h1>

        <p className="mt-2 text-slate-500">
          BNE Construction Ltd directors and portal access.
        </p>
      </div>


      {error && (
        <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}


      {message && (
        <div className="mt-6 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          {message}
        </div>
      )}


      {isMainAdmin && (
        <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">

            <div className="flex items-center gap-4">

              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#f1eadc] text-[#9b7c3f]">
                <Landmark size={23} />
              </div>

              <div>
                <p className="text-sm text-slate-500">
                  Current Treasurer
                </p>

                <h2 className="mt-1 text-lg font-semibold text-slate-900">
                  {treasurer
                    ? treasurer.full_name
                    : "Not assigned"}
                </h2>
              </div>

            </div>

            {!treasurer && (
              <span className="rounded-full bg-amber-50 px-4 py-2 text-xs font-semibold text-amber-700">
                Treasurer required
              </span>
            )}

          </div>
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
          onChange={(event) =>
            setSearch(
              event.target.value
            )
          }
          placeholder="Search members..."
          className="w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
        />
      </div>


      <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">

        {filteredMembers.map(
          (member) => (
            <div
              key={member.id}
              className="rounded-2xl border border-slate-200 bg-white p-6"
            >

              <div className="flex items-start justify-between gap-3">

                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#f1eadc] text-[#9b7c3f]">
                  <UserRound
                    size={34}
                  />
                </div>


                {member.portal_role ===
                  "main_admin" && (
                  <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white">
                    Main Admin
                  </span>
                )}


                {member.portal_role ===
                  "treasurer" && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                    <ShieldCheck
                      size={12}
                    />

                    Treasurer
                  </span>
                )}

              </div>


              <h2 className="mt-5 text-lg font-semibold text-slate-900">
                {member.full_name}
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                {member.company_position}
              </p>


              <div className="mt-6 border-t border-slate-100 pt-5">

                <p className="text-xs uppercase tracking-wide text-slate-400">
                  Portal Account
                </p>

                <div className="mt-2 flex items-center gap-2">

                  <span
                    className={
                      member.account_status ===
                      "approved"
                        ? "h-2 w-2 rounded-full bg-green-500"
                        : "h-2 w-2 rounded-full bg-amber-400"
                    }
                  />

                  <p className="text-sm font-medium capitalize text-slate-700">
                    {member.account_status.replaceAll(
                      "_",
                      " "
                    )}
                  </p>

                </div>

              </div>


              <Link
                to={`/members/${member.id}`}
                className="mt-5 block w-full rounded-xl border border-slate-200 px-4 py-3 text-center text-sm font-semibold text-slate-700 transition hover:border-[#c5a66a] hover:text-[#9b7c3f]"
              >
                View Profile
              </Link>


              {isMainAdmin &&
                member.portal_role ===
                  "director" && (
                  <button
                    onClick={() =>
                      handleAssignTreasurer(
                        member
                      )
                    }
                    disabled={
                      member.account_status !==
                        "approved" ||
                      processingId ===
                        member.id
                    }
                    className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#c5a66a] px-4 py-3 text-sm font-semibold text-[#111315] transition hover:bg-[#d2b77d] disabled:cursor-not-allowed disabled:opacity-40"
                  >

                    {processingId ===
                    member.id ? (
                      <LoaderCircle
                        size={16}
                        className="animate-spin"
                      />
                    ) : (
                      <ShieldCheck
                        size={16}
                      />
                    )}

                    Assign Treasurer

                  </button>
                )}


              {isMainAdmin &&
                member.portal_role ===
                  "treasurer" && (
                  <button
                    onClick={() =>
                      handleRemoveTreasurer(
                        member
                      )
                    }
                    disabled={
                      processingId ===
                      member.id
                    }
                    className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-red-200 px-4 py-3 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-40"
                  >

                    {processingId ===
                    member.id ? (
                      <LoaderCircle
                        size={16}
                        className="animate-spin"
                      />
                    ) : (
                      <XCircle
                        size={16}
                      />
                    )}

                    Remove Treasurer

                  </button>
                )}

            </div>
          )
        )}

      </div>


      {filteredMembers.length ===
        0 && (
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