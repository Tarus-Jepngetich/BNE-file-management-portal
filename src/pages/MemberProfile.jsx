import { useEffect, useState } from "react"
import { useParams } from "react-router-dom"

import {
  UserRound,
  Plus,
  LoaderCircle,
  Receipt,
  X,
  Upload,
  ExternalLink,
  Clock3,
  CheckCircle2,
  XCircle,
} from "lucide-react"

import { supabase } from "../lib/supabase"
import { useAuth } from "../context/AuthContext"

function MemberProfile() {
  const { memberId } = useParams()

  const {
    user,
    member: loggedInMember,
  } = useAuth()

  const [member, setMember] =
    useState(null)

  const [contributions, setContributions] =
    useState([])

  const [loading, setLoading] =
    useState(true)

  const [error, setError] =
    useState("")

  const [message, setMessage] =
    useState("")

  const [showModal, setShowModal] =
    useState(false)

  const [saving, setSaving] =
    useState(false)

  const [form, setForm] =
    useState({
      amount: "",
      contributionType: "",
      paymentDate: "",
      paymentMethod: "",
      transactionReference: "",
      notes: "",
    })

  const [evidenceFile, setEvidenceFile] =
    useState(null)

  useEffect(() => {
    loadPage()
  }, [memberId])

  const loadPage = async () => {
    try {
      setLoading(true)
      setError("")

      const [
        memberResult,
        contributionResult,
      ] = await Promise.all([
        supabase
          .from("members")
          .select(`
            id,
            full_name,
            email,
            company_position,
            portal_role,
            account_status,
            profile_photo_path,
            id_document_path
          `)
          .eq("id", memberId)
          .single(),

        supabase
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
            rejection_reason,
            created_at
          `)
          .eq("member_id", memberId)
          .order("payment_date", {
            ascending: false,
          }),
      ])

      if (memberResult.error) {
        throw memberResult.error
      }

      if (contributionResult.error) {
        throw contributionResult.error
      }

      setMember(memberResult.data)

      setContributions(
        contributionResult.data || []
      )
    } catch (error) {
      console.error(
        "Member profile error:",
        error
      )

      setError(
        error.message ||
        "Unable to load member profile."
      )
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (event) => {
    const {
      name,
      value,
    } = event.target

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }))
  }

  const resetForm = () => {
    setForm({
      amount: "",
      contributionType: "",
      paymentDate: "",
      paymentMethod: "",
      transactionReference: "",
      notes: "",
    })

    setEvidenceFile(null)
  }

  const handleCloseModal = () => {
    if (saving) return

    setShowModal(false)
    resetForm()
  }

  const uploadEvidence =
    async () => {
      if (!evidenceFile) {
        return null
      }

      const extension =
        evidenceFile.name
          .split(".")
          .pop()
          ?.toLowerCase() || "file"

      const filePath =
        `${memberId}/${crypto.randomUUID()}.${extension}`

      const {
        error,
      } = await supabase.storage
        .from(
          "contribution-evidence"
        )
        .upload(
          filePath,
          evidenceFile,
          {
            cacheControl: "3600",
            upsert: false,
          }
        )

      if (error) {
        throw error
      }

      return filePath
    }

  const handleSubmit =
    async (event) => {
      event.preventDefault()

      try {
        setSaving(true)
        setError("")
        setMessage("")

        if (!user) {
          throw new Error(
            "You must be logged in."
          )
        }

        if (
          !form.amount ||
          Number(form.amount) <= 0
        ) {
          throw new Error(
            "Enter a valid contribution amount."
          )
        }

        if (
          !form.contributionType.trim()
        ) {
          throw new Error(
            "Enter the contribution type."
          )
        }

        if (!form.paymentDate) {
          throw new Error(
            "Select the payment date."
          )
        }

        let evidencePath = null

        if (evidenceFile) {
          evidencePath =
            await uploadEvidence()
        }

        const {
          error,
        } = await supabase
          .from("contributions")
          .insert({
            member_id: memberId,

            amount:
              Number(form.amount),

            contribution_type:
              form.contributionType.trim(),

            payment_date:
              form.paymentDate,

            payment_method:
              form.paymentMethod.trim() ||
              null,

            transaction_reference:
              form.transactionReference.trim() ||
              null,

            notes:
              form.notes.trim() ||
              null,

            evidence_path:
              evidencePath,

            submitted_by:
              user.id,

            approval_status:
              "pending",

            approved_by:
              null,

            approved_at:
              null,
          })

        if (error) {
          throw error
        }

        setMessage(
          "Contribution submitted successfully and is waiting for approval."
        )

        setShowModal(false)
        resetForm()

        await loadPage()
      } catch (error) {
        console.error(
          "Contribution submission error:",
          error
        )

        setError(
          error.message ||
          "Unable to submit contribution."
        )
      } finally {
        setSaving(false)
      }
    }

  const handleViewEvidence =
    async (path) => {
      try {
        setError("")

        if (!path) {
          setError(
            "No payment evidence is attached to this contribution."
          )
          return
        }

        const {
          data,
          error,
        } = await supabase.storage
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
          "Unable to open evidence."
        )
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
      ).format(
        Number(amount) || 0
      )
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

  const getStatusStyle =
    (status) => {
      if (status === "approved") {
        return {
          label: "Approved",
          className:
            "bg-green-50 text-green-700",
          icon: CheckCircle2,
        }
      }

      if (status === "rejected") {
        return {
          label: "Rejected",
          className:
            "bg-red-50 text-red-700",
          icon: XCircle,
        }
      }

      return {
        label: "Pending",
        className:
          "bg-amber-50 text-amber-700",
        icon: Clock3,
      }
    }

  const approvedTotal =
    contributions
      .filter(
        (item) =>
          item.approval_status ===
          "approved"
      )
      .reduce(
        (total, item) =>
          total +
          Number(item.amount),
        0
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
            Loading member profile...
          </p>
        </div>
      </div>
    )
  }

  if (!member) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-8">
        <h1 className="text-xl font-bold text-red-700">
          Member not found
        </h1>
      </div>
    )
  }

  return (
    <div>
      <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex items-center gap-5">
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-[#f1eadc] text-[#9b7c3f]">
            <UserRound size={42} />
          </div>

          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-[#9b7c3f]">
              Member Profile
            </p>

            <h1 className="mt-1 text-3xl font-bold text-slate-900">
              {member.full_name}
            </h1>

            <p className="mt-1 text-slate-500">
              {member.company_position}
            </p>

            {member.email && (
              <p className="mt-1 text-sm text-slate-400">
                {member.email}
              </p>
            )}
          </div>
        </div>

        <button
          onClick={() =>
            setShowModal(true)
          }
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#c5a66a] px-5 py-3 font-semibold text-[#111315] transition hover:bg-[#d2b77d]"
        >
          <Plus size={18} />

          Add Contribution
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

      <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-3">
        <SummaryCard
          label="Approved Contributions"
          value={formatCurrency(
            approvedTotal
          )}
        />

        <SummaryCard
          label="Total Records"
          value={
            contributions.length
          }
        />

        <SummaryCard
          label="Evidence Files"
          value={
            contributions.filter(
              (item) =>
                item.evidence_path
            ).length
          }
        />
      </div>

      <div className="mt-8 rounded-2xl border border-slate-200 bg-white">
        <div className="border-b border-slate-200 px-6 py-5">
          <h2 className="text-lg font-semibold text-slate-900">
            Contribution History
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Approved, pending and rejected contribution records.
          </p>
        </div>

        {contributions.length === 0 ? (
          <div className="p-12 text-center">
            <Receipt
              size={36}
              className="mx-auto text-slate-300"
            />

            <h3 className="mt-4 font-semibold text-slate-900">
              No contributions yet
            </h3>

            <p className="mt-2 text-sm text-slate-500">
              Add the first contribution for this member.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-6 py-4">
                    Date
                  </th>

                  <th className="px-6 py-4">
                    Type
                  </th>

                  <th className="px-6 py-4">
                    Amount
                  </th>

                  <th className="px-6 py-4">
                    Reference
                  </th>

                  <th className="px-6 py-4">
                    Status
                  </th>

                  <th className="px-6 py-4">
                    Evidence
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {contributions.map(
                  (contribution) => {
                    const status =
                      getStatusStyle(
                        contribution.approval_status
                      )

                    const StatusIcon =
                      status.icon

                    return (
                      <tr
                        key={
                          contribution.id
                        }
                        className="text-sm"
                      >
                        <td className="px-6 py-4 text-slate-600">
                          {formatDate(
                            contribution.payment_date
                          )}
                        </td>

                        <td className="px-6 py-4 font-medium text-slate-900">
                          {
                            contribution.contribution_type
                          }
                        </td>

                        <td className="px-6 py-4 font-semibold text-slate-900">
                          {formatCurrency(
                            contribution.amount
                          )}
                        </td>

                        <td className="px-6 py-4 text-slate-600">
                          {
                            contribution.transaction_reference ||
                            "—"
                          }
                        </td>

                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${status.className}`}
                          >
                            <StatusIcon
                              size={13}
                            />

                            {status.label}
                          </span>

                          {contribution.approval_status ===
                            "rejected" &&
                            contribution.rejection_reason && (
                              <p className="mt-2 max-w-xs text-xs text-red-500">
                                {
                                  contribution.rejection_reason
                                }
                              </p>
                            )}
                        </td>

                        <td className="px-6 py-4">
                          {contribution.evidence_path ? (
                            <button
                              onClick={() =>
                                handleViewEvidence(
                                  contribution.evidence_path
                                )
                              }
                              className="inline-flex items-center gap-2 text-sm font-semibold text-[#9b7c3f] hover:underline"
                            >
                              <Receipt
                                size={16}
                              />

                              View

                              <ExternalLink
                                size={13}
                              />
                            </button>
                          ) : (
                            <span className="text-slate-400">
                              —
                            </span>
                          )}
                        </td>
                      </tr>
                    )
                  }
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-8">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  Add Contribution
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Record a contribution for {member.full_name}.
                </p>
              </div>

              <button
                onClick={
                  handleCloseModal
                }
                disabled={saving}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"
              >
                <X size={20} />
              </button>
            </div>

            <form
              onSubmit={
                handleSubmit
              }
              className="space-y-5 p-6"
            >
              <div className="grid gap-5 md:grid-cols-2">
                <Input
                  label="Amount"
                  name="amount"
                  type="number"
                  min="1"
                  step="0.01"
                  value={form.amount}
                  onChange={
                    handleChange
                  }
                  placeholder="500000"
                  required
                />

                <Input
                  label="Contribution Type"
                  name="contributionType"
                  value={
                    form.contributionType
                  }
                  onChange={
                    handleChange
                  }
                  placeholder="Land Deposit"
                  required
                />

                <Input
                  label="Payment Date"
                  name="paymentDate"
                  type="date"
                  value={
                    form.paymentDate
                  }
                  onChange={
                    handleChange
                  }
                  required
                />

                <Input
                  label="Payment Method"
                  name="paymentMethod"
                  value={
                    form.paymentMethod
                  }
                  onChange={
                    handleChange
                  }
                  placeholder="Bank Transfer"
                />

                <div className="md:col-span-2">
                  <Input
                    label="Transaction / Reference Number"
                    name="transactionReference"
                    value={
                      form.transactionReference
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="Transaction reference"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Notes
                  </label>

                  <textarea
                    name="notes"
                    value={form.notes}
                    onChange={
                      handleChange
                    }
                    rows={4}
                    placeholder="Optional notes..."
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-[#c5a66a]"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Payment Evidence
                  </label>

                  <label className="flex cursor-pointer items-center justify-center gap-3 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-6 py-8 transition hover:border-[#c5a66a]">
                    <Upload
                      size={22}
                      className="text-[#9b7c3f]"
                    />

                    <div>
                      <p className="text-sm font-semibold text-slate-700">
                        {evidenceFile
                          ? evidenceFile.name
                          : "Choose screenshot, image or PDF"}
                      </p>

                      <p className="mt-1 text-xs text-slate-400">
                        Stored privately in Supabase Storage
                      </p>
                    </div>

                    <input
                      type="file"
                      accept="image/*,.pdf"
                      onChange={(event) =>
                        setEvidenceFile(
                          event.target
                            .files?.[0] ||
                            null
                        )
                      }
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
                <p className="text-sm text-amber-700">
                  This contribution will be submitted as Pending. Only an approved Treasurer or Main Admin can approve it.
                </p>
              </div>

              <div className="flex justify-end gap-3 border-t border-slate-100 pt-5">
                <button
                  type="button"
                  onClick={
                    handleCloseModal
                  }
                  disabled={saving}
                  className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#c5a66a] px-5 py-3 text-sm font-semibold text-[#111315] transition hover:bg-[#d2b77d] disabled:opacity-50"
                >
                  {saving && (
                    <LoaderCircle
                      size={17}
                      className="animate-spin"
                    />
                  )}

                  {saving
                    ? "Submitting..."
                    : "Submit Contribution"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="mt-4 text-xs text-slate-400">
        Logged in as {loggedInMember?.full_name}
      </div>
    </div>
  )
}

function SummaryCard({
  label,
  value,
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6">
      <p className="text-sm text-slate-500">
        {label}
      </p>

      <p className="mt-2 text-2xl font-bold text-slate-900">
        {value}
      </p>
    </div>
  )
}

function Input({
  label,
  ...props
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-slate-700">
        {label}
      </label>

      <input
        {...props}
        className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-[#c5a66a]"
      />
    </div>
  )
}

export default MemberProfile