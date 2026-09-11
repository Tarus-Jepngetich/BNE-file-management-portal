import {
  LayoutDashboard,
  Users,
  UserCheck,
  FileText,
  FolderKanban,
  Building2,
  LogOut,
  WalletCards,
} from "lucide-react"

import {
  NavLink,
  useNavigate,
} from "react-router-dom"

import {
  useAuth,
} from "../context/AuthContext"

function Sidebar() {
  const navigate = useNavigate()

  const {
    member,
    isMainAdmin,
    isTreasurer,
    signOut,
  } = useAuth()

  const navItems = [
    {
      name: "Dashboard",
      path: "/dashboard",
      icon: LayoutDashboard,
      visible: true,
    },

    {
      name: "Members",
      path: "/members",
      icon: Users,
      visible: true,
    },

    {
      name: "Account Requests",
      path: "/account-requests",
      icon: UserCheck,
      visible: isMainAdmin,
    },

    {
      name: "Financial Approvals",
      path: "/financial-approvals",
      icon: WalletCards,
      visible:
        isMainAdmin ||
        isTreasurer,
    },

    {
      name: "Meetings",
      path: "/meetings",
      icon: FileText,
      visible: true,
    },

    {
      name: "Projects",
      path: "/projects",
      icon: FolderKanban,
      visible: true,
    },

    {
      name: "Company Documents",
      path: "/company-documents",
      icon: Building2,
      visible: true,
    },
  ]

  const visibleItems =
    navItems.filter(
      (item) => item.visible
    )

  const handleSignOut = async () => {
    try {
      await signOut()

      navigate("/", {
        replace: true,
      })
    } catch (error) {
      console.error(error)
    }
  }

  const getRoleLabel = () => {
    if (
      member?.portal_role ===
      "main_admin"
    ) {
      return "Main Admin"
    }

    if (
      member?.portal_role ===
      "treasurer"
    ) {
      return "Treasurer"
    }

    return "Director"
  }

  return (
    <aside className="flex min-h-screen w-72 flex-col border-r border-white/10 bg-[#111315]">

      {/* LOGO */}
      <div className="border-b border-white/10 px-6 py-7">

        <div className="flex items-center gap-3">

          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#c5a66a]">

            <span className="font-bold text-[#111315]">
              BNE
            </span>

          </div>

          <div>

            <h1 className="font-semibold text-white">
              BNE Construction
            </h1>

            <p className="text-xs text-slate-500">
              Management Portal
            </p>

          </div>

        </div>

      </div>


      {/* NAVIGATION */}
      <nav className="flex-1 space-y-2 px-4 py-6">

        {visibleItems.map(
          (item) => {

            const Icon =
              item.icon

            return (
              <NavLink
                key={item.name}
                to={item.path}
                className={({
                  isActive,
                }) =>
                  `flex items-center gap-3 rounded-xl px-4 py-3 transition ${
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
          }
        )}

      </nav>


      {/* LOGGED IN MEMBER */}
      <div className="border-t border-white/10 p-4">

        <div className="mb-3 rounded-xl bg-white/5 px-4 py-3">

          <p className="truncate text-sm font-semibold text-white">
            {member?.full_name}
          </p>

          <p className="mt-1 text-xs text-[#c5a66a]">
            {getRoleLabel()}
          </p>

        </div>


        <button
          onClick={handleSignOut}
          className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-slate-400 transition hover:bg-white/5 hover:text-white"
        >

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