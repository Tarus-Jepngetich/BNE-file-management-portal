import { useEffect, useState } from "react"

import {
  CheckCircle2,
  XCircle,
  Receipt,
  LoaderCircle,
  RefreshCw,
  ExternalLink,
  Clock3,
  Banknote,
} from "lucide-react"

import { supabase } from "../lib/supabase"
import { useAuth } from "../context/AuthContext"

function FinancialApprovals() {
  const {
    isMainAdmin,
    isTreasurer,
  } = useAuth()

  const [contributions, setContributions] =
    useState([])

  const [loading, setLoading] =
    useState(true)

  const [processingId, setProcessingId] =
    useState(null)

  const [error, setError] =
    useState("")

  const [message, setMessage] =
    useState("")

  useEffect(() => {
    fetchPendingContributions()
  }, [])

  const fetchPendingContributions =
    async () => {
      try {
        setLoading(true)
        setError("")

        const {
          data,
          error,
        } = await supabase
          .from("contributions")
          .select(`
            id,
            amount,
            contribution_type,
            payment_date,
            payment_method,
            transaction_reference,
            notes,
            evidence_path,
            approval_status,
            created_at,

            member:members (
              id,
              full_name,
              company_position
            )
          `)
          .eq(
            "approval_status",
            "pending"
          )
          .order(
            "created_at",
            {
              ascending: false,
            }
          )

        if (error) {
          throw error
        }

        setContributions(
          data || []
        )
      } catch (error) {
        console.error(
          "Pending contributions error:",
          error
        )

        setError(
          error.message ||
          "Unable to load pending contributions."
        )
      } finally {
        setLoading(false)
      }
    }

  const handleViewEvidence =
    async (path) => {
      try {
        setError("")

        if (!path) {
          setError(
            "No payment evidence was uploaded."
          )
          return
        }

        const {
          data,
          error,
        } = await supabase
          .storage
          .from(
            "contribution-evidence"
          )
          .createSignedUrl(
            path,
            60
          )

        if (error) {
          throw error
        }

        window.open(
          data.signedUrl,
          "_blank",
          "noopener,noreferrer"
        )
      } catch (error) {
        console.error(
          "Evidence error:",
          error
        )

        setError(
          error.message ||
          "Unable to open payment evidence."
        )
      }
    }

  const handleApprove =
    async (contribution) => {
      try {
        setProcessingId(
          contribution.id
        )

        setError("")
        setMessage("")

        const {
          error,
        } = await supabase.rpc(
          "approve_contribution",
          {
            contribution_id:
              contribution.id,
          }
        )

        if (error) {
          throw error
        }

        setMessage(
          `${contribution.member?.full_name}'s contribution has been approved.`
        )

        await fetchPendingContributions()
      } catch (error) {
        console.error(
          "Approval error:",
          error
        )

        setError(
          error.message ||
          "Unable to approve contribution."
        )
      } finally {
        setProcessingId(null)
      }
    }

  const handleReject =
    async (contribution) => {
      const reason =
        window.prompt(
          `Why are you rejecting ${contribution.member?.full_name}'s contribution?`
        )

      if (reason === null) {
        return
      }

      try {
        setProcessingId(
          contribution.id
        )

        setError("")
        setMessage("")

        const {
          error,
        } = await supabase.rpc(
          "reject_contribution",
          {
            contribution_id:
              contribution.id,

            reason:
              reason.trim() ||
              null,
          }
        )

        if (error) {
          throw error
        }

        setMessage(
          `${contribution.member?.full_name}'s contribution has been rejected.`
        )

        await fetchPendingContributions()
      } catch (error) {
        console.error(
          "Rejection error:",
          error
        )

        setError(
          error.message ||
          "Unable to reject contribution."
        )
      } finally {
        setProcessingId(null)
      }
    }

  const formatCurrency =
    (amount) => {
      return new Intl.NumberFormat(
        "en-KE",
        {
          style: "currency",
          currency: "KES",
          maximumFractionDigits: 0,
        }
      ).format(amount || 0)
    }

  const formatDate =
    (date) => {
      if (!date) {
        return "—"
      }

      return new Date(
        `${date}T00:00:00`
      ).toLocaleDateString(
        "en-GB",
        {
          day: "2-digit",
          month: "short",
          year: "numeric",
        }
      )
    }

  if (
    !isMainAdmin &&
    !isTreasurer
  ) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-8">
        <h1 className="text-xl font-bold text-red-700">
          Access Denied
        </h1>

        <p className="mt-2 text-sm text-red-600">
          Only the Treasurer or Main Admin can review financial transactions.
        </p>
      </div>
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
            Loading pending transactions...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-[#9b7c3f]">
            Finance
          </p>

          <h1 className="mt-1 text-3xl font-bold text-slate-900">
            Financial Approvals
          </h1>

          <p className="mt-2 text-slate-500">
            Review pending contributions and payment evidence.
          </p>
        </div>

        <button
          onClick={
            fetchPendingContributions
          }
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-[#c5a66a]"
        >
          <RefreshCw size={17} />
          Refresh
        </button>
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

      <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">
                Pending Contributions
              </p>

              <p className="mt-2 text-3xl font-bold text-slate-900">
                {contributions.length}
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
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">
                Pending Amount
              </p>

              <p className="mt-2 text-3xl font-bold text-slate-900">
                {formatCurrency(
                  contributions.reduce(
                    (
                      total,
                      contribution
                    ) =>
                      total +
                      Number(
                        contribution.amount
                      ),
                    0
                  )
                )}
              </p>
            </div>

            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#f1eadc]">
              <Banknote
                size={23}
                className="text-[#9b7c3f]"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 space-y-5">
        {contributions.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-14 text-center">
            <CheckCircle2
              size={40}
              className="mx-auto text-green-500"
            />

            <h2 className="mt-4 text-lg font-semibold text-slate-900">
              Nothing waiting for approval
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              New pending contributions will appear here.
            </p>
          </div>
        ) : (
          contributions.map(
            (contribution) => (
              <div
                key={contribution.id}
                className="rounded-2xl border border-slate-200 bg-white p-6"
              >
                <div className="grid gap-6 xl:grid-cols-[1.2fr_1fr_auto]">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                      Member
                    </p>

                    <h2 className="mt-2 text-lg font-semibold text-slate-900">
                      {
                        contribution
                          .member
                          ?.full_name
                      }
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                      {
                        contribution
                          .contribution_type
                      }
                    </p>

                    <div className="mt-5">
                      <p className="text-2xl font-bold text-slate-900">
                        {formatCurrency(
                          contribution.amount
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Detail
                      label="Payment Date"
                      value={
                        formatDate(
                          contribution
                            .payment_date
                        )
                      }
                    />

                    <Detail
                      label="Method"
                      value={
                        contribution
                          .payment_method ||
                        "—"
                      }
                    />

                    <Detail
                      label="Reference"
                      value={
                        contribution
                          .transaction_reference ||
                        "—"
                      }
                    />

                    {contribution.notes && (
                      <Detail
                        label="Notes"
                        value={
                          contribution.notes
                        }
                      />
                    )}
                  </div>

                  <div className="flex min-w-[190px] flex-col gap-3">
                    <button
                      onClick={() =>
                        handleViewEvidence(
                          contribution
                            .evidence_path
                        )
                      }
                      disabled={
                        !contribution
                          .evidence_path
                      }
                      className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-[#c5a66a] disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <Receipt size={17} />
                      View Evidence
                      <ExternalLink size={14} />
                    </button>

                    <button
                      onClick={() =>
                        handleApprove(
                          contribution
                        )
                      }
                      disabled={
                        processingId ===
                        contribution.id
                      }
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#c5a66a] px-4 py-3 text-sm font-semibold text-[#111315] transition hover:bg-[#d2b77d] disabled:opacity-50"
                    >
                      {processingId ===
                      contribution.id ? (
                        <LoaderCircle
                          size={17}
                          className="animate-spin"
                        />
                      ) : (
                        <CheckCircle2
                          size={17}
                        />
                      )}

                      Approve
                    </button>

                    <button
                      onClick={() =>
                        handleReject(
                          contribution
                        )
                      }
                      disabled={
                        processingId ===
                        contribution.id
                      }
                      className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-200 px-4 py-3 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                    >
                      <XCircle size={17} />
                      Reject
                    </button>
                  </div>
                </div>
              </div>
            )
          )
        )}
      </div>
    </div>
  )
}

function Detail({
  label,
  value,
}) {
  return (
    <div>
      <p className="text-xs text-slate-400">
        {label}
      </p>

      <p className="mt-1 text-sm font-medium text-slate-700">
        {value}
      </p>
    </div>
  )
}

export default FinancialApprovals