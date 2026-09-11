import { useEffect, useState } from "react"
import {
  UserCheck,
  UserX,
  LoaderCircle,
  RefreshCw,
  Clock3,
} from "lucide-react"

import { supabase } from "../lib/supabase"

function AccountRequests() {
  const [requests, setRequests] = useState([])
  const [members, setMembers] = useState([])

  const [selectedMembers, setSelectedMembers] =
    useState({})

  const [loading, setLoading] = useState(true)
  const [processingId, setProcessingId] =
    useState(null)

  const [error, setError] = useState("")
  const [message, setMessage] = useState("")

  useEffect(() => {
    loadPage()
  }, [])

  const loadPage = async () => {
    try {
      setLoading(true)
      setError("")

      const [
        requestsResult,
        membersResult,
      ] = await Promise.all([
        supabase
          .from("registration_requests")
          .select("*")
          .eq("status", "pending")
          .order("created_at", {
            ascending: false,
          }),

        supabase
          .from("members")
          .select(
            `
              id,
              full_name,
              company_position,
              portal_role,
              account_status,
              account_user_id
            `
          )
          .order("full_name", {
            ascending: true,
          }),
      ])

      if (requestsResult.error) {
        throw requestsResult.error
      }

      if (membersResult.error) {
        throw membersResult.error
      }

      setRequests(
        requestsResult.data || []
      )

      setMembers(
        membersResult.data || []
      )
    } catch (error) {
      console.error(
        "Account requests error:",
        error
      )

      setError(
        error.message ||
          "Unable to load account requests."
      )
    } finally {
      setLoading(false)
    }
  }


  const handleMemberChange = (
    requestId,
    memberId
  ) => {
    setSelectedMembers((previous) => ({
      ...previous,
      [requestId]: memberId,
    }))
  }


  const handleApprove = async (request) => {
    try {
      const memberId =
        selectedMembers[request.id]

      if (!memberId) {
        setError(
          "Please select the member profile this account belongs to."
        )
        return
      }

      setProcessingId(request.id)
      setError("")
      setMessage("")

      const { error } =
        await supabase.rpc(
          "approve_registration_request",
          {
            request_id: request.id,
            member_id: memberId,
          }
        )

      if (error) {
        throw error
      }

      setMessage(
        `${request.full_name}'s account has been approved successfully.`
      )

      await loadPage()
    } catch (error) {
      console.error(
        "Approval error:",
        error
      )

      setError(
        error.message ||
          "Unable to approve this account."
      )
    } finally {
      setProcessingId(null)
    }
  }


  const handleReject = async (request) => {
    const reason = window.prompt(
      `Reason for rejecting ${request.full_name}'s request:`
    )

    // Cancel was clicked
    if (reason === null) {
      return
    }

    try {
      setProcessingId(request.id)
      setError("")
      setMessage("")

      const { error } =
        await supabase.rpc(
          "reject_registration_request",
          {
            request_id: request.id,
            reason:
              reason.trim() || null,
          }
        )

      if (error) {
        throw error
      }

      setMessage(
        `${request.full_name}'s request has been rejected.`
      )

      await loadPage()
    } catch (error) {
      console.error(
        "Rejection error:",
        error
      )

      setError(
        error.message ||
          "Unable to reject this request."
      )
    } finally {
      setProcessingId(null)
    }
  }


  const availableMembers =
    members.filter(
      (member) =>
        !member.account_user_id
    )


  if (loading) {
    return (
      <div className="flex min-h-[450px] items-center justify-center">
        <div className="text-center">

          <LoaderCircle
            size={34}
            className="mx-auto animate-spin text-[#9b7c3f]"
          />

          <p className="mt-3 text-sm text-slate-500">
            Loading account requests...
          </p>

        </div>
      </div>
    )
  }


  return (
    <div>

      {/* HEADER */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-[#9b7c3f]">
            Administration
          </p>

          <h1 className="mt-1 text-3xl font-bold text-slate-900">
            Account Requests
          </h1>

          <p className="mt-2 text-slate-500">
            Review new registrations and link
            them to existing BNE member profiles.
          </p>
        </div>

        <button
          onClick={loadPage}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-[#c5a66a]"
        >
          <RefreshCw size={17} />

          Refresh
        </button>

      </div>


      {/* ERROR */}
      {error && (
        <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}


      {/* SUCCESS */}
      {message && (
        <div className="mt-6 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          {message}
        </div>
      )}


      {/* SUMMARY */}
      <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-3">

        <div className="rounded-2xl border border-slate-200 bg-white p-6">

          <div className="flex items-center justify-between">

            <div>
              <p className="text-sm text-slate-500">
                Pending Requests
              </p>

              <p className="mt-2 text-3xl font-bold text-slate-900">
                {requests.length}
              </p>
            </div>

            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50">
              <Clock3
                size={22}
                className="text-amber-600"
              />
            </div>

          </div>

        </div>


        <div className="rounded-2xl border border-slate-200 bg-white p-6">

          <p className="text-sm text-slate-500">
            Portal Accounts
          </p>

          <p className="mt-2 text-3xl font-bold text-slate-900">
            {
              members.filter(
                (member) =>
                  member.account_user_id
              ).length
            }
          </p>

        </div>


        <div className="rounded-2xl border border-slate-200 bg-white p-6">

          <p className="text-sm text-slate-500">
            Profiles Available
          </p>

          <p className="mt-2 text-3xl font-bold text-slate-900">
            {availableMembers.length}
          </p>

        </div>

      </div>


      {/* REQUESTS */}
      <div className="mt-8">

        {requests.length === 0 ? (

          <div className="rounded-2xl border border-slate-200 bg-white p-14 text-center">

            <UserCheck
              size={38}
              className="mx-auto text-slate-300"
            />

            <h2 className="mt-4 text-lg font-semibold text-slate-900">
              No pending requests
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              New member registrations will
              appear here.
            </p>

          </div>

        ) : (

          <div className="space-y-5">

            {requests.map((request) => (

              <div
                key={request.id}
                className="rounded-2xl border border-slate-200 bg-white p-6"
              >

                <div className="flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">

                  {/* REQUEST INFO */}
                  <div>

                    <div className="flex items-center gap-3">

                      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#f1eadc] text-[#9b7c3f]">
                        <UserCheck size={20} />
                      </div>

                      <div>

                        <h2 className="text-lg font-semibold text-slate-900">
                          {request.full_name}
                        </h2>

                        <p className="text-sm text-slate-500">
                          {request.email}
                        </p>

                      </div>

                    </div>

                    <div className="mt-4">

                      <span className="inline-flex rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                        Pending Approval
                      </span>

                    </div>

                  </div>


                  {/* LINK MEMBER */}
                  <div className="w-full xl:max-w-xs">

                    <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Link to Member Profile
                    </label>

                    <select
                      value={
                        selectedMembers[
                          request.id
                        ] || ""
                      }
                      onChange={(e) =>
                        handleMemberChange(
                          request.id,
                          e.target.value
                        )
                      }
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none focus:border-[#c5a66a]"
                    >
                      <option value="">
                        Select member
                      </option>

                      {availableMembers.map(
                        (member) => (
                          <option
                            key={member.id}
                            value={member.id}
                          >
                            {member.full_name}
                          </option>
                        )
                      )}

                    </select>

                  </div>


                  {/* BUTTONS */}
                  <div className="flex flex-col gap-3 sm:flex-row">

                    <button
                      onClick={() =>
                        handleReject(request)
                      }
                      disabled={
                        processingId ===
                        request.id
                      }
                      className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-200 px-5 py-3 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                    >
                      <UserX size={17} />

                      Reject
                    </button>


                    <button
                      onClick={() =>
                        handleApprove(request)
                      }
                      disabled={
                        processingId ===
                        request.id
                      }
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#c5a66a] px-5 py-3 text-sm font-semibold text-[#111315] transition hover:bg-[#d2b77d] disabled:opacity-50"
                    >

                      {processingId ===
                      request.id ? (
                        <LoaderCircle
                          size={17}
                          className="animate-spin"
                        />
                      ) : (
                        <UserCheck
                          size={17}
                        />
                      )}

                      Approve

                    </button>

                  </div>

                </div>

              </div>

            ))}

          </div>

        )}

      </div>

    </div>
  )
}

export default AccountRequests