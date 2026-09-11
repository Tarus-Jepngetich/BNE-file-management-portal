import {
  useEffect,
  useMemo,
  useState,
} from "react"

import {
  Users,
  Banknote,
  Clock3,
  CheckCircle2,
  LoaderCircle,
} from "lucide-react"

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  ResponsiveContainer,
} from "recharts"

import { supabase } from "../lib/supabase"
import { useAuth } from "../context/AuthContext"

function Dashboard() {
  const { member } = useAuth()

  const [members, setMembers] =
    useState([])

  const [contributions, setContributions] =
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

      const [
        membersResult,
        contributionsResult,
      ] = await Promise.all([
        supabase
          .from("members")
          .select(`
            id,
            full_name
          `)
          .order("full_name"),

        supabase
          .from("contributions")
          .select(`
            id,
            member_id,
            amount,
            payment_date,
            approval_status
          `)
          .order(
            "payment_date",
            {
              ascending: true,
            }
          ),
      ])

      if (membersResult.error) {
        throw membersResult.error
      }

      if (contributionsResult.error) {
        throw contributionsResult.error
      }

      setMembers(
        membersResult.data || []
      )

      setContributions(
        contributionsResult.data || []
      )
    } catch (error) {
      console.error(
        "Dashboard error:",
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

  const approvedContributions =
    useMemo(() => {
      return contributions.filter(
        (contribution) =>
          contribution.approval_status ===
          "approved"
      )
    }, [contributions])

  const pendingContributions =
    useMemo(() => {
      return contributions.filter(
        (contribution) =>
          contribution.approval_status ===
          "pending"
      )
    }, [contributions])

  const totalApproved =
    useMemo(() => {
      return approvedContributions.reduce(
        (total, contribution) =>
          total +
          Number(
            contribution.amount
          ),
        0
      )
    }, [approvedContributions])

  const totalPending =
    useMemo(() => {
      return pendingContributions.reduce(
        (total, contribution) =>
          total +
          Number(
            contribution.amount
          ),
        0
      )
    }, [pendingContributions])

  const memberContributionData =
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
                (
                  sum,
                  contribution
                ) =>
                  sum +
                  Number(
                    contribution.amount
                  ),
                0
              )

          return {
            id: companyMember.id,
            name:
              companyMember.full_name,
            total,
          }
        }
      )
    }, [
      members,
      approvedContributions,
    ])

  const pieData =
    useMemo(() => {
      return memberContributionData
        .filter(
          (item) =>
            item.total > 0
        )
        .map((item) => ({
          name: item.name,
          value: item.total,
        }))
    }, [
      memberContributionData,
    ])

  const timelineData =
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
            ).padStart(2, "0")}`

          if (!monthlyTotals[key]) {
            monthlyTotals[key] = 0
          }

          monthlyTotals[key] +=
            Number(
              contribution.amount
            )
        }
      )

      return Object.entries(
        monthlyTotals
      )
        .sort(
          ([monthA], [monthB]) =>
            monthA.localeCompare(
              monthB
            )
        )
        .map(
          ([month, total]) => {
            const [
              year,
              monthNumber,
            ] = month.split("-")

            const date =
              new Date(
                Number(year),
                Number(monthNumber) - 1,
                1
              )

            return {
              month:
                date.toLocaleDateString(
                  "en-GB",
                  {
                    month: "short",
                    year: "2-digit",
                  }
                ),
              total,
            }
          }
        )
    }, [
      approvedContributions,
    ])

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

  const shortCurrency =
    (amount) => {
      const value =
        Number(amount) || 0

      if (value >= 1000000) {
        return `KES ${(value / 1000000).toFixed(1)}M`
      }

      if (value >= 1000) {
        return `KES ${(value / 1000).toFixed(0)}K`
      }

      return `KES ${value}`
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
      <div>
        <p className="text-sm font-semibold uppercase tracking-wider text-[#9b7c3f]">
          Overview
        </p>

        <h1 className="mt-1 text-3xl font-bold text-slate-900">
          Dashboard
        </h1>

        <p className="mt-2 text-slate-500">
          Welcome back,{" "}
          {member?.full_name}.
        </p>
      </div>

      {error && (
        <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Company Members"
          value={members.length}
          icon={Users}
        />

        <StatCard
          title="Approved Contributions"
          value={formatCurrency(
            totalApproved
          )}
          icon={Banknote}
        />

        <StatCard
          title="Pending Contributions"
          value={
            pendingContributions.length
          }
          subtitle={
            formatCurrency(
              totalPending
            )
          }
          icon={Clock3}
        />

        <StatCard
          title="Approved Records"
          value={
            approvedContributions.length
          }
          icon={CheckCircle2}
        />
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Contributions by Member
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Approved contribution totals only.
            </p>
          </div>

          <div className="mt-6 h-[340px]">
            {memberContributionData.some(
              (item) =>
                item.total > 0
            ) ? (
              <ResponsiveContainer
                width="100%"
                height="100%"
              >
                <BarChart
                  data={
                    memberContributionData
                  }
                  margin={{
                    top: 10,
                    right: 10,
                    left: 10,
                    bottom: 40,
                  }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                  />

                  <XAxis
                    dataKey="name"
                    angle={-25}
                    textAnchor="end"
                    interval={0}
                    height={75}
                    tick={{
                      fontSize: 11,
                    }}
                  />

                  <YAxis
                    tickFormatter={
                      shortCurrency
                    }
                    width={85}
                    tick={{
                      fontSize: 11,
                    }}
                  />

                  <Tooltip
                    formatter={(
                      value
                    ) => [
                      formatCurrency(
                        value
                      ),
                      "Approved",
                    ]}
                  />

                  <Bar
                    dataKey="total"
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
              <EmptyChart />
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Contribution Share
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Percentage distribution of approved contributions.
            </p>
          </div>

          <div className="mt-6 h-[340px]">
            {pieData.length > 0 ? (
              <ResponsiveContainer
                width="100%"
                height="100%"
              >
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={110}
                    label={({
                      name,
                      percent,
                    }) =>
                      `${name} ${(
                        percent * 100
                      ).toFixed(0)}%`
                    }
                  >
                    {pieData.map(
                      (
                        entry,
                        index
                      ) => (
                        <Cell
                          key={`${entry.name}-${index}`}
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
                    formatter={(
                      value
                    ) =>
                      formatCurrency(
                        value
                      )
                    }
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <EmptyChart />
            )}
          </div>
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">
            Contributions Over Time
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Approved contributions grouped by month.
          </p>
        </div>

        <div className="mt-6 h-[350px]">
          {timelineData.length > 0 ? (
            <ResponsiveContainer
              width="100%"
              height="100%"
            >
              <LineChart
                data={timelineData}
                margin={{
                  top: 10,
                  right: 20,
                  left: 10,
                  bottom: 10,
                }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                />

                <XAxis
                  dataKey="month"
                />

                <YAxis
                  tickFormatter={
                    shortCurrency
                  }
                  width={85}
                />

                <Tooltip
                  formatter={(
                    value
                  ) => [
                    formatCurrency(
                      value
                    ),
                    "Approved",
                  ]}
                />

                <Line
                  type="monotone"
                  dataKey="total"
                  stroke="#9b7c3f"
                  strokeWidth={3}
                  dot={{
                    r: 4,
                  }}
                  activeDot={{
                    r: 6,
                  }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart />
          )}
        </div>
      </div>
    </div>
  )
}

const PIE_COLORS = [
  "#c5a66a",
  "#111315",
  "#8d7a56",
  "#637083",
  "#b9a47c",
  "#7e8a84",
  "#9a704f",
  "#4c5560",
]

function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-slate-500">
            {title}
          </p>

          <p className="mt-3 text-2xl font-bold text-slate-900">
            {value}
          </p>

          {subtitle && (
            <p className="mt-1 text-xs text-slate-400">
              {subtitle} pending
            </p>
          )}
        </div>

        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#f1eadc] text-[#9b7c3f]">
          <Icon size={21} />
        </div>
      </div>
    </div>
  )
}

function EmptyChart() {
  return (
    <div className="flex h-full items-center justify-center">
      <div className="text-center">
        <Banknote
          size={32}
          className="mx-auto text-slate-300"
        />

        <p className="mt-3 text-sm font-medium text-slate-600">
          No approved contribution data yet
        </p>

        <p className="mt-1 text-xs text-slate-400">
          Approved transactions will appear here automatically.
        </p>
      </div>
    </div>
  )
}

export default Dashboard