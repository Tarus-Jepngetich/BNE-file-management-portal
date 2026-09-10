import { UserRound, Search, Plus } from "lucide-react"
import { Link } from "react-router-dom"

function Members() {
  const members = [
    {
      id: "abel-kiprop",
      name: "Abel Kiprop",
    },
    {
      id: "mercy-tarus",
      name: "Mercy Tarus",
    },
    {
      id: "samuel-kiptoo",
      name: "Samuel Kiptoo",
    },
    {
      id: "cosmas-kipketer",
      name: "Cosmas Kipketer",
    },
    {
      id: "josphat-kipkirui",
      name: "Josphat Kipkirui",
    },
    {
      id: "elizabeth-chebichii",
      name: "Elizabeth Chebichii",
    },
    {
      id: "sharon-chepkirui",
      name: "Sharon Chepkirui",
    },
    {
      id: "dennis-kipkorir",
      name: "Dennis Kipkorir",
    },
  ]

  return (
    <div>
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">
            Members
          </h1>

          <p className="mt-2 text-slate-500">
            Manage BNE Construction Ltd member profiles and contributions.
          </p>
        </div>

        <button className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#c5a66a] px-4 py-3 font-semibold text-[#111315] transition hover:bg-[#d2b77d]">
          <Plus size={18} />
          Add Member
        </button>
      </div>

      <div className="mt-8 flex max-w-md items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3">
        <Search size={18} className="text-slate-400" />

        <input
          type="text"
          placeholder="Search members..."
          className="w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
        />
      </div>

      <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
        {members.map((member) => (
          <div
            key={member.id}
            className="rounded-2xl border border-slate-200 bg-white p-6"
          >
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#f1eadc] text-[#9b7c3f]">
              <UserRound size={34} />
            </div>

            <h2 className="mt-5 text-lg font-semibold text-slate-900">
              {member.name}
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Director
            </p>

            <div className="mt-6 border-t border-slate-100 pt-5">
              <p className="text-xs uppercase tracking-wide text-slate-400">
                Total Contribution
              </p>

              <p className="mt-1 text-lg font-bold text-slate-900">
                KSh 0
              </p>
            </div>

            <Link
              to={`/members/${member.id}`}
              className="mt-5 block w-full rounded-xl border border-slate-200 px-4 py-3 text-center text-sm font-semibold text-slate-700 transition hover:border-[#c5a66a] hover:text-[#9b7c3f]"
            >
              View Profile
            </Link>
          </div>
        ))}
      </div>
    </div>
  )
}

export default Members