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
  UserX,
  UserCheck,
  CircleCheck,
  CircleAlert,
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

  const [processingAction, setProcessingAction] =
    useState("")

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


  const beginProcessing = (
    memberId,
    action
  ) => {
    setProcessingId(memberId)
    setProcessingAction(action)
    setError("")
    setMessage("")
  }


  const finishProcessing = () => {
    setProcessingId(null)
    setProcessingAction("")
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
        beginProcessing(
          member.id,
          "assign_treasurer"
        )

        const {
          error,
        } = await supabase.rpc(
          "assign_treasurer",
          {
            p_member_id:
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
        finishProcessing()
      }
    }


  const handleRemoveTreasurer =
    async (member) => {
      const confirmed =
        window.confirm(
          `Remove ${member.full_name} from the Treasurer role? They will remain an approved Director.`
        )

      if (!confirmed) {
        return
      }

      try {
        beginProcessing(
          member.id,
          "remove_treasurer"
        )

        const {
          error,
        } = await supabase.rpc(
          "remove_treasurer",
          {
            p_member_id:
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
        finishProcessing()
      }
    }


  const handleDisableAccount =
    async (member) => {
      const roleWarning =
        member.portal_role ===
        "treasurer"
          ? " This member is currently the Treasurer and will be changed back to Director."
          : ""

      const confirmed =
        window.confirm(
          `Disable ${member.full_name}'s portal account? They will no longer be able to access protected BNE portal data.${roleWarning}`
        )

      if (!confirmed) {
        return
      }

      try {
        beginProcessing(
          member.id,
          "disable_account"
        )

        const {
          error,
        } = await supabase.rpc(
          "disable_member_account",
          {
            p_member_id:
              member.id,
          }
        )

        if (error) {
          throw error
        }

        setMessage(
          `${member.full_name}'s portal account has been disabled.`
        )

        await fetchMembers()
      } catch (error) {
        console.error(
          "Disable account error:",
          error
        )

        setError(
          error.message ||
          "Unable to disable this account."
        )
      } finally {
        finishProcessing()
      }
    }


  const handleEnableAccount =
    async (member) => {
      const confirmed =
        window.confirm(
          `Reactivate ${member.full_name}'s portal account? They will regain approved Director access.`
        )

      if (!confirmed) {
        return
      }

      try {
        beginProcessing(
          member.id,
          "enable_account"
        )

        const {
          error,
        } = await supabase.rpc(
          "enable_member_account",
          {
            p_member_id:
              member.id,
          }
        )

        if (error) {
          throw error
        }

        setMessage(
          `${member.full_name}'s portal account has been reactivated.`
        )

        await fetchMembers()
      } catch (error) {
        console.error(
          "Reactivate account error:",
          error
        )

        setError(
          error.message ||
          "Unable to reactivate this account."
        )
      } finally {
        finishProcessing()
      }
    }


  const filteredMembers =
    members.filter((member) => {
      const query =
        search
          .trim()
          .toLowerCase()

      if (!query) {
        return true
      }

      return (
        member.full_name
          ?.toLowerCase()
          .includes(query) ||
        member.email
          ?.toLowerCase()
          .includes(query) ||
        member.company_position
          ?.toLowerCase()
          .includes(query) ||
        member.portal_role
          ?.toLowerCase()
          .replaceAll("_", " ")
          .includes(query) ||
        member.account_status
          ?.toLowerCase()
          .replaceAll("_", " ")
          .includes(query)
      )
    })


  const treasurer =
    members.find(
      (member) =>
        member.portal_role ===
        "treasurer"
    )


  const approvedAccounts =
    members.filter(
      (member) =>
        member.account_status ===
        "approved"
    ).length


  const disabledAccounts =
    members.filter(
      (member) =>
        member.account_status ===
        "disabled"
    ).length


  const linkedAccounts =
    members.filter(
      (member) =>
        Boolean(
          member.account_user_id
        )
    ).length


  const formatRole = (role) => {
    if (role === "main_admin") {
      return "Main Admin"
    }

    if (role === "treasurer") {
      return "Treasurer"
    }

    return "Director"
  }


  const formatStatus = (status) => {
    if (!status) {
      return "Unknown"
    }

    return status
      .replaceAll("_", " ")
      .replace(/\b\w/g, (letter) =>
        letter.toUpperCase()
      )
  }


  const getStatusClasses = (
    status
  ) => {
    switch (status) {
      case "approved":
        return {
          dot: "bg-green-500",
          badge:
            "bg-green-50 text-green-700",
        }

      case "disabled":
        return {
          dot: "bg-red-500",
          badge:
            "bg-red-50 text-red-700",
        }

      case "pending":
        return {
          dot: "bg-amber-400",
          badge:
            "bg-amber-50 text-amber-700",
        }

      case "rejected":
        return {
          dot: "bg-red-400",
          badge:
            "bg-red-50 text-red-700",
        }

      default:
        return {
          dot: "bg-slate-300",
          badge:
            "bg-slate-100 text-slate-600",
        }
    }
  }


  const isProcessing = (
    memberId,
    action
  ) =>
    processingId === memberId &&
    processingAction === action


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
          BNE Construction Ltd directors,
          portal accounts and company roles.
        </p>
      </div>


      {error && (
        <div className="mt-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <CircleAlert
            size={18}
            className="mt-0.5 shrink-0"
          />

          <span>{error}</span>
        </div>
      )}


      {message && (
        <div className="mt-6 flex items-start gap-3 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          <CircleCheck
            size={18}
            className="mt-0.5 shrink-0"
          />

          <span>{message}</span>
        </div>
      )}


      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">
            Company Directors
          </p>

          <p className="mt-2 text-2xl font-bold text-slate-900">
            {members.length}
          </p>
        </div>


        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">
            Approved Accounts
          </p>

          <p className="mt-2 text-2xl font-bold text-slate-900">
            {approvedAccounts}
          </p>
        </div>


        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">
            Linked Accounts
          </p>

          <p className="mt-2 text-2xl font-bold text-slate-900">
            {linkedAccounts}
          </p>
        </div>


        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">
            Disabled Accounts
          </p>

          <p className="mt-2 text-2xl font-bold text-slate-900">
            {disabledAccounts}
          </p>
        </div>
      </div>


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

                {treasurer && (
                  <p className="mt-1 text-xs text-slate-500">
                    Financial approval
                    permissions are active.
                  </p>
                )}
              </div>
            </div>


            {!treasurer ? (
              <span className="rounded-full bg-amber-50 px-4 py-2 text-xs font-semibold text-amber-700">
                Treasurer not assigned
              </span>
            ) : (
              <span className="rounded-full bg-green-50 px-4 py-2 text-xs font-semibold text-green-700">
                Treasurer assigned
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
          (member) => {
            const statusClasses =
              getStatusClasses(
                member.account_status
              )

            const hasLinkedAccount =
              Boolean(
                member.account_user_id
              )

            const canAssignTreasurer =
              isMainAdmin &&
              member.portal_role ===
                "director" &&
              member.account_status ===
                "approved"

            const canRemoveTreasurer =
              isMainAdmin &&
              member.portal_role ===
                "treasurer"

            const canDisableAccount =
              isMainAdmin &&
              member.portal_role !==
                "main_admin" &&
              member.account_status ===
                "approved" &&
              hasLinkedAccount

            const canEnableAccount =
              isMainAdmin &&
              member.portal_role !==
                "main_admin" &&
              member.account_status ===
                "disabled" &&
              hasLinkedAccount

            return (
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


                  {member.portal_role ===
                    "director" && (
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                      Director
                    </span>
                  )}
                </div>


                <h2 className="mt-5 text-lg font-semibold text-slate-900">
                  {member.full_name}
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  {member.company_position ||
                    "Director"}
                </p>


                {member.email && (
                  <p className="mt-2 truncate text-xs text-slate-400">
                    {member.email}
                  </p>
                )}


                <div className="mt-6 border-t border-slate-100 pt-5">
                  <p className="text-xs uppercase tracking-wide text-slate-400">
                    Portal Account
                  </p>

                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <span
                      className={`h-2 w-2 rounded-full ${statusClasses.dot}`}
                    />

                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusClasses.badge}`}
                    >
                      {formatStatus(
                        member.account_status
                      )}
                    </span>
                  </div>


                  <div className="mt-3 flex items-center justify-between text-xs">
                    <span className="text-slate-400">
                      Account Link
                    </span>

                    <span
                      className={
                        hasLinkedAccount
                          ? "font-medium text-green-700"
                          : "font-medium text-slate-500"
                      }
                    >
                      {hasLinkedAccount
                        ? "Linked"
                        : "Not Linked"}
                    </span>
                  </div>


                  <div className="mt-2 flex items-center justify-between text-xs">
                    <span className="text-slate-400">
                      Portal Role
                    </span>

                    <span className="font-medium text-slate-700">
                      {formatRole(
                        member.portal_role
                      )}
                    </span>
                  </div>
                </div>


                <Link
                  to={`/members/${member.id}`}
                  className="mt-5 block w-full rounded-xl border border-slate-200 px-4 py-3 text-center text-sm font-semibold text-slate-700 transition hover:border-[#c5a66a] hover:text-[#9b7c3f]"
                >
                  View Profile
                </Link>


                {canAssignTreasurer && (
                  <button
                    type="button"
                    onClick={() =>
                      handleAssignTreasurer(
                        member
                      )
                    }
                    disabled={
                      processingId ===
                      member.id
                    }
                    className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#c5a66a] px-4 py-3 text-sm font-semibold text-[#111315] transition hover:bg-[#d2b77d] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {isProcessing(
                      member.id,
                      "assign_treasurer"
                    ) ? (
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


                {canRemoveTreasurer && (
                  <button
                    type="button"
                    onClick={() =>
                      handleRemoveTreasurer(
                        member
                      )
                    }
                    disabled={
                      processingId ===
                      member.id
                    }
                    className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-amber-200 px-4 py-3 text-sm font-semibold text-amber-700 transition hover:bg-amber-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {isProcessing(
                      member.id,
                      "remove_treasurer"
                    ) ? (
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


                {canDisableAccount && (
                  <button
                    type="button"
                    onClick={() =>
                      handleDisableAccount(
                        member
                      )
                    }
                    disabled={
                      processingId ===
                      member.id
                    }
                    className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-red-200 px-4 py-3 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {isProcessing(
                      member.id,
                      "disable_account"
                    ) ? (
                      <LoaderCircle
                        size={16}
                        className="animate-spin"
                      />
                    ) : (
                      <UserX
                        size={16}
                      />
                    )}

                    Disable Account
                  </button>
                )}


                {canEnableAccount && (
                  <button
                    type="button"
                    onClick={() =>
                      handleEnableAccount(
                        member
                      )
                    }
                    disabled={
                      processingId ===
                      member.id
                    }
                    className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {isProcessing(
                      member.id,
                      "enable_account"
                    ) ? (
                      <LoaderCircle
                        size={16}
                        className="animate-spin"
                      />
                    ) : (
                      <UserCheck
                        size={16}
                      />
                    )}

                    Reactivate Account
                  </button>
                )}


                {isMainAdmin &&
                  member.portal_role ===
                    "director" &&
                  member.account_status !==
                    "approved" &&
                  member.account_status !==
                    "disabled" && (
                  <p className="mt-3 rounded-xl bg-slate-50 px-3 py-2 text-center text-xs leading-5 text-slate-500">
                    Treasurer can only be
                    assigned after this
                    account is approved.
                  </p>
                )}


                {member.portal_role ===
                  "main_admin" &&
                  isMainAdmin && (
                  <div className="mt-3 rounded-xl bg-slate-50 px-3 py-2 text-center text-xs leading-5 text-slate-500">
                    Main Admin account is
                    protected.
                  </div>
                )}
              </div>
            )
          }
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