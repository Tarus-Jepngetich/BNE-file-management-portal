import {
  BrowserRouter,
  Routes,
  Route,
} from "react-router-dom"

import Login from "./pages/Login"
import Register from "./pages/Register"

import Dashboard from "./pages/Dashboard"
import Members from "./pages/Members"
import MemberProfile from "./pages/MemberProfile"
import Meetings from "./pages/Meetings"
import MeetingDetails from "./pages/MeetingDetails"
import Projects from "./pages/Projects"
import CompanyDocuments from "./pages/CompanyDocuments"
import AccountRequests from "./pages/AccountRequests"
import FinancialApprovals from "./pages/FinancialApprovals"

import DashboardLayout from "./layouts/DashboardLayout"

import ProtectedRoute from "./components/ProtectedRoute"
import RoleRoute from "./components/RoleRoute"

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* PUBLIC ROUTES */}
        <Route
          path="/"
          element={<Login />}
        />

        <Route
          path="/register"
          element={<Register />}
        />

        {/* PROTECTED PORTAL */}
        <Route element={<ProtectedRoute />}>
          <Route element={<DashboardLayout />}>

            {/* ALL APPROVED MEMBERS */}

            <Route
              path="/dashboard"
              element={<Dashboard />}
            />

            <Route
              path="/members"
              element={<Members />}
            />

            <Route
              path="/members/:memberId"
              element={<MemberProfile />}
            />

            <Route
              path="/meetings"
              element={<Meetings />}
            />

            <Route
              path="/meetings/:meetingId"
              element={<MeetingDetails />}
            />

            <Route
              path="/projects"
              element={<Projects />}
            />

            <Route
              path="/company-documents"
              element={<CompanyDocuments />}
            />


            {/* MAIN ADMIN ONLY */}

            <Route
              element={
                <RoleRoute
                  allowedRoles={[
                    "main_admin",
                  ]}
                />
              }
            >
              <Route
                path="/account-requests"
                element={<AccountRequests />}
              />
            </Route>


            {/* MAIN ADMIN + TREASURER */}

            <Route
              element={
                <RoleRoute
                  allowedRoles={[
                    "main_admin",
                    "treasurer",
                  ]}
                />
              }
            >
              <Route
                path="/financial-approvals"
                element={<FinancialApprovals />}
              />
            </Route>

          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App