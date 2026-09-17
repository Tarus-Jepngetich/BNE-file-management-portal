import {
  useEffect,
  useMemo,
  useState,
} from "react"

import {
  Activity,
  Building2,
  CheckCircle2,
  CircleDollarSign,
  ClipboardCheck,
  FileSignature,
  LoaderCircle,
  ReceiptText,
  UserPlus,
  Users,
  Wallet,
} from "lucide-react"

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

import { useNavigate } from "react-router-dom"

import { supabase } from "../lib/supabase"
import { useAuth } from "../context/AuthContext"


function Dashboard() {
  const navigate = useNavigate()

  const {
    member,
    isMainAdmin,
    isTreasurer,
  } = useAuth()


  const [members, setMembers] =
    useState([])

  const [contributions, setContributions] =
    useState([])

  const [projects, setProjects] =
    useState([])

  const [projectExpenses, setProjectExpenses] =
    useState([])

  const [accountRequests, setAccountRequests] =
    useState([])

  const [resolutionSignatories, setResolutionSignatories] =
    useState([])

  const [activityLogs, setActivityLogs] =
    useState([])


  const [loading, setLoading] =
    useState(true)

  const [error, setError] =
    useState("")


  useEffect(() => {
    loadDashboard()
  }, [])


  const loadDashboard = async () => {
    try {
      setLoading(true)
      setError("")


      const requests = [
        supabase
          .from("members")
          .select(`
            id,
            full_name,
            portal_role,
            account_status
          `)
          .order("full_name"),


        supabase
          .from("contributions")
          .select(`
            id,
            member_id,
            amount,
            contribution_type,
            payment_date,
            approval_status
          `)
          .order(
            "payment_date",
            {
              ascending: true,
            }
          ),


        supabase
          .from("projects")
          .select(`
            id,
            title,
            project_status,
            budget,
            expected_completion_date
          `)
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
            amount,
            approval_status
          `),


        supabase
          .from("resolution_signatories")
          .select(`
            id,
            resolution_id,
            member_id,
            status,
            resolutions (
              id,
              title,
              status
            )
          `)
          .eq(
            "status",
            "pending"
          ),


        supabase
          .from("activity_logs")
          .select(`
            id,
            action_type,
            title,
            description,
            created_at,
            members:actor_member_id (
              id,
              full_name
            )
          `)
          .order(
            "created_at",
            {
              ascending: false,
            }
          )
          .limit(8),
      ]


      if (isMainAdmin) {
        requests.push(
          supabase
            .from("registration_requests")
            .select(`
              id,
              full_name,
              email,
              status,
              created_at
            `)
            .eq(
              "status",
              "pending"
            )
        )
      }


      const results =
        await Promise.all(
          requests
        )


      const [
        membersResult,
        contributionsResult,
        projectsResult,
        projectExpensesResult,
        signatoriesResult,
        activityResult,
        accountRequestsResult,
      ] = results


      if (membersResult.error) {
        throw membersResult.error
      }

      if (contributionsResult.error) {
        throw contributionsResult.error
      }

      if (projectsResult.error) {
        throw projectsResult.error
      }

      if (projectExpensesResult.error) {
        throw projectExpensesResult.error
      }

      if (signatoriesResult.error) {
        throw signatoriesResult.error
      }

      if (activityResult.error) {
        throw activityResult.error
      }

      if (
        isMainAdmin &&
        accountRequestsResult?.error
      ) {
        throw accountRequestsResult.error
      }


      setMembers(
        membersResult.data || []
      )

      setContributions(
        contributionsResult.data || []
      )

      setProjects(
        projectsResult.data || []
      )

      setProjectExpenses(
        projectExpensesResult.data || []
      )

      setResolutionSignatories(
        signatoriesResult.data || []
      )

      setActivityLogs(
        activityResult.data || []
      )

      setAccountRequests(
        accountRequestsResult?.data || []
      )

    } catch (error) {

      console.error(
        "Dashboard load error:",
        error
      )

      setError(
        error.message ||
        "Unable to load dashboard."
      )

    } finally {
      setLoading(false)
    }
  }


  // ==================================================
  // CONTRIBUTIONS
  // ==================================================

  const approvedContributions =
    useMemo(
      () =>
        contributions.filter(
          (contribution) =>
            contribution.approval_status ===
            "approved"
        ),
      [contributions]
    )


  const pendingContributions =
    useMemo(
      () =>
        contributions.filter(
          (contribution) =>
            contribution.approval_status ===
            "pending"
        ),
      [contributions]
    )


  const totalApprovedContributions =
    approvedContributions.reduce(
      (total, contribution) =>
        total +
        Number(
          contribution.amount || 0
        ),
      0
    )


  const pendingContributionAmount =
    pendingContributions.reduce(
      (total, contribution) =>
        total +
        Number(
          contribution.amount || 0
        ),
      0
    )


  // ==================================================
  // PROJECT EXPENSES
  // ==================================================

  const approvedProjectExpenses =
    useMemo(
      () =>
        projectExpenses.filter(
          (expense) =>
            expense.approval_status ===
            "approved"
        ),
      [projectExpenses]
    )


  const pendingProjectExpenses =
    useMemo(
      () =>
        projectExpenses.filter(
          (expense) =>
            expense.approval_status ===
            "pending"
        ),
      [projectExpenses]
    )


  const totalApprovedProjectExpenses =
    approvedProjectExpenses.reduce(
      (total, expense) =>
        total +
        Number(
          expense.amount || 0
        ),
      0
    )


  // ==================================================
  // PROJECTS
  // ==================================================

  const ongoingProjects =
    projects.filter(
      (project) =>
        project.project_status ===
        "ongoing"
    ).length


  const completedProjects =
    projects.filter(
      (project) =>
        project.project_status ===
        "completed"
    ).length


  // ==================================================
  // CHART - CONTRIBUTIONS BY MEMBER
  // ==================================================

  const contributionByMember =
    useMemo(() => {
      return members.map(
        (companyMember) => {
          const total =
            approvedContributions
              .filter(
                (contribution) =>
                  contribution.member_id ===
                  companyMember.id
              )
              .reduce(
                (sum, contribution) =>
                  sum +
                  Number(
                    contribution.amount || 0
                  ),
                0
              )


          return {
            member:
              shortenName(
                companyMember.full_name
              ),

            fullName:
              companyMember.full_name,

            amount:
              total,
          }
        }
      )
    }, [
      members,
      approvedContributions,
    ])


  // ==================================================
  // CHART - CONTRIBUTION SHARE
  // ==================================================

  const contributionPieData =
    contributionByMember.filter(
      (item) =>
        item.amount > 0
    )


  // ==================================================
  // CHART - CONTRIBUTIONS OVER TIME
  // ==================================================

  const contributionTimeline =
    useMemo(() => {
      const monthlyTotals = {}


      approvedContributions.forEach(
        (contribution) => {
          if (
            !contribution.payment_date
          ) {
            return
          }


          const date =
            new Date(
              `${contribution.payment_date}T00:00:00`
            )


          const key =
            `${date.getFullYear()}-${String(
              date.getMonth() + 1
            ).padStart(
              2,
              "0"
            )}`


          if (
            !monthlyTotals[key]
          ) {
            monthlyTotals[key] = 0
          }


          monthlyTotals[key] +=
            Number(
              contribution.amount || 0
            )
        }
      )


      return Object.keys(
        monthlyTotals
      )
        .sort()
        .map(
          (month) => ({
            month:
              formatMonth(
                month
              ),

            amount:
              monthlyTotals[
                month
              ],
          })
        )
    }, [
      approvedContributions,
    ])


  // ==================================================
  // SIGNATURE ACTIONS
  // ==================================================

  const myPendingSignatures =
    resolutionSignatories.filter(
      (signatory) =>
        signatory.member_id ===
        member?.id &&
        signatory.resolutions?.status ===
        "pending_signatures"
    )


  const totalUnsignedResolutions =
    resolutionSignatories.filter(
      (signatory) =>
        signatory.resolutions?.status ===
        "pending_signatures"
    ).length


  // ==================================================
  // PENDING ACTION COUNT
  // ==================================================

  let pendingActionCount =
    myPendingSignatures.length


  if (
    isMainAdmin ||
    isTreasurer
  ) {
    pendingActionCount +=
      pendingContributions.length +
      pendingProjectExpenses.length
  }


  if (isMainAdmin) {
    pendingActionCount +=
      accountRequests.length
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
            Loading dashboard...
          </p>

        </div>

      </div>
    )
  }


  return (
    <div>

      {/* HEADER */}

      <div>

        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#9b7c3f]">
          BNE Construction Ltd
        </p>

        <h1 className="mt-2 text-3xl font-bold text-slate-900">
          Dashboard
        </h1>

        <p className="mt-2 text-sm text-slate-500">
          Welcome back,{" "}
          <span className="font-semibold text-slate-700">
            {member?.full_name ||
              "BNE Member"}
          </span>
          .
        </p>

      </div>


      {error && (
        <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}


      {/* MAIN SUMMARY */}

      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

        <SummaryCard
          title="Company Members"
          value={
            members.length
          }
          icon={
            Users
          }
        />


        <SummaryCard
          title="Approved Contributions"
          value={
            formatKES(
              totalApprovedContributions
            )
          }
          icon={
            CircleDollarSign
          }
        />


        <SummaryCard
          title="Projects"
          value={
            projects.length
          }
          icon={
            Building2
          }
          subtitle={
            `${ongoingProjects} ongoing`
          }
        />


        <SummaryCard
          title="Pending Actions"
          value={
            pendingActionCount
          }
          icon={
            ClipboardCheck
          }
        />

      </div>


      {/* ACTION CENTRE */}

      <div className="mt-8 rounded-2xl border border-slate-200 bg-white">

        <div className="border-b border-slate-200 px-6 py-5">

          <h2 className="text-lg font-bold text-slate-900">
            Action Centre
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Items that currently need attention.
          </p>

        </div>


        <div className="grid gap-4 p-6 md:grid-cols-2 xl:grid-cols-4">

          {isMainAdmin && (

            <ActionCard
              title="Account Requests"
              value={
                accountRequests.length
              }
              description="Member registrations waiting for approval."
              icon={
                UserPlus
              }
              onClick={() =>
                navigate(
                  "/account-requests"
                )
              }
            />

          )}


          {(isMainAdmin ||
            isTreasurer) && (

            <ActionCard
              title="Pending Contributions"
              value={
                pendingContributions.length
              }
              description={
                formatKES(
                  pendingContributionAmount
                )
              }
              icon={
                Wallet
              }
              onClick={() =>
                navigate(
                  "/financial-approvals"
                )
              }
            />

          )}


          {(isMainAdmin ||
            isTreasurer) && (

            <ActionCard
              title="Project Expenses"
              value={
                pendingProjectExpenses.length
              }
              description="Expenses waiting for approval."
              icon={
                ReceiptText
              }
              onClick={() =>
                navigate(
                  "/financial-approvals"
                )
              }
            />

          )}


          <ActionCard
            title="My Signatures"
            value={
              myPendingSignatures.length
            }
            description="Resolutions waiting for your signature."
            icon={
              FileSignature
            }
            onClick={() =>
              navigate(
                "/meetings"
              )
            }
          />

        </div>

      </div>


      {/* FINANCIAL SUMMARY */}

      <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">

        <FinanceCard
          title="Approved Contributions"
          value={
            formatKES(
              totalApprovedContributions
            )
          }
          icon={
            CircleDollarSign
          }
        />


        <FinanceCard
          title="Project Spending"
          value={
            formatKES(
              totalApprovedProjectExpenses
            )
          }
          icon={
            ReceiptText
          }
        />


        <FinanceCard
          title="Pending Finance Records"
          value={
            pendingContributions.length +
            pendingProjectExpenses.length
          }
          icon={
            Wallet
          }
        />


        <FinanceCard
          title="Unsigned Resolution Entries"
          value={
            totalUnsignedResolutions
          }
          icon={
            FileSignature
          }
        />

      </div>


      {/* CHARTS */}

      <div className="mt-8 grid gap-6 xl:grid-cols-2">

        {/* BAR */}

        <ChartCard
          title="Contributions by Member"
          description="Approved member contributions only."
        >

          {contributionByMember.some(
            (item) =>
              item.amount > 0
          ) ? (

            <ResponsiveContainer
              width="100%"
              height={320}
            >

              <BarChart
                data={
                  contributionByMember
                }
              >

                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                />

                <XAxis
                  dataKey="member"
                  tick={{
                    fontSize: 11,
                  }}
                />

                <YAxis
                  tickFormatter={
                    compactNumber
                  }
                  tick={{
                    fontSize: 11,
                  }}
                />

                <Tooltip
                  formatter={(value) =>
                    formatKES(
                      value
                    )
                  }
                />

                <Bar
                  dataKey="amount"
                  fill="#c5a66a"
                  radius={[
                    6,
                    6,
                    0,
                    0,
                  ]}
                />

              </BarChart>

            </ResponsiveContainer>

          ) : (

            <ChartEmpty />

          )}

        </ChartCard>


        {/* PIE */}

        <ChartCard
          title="Contribution Share"
          description="Distribution of approved contributions."
        >

          {contributionPieData.length >
          0 ? (

            <ResponsiveContainer
              width="100%"
              height={320}
            >

              <PieChart>

                <Pie
                  data={
                    contributionPieData
                  }
                  dataKey="amount"
                  nameKey="member"
                  outerRadius={105}
                  label={({
                    member,
                  }) =>
                    member
                  }
                >

                  {contributionPieData.map(
                    (
                      entry,
                      index
                    ) => (

                      <Cell
                        key={`${entry.member}-${index}`}
                        fill={
                          PIE_COLORS[
                            index %
                              PIE_COLORS.length
                          ]
                        }
                      />

                    )
                  )}

                </Pie>

                <Tooltip
                  formatter={(value) =>
                    formatKES(
                      value
                    )
                  }
                />

                <Legend />

              </PieChart>

            </ResponsiveContainer>

          ) : (

            <ChartEmpty />

          )}

        </ChartCard>

      </div>


      {/* LINE CHART */}

      <div className="mt-6">

        <ChartCard
          title="Contributions Over Time"
          description="Approved company contributions by month."
        >

          {contributionTimeline.length >
          0 ? (

            <ResponsiveContainer
              width="100%"
              height={320}
            >

              <LineChart
                data={
                  contributionTimeline
                }
              >

                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                />

                <XAxis
                  dataKey="month"
                  tick={{
                    fontSize: 11,
                  }}
                />

                <YAxis
                  tickFormatter={
                    compactNumber
                  }
                  tick={{
                    fontSize: 11,
                  }}
                />

                <Tooltip
                  formatter={(value) =>
                    formatKES(
                      value
                    )
                  }
                />

                <Line
                  type="monotone"
                  dataKey="amount"
                  stroke="#9b7c3f"
                  strokeWidth={3}
                  dot={{
                    r: 4,
                  }}
                />

              </LineChart>

            </ResponsiveContainer>

          ) : (

            <ChartEmpty />

          )}

        </ChartCard>

      </div>


      {/* PROJECT STATUS + ACTIVITY */}

      <div className="mt-8 grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">

        {/* PROJECTS */}

        <div className="rounded-2xl border border-slate-200 bg-white">

          <div className="border-b border-slate-200 px-6 py-5">

            <h2 className="font-bold text-slate-900">
              Project Overview
            </h2>

          </div>


          <div className="space-y-4 p-6">

            <ProjectStatusRow
              label="Total Projects"
              value={
                projects.length
              }
            />

            <ProjectStatusRow
              label="Ongoing"
              value={
                ongoingProjects
              }
            />

            <ProjectStatusRow
              label="Completed"
              value={
                completedProjects
              }
            />

            <ProjectStatusRow
              label="Other Status"
              value={
                Math.max(
                  projects.length -
                    ongoingProjects -
                    completedProjects,
                  0
                )
              }
            />


            <button
              type="button"
              onClick={() =>
                navigate(
                  "/projects"
                )
              }
              className="mt-3 w-full rounded-xl bg-[#111315] px-4 py-3 text-sm font-semibold text-white"
            >
              View Projects
            </button>

          </div>

        </div>


        {/* ACTIVITY */}

        <div className="rounded-2xl border border-slate-200 bg-white">

          <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">

            <div>

              <h2 className="font-bold text-slate-900">
                Recent Activity
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Latest actions in the portal.
              </p>

            </div>


            <button
              type="button"
              onClick={() =>
                navigate(
                  "/activity"
                )
              }
              className="text-sm font-semibold text-[#9b7c3f]"
            >
              View All
            </button>

          </div>


          {activityLogs.length ===
          0 ? (

            <div className="py-12 text-center">

              <Activity
                size={36}
                className="mx-auto text-slate-300"
              />

              <p className="mt-3 text-sm text-slate-500">
                No recent activity yet.
              </p>

            </div>

          ) : (

            <div className="divide-y divide-slate-100">

              {activityLogs.map(
                (log) => (

                  <div
                    key={
                      log.id
                    }
                    className="flex gap-4 px-6 py-4"
                  >

                    <div className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#f1eadc]">

                      <Activity
                        size={16}
                        className="text-[#9b7c3f]"
                      />

                    </div>


                    <div className="min-w-0">

                      <p className="font-semibold text-slate-900">
                        {log.title}
                      </p>


                      {log.description && (

                        <p className="mt-1 line-clamp-2 text-sm text-slate-500">
                          {log.description}
                        </p>

                      )}


                      <p className="mt-2 text-xs text-slate-400">

                        {log.members?.full_name
                          ? `${log.members.full_name} • `
                          : ""}

                        {formatDateTime(
                          log.created_at
                        )}

                      </p>

                    </div>

                  </div>

                )
              )}

            </div>

          )}

        </div>

      </div>

    </div>
  )
}


// ==================================================
// COMPONENTS
// ==================================================

function SummaryCard({
  title,
  value,
  subtitle,
  icon: Icon,
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">

      <div className="flex items-start justify-between gap-4">

        <div>

          <p className="text-sm font-medium text-slate-500">
            {title}
          </p>

          <p className="mt-2 text-2xl font-bold text-slate-900">
            {value}
          </p>


          {subtitle && (
            <p className="mt-1 text-xs text-slate-400">
              {subtitle}
            </p>
          )}

        </div>


        <div className="rounded-xl bg-[#f1eadc] p-3">

          <Icon
            size={21}
            className="text-[#9b7c3f]"
          />

        </div>

      </div>

    </div>
  )
}


function ActionCard({
  title,
  value,
  description,
  icon: Icon,
  onClick,
}) {
  return (
    <button
      type="button"
      onClick={
        onClick
      }
      className="rounded-2xl border border-slate-200 p-5 text-left transition hover:border-[#c5a66a] hover:bg-[#fffdf8]"
    >

      <div className="flex items-start justify-between gap-4">

        <div>

          <p className="font-semibold text-slate-900">
            {title}
          </p>

          <p className="mt-2 text-3xl font-bold text-[#9b7c3f]">
            {value}
          </p>

        </div>


        <Icon
          size={21}
          className="text-[#9b7c3f]"
        />

      </div>


      <p className="mt-3 text-xs leading-5 text-slate-500">
        {description}
      </p>

    </button>
  )
}


function FinanceCard({
  title,
  value,
  icon: Icon,
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">

      <Icon
        size={19}
        className="text-[#9b7c3f]"
      />


      <p className="mt-4 text-sm text-slate-500">
        {title}
      </p>

      <p className="mt-2 text-xl font-bold text-slate-900">
        {value}
      </p>

    </div>
  )
}


function ChartCard({
  title,
  description,
  children,
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6">

      <h2 className="font-bold text-slate-900">
        {title}
      </h2>

      <p className="mt-1 text-sm text-slate-500">
        {description}
      </p>


      <div className="mt-6">
        {children}
      </div>

    </div>
  )
}


function ChartEmpty() {
  return (
    <div className="flex h-[300px] items-center justify-center">

      <div className="text-center">

        <CircleDollarSign
          size={38}
          className="mx-auto text-slate-300"
        />

        <p className="mt-3 text-sm text-slate-500">
          No approved financial data yet.
        </p>

      </div>

    </div>
  )
}


function ProjectStatusRow({
  label,
  value,
}) {
  return (
    <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">

      <span className="text-sm text-slate-500">
        {label}
      </span>

      <span className="font-bold text-slate-900">
        {value}
      </span>

    </div>
  )
}


// ==================================================
// HELPERS
// ==================================================

const PIE_COLORS = [
  "#111315",
  "#9b7c3f",
  "#c5a66a",
  "#6b7280",
  "#8b6c35",
  "#374151",
  "#d6c39d",
  "#78716c",
]


function shortenName(name) {
  if (!name) {
    return "Member"
  }


  const parts =
    name.trim().split(
      /\s+/
    )


  if (
    parts.length === 1
  ) {
    return parts[0]
  }


  return `${parts[0]} ${parts[
    parts.length - 1
  ].charAt(0)}.`
}


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


function compactNumber(value) {
  const number =
    Number(
      value || 0
    )


  if (
    number >= 1000000
  ) {
    return `${(
      number / 1000000
    ).toFixed(1)}M`
  }


  if (
    number >= 1000
  ) {
    return `${(
      number / 1000
    ).toFixed(0)}K`
  }


  return number
}


function formatMonth(
  value
) {
  const [
    year,
    month,
  ] =
    value.split("-")


  return new Date(
    Number(year),
    Number(month) - 1,
    1
  ).toLocaleDateString(
    "en-GB",
    {
      month: "short",
      year: "2-digit",
    }
  )
}


function formatDateTime(
  value
) {
  if (!value) {
    return ""
  }


  return new Date(
    value
  ).toLocaleString(
    "en-GB",
    {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    }
  )
}


export default Dashboard