import { Outlet } from "react-router-dom"
import Sidebar from "../components/Sidebar"
import Navbar from "../components/Navbar"

function DashboardLayout() {
  return (
    <div className="min-h-screen bg-[#f5f3ee] flex">
      <Sidebar />

      <div className="flex-1">
        <Navbar />

        <main className="p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default DashboardLayout