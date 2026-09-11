import {
  useEffect,
  useState,
} from "react"

import {
  useNavigate,
  useParams,
} from "react-router-dom"

import {
  ArrowLeft,
  CalendarDays,
  Clock3,
  MapPin,
  Users,
  FileText,
  LoaderCircle,
  Save,
  Upload,
  ExternalLink,
  CheckCircle2,
  XCircle,
  UserMinus,
} from "lucide-react"

import { supabase } from "../lib/supabase"
import { useAuth } from "../context/AuthContext"

function MeetingDetails() {
  const { meetingId } = useParams()

  const navigate = useNavigate()

  const {
    user,
    isMainAdmin,
  } = useAuth()

  const [meeting, setMeeting] =
    useState(null)

  const [members, setMembers] =
    useState([])

  const [attendance, setAttendance] =
    useState([])

  const [minutes, setMinutes] =
    useState(null)

  const [minutesText, setMinutesText] =
    useState("")

  const [minutesFile, setMinutesFile] =
    useState(null)

  const [loading, setLoading] =
    useState(true)

  const [savingAttendance, setSavingAttendance] =
    useState(false)

  const [savingMinutes, setSavingMinutes] =
    useState(false)

  const [error, setError] =
    useState("")

  const [message, setMessage] =
    useState("")


  useEffect(() => {
    loadMeeting()
  }, [meetingId])


  const loadMeeting = async () => {
    try {
      setLoading(true)
      setError("")

      const [
        meetingResult,
        membersResult,
        attendanceResult,
        minutesResult,
      ] = await Promise.all([
        supabase
          .from("meetings")
          .select("*")
          .eq("id", meetingId)
          .single(),

        supabase
          .from("members")
          .select(`
            id,
            full_name,
            company_position
          `)
          .order("full_name"),

        supabase
          .from("meeting_attendance")
          .select(`
            id,
            meeting_id,
            member_id,
            attendance_status
          `)
          .eq("meeting_id", meetingId),

        supabase
          .from("meeting_minutes")
          .select("*")
          .eq("meeting_id", meetingId)
          .maybeSingle(),
      ])

      if (meetingResult.error) {
        throw meetingResult.error
      }

      if (membersResult.error) {
        throw membersResult.error
      }

      if (attendanceResult.error) {
        throw attendanceResult.error
      }

      if (minutesResult.error) {
        throw minutesResult.error
      }

      setMeeting(
        meetingResult.data
      )

      setMembers(
        membersResult.data || []
      )

      setAttendance(
        attendanceResult.data || []
      )

      setMinutes(
        minutesResult.data || null
      )

      setMinutesText(
        minutesResult.data?.minutes_text ||
        ""
      )

    } catch (error) {
      console.error(
        "Meeting details error:",
        error
      )

      setError(
        error.message ||
        "Unable to load meeting."
      )
    } finally {
      setLoading(false)
    }
  }


  const getAttendanceStatus =
    (memberId) => {
      const record =
        attendance.find(
          (item) =>
            item.member_id ===
            memberId
        )

      return (
        record?.attendance_status ||
        "present"
      )
    }


  const updateAttendance =
    (memberId, status) => {
      setAttendance(
        (previous) => {
          const existing =
            previous.find(
              (item) =>
                item.member_id ===
                memberId
            )

          if (existing) {
            return previous.map(
              (item) =>
                item.member_id ===
                memberId
                  ? {
                      ...item,
                      attendance_status:
                        status,
                    }
                  : item
            )
          }

          return [
            ...previous,
            {
              meeting_id:
                meetingId,

              member_id:
                memberId,

              attendance_status:
                status,
            },
          ]
        }
      )
    }


  const saveAttendance =
    async () => {
      try {
        setSavingAttendance(true)
        setError("")
        setMessage("")

        if (!isMainAdmin) {
          throw new Error(
            "Only the Main Admin can update attendance."
          )
        }

        const records =
          members.map(
            (member) => ({
              meeting_id:
                meetingId,

              member_id:
                member.id,

              attendance_status:
                getAttendanceStatus(
                  member.id
                ),
            })
          )

        const {
          error,
        } = await supabase
          .from(
            "meeting_attendance"
          )
          .upsert(
            records,
            {
              onConflict:
                "meeting_id,member_id",
            }
          )

        if (error) {
          throw error
        }

        setMessage(
          "Attendance saved successfully."
        )

        await loadMeeting()

      } catch (error) {
        console.error(
          "Attendance error:",
          error
        )

        setError(
          error.message ||
          "Unable to save attendance."
        )
      } finally {
        setSavingAttendance(false)
      }
    }


  const uploadMinutesFile =
    async () => {
      if (!minutesFile) {
        return (
          minutes?.document_path ||
          null
        )
      }

      const safeName =
        minutesFile.name.replace(
          /[^a-zA-Z0-9._-]/g,
          "_"
        )

      const path =
        `${meetingId}/${crypto.randomUUID()}-${safeName}`

      const {
        error,
      } = await supabase.storage
        .from("meeting-minutes")
        .upload(
          path,
          minutesFile,
          {
            cacheControl: "3600",
            upsert: false,
          }
        )

      if (error) {
        throw error
      }

      return path
    }


  const saveMinutes =
    async () => {
      try {
        setSavingMinutes(true)
        setError("")
        setMessage("")

        if (!isMainAdmin) {
          throw new Error(
            "Only the Main Admin can manage meeting minutes."
          )
        }

        const documentPath =
          await uploadMinutesFile()

        const payload = {
          meeting_id:
            meetingId,

          minutes_text:
            minutesText.trim() ||
            null,

          document_path:
            documentPath,

          created_by:
            user.id,

          updated_at:
            new Date().toISOString(),
        }

        const {
          error,
        } = await supabase
          .from("meeting_minutes")
          .upsert(
            payload,
            {
              onConflict:
                "meeting_id",
            }
          )

        if (error) {
          throw error
        }

        setMessage(
          "Meeting minutes saved successfully."
        )

        setMinutesFile(null)

        await loadMeeting()

      } catch (error) {
        console.error(
          "Minutes error:",
          error
        )

        setError(
          error.message ||
          "Unable to save meeting minutes."
        )
      } finally {
        setSavingMinutes(false)
      }
    }


  const viewMinutesFile =
    async () => {
      try {
        if (
          !minutes?.document_path
        ) {
          return
        }

        const {
          data,
          error,
        } = await supabase.storage
          .from("meeting-minutes")
          .createSignedUrl(
            minutes.document_path,
            60
          )

        if (error) {
          throw error
        }

        window.open(
          data.signedUrl,
          "_blank",
          "noopener,noreferrer"
        )

      } catch (error) {
        console.error(
          "Minutes file error:",
          error
        )

        setError(
          error.message ||
          "Unable to open minutes document."
        )
      }
    }


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
          month: "long",
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
            Loading meeting...
          </p>

        </div>

      </div>
    )
  }


  if (!meeting) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-8">
        <h1 className="text-xl font-bold text-red-700">
          Meeting not found
        </h1>
      </div>
    )
  }


  return (
    <div>

      <button
        onClick={() =>
          navigate("/meetings")
        }
        className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-[#9b7c3f]"
      >
        <ArrowLeft size={17} />

        Back to Meetings
      </button>


      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-7">

        <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">

          <div>

            <div className="flex flex-wrap gap-2">

              <span className="rounded-full bg-[#f1eadc] px-3 py-1 text-xs font-semibold capitalize text-[#9b7c3f]">
                {meeting.meeting_type}
              </span>

              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold capitalize text-slate-600">
                {meeting.status}
              </span>

            </div>


            <h1 className="mt-4 text-3xl font-bold text-slate-900">
              {meeting.title}
            </h1>


            {meeting.agenda && (
              <p className="mt-3 max-w-3xl leading-7 text-slate-500">
                {meeting.agenda}
              </p>
            )}

          </div>


          <div className="space-y-3 text-sm text-slate-600">

            <InfoRow
              icon={CalendarDays}
              value={formatDate(
                meeting.meeting_date
              )}
            />

            {meeting.start_time && (
              <InfoRow
                icon={Clock3}
                value={
                  meeting.end_time
                    ? `${formatTime(
                        meeting.start_time
                      )} – ${formatTime(
                        meeting.end_time
                      )}`
                    : formatTime(
                        meeting.start_time
                      )
                }
              />
            )}

            {meeting.location && (
              <InfoRow
                icon={MapPin}
                value={
                  meeting.location
                }
              />
            )}

          </div>

        </div>

      </div>


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


      <div className="mt-8 rounded-2xl border border-slate-200 bg-white">

        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">

          <div>

            <h2 className="text-lg font-semibold text-slate-900">
              Attendance
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Record who attended this meeting.
            </p>

          </div>

          <Users
            size={22}
            className="text-[#9b7c3f]"
          />

        </div>


        <div className="divide-y divide-slate-100">

          {members.map(
            (member) => {

              const status =
                getAttendanceStatus(
                  member.id
                )

              return (
                <div
                  key={member.id}
                  className="flex flex-col gap-4 px-6 py-5 md:flex-row md:items-center md:justify-between"
                >

                  <div>

                    <p className="font-semibold text-slate-900">
                      {member.full_name}
                    </p>

                    <p className="mt-1 text-sm text-slate-500">
                      {member.company_position}
                    </p>

                  </div>


                  {isMainAdmin ? (

                    <div className="flex flex-wrap gap-2">

                      <AttendanceButton
                        active={
                          status ===
                          "present"
                        }
                        icon={
                          CheckCircle2
                        }
                        label="Present"
                        onClick={() =>
                          updateAttendance(
                            member.id,
                            "present"
                          )
                        }
                      />


                      <AttendanceButton
                        active={
                          status ===
                          "absent"
                        }
                        icon={XCircle}
                        label="Absent"
                        onClick={() =>
                          updateAttendance(
                            member.id,
                            "absent"
                          )
                        }
                      />


                      <AttendanceButton
                        active={
                          status ===
                          "apology"
                        }
                        icon={
                          UserMinus
                        }
                        label="Apology"
                        onClick={() =>
                          updateAttendance(
                            member.id,
                            "apology"
                          )
                        }
                      />

                    </div>

                  ) : (

                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold capitalize text-slate-600">
                      {status}
                    </span>

                  )}

                </div>
              )
            }
          )}

        </div>


        {isMainAdmin && (

          <div className="border-t border-slate-200 px-6 py-5">

            <button
              onClick={
                saveAttendance
              }
              disabled={
                savingAttendance
              }
              className="inline-flex items-center gap-2 rounded-xl bg-[#c5a66a] px-5 py-3 text-sm font-semibold text-[#111315] disabled:opacity-50"
            >

              {savingAttendance ? (
                <LoaderCircle
                  size={17}
                  className="animate-spin"
                />
              ) : (
                <Save size={17} />
              )}

              {savingAttendance
                ? "Saving..."
                : "Save Attendance"}

            </button>

          </div>

        )}

      </div>


      <div className="mt-8 rounded-2xl border border-slate-200 bg-white">

        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">

          <div>

            <h2 className="text-lg font-semibold text-slate-900">
              Meeting Minutes
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Official notes and supporting document for this meeting.
            </p>

          </div>

          <FileText
            size={22}
            className="text-[#9b7c3f]"
          />

        </div>


        <div className="p-6">

          {isMainAdmin ? (

            <>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Minutes
              </label>

              <textarea
                value={minutesText}
                onChange={(event) =>
                  setMinutesText(
                    event.target.value
                  )
                }
                rows={12}
                placeholder="Enter the meeting minutes here..."
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm leading-6 outline-none focus:border-[#c5a66a]"
              />


              <div className="mt-5">

                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Minutes Document
                </label>

                <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-5 py-5">

                  <Upload
                    size={20}
                    className="text-[#9b7c3f]"
                  />

                  <div>

                    <p className="text-sm font-semibold text-slate-700">
                      {minutesFile
                        ? minutesFile.name
                        : "Upload PDF or document"}
                    </p>

                    <p className="mt-1 text-xs text-slate-400">
                      Stored privately
                    </p>

                  </div>

                  <input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    className="hidden"
                    onChange={(event) =>
                      setMinutesFile(
                        event.target
                          .files?.[0] ||
                        null
                      )
                    }
                  />

                </label>

              </div>


              <div className="mt-6 flex flex-wrap gap-3">

                <button
                  onClick={
                    saveMinutes
                  }
                  disabled={
                    savingMinutes
                  }
                  className="inline-flex items-center gap-2 rounded-xl bg-[#c5a66a] px-5 py-3 text-sm font-semibold text-[#111315] disabled:opacity-50"
                >

                  {savingMinutes ? (
                    <LoaderCircle
                      size={17}
                      className="animate-spin"
                    />
                  ) : (
                    <Save size={17} />
                  )}

                  {savingMinutes
                    ? "Saving..."
                    : "Save Minutes"}

                </button>


                {minutes?.document_path && (

                  <button
                    onClick={
                      viewMinutesFile
                    }
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700"
                  >
                    <ExternalLink
                      size={17}
                    />

                    View Document
                  </button>

                )}

              </div>
            </>

          ) : (

            <>
              {minutesText ? (

                <div className="whitespace-pre-wrap text-sm leading-7 text-slate-700">
                  {minutesText}
                </div>

              ) : (

                <p className="text-sm text-slate-400">
                  Minutes have not been added yet.
                </p>

              )}


              {minutes?.document_path && (

                <button
                  onClick={
                    viewMinutesFile
                  }
                  className="mt-5 inline-flex items-center gap-2 rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700"
                >
                  <ExternalLink
                    size={17}
                  />

                  View Minutes Document
                </button>

              )}
            </>

          )}

        </div>

      </div>

    </div>
  )
}


function InfoRow({
  icon: Icon,
  value,
}) {
  return (
    <div className="flex items-center gap-3">

      <Icon
        size={17}
        className="text-[#9b7c3f]"
      />

      <span>
        {value}
      </span>

    </div>
  )
}


function AttendanceButton({
  active,
  icon: Icon,
  label,
  onClick,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        active
          ? "inline-flex items-center gap-2 rounded-xl bg-[#111315] px-4 py-2 text-xs font-semibold text-white"
          : "inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:border-[#c5a66a]"
      }
    >
      <Icon size={14} />

      {label}
    </button>
  )
}


export default MeetingDetails