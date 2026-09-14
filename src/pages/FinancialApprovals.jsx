import {
  useEffect,
  useMemo,
  useState,
} from "react"

import {
  CheckCircle2,
  CircleDollarSign,
  ExternalLink,
  LoaderCircle,
  ReceiptText,
  RefreshCw,
  UserRound,
  Building2,
  Wallet,
  XCircle,
} from "lucide-react"

import { supabase } from "../lib/supabase"


function FinancialApprovals() {
  const [contributions, setContributions] =
    useState([])

  const [projectExpenses, setProjectExpenses] =
    useState([])

  const [loading, setLoading] =
    useState(true)

  const [reviewingId, setReviewingId] =
    useState(null)

  const [error, setError] =
    useState("")

  const [message, setMessage] =
    useState("")

  const [activeTab, setActiveTab] =
    useState("all")


  useEffect(() => {
    loadApprovals()
  }, [])


  const loadApprovals = async () => {
    try {
      setLoading(true)
      setError("")

      const [
        contributionResult,
        expenseResult,
      ] = await Promise.all([

        supabase
          .from("contributions")
          .select(`
            id,
            member_id,
            amount,
            contribution_type,
            payment_date,
            payment_method,
            transaction_reference,
            notes,
            evidence_path,
            submitted_by,
            approval_status,
            created_at,
            members (
              id,
              full_name
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
          ),

        supabase
          .from("project_expenses")
          .select(`
            id,
            project_id,
            expense_date,
            expense_title,
            category,
            supplier,
            amount,
            transaction_reference,
            notes,
            evidence_path,
            submitted_by,
            approval_status,
            created_at,
            projects (
              id,
              title
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
          ),

      ])


      if (
        contributionResult.error
      ) {
        throw contributionResult.error
      }


      if (
        expenseResult.error
      ) {
        throw expenseResult.error
      }


      setContributions(
        contributionResult.data || []
      )

      setProjectExpenses(
        expenseResult.data || []
      )

    } catch (error) {

      console.error(
        "Load financial approvals error:",
        error
      )

      setError(
        error.message ||
          "Unable to load financial approvals."
      )

    } finally {
      setLoading(false)
    }
  }


  // ==================================================
  // SUMMARY
  // ==================================================

  const pendingContributionAmount =
    useMemo(
      () =>
        contributions.reduce(
          (total, contribution) =>
            total +
            Number(
              contribution.amount || 0
            ),
          0
        ),
      [contributions]
    )


  const pendingProjectExpenseAmount =
    useMemo(
      () =>
        projectExpenses.reduce(
          (total, expense) =>
            total +
            Number(
              expense.amount || 0
            ),
          0
        ),
      [projectExpenses]
    )


  const totalPending =
    contributions.length +
    projectExpenses.length


  // ==================================================
  // CONTRIBUTION APPROVAL
  // ==================================================

  const approveContribution =
    async (contribution) => {
      try {
        setReviewingId(
          `contribution-${contribution.id}`
        )

        setError("")
        setMessage("")


        const { error } =
          await supabase.rpc(
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
          "Contribution approved successfully."
        )


        await loadApprovals()

      } catch (error) {

        console.error(
          "Approve contribution error:",
          error
        )

        setError(
          error.message ||
            "Unable to approve contribution."
        )

      } finally {
        setReviewingId(null)
      }
    }


  const rejectContribution =
    async (contribution) => {
      const reason =
        window.prompt(
          "Enter the reason for rejecting this contribution:"
        )


      if (reason === null) {
        return
      }


      try {
        setReviewingId(
          `contribution-${contribution.id}`
        )

        setError("")
        setMessage("")


        const { error } =
          await supabase.rpc(
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
          "Contribution rejected."
        )


        await loadApprovals()

      } catch (error) {

        console.error(
          "Reject contribution error:",
          error
        )

        setError(
          error.message ||
            "Unable to reject contribution."
        )

      } finally {
        setReviewingId(null)
      }
    }


  // ==================================================
  // PROJECT EXPENSE APPROVAL
  // ==================================================

  const approveProjectExpense =
    async (expense) => {
      try {
        setReviewingId(
          `expense-${expense.id}`
        )

        setError("")
        setMessage("")


        const { error } =
          await supabase.rpc(
            "approve_project_expense",
            {
              p_expense_id:
                expense.id,
            }
          )


        if (error) {
          throw error
        }


        setMessage(
          "Project expense approved successfully."
        )


        await loadApprovals()

      } catch (error) {

        console.error(
          "Approve project expense error:",
          error
        )

        setError(
          error.message ||
            "Unable to approve project expense."
        )

      } finally {
        setReviewingId(null)
      }
    }


  const rejectProjectExpense =
    async (expense) => {
      const reason =
        window.prompt(
          "Enter the reason for rejecting this project expense:"
        )


      if (reason === null) {
        return
      }


      try {
        setReviewingId(
          `expense-${expense.id}`
        )

        setError("")
        setMessage("")


        const { error } =
          await supabase.rpc(
            "reject_project_expense",
            {
              p_expense_id:
                expense.id,

              p_reason:
                reason.trim() ||
                null,
            }
          )


        if (error) {
          throw error
        }


        setMessage(
          "Project expense rejected."
        )


        await loadApprovals()

      } catch (error) {

        console.error(
          "Reject project expense error:",
          error
        )

        setError(
          error.message ||
            "Unable to reject project expense."
        )

      } finally {
        setReviewingId(null)
      }
    }


  // ==================================================
  // EVIDENCE
  // ==================================================

  const viewContributionEvidence =
    async (path) => {
      try {
        setError("")


        const {
          data,
          error,
        } =
          await supabase.storage
            .from(
              "contribution-evidence"
            )
            .createSignedUrl(
              path,
              120
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

        setError(
          error.message ||
            "Unable to open contribution evidence."
        )
      }
    }


  const viewExpenseEvidence =
    async (path) => {
      try {
        setError("")


        const {
          data,
          error,
        } =
          await supabase.storage
            .from(
              "project-expense-evidence"
            )
            .createSignedUrl(
              path,
              120
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

        setError(
          error.message ||
            "Unable to open project expense evidence."
        )
      }
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
            Loading financial approvals...
          </p>

        </div>

      </div>
    )
  }


  return (
    <div>

      {/* HEADER */}

      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">

        <div>

          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#9b7c3f]">
            BNE Construction Ltd
          </p>

          <h1 className="mt-2 text-3xl font-bold text-slate-900">
            Financial Approvals
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            Review member contributions and project
            expenses before they become part of the
            company's official financial records.
          </p>

        </div>


        <button
          type="button"
          onClick={
            loadApprovals
          }
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700"
        >
          <RefreshCw size={17} />
          Refresh
        </button>

      </div>


      {/* MESSAGES */}

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


      {/* SUMMARY */}

      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

        <SummaryCard
          title="Pending Records"
          value={
            totalPending
          }
          icon={
            ReceiptText
          }
        />


        <SummaryCard
          title="Contributions"
          value={
            contributions.length
          }
          icon={
            UserRound
          }
        />


        <SummaryCard
          title="Pending Contributions"
          value={
            formatKES(
              pendingContributionAmount
            )
          }
          icon={
            CircleDollarSign
          }
        />


        <SummaryCard
          title="Pending Project Expenses"
          value={
            formatKES(
              pendingProjectExpenseAmount
            )
          }
          icon={
            Wallet
          }
        />

      </div>


      {/* TABS */}

      <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-3">

        <div className="flex flex-wrap gap-2">

          <TabButton
            label={`All (${totalPending})`}
            active={
              activeTab ===
              "all"
            }
            onClick={() =>
              setActiveTab(
                "all"
              )
            }
          />


          <TabButton
            label={`Contributions (${contributions.length})`}
            active={
              activeTab ===
              "contributions"
            }
            onClick={() =>
              setActiveTab(
                "contributions"
              )
            }
          />


          <TabButton
            label={`Project Expenses (${projectExpenses.length})`}
            active={
              activeTab ===
              "expenses"
            }
            onClick={() =>
              setActiveTab(
                "expenses"
              )
            }
          />

        </div>

      </div>


      {/* CONTRIBUTIONS */}

      {(activeTab === "all" ||
        activeTab === "contributions") && (

        <section className="mt-8">

          <div className="mb-4">

            <h2 className="text-xl font-bold text-slate-900">
              Member Contributions
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Contributions waiting for Treasurer or
              Main Admin approval.
            </p>

          </div>


          {contributions.length === 0 ? (

            <EmptyState
              icon={
                UserRound
              }
              title="No pending contributions"
              text="There are currently no member contributions waiting for approval."
            />

          ) : (

            <div className="grid gap-5">

              {contributions.map(
                (contribution) => (

                  <ContributionCard
                    key={
                      contribution.id
                    }
                    contribution={
                      contribution
                    }
                    reviewing={
                      reviewingId ===
                      `contribution-${contribution.id}`
                    }
                    onApprove={() =>
                      approveContribution(
                        contribution
                      )
                    }
                    onReject={() =>
                      rejectContribution(
                        contribution
                      )
                    }
                    onEvidence={() =>
                      viewContributionEvidence(
                        contribution.evidence_path
                      )
                    }
                  />

                )
              )}

            </div>

          )}

        </section>

      )}


      {/* PROJECT EXPENSES */}

      {(activeTab === "all" ||
        activeTab === "expenses") && (

        <section className="mt-10">

          <div className="mb-4">

            <h2 className="text-xl font-bold text-slate-900">
              Project Expenses
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Expenses waiting for financial approval
              before being counted against project budgets.
            </p>

          </div>


          {projectExpenses.length === 0 ? (

            <EmptyState
              icon={
                Building2
              }
              title="No pending project expenses"
              text="There are currently no project expenses waiting for approval."
            />

          ) : (

            <div className="grid gap-5">

              {projectExpenses.map(
                (expense) => (

                  <ProjectExpenseCard
                    key={
                      expense.id
                    }
                    expense={
                      expense
                    }
                    reviewing={
                      reviewingId ===
                      `expense-${expense.id}`
                    }
                    onApprove={() =>
                      approveProjectExpense(
                        expense
                      )
                    }
                    onReject={() =>
                      rejectProjectExpense(
                        expense
                      )
                    }
                    onEvidence={() =>
                      viewExpenseEvidence(
                        expense.evidence_path
                      )
                    }
                  />

                )
              )}

            </div>

          )}

        </section>

      )}

    </div>
  )
}


// ==================================================
// CONTRIBUTION CARD
// ==================================================

function ContributionCard({
  contribution,
  reviewing,
  onApprove,
  onReject,
  onEvidence,
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6">

      <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">

        <div>

          <div className="flex items-center gap-3">

            <div className="rounded-xl bg-[#f1eadc] p-3">
              <UserRound
                size={20}
                className="text-[#9b7c3f]"
              />
            </div>


            <div>

              <p className="text-xs font-semibold uppercase tracking-wide text-[#9b7c3f]">
                Member Contribution
              </p>

              <h3 className="mt-1 text-lg font-bold text-slate-900">
                {contribution.members?.full_name ||
                  "BNE Member"}
              </h3>

            </div>

          </div>


          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

            <Detail
              label="Amount"
              value={
                formatKES(
                  contribution.amount
                )
              }
            />

            <Detail
              label="Type"
              value={
                contribution.contribution_type ||
                "Not specified"
              }
            />

            <Detail
              label="Payment Date"
              value={
                formatDate(
                  contribution.payment_date
                )
              }
            />

            <Detail
              label="Payment Method"
              value={
                contribution.payment_method ||
                "Not specified"
              }
            />

          </div>


          {contribution.transaction_reference && (
            <p className="mt-4 text-sm text-slate-500">
              Reference:{" "}
              <span className="font-semibold text-slate-700">
                {contribution.transaction_reference}
              </span>
            </p>
          )}


          {contribution.notes && (
            <p className="mt-3 text-sm leading-6 text-slate-500">
              {contribution.notes}
            </p>
          )}

        </div>


        <ReviewActions
          reviewing={
            reviewing
          }
          evidence={
            contribution.evidence_path
          }
          onEvidence={
            onEvidence
          }
          onApprove={
            onApprove
          }
          onReject={
            onReject
          }
        />

      </div>

    </div>
  )
}


// ==================================================
// PROJECT EXPENSE CARD
// ==================================================

function ProjectExpenseCard({
  expense,
  reviewing,
  onApprove,
  onReject,
  onEvidence,
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6">

      <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">

        <div>

          <div className="flex items-center gap-3">

            <div className="rounded-xl bg-[#f1eadc] p-3">
              <Building2
                size={20}
                className="text-[#9b7c3f]"
              />
            </div>


            <div>

              <p className="text-xs font-semibold uppercase tracking-wide text-[#9b7c3f]">
                Project Expense
              </p>

              <h3 className="mt-1 text-lg font-bold text-slate-900">
                {expense.expense_title}
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                {expense.projects?.title ||
                  "Project"}
              </p>

            </div>

          </div>


          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

            <Detail
              label="Amount"
              value={
                formatKES(
                  expense.amount
                )
              }
            />

            <Detail
              label="Category"
              value={
                expense.category ||
                "Not specified"
              }
            />

            <Detail
              label="Expense Date"
              value={
                formatDate(
                  expense.expense_date
                )
              }
            />

            <Detail
              label="Supplier / Payee"
              value={
                expense.supplier ||
                "Not specified"
              }
            />

          </div>


          {expense.transaction_reference && (
            <p className="mt-4 text-sm text-slate-500">
              Reference:{" "}
              <span className="font-semibold text-slate-700">
                {expense.transaction_reference}
              </span>
            </p>
          )}


          {expense.notes && (
            <p className="mt-3 text-sm leading-6 text-slate-500">
              {expense.notes}
            </p>
          )}

        </div>


        <ReviewActions
          reviewing={
            reviewing
          }
          evidence={
            expense.evidence_path
          }
          onEvidence={
            onEvidence
          }
          onApprove={
            onApprove
          }
          onReject={
            onReject
          }
        />

      </div>

    </div>
  )
}


// ==================================================
// SMALL COMPONENTS
// ==================================================

function ReviewActions({
  reviewing,
  evidence,
  onEvidence,
  onApprove,
  onReject,
}) {
  return (
    <div className="flex shrink-0 flex-wrap gap-2">

      {evidence && (
        <button
          type="button"
          onClick={
            onEvidence
          }
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700"
        >
          <ExternalLink size={15} />
          Evidence
        </button>
      )}


      <button
        type="button"
        disabled={
          reviewing
        }
        onClick={
          onApprove
        }
        className="inline-flex items-center gap-2 rounded-xl bg-green-50 px-4 py-2.5 text-sm font-semibold text-green-700 disabled:cursor-not-allowed disabled:opacity-50"
      >

        {reviewing ? (
          <LoaderCircle
            size={15}
            className="animate-spin"
          />
        ) : (
          <CheckCircle2
            size={15}
          />
        )}

        Approve
      </button>


      <button
        type="button"
        disabled={
          reviewing
        }
        onClick={
          onReject
        }
        className="inline-flex items-center gap-2 rounded-xl bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <XCircle size={15} />
        Reject
      </button>

    </div>
  )
}


function SummaryCard({
  title,
  value,
  icon: Icon,
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">

      <div className="flex items-start justify-between gap-4">

        <div>

          <p className="text-sm font-medium text-slate-500">
            {title}
          </p>

          <p className="mt-2 text-xl font-bold text-slate-900">
            {value}
          </p>

        </div>


        <div className="rounded-xl bg-[#f1eadc] p-3">
          <Icon
            size={20}
            className="text-[#9b7c3f]"
          />
        </div>

      </div>

    </div>
  )
}


function Detail({
  label,
  value,
}) {
  return (
    <div className="rounded-xl bg-slate-50 p-4">

      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </p>

      <p className="mt-2 text-sm font-semibold text-slate-800">
        {value}
      </p>

    </div>
  )
}


function EmptyState({
  icon: Icon,
  title,
  text,
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white py-14 text-center">

      <Icon
        size={38}
        className="mx-auto text-slate-300"
      />

      <h3 className="mt-4 font-semibold text-slate-900">
        {title}
      </h3>

      <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
        {text}
      </p>

    </div>
  )
}


function TabButton({
  label,
  active,
  onClick,
}) {
  return (
    <button
      type="button"
      onClick={
        onClick
      }
      className={
        active
          ? "rounded-xl bg-[#111315] px-4 py-2.5 text-sm font-semibold text-white"
          : "rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-500 hover:bg-slate-50 hover:text-slate-900"
      }
    >
      {label}
    </button>
  )
}


// ==================================================
// FORMATTERS
// ==================================================

function formatKES(value) {
  return new Intl.NumberFormat(
    "en-KE",
    {
      style: "currency",
      currency: "KES",
      maximumFractionDigits: 0,
    }
  ).format(
    Number(
      value || 0
    )
  )
}


function formatDate(date) {
  if (!date) {
    return "Not set"
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


export default FinancialApprovals