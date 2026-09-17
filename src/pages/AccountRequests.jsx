import { useEffect, useState } from "react"

import {
  UserCheck,
  UserX,
  LoaderCircle,
  RefreshCw,
  Clock3,
  ShieldCheck,
  CircleAlert,
  CircleCheck,
  Link2,
} from "lucide-react"

import { supabase } from "../lib/supabase"


function AccountRequests() {
  const [requests, setRequests] = useState([])
  const [members, setMembers] = useState([])

  const [selectedMembers, setSelectedMembers] =
    useState({})

  const [loading, setLoading] =
    useState(true)

  const [refreshing, setRefreshing] =
    useState(false)

  const [processingId, setProcessingId] =
    useState(null)

  const [processingAction, setProcessingAction] =
    useState("")

  const [error, setError] =
    useState("")

  const [message, setMessage] =
    useState("")


  useEffect(() => {
    loadPage()
  }, [])


  const loadPage = async (
    showRefreshState = false
  ) => {
    try {
      if (showRefreshState) {
        setRefreshing(true)
      } else {
        setLoading(true)
      }

      setError("")

      const [
        requestsResult,
        membersResult,
      ] = await Promise.all([
        supabase
          .from("registration_requests")
          .select(`
            id,
            auth_user_id,
            full_name,
            email,
            status,
            linked_member_id,
            reviewed_by,
            reviewed_at,
            rejection_reason,
            created_at
          `)
          .eq("status", "pending")
          .order("created_at", {
            ascending: false,
          }),

        supabase
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


      /*
       * Remove stale selections.
       *
       * For example:
       * Request A was linked to Member A,
       * then the page refreshed.
       *
       * We do not want an old member ID
       * remaining in selectedMembers.
       */
      setSelectedMembers(
        (previous) => {
          const validRequestIds =
            new Set(
              (
                requestsResult.data ||
                []
              ).map(
                (request) =>
                  request.id
              )
            )

          return Object.fromEntries(
            Object.entries(
              previous
            ).filter(
              ([requestId]) =>
                validRequestIds.has(
                  requestId
                )
            )
          )
        }
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
      setRefreshing(false)
    }
  }


  const handleMemberChange = (
    requestId,
    memberId
  ) => {
    setSelectedMembers(
      (previous) => ({
        ...previous,
        [requestId]:
          memberId,
      })
    )

    setError("")
    setMessage("")
  }


  const beginProcessing = (
    requestId,
    action
  ) => {
    setProcessingId(
      requestId
    )

    setProcessingAction(
      action
    )

    setError("")
    setMessage("")
  }


  const finishProcessing = () => {
    setProcessingId(null)
    setProcessingAction("")
  }


  const handleApprove =
    async (request) => {
      const memberId =
        selectedMembers[
          request.id
        ]

      if (!memberId) {
        setError(
          "Please select the BNE member profile this account belongs to."
        )

        return
      }


      const selectedMember =
        members.find(
          (member) =>
            member.id ===
            memberId
        )


      if (!selectedMember) {
        setError(
          "The selected BNE member could not be found. Refresh the page and try again."
        )

        return
      }


      if (
        selectedMember.portal_role ===
        "main_admin"
      ) {
        setError(
          "The Main Admin account cannot be linked through a registration request."
        )

        return
      }


      if (
        selectedMember.account_user_id
      ) {
        setError(
          `${selectedMember.full_name} already has a linked portal account.`
        )

        return
      }


      if (
        selectedMember.account_status ===
        "disabled"
      ) {
        setError(
          `${selectedMember.full_name}'s account is disabled. Reactivate the existing account instead.`
        )

        return
      }


      const confirmed =
        window.confirm(
          `Approve ${request.full_name}'s registration and link it to the BNE member profile for ${selectedMember.full_name}?\n\nPlease confirm that you have verified this person's identity before approving.`
        )


      if (!confirmed) {
        return
      }


      try {
        beginProcessing(
          request.id,
          "approve"
        )


        const {
          error,
        } = await supabase.rpc(
          "approve_registration_request",
          {
            p_request_id:
              request.id,

            p_member_id:
              memberId,
          }
        )


        if (error) {
          throw error
        }


        setMessage(
          `${request.full_name}'s account has been approved and linked to ${selectedMember.full_name}.`
        )


        setSelectedMembers(
          (previous) => {
            const next = {
              ...previous,
            }

            delete next[
              request.id
            ]

            return next
          }
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
        finishProcessing()
      }
    }


  const handleReject =
    async (request) => {
      const reason =
        window.prompt(
          `Reason for rejecting ${request.full_name}'s request:`
        )


      // User clicked Cancel
      if (reason === null) {
        return
      }


      const cleanedReason =
        reason.trim()


      const confirmed =
        window.confirm(
          cleanedReason
            ? `Reject ${request.full_name}'s registration request?\n\nReason: ${cleanedReason}`
            : `Reject ${request.full_name}'s registration request without providing a reason?`
        )


      if (!confirmed) {
        return
      }


      try {
        beginProcessing(
          request.id,
          "reject"
        )


        const {
          error,
        } = await supabase.rpc(
          "reject_registration_request",
          {
            p_request_id:
              request.id,

            p_reason:
              cleanedReason ||
              null,
          }
        )


        if (error) {
          throw error
        }


        setMessage(
          `${request.full_name}'s registration request has been rejected.`
        )


        setSelectedMembers(
          (previous) => {
            const next = {
              ...previous,
            }

            delete next[
              request.id
            ]

            return next
          }
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
        finishProcessing()
      }
    }


  /*
   * Only profiles that are genuinely
   * available for a new registration
   * should appear in the dropdown.
   */
  const availableMembers =
    members.filter(
      (member) =>
        !member.account_user_id &&
        member.portal_role !==
          "main_admin" &&
        member.account_status !==
          "disabled" &&
        member.account_status !==
          "rejected"
    )


  const linkedAccounts =
    members.filter(
      (member) =>
        Boolean(
          member.account_user_id
        )
    ).length


  const approvedAccounts =
    members.filter(
      (member) =>
        member.account_status ===
        "approved"
    ).length


  const isProcessing = (
    requestId,
    action
  ) =>
    processingId ===
      requestId &&
    processingAction ===
      action


  const formatRequestDate = (
    date
  ) => {
    if (!date) {
      return "Unknown"
    }

    return new Intl.DateTimeFormat(
      "en-AU",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }
    ).format(
      new Date(date)
    )
  }


  if (loading) {
    return (
      <div className="flex min-h-[450px] items-center justify-center">
        <div className="text-center">
          <LoaderCircle
            size={34}
            className="mx-auto animate-spin text-[#9b7c3f]"
          />

          <p className="mt-3 text-sm text-slate-500">
            Loading account
            requests...
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
            Review registrations
            and securely link them
            to existing BNE member
            profiles.
          </p>
        </div>


        <button
          type="button"
          onClick={() =>
            loadPage(true)
          }
          disabled={
            refreshing ||
            processingId !==
              null
          }
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-[#c5a66a] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <RefreshCw
            size={17}
            className={
              refreshing
                ? "animate-spin"
                : ""
            }
          />

          {refreshing
            ? "Refreshing..."
            : "Refresh"}
        </button>
      </div>


      {/* ERROR */}

      {error && (
        <div className="mt-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <CircleAlert
            size={18}
            className="mt-0.5 shrink-0"
          />

          <span>
            {error}
          </span>
        </div>
      )}


      {/* SUCCESS */}

      {message && (
        <div className="mt-6 flex items-start gap-3 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          <CircleCheck
            size={18}
            className="mt-0.5 shrink-0"
          />

          <span>
            {message}
          </span>
        </div>
      )}


      {/* SECURITY NOTE */}

      <div className="mt-8 rounded-2xl border border-[#e5d8bd] bg-[#faf7f0] p-5">
        <div className="flex items-start gap-3">
          <ShieldCheck
            size={21}
            className="mt-0.5 shrink-0 text-[#9b7c3f]"
          />

          <div>
            <p className="text-sm font-semibold text-slate-900">
              Verify identity before
              approval
            </p>

            <p className="mt-1 text-sm leading-6 text-slate-600">
              The name and email
              entered during
              registration do not
              automatically prove
              that the account
              belongs to that BNE
              director. Confirm the
              person before linking
              the account to a
              member profile.
            </p>
          </div>
        </div>
      </div>


      {/* SUMMARY */}

      <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-4">
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
            Linked Accounts
          </p>

          <p className="mt-2 text-3xl font-bold text-slate-900">
            {linkedAccounts}
          </p>
        </div>


        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <p className="text-sm text-slate-500">
            Approved Accounts
          </p>

          <p className="mt-2 text-3xl font-bold text-slate-900">
            {approvedAccounts}
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
        {requests.length ===
        0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-14 text-center">
            <UserCheck
              size={38}
              className="mx-auto text-slate-300"
            />

            <h2 className="mt-4 text-lg font-semibold text-slate-900">
              No pending requests
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              New member
              registrations will
              appear here for
              review.
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            {requests.map(
              (request) => {
                const selectedMemberId =
                  selectedMembers[
                    request.id
                  ] || ""

                const selectedMember =
                  members.find(
                    (member) =>
                      member.id ===
                      selectedMemberId
                  )

                const requestBusy =
                  processingId ===
                  request.id

                return (
                  <div
                    key={
                      request.id
                    }
                    className="rounded-2xl border border-slate-200 bg-white p-6"
                  >
                    <div className="flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
                      {/* REQUEST INFO */}

                      <div className="min-w-0">
                        <div className="flex items-center gap-3">
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#f1eadc] text-[#9b7c3f]">
                            <UserCheck
                              size={20}
                            />
                          </div>

                          <div className="min-w-0">
                            <h2 className="truncate text-lg font-semibold text-slate-900">
                              {
                                request.full_name
                              }
                            </h2>

                            <p className="truncate text-sm text-slate-500">
                              {
                                request.email
                              }
                            </p>
                          </div>
                        </div>


                        <div className="mt-4 flex flex-wrap items-center gap-2">
                          <span className="inline-flex rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                            Pending
                            Approval
                          </span>

                          <span className="text-xs text-slate-400">
                            Requested{" "}
                            {formatRequestDate(
                              request.created_at
                            )}
                          </span>
                        </div>
                      </div>


                      {/* MEMBER LINK */}

                      <div className="w-full xl:max-w-sm">
                        <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Link to BNE
                          Member Profile
                        </label>

                        <select
                          value={
                            selectedMemberId
                          }
                          onChange={(
                            event
                          ) =>
                            handleMemberChange(
                              request.id,
                              event
                                .target
                                .value
                            )
                          }
                          disabled={
                            requestBusy
                          }
                          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none focus:border-[#c5a66a] disabled:cursor-not-allowed disabled:bg-slate-50"
                        >
                          <option value="">
                            Select
                            member
                          </option>

                          {availableMembers.map(
                            (
                              member
                            ) => (
                              <option
                                key={
                                  member.id
                                }
                                value={
                                  member.id
                                }
                              >
                                {
                                  member.full_name
                                }
                              </option>
                            )
                          )}
                        </select>


                        {selectedMember && (
                          <div className="mt-2 flex items-center gap-2 text-xs text-slate-500">
                            <Link2
                              size={13}
                            />

                            <span>
                              Will link
                              to{" "}
                              <strong className="font-semibold text-slate-700">
                                {
                                  selectedMember.full_name
                                }
                              </strong>
                            </span>
                          </div>
                        )}
                      </div>


                      {/* ACTIONS */}

                      <div className="flex flex-col gap-3 sm:flex-row">
                        <button
                          type="button"
                          onClick={() =>
                            handleReject(
                              request
                            )
                          }
                          disabled={
                            requestBusy
                          }
                          className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-200 px-5 py-3 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {isProcessing(
                            request.id,
                            "reject"
                          ) ? (
                            <LoaderCircle
                              size={
                                17
                              }
                              className="animate-spin"
                            />
                          ) : (
                            <UserX
                              size={
                                17
                              }
                            />
                          )}

                          Reject
                        </button>


                        <button
                          type="button"
                          onClick={() =>
                            handleApprove(
                              request
                            )
                          }
                          disabled={
                            requestBusy ||
                            !selectedMemberId
                          }
                          className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#c5a66a] px-5 py-3 text-sm font-semibold text-[#111315] transition hover:bg-[#d2b77d] disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {isProcessing(
                            request.id,
                            "approve"
                          ) ? (
                            <LoaderCircle
                              size={
                                17
                              }
                              className="animate-spin"
                            />
                          ) : (
                            <UserCheck
                              size={
                                17
                              }
                            />
                          )}

                          Approve
                        </button>
                      </div>
                    </div>
                  </div>
                )
              }
            )}
          </div>
        )}
      </div>
    </div>
  )
}


export default AccountRequests