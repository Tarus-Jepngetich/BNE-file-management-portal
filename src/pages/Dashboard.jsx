import {
  Users,
  Wallet,
  FolderKanban,
  FileText,
} from "lucide-react"

function Dashboard() {
  const stats = [
    {
      title: "Members",
      value: "8",
      description: "Registered directors",
      icon: Users,
    },
    {
      title: "Total Contributions",
      value: "KSh 0",
      description: "Recorded contributions",
      icon: Wallet,
    },
    {
      title: "Active Projects",
      value: "0",
      description: "Projects in progress",
      icon: FolderKanban,
    },
    {
      title: "Meetings",
      value: "0",
      description: "Recorded meetings",
      icon: FileText,
    },
  ]

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">
          Dashboard
        </h1>

        <p className="mt-2 text-slate-500">
          Overview of BNE Construction Ltd activities.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
        {stats.map((stat) => {
          const Icon = stat.icon

          return (
            <div
              key={stat.title}
              className="bg-white rounded-2xl border border-slate-200 p-6"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-slate-500">
                    {stat.title}
                  </p>

                  <h3 className="mt-2 text-2xl font-bold text-slate-900">
                    {stat.value}
                  </h3>
                </div>

                <div className="h-11 w-11 rounded-xl bg-[#f1eadc] flex items-center justify-center text-[#9b7c3f]">
                  <Icon size={21} />
                </div>
              </div>

              <p className="mt-4 text-xs text-slate-400">
                {stat.description}
              </p>
            </div>
          )
        })}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mt-8">
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-slate-900">
              Member Contributions
            </h2>

            <p className="text-sm text-slate-500">
              Contribution comparison will appear here.
            </p>
          </div>

          <div className="h-64 rounded-xl bg-slate-50 flex items-center justify-center">
            <p className="text-sm text-slate-400">
              Bar chart coming next
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-slate-900">
              Contribution Distribution
            </h2>

            <p className="text-sm text-slate-500">
              Percentage contribution by member.
            </p>
          </div>

          <div className="h-64 rounded-xl bg-slate-50 flex items-center justify-center">
            <p className="text-sm text-slate-400">
              Pie chart coming next
            </p>
          </div>
        </div>
      </div>

      <div className="mt-8 bg-white rounded-2xl border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-900">
          Recent Activity
        </h2>

        <div className="mt-6 rounded-xl bg-slate-50 py-12 text-center">
          <p className="text-sm text-slate-400">
            No activity recorded yet.
          </p>
        </div>
      </div>
    </div>
  )
}

export default Dashboard