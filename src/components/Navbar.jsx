import {
  useAuth,
} from "../context/AuthContext"

function Navbar() {
  const {
    member,
  } = useAuth()

  const getRoleLabel = () => {
    if (
      member?.portal_role ===
      "main_admin"
    ) {
      return "Main Administrator"
    }

    if (
      member?.portal_role ===
      "treasurer"
    ) {
      return "Treasurer"
    }

    return "Director"
  }

  const getInitials = () => {
    if (!member?.full_name) {
      return "B"
    }

    return member.full_name
      .split(" ")
      .map((name) => name[0])
      .join("")
      .slice(0, 2)
      .toUpperCase()
  }

  return (
    <header className="flex h-20 items-center justify-between border-b border-slate-200 bg-white px-8">

      <div>

        <h2 className="text-xl font-semibold text-slate-900">
          BNE Construction Ltd
        </h2>

        <p className="text-sm text-slate-500">
          Company Management Portal
        </p>

      </div>


      <div className="flex items-center gap-3">

        <div className="text-right">

          <p className="text-sm font-semibold text-slate-900">
            {member?.full_name}
          </p>

          <p className="text-xs text-slate-500">
            {getRoleLabel()}
          </p>

        </div>


        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#c5a66a] font-bold text-[#111315]">
          {getInitials()}
        </div>

      </div>

    </header>
  )
}

export default Navbar