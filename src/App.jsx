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
import Projects from "./pages/Projects"
import CompanyDocuments from "./pages/CompanyDocuments"
import AccountRequests from "./pages/AccountRequests"

import DashboardLayout from "./layouts/DashboardLayout"
import ProtectedRoute from "./components/ProtectedRoute"

function App() {
  return (
    <BrowserRouter>

      <Routes>

        {/* PUBLIC */}
        <Route
          path="/"
          element={<Login />}
        />

        <Route
          path="/register"
          element={<Register />}
        />


        {/* PROTECTED PORTAL */}
        <Route
          element={<ProtectedRoute />}
        >

          <Route
            element={
              <DashboardLayout />
            }
          >

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
              element={
                <MemberProfile />
              }
            />

            <Route
              path="/account-requests"
              element={
                <AccountRequests />
              }
            />

            <Route
              path="/meetings"
              element={<Meetings />}
            />

            <Route
              path="/projects"
              element={<Projects />}
            />

            <Route
              path="/company-documents"
              element={
                <CompanyDocuments />
              }
            />

          </Route>

        </Route>

      </Routes>

    </BrowserRouter>
  )
}

export default App