import {
  useEffect,
  useState,
} from "react"

import { Link } from "react-router-dom"

import {
  CalendarDays,
  Plus,
  Search,
  Clock3,
  MapPin,
  Users,
  LoaderCircle,
  X,
  FileText,
  ArrowRight,
} from "lucide-react"

import { supabase } from "../lib/supabase"
import { useAuth } from "../context/AuthContext"

function Meetings() {
  const {
    user,
    isMainAdmin,
  } = useAuth()

  const [meetings, setMeetings] =
    useState([])

  const [loading, setLoading] =
    useState(true)

  const [saving, setSaving] =
    useState(false)

  const [error, setError] =
    useState("")

  const [message, setMessage] =
    useState("")

  const [search, setSearch] =
    useState("")

  const [showModal, setShowModal] =
    useState(false)

  const [form, setForm] =
    useState({
      title: "",
      meetingDate: "",
      startTime: "",
      endTime: "",
      location: "",
      meetingType: "directors",
      agenda: "",
      notes: "",
      status: "scheduled",
    })

  useEffect(() => {
    fetchMeetings()
  }, [])

  const fetchMeetings =
    async () => {
      try {
        setLoading(true)
        setError("")

        const {
          data,
          error,
        } = await supabase
          .from("meetings")
          .select(`
            id,
            title,
            meeting_date,
            start_time,
            end_time,
            location,
            meeting_type,
            agenda,
            notes,
            status,
            created_at
          `)
          .order(
            "meeting_date",
            {
              ascending: false,
            }
          )

        if (error) {
          throw error
        }

        setMeetings(
          data || []
        )
      } catch (error) {
        console.error(
          "Meetings error:",
          error
        )

        setError(
          error.message ||
          "Unable to load meetings."
        )
      } finally {
        setLoading(false)
      }
    }

  const handleChange =
    (event) => {
      const {
        name,
        value,
      } = event.target

      setForm(
        (previous) => ({
          ...previous,
          [name]: value,
        })
      )
    }

  const resetForm = () => {
    setForm({
      title: "",
      meetingDate: "",
      startTime: "",
      endTime: "",
      location: "",
      meetingType: "directors",
      agenda: "",
      notes: "",
      status: "scheduled",
    })
  }

  const handleSubmit =
    async (event) => {
      event.preventDefault()

      try {
        setSaving(true)
        setError("")
        setMessage("")

        if (!user) {
          throw new Error(
            "You must be logged in."
          )
        }

        if (!form.title.trim()) {
          throw new Error(
            "Enter a meeting title."
          )
        }

        if (!form.meetingDate) {
          throw new Error(
            "Select the meeting date."
          )
        }

        const {
          error,
        } = await supabase
          .from("meetings")
          .insert({
            title:
              form.title.trim(),

            meeting_date:
              form.meetingDate,

            start_time:
              form.startTime ||
              null,

            end_time:
              form.endTime ||
              null,

            location:
              form.location.trim() ||
              null,

            meeting_type:
              form.meetingType,

            agenda:
              form.agenda.trim() ||
              null,

            notes:
              form.notes.trim() ||
              null,

            status:
              form.status,

            created_by:
              user.id,
          })

        if (error) {
          throw error
        }

        setMessage(
          "Meeting created successfully."
        )

        setShowModal(false)

        resetForm()

        await fetchMeetings()
      } catch (error) {
        console.error(
          "Meeting creation error:",
          error
        )

        setError(
          error.message ||
          "Unable to create meeting."
        )
      } finally {
        setSaving(false)
      }
    }

  const filteredMeetings =
    meetings.filter(
      (meeting) => {
        const searchValue =
          search.toLowerCase()

        return (
          meeting.title
            ?.toLowerCase()
            .includes(
              searchValue
            ) ||

          meeting.location
            ?.toLowerCase()
            .includes(
              searchValue
            ) ||

          meeting.agenda
            ?.toLowerCase()
            .includes(
              searchValue
            )
        )
      }
    )

  const formatDate =
    (date) => {
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

  const formatTime =
    (time) => {
      if (!time) {
        return null
      }

      return new Date(
        `2000-01-01T${time}`
      ).toLocaleTimeString(
        "en-AU",
        {
          hour: "numeric",
          minute: "2-digit",
        }
      )
    }

  if (loading) {
    return (
      <div className="flex min-h-[450px] items-center justify-center">
        <div className="text-center">

          <LoaderCircle
            size={34}
            className="mx-auto animate-spin text-[#9b7c3f]"
          />

          <p className="mt-3 text-sm text-slate-500">
            Loading meetings...
          </p>

        </div>
      </div>
    )
  }

  return (
    <div>

      {/* PAGE HEADER */}

      <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">

        <div>

          <p className="text-sm font-semibold uppercase tracking-wider text-[#9b7c3f]">
            Governance
          </p>

          <h1 className="mt-1 text-3xl font-bold text-slate-900">
            Meetings
          </h1>

          <p className="mt-2 text-slate-500">
            Company meetings, minutes, attendance and resolutions.
          </p>

        </div>

        {isMainAdmin && (
          <button
            onClick={() =>
              setShowModal(true)
            }
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#c5a66a] px-5 py-3 font-semibold text-[#111315] transition hover:bg-[#d2b77d]"
          >
            <Plus size={18} />

            New Meeting
          </button>
        )}

      </div>


      {/* ERROR */}

      {error && (
        <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}


      {/* SUCCESS */}

      {message && (
        <div className="mt-6 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          {message}
        </div>
      )}


      {/* SUMMARY */}

      <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-3">

        <SummaryCard
          label="Total Meetings"
          value={meetings.length}
          icon={CalendarDays}
        />

        <SummaryCard
          label="Completed"
          value={
            meetings.filter(
              (meeting) =>
                meeting.status ===
                "completed"
            ).length
          }
          icon={FileText}
        />

        <SummaryCard
          label="Scheduled"
          value={
            meetings.filter(
              (meeting) =>
                meeting.status ===
                "scheduled"
            ).length
          }
          icon={Clock3}
        />

      </div>


      {/* SEARCH */}

      <div className="mt-8 flex max-w-lg items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3">

        <Search
          size={18}
          className="text-slate-400"
        />

        <input
          value={search}
          onChange={(event) =>
            setSearch(
              event.target.value
            )
          }
          placeholder="Search meetings..."
          className="w-full bg-transparent text-sm outline-none"
        />

      </div>


      {/* MEETINGS */}

      <div className="mt-8 space-y-5">

        {filteredMeetings.length ===
        0 ? (

          <div className="rounded-2xl border border-slate-200 bg-white p-14 text-center">

            <CalendarDays
              size={40}
              className="mx-auto text-slate-300"
            />

            <h2 className="mt-4 text-lg font-semibold text-slate-900">
              No meetings found
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Company meetings will appear here.
            </p>

          </div>

        ) : (

          filteredMeetings.map(
            (meeting) => (

              <div
                key={meeting.id}
                className="rounded-2xl border border-slate-200 bg-white p-6 transition hover:border-[#d8c49b] hover:shadow-sm"
              >

                <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">

                  {/* MEETING INFORMATION */}

                  <div className="flex-1">

                    <div className="flex flex-wrap items-center gap-3">

                      <span className="rounded-full bg-[#f1eadc] px-3 py-1 text-xs font-semibold capitalize text-[#9b7c3f]">
                        {meeting.meeting_type}
                      </span>

                      <StatusBadge
                        status={
                          meeting.status
                        }
                      />

                    </div>

                    <h2 className="mt-4 text-xl font-semibold text-slate-900">
                      {meeting.title}
                    </h2>

                    {meeting.agenda && (
                      <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-500">
                        {meeting.agenda}
                      </p>
                    )}

                    {/* STEP 59 - VIEW MEETING */}

                    <Link
                      to={`/meetings/${meeting.id}`}
                      className="mt-6 inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-[#c5a66a] hover:text-[#9b7c3f]"
                    >
                      View Meeting

                      <ArrowRight
                        size={16}
                      />
                    </Link>

                  </div>


                  {/* MEETING DETAILS */}

                  <div className="min-w-[240px] space-y-3 text-sm">

                    <div className="flex items-center gap-3 text-slate-600">

                      <CalendarDays
                        size={17}
                      />

                      {formatDate(
                        meeting.meeting_date
                      )}

                    </div>

                    {meeting.start_time && (

                      <div className="flex items-center gap-3 text-slate-600">

                        <Clock3
                          size={17}
                        />

                        <span>
                          {formatTime(
                            meeting.start_time
                          )}

                          {meeting.end_time &&
                            ` – ${formatTime(
                              meeting.end_time
                            )}`}
                        </span>

                      </div>

                    )}

                    {meeting.location && (

                      <div className="flex items-center gap-3 text-slate-600">

                        <MapPin
                          size={17}
                        />

                        {meeting.location}

                      </div>

                    )}

                    <div className="flex items-center gap-3 text-slate-400">

                      <Users
                        size={17}
                      />

                      Attendance available in meeting details

                    </div>

                  </div>

                </div>

              </div>

            )
          )

        )}

      </div>


      {/* CREATE MEETING MODAL */}

      {showModal && (

        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-8">

          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white shadow-2xl">

            {/* MODAL HEADER */}

            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">

              <div>

                <h2 className="text-xl font-bold text-slate-900">
                  New Meeting
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Create a BNE Construction meeting record.
                </p>

              </div>

              <button
                type="button"
                onClick={() =>
                  setShowModal(false)
                }
                disabled={saving}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"
              >
                <X size={20} />
              </button>

            </div>


            {/* FORM */}

            <form
              onSubmit={handleSubmit}
              className="space-y-5 p-6"
            >

              <Input
                label="Meeting Title"
                name="title"
                value={form.title}
                onChange={handleChange}
                placeholder="Directors Meeting"
                required
              />

              <div className="grid gap-5 md:grid-cols-2">

                <Input
                  label="Date"
                  name="meetingDate"
                  type="date"
                  value={
                    form.meetingDate
                  }
                  onChange={
                    handleChange
                  }
                  required
                />

                <Select
                  label="Meeting Type"
                  name="meetingType"
                  value={
                    form.meetingType
                  }
                  onChange={
                    handleChange
                  }
                >

                  <option value="directors">
                    Directors
                  </option>

                  <option value="general">
                    General
                  </option>

                  <option value="special">
                    Special
                  </option>

                  <option value="project">
                    Project
                  </option>

                  <option value="other">
                    Other
                  </option>

                </Select>


                <Input
                  label="Start Time"
                  name="startTime"
                  type="time"
                  value={
                    form.startTime
                  }
                  onChange={
                    handleChange
                  }
                />


                <Input
                  label="End Time"
                  name="endTime"
                  type="time"
                  value={
                    form.endTime
                  }
                  onChange={
                    handleChange
                  }
                />


                <div className="md:col-span-2">

                  <Input
                    label="Location / Platform"
                    name="location"
                    value={
                      form.location
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="WhatsApp, Office, Elgon View..."
                  />

                </div>


                <div className="md:col-span-2">

                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Agenda
                  </label>

                  <textarea
                    name="agenda"
                    value={
                      form.agenda
                    }
                    onChange={
                      handleChange
                    }
                    rows={4}
                    placeholder="Main agenda for the meeting..."
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-[#c5a66a]"
                  />

                </div>


                <div className="md:col-span-2">

                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Notes
                  </label>

                  <textarea
                    name="notes"
                    value={
                      form.notes
                    }
                    onChange={
                      handleChange
                    }
                    rows={4}
                    placeholder="Optional notes..."
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-[#c5a66a]"
                  />

                </div>


                <Select
                  label="Status"
                  name="status"
                  value={
                    form.status
                  }
                  onChange={
                    handleChange
                  }
                >

                  <option value="scheduled">
                    Scheduled
                  </option>

                  <option value="completed">
                    Completed
                  </option>

                  <option value="cancelled">
                    Cancelled
                  </option>

                </Select>

              </div>


              {/* MODAL BUTTONS */}

              <div className="flex justify-end gap-3 border-t border-slate-100 pt-5">

                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false)
                    resetForm()
                  }}
                  disabled={saving}
                  className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Cancel
                </button>


                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#c5a66a] px-5 py-3 text-sm font-semibold text-[#111315] transition hover:bg-[#d2b77d] disabled:opacity-50"
                >

                  {saving && (
                    <LoaderCircle
                      size={17}
                      className="animate-spin"
                    />
                  )}

                  {saving
                    ? "Creating..."
                    : "Create Meeting"}

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
  label,
  value,
  icon: Icon,
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6">

      <div className="flex items-center justify-between">

        <div>

          <p className="text-sm text-slate-500">
            {label}
          </p>

          <p className="mt-2 text-3xl font-bold text-slate-900">
            {value}
          </p>

        </div>

        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#f1eadc] text-[#9b7c3f]">
          <Icon size={21} />
        </div>

      </div>

    </div>
  )
}


function StatusBadge({
  status,
}) {
  const styles = {
    scheduled:
      "bg-blue-50 text-blue-700",

    completed:
      "bg-green-50 text-green-700",

    cancelled:
      "bg-red-50 text-red-700",
  }

  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${
        styles[status] ||
        "bg-slate-100 text-slate-600"
      }`}
    >
      {status}
    </span>
  )
}


function Input({
  label,
  ...props
}) {
  return (
    <div>

      <label className="mb-2 block text-sm font-medium text-slate-700">
        {label}
      </label>

      <input
        {...props}
        className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-[#c5a66a]"
      />

    </div>
  )
}


function Select({
  label,
  children,
  ...props
}) {
  return (
    <div>

      <label className="mb-2 block text-sm font-medium text-slate-700">
        {label}
      </label>

      <select
        {...props}
        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#c5a66a]"
      >
        {children}
      </select>

    </div>
  )
}


export default Meetings