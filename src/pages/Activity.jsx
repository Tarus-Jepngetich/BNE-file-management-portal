import {
  useEffect,
  useMemo,
  useState,
} from "react"

import {
  Activity as ActivityIcon,
  Building2,
  CheckCircle2,
  FileText,
  LoaderCircle,
  ReceiptText,
  RefreshCw,
  Search,
  Signature,
  UserRound,
  XCircle,
} from "lucide-react"

import { supabase } from "../lib/supabase"


function Activity() {
  const [logs, setLogs] =
    useState([])

  const [loading, setLoading] =
    useState(true)

  const [error, setError] =
    useState("")

  const [search, setSearch] =
    useState("")

  const [filter, setFilter] =
    useState("all")


  useEffect(() => {
    loadActivity()
  }, [])


  const loadActivity = async () => {
    try {
      setLoading(true)
      setError("")


      const {
        data,
        error,
      } =
        await supabase
          .from("activity_logs")
          .select(`
            *,
            members:actor_member_id (
              id,
              full_name
            )
          `)
          .order(
            "created_at",
            {
              ascending: false,
            }
          )
          .limit(200)


      if (error) {
        throw error
      }


      setLogs(
        data || []
      )

    } catch (error) {

      console.error(
        "Load activity error:",
        error
      )

      setError(
        error.message ||
          "Unable to load activity."
      )

    } finally {
      setLoading(false)
    }
  }


  const filteredLogs =
    useMemo(() => {
      const query =
        search
          .trim()
          .toLowerCase()


      return logs.filter(
        (log) => {
          const matchesSearch =
            !query ||
            log.title
              ?.toLowerCase()
              .includes(query) ||
            log.description
              ?.toLowerCase()
              .includes(query) ||
            log.members
              ?.full_name
              ?.toLowerCase()
              .includes(query)


          const matchesFilter =
            filter === "all" ||
            getActivityGroup(
              log.action_type
            ) === filter


          return (
            matchesSearch &&
            matchesFilter
          )
        }
      )
    }, [
      logs,
      search,
      filter,
    ])


  if (loading) {
    return (
      <div className="flex min-h-[450px] items-center justify-center">

        <div className="text-center">

          <LoaderCircle
            size={34}
            className="mx-auto animate-spin text-[#9b7c3f]"
          />

          <p className="mt-3 text-sm text-slate-500">
            Loading activity...
          </p>

        </div>

      </div>
    )
  }


  return (
    <div>

      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">

        <div>

          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#9b7c3f]">
            BNE Construction Ltd
          </p>

          <h1 className="mt-2 text-3xl font-bold text-slate-900">
            Activity Log
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            Review important actions across company finances,
            projects, documents and resolutions.
          </p>

        </div>


        <button
          type="button"
          onClick={
            loadActivity
          }
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700"
        >
          <RefreshCw size={17} />
          Refresh
        </button>

      </div>


      {error && (
        <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}


      <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-5">

        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">

          <div className="relative w-full xl:max-w-md">

            <Search
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              value={
                search
              }
              onChange={(event) =>
                setSearch(
                  event.target.value
                )
              }
              placeholder="Search activity..."
              className="w-full rounded-xl border border-slate-200 py-3 pl-11 pr-4 text-sm outline-none focus:border-[#c5a66a]"
            />

          </div>


          <div className="flex flex-wrap gap-2">

            <FilterButton
              label="All"
              active={
                filter === "all"
              }
              onClick={() =>
                setFilter("all")
              }
            />

            <FilterButton
              label="Finance"
              active={
                filter === "finance"
              }
              onClick={() =>
                setFilter("finance")
              }
            />

            <FilterButton
              label="Projects"
              active={
                filter === "projects"
              }
              onClick={() =>
                setFilter("projects")
              }
            />

            <FilterButton
              label="Documents"
              active={
                filter === "documents"
              }
              onClick={() =>
                setFilter("documents")
              }
            />

            <FilterButton
              label="Resolutions"
              active={
                filter === "resolutions"
              }
              onClick={() =>
                setFilter("resolutions")
              }
            />

          </div>

        </div>

      </div>


      <div className="mt-6 rounded-2xl border border-slate-200 bg-white">

        {filteredLogs.length === 0 ? (

          <div className="py-16 text-center">

            <ActivityIcon
              size={42}
              className="mx-auto text-slate-300"
            />

            <h2 className="mt-4 font-bold text-slate-900">
              No activity found
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Portal activity will appear here.
            </p>

          </div>

        ) : (

          <div className="divide-y divide-slate-100">

            {filteredLogs.map(
              (log) => (

                <ActivityRow
                  key={
                    log.id
                  }
                  log={
                    log
                  }
                />

              )
            )}

          </div>

        )}

      </div>

    </div>
  )
}


function ActivityRow({
  log,
}) {
  const Icon =
    getActivityIcon(
      log.action_type
    )


  return (
    <div className="flex gap-4 p-5 sm:p-6">

      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#f1eadc]">

        <Icon
          size={20}
          className="text-[#9b7c3f]"
        />

      </div>


      <div className="min-w-0 flex-1">

        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">

          <div>

            <h3 className="font-bold text-slate-900">
              {log.title}
            </h3>


            {log.description && (

              <p className="mt-1 text-sm leading-6 text-slate-500">
                {log.description}
              </p>

            )}


            <p className="mt-2 text-xs text-slate-400">

              {log.members?.full_name
                ? `By ${log.members.full_name} • `
                : ""}

              {formatDateTime(
                log.created_at
              )}

            </p>

          </div>


          <span className="shrink-0 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500">
            {formatAction(
              log.action_type
            )}
          </span>

        </div>

      </div>

    </div>
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
      onClick={
        onClick
      }
      className={
        active
          ? "rounded-xl bg-[#111315] px-4 py-2 text-sm font-semibold text-white"
          : "rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600"
      }
    >
      {label}
    </button>
  )
}


function getActivityGroup(
  action
) {
  if (
    action.includes(
      "contribution"
    ) ||
    action.includes(
      "expense"
    )
  ) {
    return "finance"
  }


  if (
    action.includes(
      "project"
    )
  ) {
    return "projects"
  }


  if (
    action.includes(
      "document"
    )
  ) {
    return "documents"
  }


  if (
    action.includes(
      "resolution"
    )
  ) {
    return "resolutions"
  }


  return "other"
}


function getActivityIcon(
  action
) {
  if (
    action ===
    "contribution_submitted"
  ) {
    return UserRound
  }


  if (
    action.includes(
      "approved"
    )
  ) {
    return CheckCircle2
  }


  if (
    action.includes(
      "rejected"
    )
  ) {
    return XCircle
  }


  if (
    action.includes(
      "expense"
    )
  ) {
    return ReceiptText
  }


  if (
    action.includes(
      "project"
    )
  ) {
    return Building2
  }


  if (
    action.includes(
      "document"
    )
  ) {
    return FileText
  }


  if (
    action.includes(
      "resolution"
    )
  ) {
    return Signature
  }


  return ActivityIcon
}


function formatAction(
  action
) {
  return String(
    action || ""
  )
    .replaceAll(
      "_",
      " "
    )
    .replace(
      /\b\w/g,
      (character) =>
        character.toUpperCase()
    )
}


function formatDateTime(
  date
) {
  if (!date) {
    return "Unknown"
  }


  return new Date(
    date
  ).toLocaleString(
    "en-GB",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }
  )
}


export default Activity