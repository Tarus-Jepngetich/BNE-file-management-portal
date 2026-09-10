import {
  LayoutDashboard,
  Users,
  FileText,
  FolderKanban,
  Building2,
  LogOut,
} from "lucide-react"
import { NavLink } from "react-router-dom"

function Sidebar() {
  const navItems = [
    {
      name: "Dashboard",
      path: "/dashboard",
      icon: LayoutDashboard,
    },
    {
      name: "Members",
      path: "/members",
      icon: Users,
    },
    {
      name: "Meetings",
      path: "/meetings",
      icon: FileText,
    },
    {
      name: "Projects",
      path: "/projects",
      icon: FolderKanban,
    },
    {
      name: "Company Documents",
      path: "/company-documents",
      icon: Building2,
    },
  ]

  return (
    <aside className="w-72 min-h-screen bg-[#111315] border-r border-white/10 flex flex-col">
      <div className="px-6 py-7 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-xl bg-[#c5a66a] flex items-center justify-center">
            <span className="font-bold text-[#111315]">
              BNE
            </span>
          </div>

          <div>
            <h1 className="text-white font-semibold">
              BNE Construction
            </h1>

            <p className="text-xs text-slate-500">
              Management Portal
            </p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-4 py-6 space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon

          return (
            <NavLink
              key={item.name}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl transition ${
                  isActive
                    ? "bg-[#c5a66a] text-[#111315]"
                    : "text-slate-400 hover:bg-white/5 hover:text-white"
                }`
              }
            >
              <Icon size={19} />

              <span className="text-sm font-medium">
                {item.name}
              </span>
            </NavLink>
          )
        })}
      </nav>

      <div className="p-4 border-t border-white/10">
        <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:bg-white/5 hover:text-white transition">
          <LogOut size={19} />

          <span className="text-sm font-medium">
            Sign Out
          </span>
        </button>
      </div>
    </aside>
  )
}

export default Sidebar