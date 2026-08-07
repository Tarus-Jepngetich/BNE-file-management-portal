import { BrowserRouter, Routes, Route } from "react-router-dom"

import Login from "./pages/Login"
import Dashboard from "./pages/Dashboard"
import Members from "./pages/Members"
import Meetings from "./pages/Meetings"
import Projects from "./pages/Projects"
import CompanyDocuments from "./pages/CompanyDocuments"

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/members" element={<Members />} />
        <Route path="/meetings" element={<Meetings />} />
        <Route path="/projects" element={<Projects />} />
        <Route
          path="/company-documents"
          element={<CompanyDocuments />}
        />
      </Routes>
    </BrowserRouter>
  )
}

export default App