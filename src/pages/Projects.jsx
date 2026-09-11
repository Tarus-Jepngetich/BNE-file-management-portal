import {
  useEffect,
  useMemo,
  useState,
} from "react"

import { useNavigate } from "react-router-dom"

import {
  Building2,
  CalendarDays,
  CircleDollarSign,
  Clock3,
  LoaderCircle,
  MapPin,
  Plus,
  Search,
  X,
  CheckCircle2,
  PauseCircle,
  Hammer,
  FileText,
} from "lucide-react"

import { supabase } from "../lib/supabase"
import { useAuth } from "../context/AuthContext"


function Projects() {
  const navigate = useNavigate()

  const {
    user,
    isMainAdmin,
  } = useAuth()

  const [projects, setProjects] = useState([])

  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)

  const [error, setError] = useState("")
  const [message, setMessage] = useState("")

  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")

  const [showCreateModal, setShowCreateModal] =
    useState(false)

  const [form, setForm] = useState({
    title: "",
    description: "",
    location: "",
    projectStatus: "planning",
    startDate: "",
    expectedCompletionDate: "",
    budget: "",
  })


  useEffect(() => {
    loadProjects()
  }, [])


  const loadProjects = async () => {
    try {
      setLoading(true)
      setError("")

      const { data, error } =
        await supabase
          .from("projects")
          .select("*")
          .order("created_at", {
            ascending: false,
          })

      if (error) {
        throw error
      }

      setProjects(data || [])
    } catch (error) {
      console.error(
        "Load projects error:",
        error
      )

      setError(
        error.message ||
          "Unable to load projects."
      )
    } finally {
      setLoading(false)
    }
  }


  const resetForm = () => {
    setForm({
      title: "",
      description: "",
      location: "",
      projectStatus: "planning",
      startDate: "",
      expectedCompletionDate: "",
      budget: "",
    })
  }


  const closeCreateModal = () => {
    setShowCreateModal(false)
    resetForm()
  }


  const createProject = async (event) => {
    event.preventDefault()

    try {
      setCreating(true)
      setError("")
      setMessage("")

      if (!isMainAdmin) {
        throw new Error(
          "Only the Main Admin can create projects."
        )
      }

      if (!form.title.trim()) {
        throw new Error(
          "Enter the project title."
        )
      }

      if (
        form.budget &&
        Number(form.budget) < 0
      ) {
        throw new Error(
          "Project budget cannot be negative."
        )
      }

      const { error } =
        await supabase
          .from("projects")
          .insert({
            title:
              form.title.trim(),

            description:
              form.description.trim() ||
              null,

            location:
              form.location.trim() ||
              null,

            project_status:
              form.projectStatus,

            start_date:
              form.startDate ||
              null,

            expected_completion_date:
              form.expectedCompletionDate ||
              null,

            budget:
              form.budget
                ? Number(form.budget)
                : null,

            created_by:
              user.id,
          })

      if (error) {
        throw error
      }

      closeCreateModal()

      setMessage(
        "Project created successfully."
      )

      await loadProjects()
    } catch (error) {
      console.error(
        "Create project error:",
        error
      )

      setError(
        error.message ||
          "Unable to create project."
      )
    } finally {
      setCreating(false)
    }
  }


  const filteredProjects = useMemo(() => {
    const query =
      search.trim().toLowerCase()

    return projects.filter(
      (project) => {
        const matchesStatus =
          statusFilter === "all" ||
          project.project_status ===
            statusFilter

        const matchesSearch =
          !query ||
          project.title
            ?.toLowerCase()
            .includes(query) ||
          project.location
            ?.toLowerCase()
            .includes(query) ||
          project.description
            ?.toLowerCase()
            .includes(query)

        return (
          matchesStatus &&
          matchesSearch
        )
      }
    )
  }, [
    projects,
    search,
    statusFilter,
  ])


  const totalProjects =
    projects.length

  const ongoingProjects =
    projects.filter(
      (project) =>
        project.project_status ===
        "ongoing"
    ).length

  const completedProjects =
    projects.filter(
      (project) =>
        project.project_status ===
        "completed"
    ).length

  const planningProjects =
    projects.filter(
      (project) =>
        project.project_status ===
        "planning"
    ).length


  if (loading) {
    return (
      <div className="flex min-h-[450px] items-center justify-center">
        <div className="text-center">

          <LoaderCircle
            size={34}
            className="mx-auto animate-spin text-[#9b7c3f]"
          />

          <p className="mt-3 text-sm text-slate-500">
            Loading projects...
          </p>

        </div>
      </div>
    )
  }


  return (
    <div>

      {/* PAGE HEADER */}

      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">

        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#9b7c3f]">
            BNE Construction Ltd
          </p>

          <h1 className="mt-2 text-3xl font-bold text-slate-900">
            Projects
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            Manage construction projects, budgets,
            documents, expenses and progress records.
          </p>
        </div>


        {isMainAdmin && (
          <button
            onClick={() =>
              setShowCreateModal(true)
            }
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#111315] px-5 py-3 text-sm font-semibold text-white"
          >
            <Plus size={18} />

            Add Project
          </button>
        )}

      </div>


      {/* MESSAGES */}

      {error && (
        <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {message && (
        <div className="mt-6 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          {message}
        </div>
      )}


      {/* SUMMARY CARDS */}

      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

        <SummaryCard
          title="Total Projects"
          value={totalProjects}
          icon={Building2}
        />

        <SummaryCard
          title="Planning"
          value={planningProjects}
          icon={FileText}
        />

        <SummaryCard
          title="Ongoing"
          value={ongoingProjects}
          icon={Hammer}
        />

        <SummaryCard
          title="Completed"
          value={completedProjects}
          icon={CheckCircle2}
        />

      </div>


      {/* SEARCH / FILTER */}

      <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-5">

        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

          <div className="relative w-full lg:max-w-md">

            <Search
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value
                )
              }
              placeholder="Search projects..."
              className="w-full rounded-xl border border-slate-200 py-3 pl-11 pr-4 text-sm outline-none focus:border-[#c5a66a]"
            />

          </div>


          <div className="flex flex-wrap gap-2">

            <FilterButton
              label="All"
              active={
                statusFilter ===
                "all"
              }
              onClick={() =>
                setStatusFilter(
                  "all"
                )
              }
            />

            <FilterButton
              label="Planning"
              active={
                statusFilter ===
                "planning"
              }
              onClick={() =>
                setStatusFilter(
                  "planning"
                )
              }
            />

            <FilterButton
              label="Ongoing"
              active={
                statusFilter ===
                "ongoing"
              }
              onClick={() =>
                setStatusFilter(
                  "ongoing"
                )
              }
            />

            <FilterButton
              label="On Hold"
              active={
                statusFilter ===
                "on_hold"
              }
              onClick={() =>
                setStatusFilter(
                  "on_hold"
                )
              }
            />

            <FilterButton
              label="Completed"
              active={
                statusFilter ===
                "completed"
              }
              onClick={() =>
                setStatusFilter(
                  "completed"
                )
              }
            />

          </div>

        </div>

      </div>


      {/* PROJECT LIST */}

      <div className="mt-6">

        {filteredProjects.length === 0 ? (

          <div className="rounded-2xl border border-slate-200 bg-white py-16 text-center">

            <Building2
              size={42}
              className="mx-auto text-slate-300"
            />

            <h2 className="mt-5 text-lg font-bold text-slate-900">
              No projects found
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              {projects.length === 0
                ? "Your BNE Construction projects will appear here."
                : "No projects match your current search or filter."}
            </p>


            {isMainAdmin &&
              projects.length ===
                0 && (

              <button
                onClick={() =>
                  setShowCreateModal(
                    true
                  )
                }
                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#c5a66a] px-5 py-3 text-sm font-bold text-[#111315]"
              >
                <Plus size={17} />

                Create First Project
              </button>

            )}

          </div>

        ) : (

          <div className="grid gap-5 xl:grid-cols-2">

            {filteredProjects.map(
              (project) => (

              <ProjectCard
                key={
                  project.id
                }
                project={
                  project
                }
                onOpen={() =>
                  navigate(
                    `/projects/${project.id}`
                  )
                }
              />

            ))}

          </div>

        )}

      </div>


      {/* CREATE PROJECT MODAL */}

      {showCreateModal && (

        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">

          <div className="max-h-[94vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white">

            <div className="flex items-start justify-between border-b border-slate-200 px-6 py-5">

              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  Add Project
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Create a new BNE Construction project.
                </p>
              </div>


              <button
                type="button"
                onClick={
                  closeCreateModal
                }
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"
              >
                <X size={20} />
              </button>

            </div>


            <form
              onSubmit={
                createProject
              }
              className="space-y-5 p-6"
            >

              {/* TITLE */}

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Project Title *
                </label>

                <input
                  value={
                    form.title
                  }
                  onChange={(event) =>
                    setForm(
                      (previous) => ({
                        ...previous,
                        title:
                          event
                            .target
                            .value,
                      })
                    )
                  }
                  placeholder="Elgon View Development"
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-[#c5a66a]"
                />
              </div>


              {/* DESCRIPTION */}

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Description
                </label>

                <textarea
                  value={
                    form.description
                  }
                  onChange={(event) =>
                    setForm(
                      (previous) => ({
                        ...previous,
                        description:
                          event
                            .target
                            .value,
                      })
                    )
                  }
                  rows={4}
                  placeholder="Brief description of the project..."
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 leading-6 outline-none focus:border-[#c5a66a]"
                />
              </div>


              {/* LOCATION + STATUS */}

              <div className="grid gap-5 md:grid-cols-2">

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Location
                  </label>

                  <input
                    value={
                      form.location
                    }
                    onChange={(event) =>
                      setForm(
                        (previous) => ({
                          ...previous,
                          location:
                            event
                              .target
                              .value,
                        })
                      )
                    }
                    placeholder="Elgon View, Eldoret"
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-[#c5a66a]"
                  />
                </div>


                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Status
                  </label>

                  <select
                    value={
                      form.projectStatus
                    }
                    onChange={(event) =>
                      setForm(
                        (previous) => ({
                          ...previous,
                          projectStatus:
                            event
                              .target
                              .value,
                        })
                      )
                    }
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-[#c5a66a]"
                  >
                    <option value="planning">
                      Planning
                    </option>

                    <option value="ongoing">
                      Ongoing
                    </option>

                    <option value="on_hold">
                      On Hold
                    </option>

                    <option value="completed">
                      Completed
                    </option>

                    <option value="cancelled">
                      Cancelled
                    </option>
                  </select>
                </div>

              </div>


              {/* DATES */}

              <div className="grid gap-5 md:grid-cols-2">

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Start Date
                  </label>

                  <input
                    type="date"
                    value={
                      form.startDate
                    }
                    onChange={(event) =>
                      setForm(
                        (previous) => ({
                          ...previous,
                          startDate:
                            event
                              .target
                              .value,
                        })
                      )
                    }
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-[#c5a66a]"
                  />
                </div>


                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Expected Completion
                  </label>

                  <input
                    type="date"
                    value={
                      form.expectedCompletionDate
                    }
                    onChange={(event) =>
                      setForm(
                        (previous) => ({
                          ...previous,
                          expectedCompletionDate:
                            event
                              .target
                              .value,
                        })
                      )
                    }
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-[#c5a66a]"
                  />
                </div>

              </div>


              {/* BUDGET */}

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Project Budget
                </label>

                <div className="relative">

                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-400">
                    KES
                  </span>

                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={
                      form.budget
                    }
                    onChange={(event) =>
                      setForm(
                        (previous) => ({
                          ...previous,
                          budget:
                            event
                              .target
                              .value,
                        })
                      )
                    }
                    placeholder="0.00"
                    className="w-full rounded-xl border border-slate-200 py-3 pl-14 pr-4 outline-none focus:border-[#c5a66a]"
                  />

                </div>
              </div>


              {/* ACTIONS */}

              <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">

                <button
                  type="button"
                  onClick={
                    closeCreateModal
                  }
                  className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700"
                >
                  Cancel
                </button>


                <button
                  type="submit"
                  disabled={
                    creating
                  }
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#c5a66a] px-5 py-3 text-sm font-bold text-[#111315] disabled:cursor-not-allowed disabled:opacity-50"
                >

                  {creating ? (
                    <LoaderCircle
                      size={17}
                      className="animate-spin"
                    />
                  ) : (
                    <Plus
                      size={17}
                    />
                  )}

                  {creating
                    ? "Creating..."
                    : "Create Project"}

                </button>

              </div>

            </form>

          </div>

        </div>

      )}

    </div>
  )
}


function SummaryCard({
  title,
  value,
  icon: Icon,
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">

      <div className="flex items-start justify-between">

        <div>
          <p className="text-sm font-medium text-slate-500">
            {title}
          </p>

          <p className="mt-2 text-3xl font-bold text-slate-900">
            {value}
          </p>
        </div>


        <div className="rounded-xl bg-[#f1eadc] p-3">

          <Icon
            size={21}
            className="text-[#9b7c3f]"
          />

        </div>

      </div>

    </div>
  )
}


function ProjectCard({
  project,
  onOpen,
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 transition hover:border-[#d4c29f] hover:shadow-sm">

      <div className="flex items-start justify-between gap-4">

        <div className="min-w-0">

          <ProjectStatus
            status={
              project.project_status
            }
          />

          <h2 className="mt-3 truncate text-xl font-bold text-slate-900">
            {project.title}
          </h2>

        </div>


        <div className="rounded-xl bg-[#f1eadc] p-3">

          <Building2
            size={21}
            className="text-[#9b7c3f]"
          />

        </div>

      </div>


      {project.description && (

        <p className="mt-4 line-clamp-3 text-sm leading-6 text-slate-500">
          {project.description}
        </p>

      )}


      <div className="mt-5 space-y-3">

        {project.location && (

          <ProjectInfo
            icon={MapPin}
            value={
              project.location
            }
          />

        )}


        {project.start_date && (

          <ProjectInfo
            icon={CalendarDays}
            value={`Started ${formatDate(
              project.start_date
            )}`}
          />

        )}


        {project.expected_completion_date && (

          <ProjectInfo
            icon={Clock3}
            value={`Expected ${formatDate(
              project.expected_completion_date
            )}`}
          />

        )}


        <ProjectInfo
          icon={CircleDollarSign}
          value={
            project.budget !==
              null &&
            project.budget !==
              undefined
              ? `Budget ${formatKES(
                  project.budget
                )}`
              : "Budget not set"
          }
        />

      </div>


      <button
        onClick={onOpen}
        className="mt-6 inline-flex w-full items-center justify-center rounded-xl bg-[#111315] px-4 py-3 text-sm font-semibold text-white"
      >
        View Project
      </button>

    </div>
  )
}


function ProjectInfo({
  icon: Icon,
  value,
}) {
  return (
    <div className="flex items-center gap-3 text-sm text-slate-500">

      <Icon
        size={16}
        className="shrink-0 text-[#9b7c3f]"
      />

      <span>
        {value}
      </span>

    </div>
  )
}


function ProjectStatus({
  status,
}) {
  const styles = {
    planning:
      "bg-slate-100 text-slate-600",

    ongoing:
      "bg-blue-50 text-blue-700",

    on_hold:
      "bg-amber-50 text-amber-700",

    completed:
      "bg-green-50 text-green-700",

    cancelled:
      "bg-red-50 text-red-700",
  }


  const labels = {
    planning:
      "Planning",

    ongoing:
      "Ongoing",

    on_hold:
      "On Hold",

    completed:
      "Completed",

    cancelled:
      "Cancelled",
  }


  const icons = {
    planning:
      FileText,

    ongoing:
      Hammer,

    on_hold:
      PauseCircle,

    completed:
      CheckCircle2,

    cancelled:
      X,
  }


  const Icon =
    icons[status] ||
    FileText


  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
        styles[status] ||
        styles.planning
      }`}
    >

      <Icon size={13} />

      {labels[status] || status}

    </span>
  )
}


function FilterButton({
  label,
  active,
  onClick,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        active
          ? "rounded-xl bg-[#111315] px-4 py-2 text-xs font-semibold text-white"
          : "rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 hover:border-[#c5a66a]"
      }
    >
      {label}
    </button>
  )
}


function formatKES(value) {
  const amount =
    Number(value || 0)

  return new Intl.NumberFormat(
    "en-KE",
    {
      style: "currency",
      currency: "KES",
      maximumFractionDigits: 0,
    }
  ).format(amount)
}


function formatDate(date) {
  if (!date) {
    return "—"
  }

  return new Date(
    `${date}T00:00:00`
  ).toLocaleDateString(
    "en-GB",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  )
}


export default Projects