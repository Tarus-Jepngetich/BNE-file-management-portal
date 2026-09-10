import { useState } from "react"
import { useParams, Link } from "react-router-dom"
import {
  ArrowLeft,
  UserRound,
  CreditCard,
  Wallet,
  FileImage,
  Plus,
  X,
  Upload,
  Eye,
} from "lucide-react"

const members = [
  {
    id: "abel-kiprop",
    name: "Abel Kiprop",
    role: "Director",
  },
  {
    id: "mercy-tarus",
    name: "Mercy Tarus",
    role: "Director",
  },
  {
    id: "samuel-kiptoo",
    name: "Samuel Kiptoo",
    role: "Director",
  },
  {
    id: "cosmas-kipketer",
    name: "Cosmas Kipketer",
    role: "Director",
  },
  {
    id: "josphat-kipkirui",
    name: "Josphat Kipkirui",
    role: "Director",
  },
  {
    id: "elizabeth-chebichii",
    name: "Elizabeth Chebichii",
    role: "Director",
  },
  {
    id: "sharon-chepkirui",
    name: "Sharon Chepkirui",
    role: "Director",
  },
  {
    id: "dennis-kipkorir",
    name: "Dennis Kipkorir",
    role: "Director",
  },
]

function MemberProfile() {
  const { memberId } = useParams()

  const member = members.find((item) => item.id === memberId)

  const [showContributionForm, setShowContributionForm] = useState(false)

  const [contributions, setContributions] = useState([])

  const [formData, setFormData] = useState({
    amount: "",
    type: "",
    date: "",
    paymentMethod: "",
    reference: "",
    notes: "",
    evidence: null,
  })

  if (!member) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Member not found
        </h1>

        <Link
          to="/members"
          className="mt-4 inline-block text-[#9b7c3f]"
        >
          Back to members
        </Link>
      </div>
    )
  }

  const handleChange = (e) => {
    const { name, value } = e.target

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }))
  }

  const handleEvidenceChange = (e) => {
    const file = e.target.files[0]

    if (!file) return

    setFormData((previous) => ({
      ...previous,
      evidence: file,
    }))
  }

  const handleSubmitContribution = (e) => {
    e.preventDefault()

    const newContribution = {
      id: Date.now(),
      ...formData,
      amount: Number(formData.amount),
      recordedBy: "Main Admin",
    }

    setContributions((previous) => [
      newContribution,
      ...previous,
    ])

    setFormData({
      amount: "",
      type: "",
      date: "",
      paymentMethod: "",
      reference: "",
      notes: "",
      evidence: null,
    })

    setShowContributionForm(false)
  }

  const totalContribution = contributions.reduce(
    (total, item) => total + item.amount,
    0
  )

  return (
    <div>
      <Link
        to="/members"
        className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-[#9b7c3f]"
      >
        <ArrowLeft size={18} />
        Back to Members
      </Link>

      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-5">
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-[#f1eadc] text-[#9b7c3f]">
              <UserRound size={40} />
            </div>

            <div>
              <h1 className="text-3xl font-bold text-slate-900">
                {member.name}
              </h1>

              <p className="mt-1 text-slate-500">
                {member.role}
              </p>

              <span className="mt-3 inline-flex rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">
                Active Member
              </span>
            </div>
          </div>

          <button className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-[#c5a66a] hover:text-[#9b7c3f]">
            Edit Profile
          </button>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <div className="flex items-center gap-3">
            <CreditCard
              size={20}
              className="text-[#9b7c3f]"
            />

            <h2 className="text-lg font-semibold text-slate-900">
              ID Document
            </h2>
          </div>

          <p className="mt-3 text-sm text-slate-500">
            Store and manage this member&apos;s identification document.
          </p>

          <div className="mt-6 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
            <CreditCard
              size={30}
              className="mx-auto text-slate-400"
            />

            <p className="mt-3 text-sm font-medium text-slate-600">
              No ID uploaded
            </p>

            <button className="mt-4 rounded-lg bg-[#111315] px-4 py-2 text-sm font-semibold text-white">
              Upload ID
            </button>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <div className="flex items-center gap-3">
            <Wallet
              size={20}
              className="text-[#9b7c3f]"
            />

            <h2 className="text-lg font-semibold text-slate-900">
              Contributions
            </h2>
          </div>

          <p className="mt-3 text-sm text-slate-500">
            Total verified contributions made by this member.
          </p>

          <p className="mt-8 text-3xl font-bold text-slate-900">
            KSh {totalContribution.toLocaleString()}
          </p>

          <p className="mt-2 text-xs text-slate-400">
            {contributions.length} contribution record
            {contributions.length !== 1 ? "s" : ""}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <div className="flex items-center gap-3">
            <FileImage
              size={20}
              className="text-[#9b7c3f]"
            />

            <h2 className="text-lg font-semibold text-slate-900">
              Payment Evidence
            </h2>
          </div>

          <p className="mt-3 text-sm text-slate-500">
            Bank screenshots and payment evidence are attached to each
            contribution.
          </p>

          <div className="mt-7 rounded-xl bg-slate-50 p-5 text-center">
            <p className="text-sm text-slate-400">
              {
                contributions.filter((item) => item.evidence)
                  .length
              }{" "}
              evidence file(s) attached.
            </p>
          </div>
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-slate-200 bg-white">
        <div className="flex flex-col gap-4 border-b border-slate-100 p-6 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Contribution History
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Contributions and payment evidence recorded for{" "}
              {member.name}.
            </p>
          </div>

          <button
            onClick={() => setShowContributionForm(true)}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#c5a66a] px-4 py-3 text-sm font-semibold text-[#111315] transition hover:bg-[#d2b77d]"
          >
            <Plus size={18} />
            Add Contribution
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px]">
            <thead className="bg-slate-50">
              <tr className="text-left text-xs uppercase tracking-wide text-slate-500">
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Type</th>
                <th className="px-6 py-4">Amount</th>
                <th className="px-6 py-4">Payment</th>
                <th className="px-6 py-4">Reference</th>
                <th className="px-6 py-4">Evidence</th>
                <th className="px-6 py-4">Recorded By</th>
              </tr>
            </thead>

            <tbody>
              {contributions.length === 0 ? (
                <tr>
                  <td
                    colSpan="7"
                    className="px-6 py-14 text-center text-sm text-slate-400"
                  >
                    No contribution records yet.
                  </td>
                </tr>
              ) : (
                contributions.map((contribution) => (
                  <tr
                    key={contribution.id}
                    className="border-t border-slate-100"
                  >
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {contribution.date}
                    </td>

                    <td className="px-6 py-4 text-sm text-slate-600">
                      {contribution.type}
                    </td>

                    <td className="px-6 py-4 text-sm font-semibold text-slate-900">
                      KSh{" "}
                      {contribution.amount.toLocaleString()}
                    </td>

                    <td className="px-6 py-4 text-sm text-slate-600">
                      {contribution.paymentMethod ||
                        "Not specified"}
                    </td>

                    <td className="px-6 py-4 text-sm text-slate-600">
                      {contribution.reference || "—"}
                    </td>

                    <td className="px-6 py-4">
                      {contribution.evidence ? (
                        <span className="inline-flex items-center gap-2 rounded-lg bg-green-50 px-3 py-2 text-xs font-semibold text-green-700">
                          <Eye size={15} />
                          {contribution.evidence.name}
                        </span>
                      ) : (
                        <span className="text-sm text-slate-400">
                          No evidence
                        </span>
                      )}
                    </td>

                    <td className="px-6 py-4 text-sm text-slate-600">
                      {contribution.recordedBy}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showContributionForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 py-8">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  Add Contribution
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Record a contribution for {member.name}.
                </p>
              </div>

              <button
                onClick={() =>
                  setShowContributionForm(false)
                }
                className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              >
                <X size={22} />
              </button>
            </div>

            <form
              onSubmit={handleSubmitContribution}
              className="space-y-5 p-6"
            >
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Amount
                </label>

                <div className="flex overflow-hidden rounded-xl border border-slate-200">
                  <span className="flex items-center bg-slate-50 px-4 text-sm font-medium text-slate-500">
                    KSh
                  </span>

                  <input
                    type="number"
                    name="amount"
                    value={formData.amount}
                    onChange={handleChange}
                    min="1"
                    placeholder="500000"
                    required
                    className="w-full px-4 py-3 text-sm text-slate-900 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Contribution Type
                  </label>

                  <select
                    name="type"
                    value={formData.type}
                    onChange={handleChange}
                    required
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-[#c5a66a]"
                  >
                    <option value="">
                      Select type
                    </option>

                    <option value="Deposit">
                      Deposit
                    </option>

                    <option value="Goodwill">
                      Goodwill
                    </option>

                    <option value="Land Payment">
                      Land Payment
                    </option>

                    <option value="Project Contribution">
                      Project Contribution
                    </option>

                    <option value="Service Payment">
                      Service Payment
                    </option>

                    <option value="Other">
                      Other
                    </option>
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Payment Date
                  </label>

                  <input
                    type="date"
                    name="date"
                    value={formData.date}
                    onChange={handleChange}
                    required
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none focus:border-[#c5a66a]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Payment Method
                  </label>

                  <select
                    name="paymentMethod"
                    value={formData.paymentMethod}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-[#c5a66a]"
                  >
                    <option value="">
                      Select method
                    </option>

                    <option value="Bank Transfer">
                      Bank Transfer
                    </option>

                    <option value="M-Pesa">
                      M-Pesa
                    </option>

                    <option value="Cash">
                      Cash
                    </option>

                    <option value="Cheque">
                      Cheque
                    </option>

                    <option value="Other">
                      Other
                    </option>
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Transaction / Reference
                  </label>

                  <input
                    type="text"
                    name="reference"
                    value={formData.reference}
                    onChange={handleChange}
                    placeholder="Transaction reference"
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-[#c5a66a]"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Notes
                </label>

                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  rows="4"
                  placeholder="Add any notes about this contribution..."
                  className="w-full resize-none rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-[#c5a66a]"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Payment Evidence
                </label>

                <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 p-8 text-center transition hover:border-[#c5a66a]">
                  <Upload
                    size={28}
                    className="text-slate-400"
                  />

                  {formData.evidence ? (
                    <>
                      <p className="mt-3 text-sm font-semibold text-slate-700">
                        {formData.evidence.name}
                      </p>

                      <p className="mt-1 text-xs text-slate-400">
                        Click to select another file
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="mt-3 text-sm font-medium text-slate-600">
                        Upload bank screenshot or payment
                        evidence
                      </p>

                      <p className="mt-1 text-xs text-slate-400">
                        JPG, PNG or PDF
                      </p>
                    </>
                  )}

                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={handleEvidenceChange}
                    className="hidden"
                  />
                </label>
              </div>

              <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() =>
                    setShowContributionForm(false)
                  }
                  className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="rounded-xl bg-[#c5a66a] px-5 py-3 text-sm font-semibold text-[#111315] transition hover:bg-[#d2b77d]"
                >
                  Save Contribution
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default MemberProfile