import {
  useEffect,
  useRef,
  useState,
} from "react"

import {
  useNavigate,
  useParams,
} from "react-router-dom"

import SignaturePad from "signature_pad"

import {
  PDFDocument,
  StandardFonts,
  rgb,
} from "pdf-lib"

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
  Plus,
  PenLine,
  X,
  RotateCcw,
  ShieldCheck,
  FolderOpen,
  Trash2,
  Paperclip,
  FileCheck2,
  Download,
} from "lucide-react"

import { supabase } from "../lib/supabase"
import { useAuth } from "../context/AuthContext"


function MeetingDetails() {
  const { meetingId } = useParams()
  const navigate = useNavigate()

  const {
    user,
    member: loggedInMember,
    isMainAdmin,
  } = useAuth()

  const canvasRef = useRef(null)
  const signaturePadRef = useRef(null)

  const [meeting, setMeeting] = useState(null)
  const [members, setMembers] = useState([])
  const [attendance, setAttendance] = useState([])
  const [minutes, setMinutes] = useState(null)
  const [resolutions, setResolutions] = useState([])
  const [meetingDocuments, setMeetingDocuments] = useState([])

  const [minutesText, setMinutesText] = useState("")
  const [minutesFile, setMinutesFile] = useState(null)

  const [loading, setLoading] = useState(true)

  const [savingAttendance, setSavingAttendance] =
    useState(false)

  const [savingMinutes, setSavingMinutes] =
    useState(false)

  const [
    creatingResolution,
    setCreatingResolution,
  ] = useState(false)

  const [signing, setSigning] =
    useState(false)

  const [
    uploadingDocument,
    setUploadingDocument,
  ] = useState(false)

  const [
    generatingPdfId,
    setGeneratingPdfId,
  ] = useState(null)

  const [error, setError] =
    useState("")

  const [message, setMessage] =
    useState("")

  const [
    showResolutionModal,
    setShowResolutionModal,
  ] = useState(false)

  const [
    showSignatureModal,
    setShowSignatureModal,
  ] = useState(false)

  const [
    showDocumentModal,
    setShowDocumentModal,
  ] = useState(false)

  const [
    selectedResolution,
    setSelectedResolution,
  ] = useState(null)

  const [
    confirmSignature,
    setConfirmSignature,
  ] = useState(false)

  const [
    resolutionForm,
    setResolutionForm,
  ] = useState({
    title: "",
    resolutionText: "",
    signatoryIds: [],
  })

  const [
    documentForm,
    setDocumentForm,
  ] = useState({
    title: "",
    documentType: "other",
    description: "",
    file: null,
  })


  useEffect(() => {
    loadMeeting()
  }, [meetingId])


  useEffect(() => {
    if (!showSignatureModal) {
      return
    }

    const canvas = canvasRef.current

    if (!canvas) {
      return
    }

    const setupCanvas = () => {
      const ratio = Math.max(
        window.devicePixelRatio || 1,
        1
      )

      const rect =
        canvas.getBoundingClientRect()

      canvas.width =
        rect.width * ratio

      canvas.height =
        rect.height * ratio

      const context =
        canvas.getContext("2d")

      context.scale(
        ratio,
        ratio
      )

      const pad =
        new SignaturePad(
          canvas,
          {
            minWidth: 0.8,
            maxWidth: 2.5,
          }
        )

      signaturePadRef.current =
        pad
    }

    const timer =
      setTimeout(
        setupCanvas,
        50
      )

    return () => {
      clearTimeout(timer)

      if (
        signaturePadRef.current
      ) {
        signaturePadRef.current.off()
        signaturePadRef.current = null
      }
    }
  }, [showSignatureModal])


  const loadMeeting = async () => {
    try {
      setLoading(true)
      setError("")

      const [
        meetingResult,
        membersResult,
        attendanceResult,
        minutesResult,
        resolutionsResult,
        documentsResult,
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
            company_position,
            portal_role,
            account_status
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
          .eq(
            "meeting_id",
            meetingId
          ),

        supabase
          .from("meeting_minutes")
          .select("*")
          .eq(
            "meeting_id",
            meetingId
          )
          .maybeSingle(),

        supabase
          .from("resolutions")
          .select(`
            id,
            meeting_id,
            title,
            resolution_text,
            status,
            completed_at,
            created_at,
            final_pdf_path,
            pdf_generated_at,
            pdf_generated_by,
            resolution_signatories (
              id,
              member_id,
              status,
              signature_path,
              signed_by,
              signed_at
            )
          `)
          .eq(
            "meeting_id",
            meetingId
          )
          .order(
            "created_at",
            {
              ascending: false,
            }
          ),

        supabase
          .from("meeting_documents")
          .select("*")
          .eq(
            "meeting_id",
            meetingId
          )
          .order(
            "created_at",
            {
              ascending: false,
            }
          ),
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

      if (resolutionsResult.error) {
        throw resolutionsResult.error
      }

      if (documentsResult.error) {
        throw documentsResult.error
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
        minutesResult.data
          ?.minutes_text || ""
      )

      setResolutions(
        resolutionsResult.data || []
      )

      setMeetingDocuments(
        documentsResult.data || []
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


  // ==================================================
  // ATTENDANCE
  // ==================================================

  const getAttendanceStatus = (
    memberId
  ) => {
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


  const updateAttendance = (
    memberId,
    status
  ) => {
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

        const { error } =
          await supabase
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


  // ==================================================
  // MEETING MINUTES
  // ==================================================

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

      const { error } =
        await supabase.storage
          .from(
            "meeting-minutes"
          )
          .upload(
            path,
            minutesFile,
            {
              cacheControl:
                "3600",
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
            minutes?.created_by ||
            user.id,

          updated_at:
            new Date()
              .toISOString(),
        }

        const { error } =
          await supabase
            .from(
              "meeting_minutes"
            )
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
        } =
          await supabase.storage
            .from(
              "meeting-minutes"
            )
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
        setError(
          error.message ||
          "Unable to open minutes document."
        )
      }
    }


  // ==================================================
  // MEETING DOCUMENTS
  // ==================================================

  const uploadMeetingDocument =
    async (event) => {
      event.preventDefault()

      let uploadedPath = null

      try {
        setUploadingDocument(
          true
        )

        setError("")
        setMessage("")

        if (!isMainAdmin) {
          throw new Error(
            "Only the Main Admin can upload meeting documents."
          )
        }

        if (
          !documentForm.title.trim()
        ) {
          throw new Error(
            "Enter a document title."
          )
        }

        if (
          !documentForm.file
        ) {
          throw new Error(
            "Select a document to upload."
          )
        }

        const allowedTypes = [
          "application/pdf",
          "application/msword",
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          "image/jpeg",
          "image/png",
        ]

        if (
          !allowedTypes.includes(
            documentForm.file.type
          )
        ) {
          throw new Error(
            "Only PDF, DOC, DOCX, JPG and PNG files are allowed."
          )
        }

        const maxSize =
          10 * 1024 * 1024

        if (
          documentForm.file.size >
          maxSize
        ) {
          throw new Error(
            "The document must be 10 MB or smaller."
          )
        }

        const safeFileName =
          documentForm.file.name.replace(
            /[^a-zA-Z0-9._-]/g,
            "_"
          )

        uploadedPath =
          `${meetingId}/${user.id}/${crypto.randomUUID()}-${safeFileName}`

        const {
          error:
            uploadError,
        } =
          await supabase.storage
            .from(
              "meeting-documents"
            )
            .upload(
              uploadedPath,
              documentForm.file,
              {
                cacheControl:
                  "3600",
                upsert: false,
              }
            )

        if (uploadError) {
          throw uploadError
        }

        const {
          error:
            databaseError,
        } =
          await supabase
            .from(
              "meeting_documents"
            )
            .insert({
              meeting_id:
                meetingId,

              title:
                documentForm
                  .title
                  .trim(),

              document_type:
                documentForm
                  .documentType,

              description:
                documentForm
                  .description
                  .trim() ||
                null,

              file_path:
                uploadedPath,

              original_file_name:
                documentForm
                  .file
                  .name,

              uploaded_by:
                user.id,
            })

        if (databaseError) {
          throw databaseError
        }

        setDocumentForm({
          title: "",
          documentType:
            "other",
          description: "",
          file: null,
        })

        setShowDocumentModal(
          false
        )

        setMessage(
          "Meeting document uploaded successfully."
        )

        await loadMeeting()
      } catch (error) {
        console.error(
          "Meeting document upload error:",
          error
        )

        if (uploadedPath) {
          await supabase.storage
            .from(
              "meeting-documents"
            )
            .remove([
              uploadedPath,
            ])
        }

        setError(
          error.message ||
          "Unable to upload meeting document."
        )
      } finally {
        setUploadingDocument(
          false
        )
      }
    }


  const viewMeetingDocument =
    async (filePath) => {
      try {
        setError("")

        const {
          data,
          error,
        } =
          await supabase.storage
            .from(
              "meeting-documents"
            )
            .createSignedUrl(
              filePath,
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
        setError(
          error.message ||
          "Unable to open document."
        )
      }
    }


  const deleteMeetingDocument =
    async (document) => {
      const confirmed =
        window.confirm(
          `Delete "${document.title}"? This cannot be undone.`
        )

      if (!confirmed) {
        return
      }

      try {
        setError("")
        setMessage("")

        if (!isMainAdmin) {
          throw new Error(
            "Only the Main Admin can delete meeting documents."
          )
        }

        const {
          error:
            storageError,
        } =
          await supabase.storage
            .from(
              "meeting-documents"
            )
            .remove([
              document.file_path,
            ])

        if (storageError) {
          throw storageError
        }

        const {
          error:
            databaseError,
        } =
          await supabase
            .from(
              "meeting_documents"
            )
            .delete()
            .eq(
              "id",
              document.id
            )

        if (databaseError) {
          throw databaseError
        }

        setMessage(
          "Meeting document deleted."
        )

        await loadMeeting()
      } catch (error) {
        console.error(
          "Delete document error:",
          error
        )

        setError(
          error.message ||
          "Unable to delete document."
        )
      }
    }


  // ==================================================
  // RESOLUTIONS
  // ==================================================

  const toggleSignatory = (
    memberId
  ) => {
    setResolutionForm(
      (previous) => {
        const selected =
          previous
            .signatoryIds
            .includes(
              memberId
            )

        return {
          ...previous,

          signatoryIds:
            selected
              ? previous
                  .signatoryIds
                  .filter(
                    (id) =>
                      id !==
                      memberId
                  )
              : [
                  ...previous
                    .signatoryIds,
                  memberId,
                ],
        }
      }
    )
  }


  const selectAllSignatories =
    () => {
      const approvedMemberIds =
        members
          .filter(
            (member) =>
              member.account_status ===
              "approved"
          )
          .map(
            (member) =>
              member.id
          )

      setResolutionForm(
        (previous) => ({
          ...previous,

          signatoryIds:
            approvedMemberIds,
        })
      )
    }


  const clearSignatories =
    () => {
      setResolutionForm(
        (previous) => ({
          ...previous,
          signatoryIds: [],
        })
      )
    }


  const resetResolutionForm =
    () => {
      setResolutionForm({
        title: "",
        resolutionText: "",
        signatoryIds: [],
      })
    }


  const createResolution =
    async (event) => {
      event.preventDefault()

      try {
        setCreatingResolution(
          true
        )

        setError("")
        setMessage("")

        if (
          !resolutionForm.title.trim()
        ) {
          throw new Error(
            "Enter a resolution title."
          )
        }

        if (
          !resolutionForm
            .resolutionText
            .trim()
        ) {
          throw new Error(
            "Enter the resolution."
          )
        }

        if (
          resolutionForm
            .signatoryIds
            .length === 0
        ) {
          throw new Error(
            "Select at least one required signatory."
          )
        }

        const { error } =
          await supabase.rpc(
            "create_resolution",
            {
              p_meeting_id:
                meetingId,

              p_title:
                resolutionForm
                  .title
                  .trim(),

              p_resolution_text:
                resolutionForm
                  .resolutionText
                  .trim(),

              p_signatory_ids:
                resolutionForm
                  .signatoryIds,
            }
          )

        if (error) {
          throw error
        }

        setShowResolutionModal(
          false
        )

        resetResolutionForm()

        setMessage(
          "Resolution created successfully."
        )

        await loadMeeting()
      } catch (error) {
        console.error(
          "Create resolution error:",
          error
        )

        setError(
          error.message ||
          "Unable to create resolution."
        )
      } finally {
        setCreatingResolution(
          false
        )
      }
    }


  const getMember = (
    memberId
  ) => {
    return members.find(
      (member) =>
        member.id ===
        memberId
    )
  }


  const getMySignatoryRecord =
    (resolution) => {
      if (!loggedInMember) {
        return null
      }

      return resolution
        .resolution_signatories
        ?.find(
          (signatory) =>
            signatory.member_id ===
            loggedInMember.id
        )
    }


  // ==================================================
  // SIGNATURE
  // ==================================================

  const openSignatureModal =
    (resolution) => {
      setSelectedResolution(
        resolution
      )

      setConfirmSignature(
        false
      )

      setShowSignatureModal(
        true
      )

      setError("")
    }


  const clearSignature = () => {
    signaturePadRef.current?.clear()
  }


  const dataUrlToBlob =
    async (dataUrl) => {
      const response =
        await fetch(dataUrl)

      return response.blob()
    }


  const submitSignature =
    async () => {
      let uploadedPath = null

      try {
        setSigning(true)
        setError("")
        setMessage("")

        if (
          !selectedResolution
        ) {
          throw new Error(
            "Resolution not selected."
          )
        }

        if (
          !signaturePadRef.current ||
          signaturePadRef.current
            .isEmpty()
        ) {
          throw new Error(
            "Please draw your signature."
          )
        }

        if (!confirmSignature) {
          throw new Error(
            "Please confirm that you have read and agree to sign the resolution."
          )
        }

        const dataUrl =
          signaturePadRef.current
            .toDataURL(
              "image/png"
            )

        const signatureBlob =
          await dataUrlToBlob(
            dataUrl
          )

        uploadedPath =
          `${user.id}/${selectedResolution.id}/${crypto.randomUUID()}-signature.png`

        const {
          error:
            uploadError,
        } =
          await supabase.storage
            .from(
              "resolution-signatures"
            )
            .upload(
              uploadedPath,
              signatureBlob,
              {
                contentType:
                  "image/png",

                cacheControl:
                  "3600",

                upsert: false,
              }
            )

        if (uploadError) {
          throw uploadError
        }

        const {
          error:
            signError,
        } =
          await supabase.rpc(
            "sign_resolution",
            {
              p_resolution_id:
                selectedResolution.id,

              p_signature_path:
                uploadedPath,
            }
          )

        if (signError) {
          throw signError
        }

        setShowSignatureModal(
          false
        )

        setSelectedResolution(
          null
        )

        setConfirmSignature(
          false
        )

        setMessage(
          "Resolution signed successfully."
        )

        await loadMeeting()
      } catch (error) {
        console.error(
          "Signature error:",
          error
        )

        if (uploadedPath) {
          await supabase.storage
            .from(
              "resolution-signatures"
            )
            .remove([
              uploadedPath,
            ])
        }

        setError(
          error.message ||
          "Unable to sign resolution."
        )
      } finally {
        setSigning(false)
      }
    }


  const viewSignature =
    async (
      signaturePath
    ) => {
      try {
        if (!signaturePath) {
          return
        }

        const {
          data,
          error,
        } =
          await supabase.storage
            .from(
              "resolution-signatures"
            )
            .createSignedUrl(
              signaturePath,
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
        setError(
          error.message ||
          "Unable to view signature."
        )
      }
    }


  // ==================================================
  // FINAL SIGNED RESOLUTION PDF
  // ==================================================

  const getSignatureBytes =
    async (
      signaturePath
    ) => {
      const {
        data,
        error,
      } =
        await supabase.storage
          .from(
            "resolution-signatures"
          )
          .createSignedUrl(
            signaturePath,
            60
          )

      if (error) {
        throw error
      }

      const response =
        await fetch(
          data.signedUrl
        )

      if (!response.ok) {
        throw new Error(
          "Unable to load one of the signatures."
        )
      }

      return await response.arrayBuffer()
    }


  const generateSignedResolutionPdf =
    async (
      resolution
    ) => {
      let uploadedPath = null

      try {
        setGeneratingPdfId(
          resolution.id
        )

        setError("")
        setMessage("")

        if (!isMainAdmin) {
          throw new Error(
            "Only the Main Admin can generate the official resolution PDF."
          )
        }

        if (
          resolution.status !==
          "completed"
        ) {
          throw new Error(
            "The resolution must be completed before the signed PDF can be generated."
          )
        }

        const signatories =
          resolution
            .resolution_signatories ||
          []

        const unsigned =
          signatories.filter(
            (record) =>
              record.status !==
              "signed"
          )

        if (
          unsigned.length > 0
        ) {
          throw new Error(
            "All required members must sign before generating the final PDF."
          )
        }

        if (
          signatories.length === 0
        ) {
          throw new Error(
            "This resolution has no signatories."
          )
        }

        const pdfDoc =
          await PDFDocument.create()

        const regularFont =
          await pdfDoc.embedFont(
            StandardFonts
              .Helvetica
          )

        const boldFont =
          await pdfDoc.embedFont(
            StandardFonts
              .HelveticaBold
          )

        const pageWidth = 595.28
        const pageHeight = 841.89

        const margin = 55

        let page =
          pdfDoc.addPage([
            pageWidth,
            pageHeight,
          ])

        let y =
          pageHeight - margin


        const ensureSpace = (
          requiredHeight = 40
        ) => {
          if (
            y -
              requiredHeight <
            margin
          ) {
            page =
              pdfDoc.addPage([
                pageWidth,
                pageHeight,
              ])

            y =
              pageHeight -
              margin

            drawPdfFooter(
              page,
              regularFont,
              pageWidth
            )
          }
        }


        const drawLine = (
          text,
          {
            size = 11,
            bold = false,
            x = margin,
            gap = 6,
            colour =
              rgb(
                0.15,
                0.15,
                0.15
              ),
          } = {}
        ) => {
          ensureSpace(
            size + gap + 4
          )

          page.drawText(
            String(
              text ?? ""
            ),
            {
              x,
              y,
              size,
              font:
                bold
                  ? boldFont
                  : regularFont,
              color:
                colour,
            }
          )

          y -=
            size + gap
        }


        const drawWrappedText = (
          text,
          {
            size = 11,
            bold = false,
            x = margin,
            width =
              pageWidth -
              margin * 2,
            lineHeight = 17,
            paragraphGap = 8,
            colour =
              rgb(
                0.15,
                0.15,
                0.15
              ),
          } = {}
        ) => {
          const font =
            bold
              ? boldFont
              : regularFont

          const paragraphs =
            String(
              text ?? ""
            ).split("\n")

          for (
            const paragraph of
            paragraphs
          ) {
            if (
              paragraph.trim() ===
              ""
            ) {
              y -=
                paragraphGap

              continue
            }

            const lines =
              wrapPdfText(
                paragraph,
                font,
                size,
                width
              )

            for (
              const line of
              lines
            ) {
              ensureSpace(
                lineHeight +
                  4
              )

              page.drawText(
                line,
                {
                  x,
                  y,
                  size,
                  font,
                  color:
                    colour,
                }
              )

              y -=
                lineHeight
            }

            y -=
              paragraphGap
          }
        }


        // ==========================================
        // PDF HEADER
        // ==========================================

        page.drawText(
          "BNE CONSTRUCTION LTD",
          {
            x: margin,
            y,
            size: 19,
            font: boldFont,
            color:
              rgb(
                0.12,
                0.12,
                0.12
              ),
          }
        )

        y -= 27

        page.drawText(
          "OFFICIAL RESOLUTION",
          {
            x: margin,
            y,
            size: 14,
            font: boldFont,
            color:
              rgb(
                0.58,
                0.45,
                0.22
              ),
          }
        )

        y -= 24

        page.drawLine({
          start: {
            x: margin,
            y,
          },

          end: {
            x:
              pageWidth -
              margin,
            y,
          },

          thickness: 1.5,

          color:
            rgb(
              0.78,
              0.65,
              0.4
            ),
        })

        y -= 28


        // ==========================================
        // MEETING DETAILS
        // ==========================================

        drawLine(
          "MEETING DETAILS",
          {
            size: 11,
            bold: true,
          }
        )

        y -= 4

        drawWrappedText(
          `Meeting: ${meeting.title}`,
          {
            size: 10,
            lineHeight: 15,
            paragraphGap: 2,
          }
        )

        drawLine(
          `Date: ${formatDate(
            meeting.meeting_date
          )}`,
          {
            size: 10,
            gap: 5,
          }
        )

        if (
          meeting.start_time
        ) {
          const meetingTime =
            meeting.end_time
              ? `${formatTime(
                  meeting.start_time
                )} - ${formatTime(
                  meeting.end_time
                )}`
              : formatTime(
                  meeting.start_time
                )

          drawLine(
            `Time: ${meetingTime}`,
            {
              size: 10,
              gap: 5,
            }
          )
        }

        if (
          meeting.location
        ) {
          drawWrappedText(
            `Location: ${meeting.location}`,
            {
              size: 10,
              lineHeight: 15,
              paragraphGap: 2,
            }
          )
        }

        y -= 15


        // ==========================================
        // RESOLUTION
        // ==========================================

        drawLine(
          "RESOLUTION",
          {
            size: 11,
            bold: true,
          }
        )

        y -= 7

        drawWrappedText(
          resolution.title,
          {
            size: 13,
            bold: true,
            lineHeight: 18,
            paragraphGap: 10,
          }
        )

        drawWrappedText(
          resolution.resolution_text,
          {
            size: 11,
            lineHeight: 17,
            paragraphGap: 8,
          }
        )

        y -= 12


        // ==========================================
        // COMPLETION
        // ==========================================

        ensureSpace(70)

        page.drawLine({
          start: {
            x: margin,
            y,
          },

          end: {
            x:
              pageWidth -
              margin,
            y,
          },

          thickness: 0.7,

          color:
            rgb(
              0.8,
              0.8,
              0.8
            ),
        })

        y -= 22

        drawLine(
          "RESOLUTION STATUS",
          {
            size: 10,
            bold: true,
          }
        )

        drawLine(
          "COMPLETED",
          {
            size: 11,
            bold: true,
            colour:
              rgb(
                0.05,
                0.45,
                0.2
              ),
          }
        )

        if (
          resolution.completed_at
        ) {
          drawLine(
            `Completed: ${formatDateTime(
              resolution.completed_at
            )}`,
            {
              size: 9,
              gap: 5,
            }
          )
        }

        y -= 15


        // ==========================================
        // SIGNATORIES
        // ==========================================

        drawLine(
          "AUTHORISED SIGNATORIES",
          {
            size: 11,
            bold: true,
          }
        )

        y -= 8


        for (
          let index = 0;
          index <
          signatories.length;
          index++
        ) {
          const signatory =
            signatories[index]

          const signer =
            getMember(
              signatory.member_id
            )

          ensureSpace(155)

          page.drawText(
            `${index + 1}. ${
              signer?.full_name ||
              "BNE Member"
            }`,
            {
              x: margin,
              y,
              size: 11,
              font: boldFont,
              color:
                rgb(
                  0.15,
                  0.15,
                  0.15
                ),
            }
          )

          y -= 17

          if (
            signer
              ?.company_position
          ) {
            page.drawText(
              signer.company_position,
              {
                x: margin,
                y,
                size: 9,
                font:
                  regularFont,

                color:
                  rgb(
                    0.4,
                    0.4,
                    0.4
                  ),
              }
            )

            y -= 15
          }


          if (
            signatory.signature_path
          ) {
            try {
              const signatureBytes =
                await getSignatureBytes(
                  signatory
                    .signature_path
                )

              const signatureImage =
                await pdfDoc.embedPng(
                  signatureBytes
                )

              const originalWidth =
                signatureImage.width

              const originalHeight =
                signatureImage.height

              const maxWidth =
                170

              const maxHeight =
                65

              const scale =
                Math.min(
                  maxWidth /
                    originalWidth,

                  maxHeight /
                    originalHeight,

                  1
                )

              const width =
                originalWidth *
                scale

              const height =
                originalHeight *
                scale

              ensureSpace(
                height + 60
              )

              page.drawImage(
                signatureImage,
                {
                  x: margin,
                  y:
                    y -
                    height,
                  width,
                  height,
                }
              )

              y -=
                height + 8

              page.drawLine({
                start: {
                  x: margin,
                  y,
                },

                end: {
                  x:
                    margin +
                    190,
                  y,
                },

                thickness: 0.7,

                color:
                  rgb(
                    0.5,
                    0.5,
                    0.5
                  ),
              })

              y -= 14
            } catch (
              signatureError
            ) {
              console.error(
                "Signature embedding error:",
                signatureError
              )

              drawLine(
                "Signature image unavailable",
                {
                  size: 9,
                  colour:
                    rgb(
                      0.7,
                      0.15,
                      0.15
                    ),
                }
              )
            }
          }


          drawLine(
            `Signed: ${formatDateTime(
              signatory.signed_at
            )}`,
            {
              size: 9,
              gap: 4,
            }
          )

          drawLine(
            "Signed electronically through the BNE Construction Ltd secure member portal.",
            {
              size: 8,
              gap: 4,
              colour:
                rgb(
                  0.4,
                  0.4,
                  0.4
                ),
            }
          )

          y -= 14

          if (
            index <
            signatories.length -
              1
          ) {
            ensureSpace(25)

            page.drawLine({
              start: {
                x: margin,
                y,
              },

              end: {
                x:
                  pageWidth -
                  margin,
                y,
              },

              thickness: 0.4,

              color:
                rgb(
                  0.85,
                  0.85,
                  0.85
                ),
            })

            y -= 20
          }
        }


        // ==========================================
        // FINAL DECLARATION
        // ==========================================

        ensureSpace(120)

        y -= 10

        page.drawLine({
          start: {
            x: margin,
            y,
          },

          end: {
            x:
              pageWidth -
              margin,
            y,
          },

          thickness: 0.8,

          color:
            rgb(
              0.75,
              0.75,
              0.75
            ),
        })

        y -= 22

        drawWrappedText(
          "This document records the resolution and electronic signatures captured through the BNE Construction Ltd internal portal.",
          {
            size: 8.5,
            lineHeight: 13,
            paragraphGap: 3,
            colour:
              rgb(
                0.4,
                0.4,
                0.4
              ),
          }
        )


        // ==========================================
        // FOOTERS ON EVERY PAGE
        // ==========================================

        const pages =
          pdfDoc.getPages()

        pages.forEach(
          (
            pdfPage,
            index
          ) => {
            drawPdfFooter(
              pdfPage,
              regularFont,
              pageWidth,
              index + 1,
              pages.length
            )
          }
        )


        // ==========================================
        // SAVE PDF
        // ==========================================

        const pdfBytes =
          await pdfDoc.save()

        const pdfBlob =
          new Blob(
            [pdfBytes],
            {
              type:
                "application/pdf",
            }
          )

        uploadedPath =
          `${resolution.id}/signed-resolution.pdf`

        const {
          error:
            uploadError,
        } =
          await supabase.storage
            .from(
              "resolution-documents"
            )
            .upload(
              uploadedPath,
              pdfBlob,
              {
                contentType:
                  "application/pdf",

                cacheControl:
                  "3600",

                upsert: true,
              }
            )

        if (uploadError) {
          throw uploadError
        }


        // ==========================================
        // SAVE PDF PATH TO DATABASE
        // ==========================================

        const {
          error:
            rpcError,
        } =
          await supabase.rpc(
            "save_resolution_pdf",
            {
              p_resolution_id:
                resolution.id,

              p_pdf_path:
                uploadedPath,
            }
          )

        if (rpcError) {
          throw rpcError
        }

        setMessage(
          "Official signed resolution PDF generated successfully."
        )

        await loadMeeting()
      } catch (error) {
        console.error(
          "Generate signed PDF error:",
          error
        )

        setError(
          error.message ||
          "Unable to generate the signed resolution PDF."
        )
      } finally {
        setGeneratingPdfId(
          null
        )
      }
    }


  const viewSignedResolutionPdf =
    async (
      pdfPath
    ) => {
      try {
        setError("")

        if (!pdfPath) {
          throw new Error(
            "Signed resolution PDF is not available."
          )
        }

        const {
          data,
          error,
        } =
          await supabase.storage
            .from(
              "resolution-documents"
            )
            .createSignedUrl(
              pdfPath,
              120
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
          "View signed PDF error:",
          error
        )

        setError(
          error.message ||
          "Unable to open the signed resolution PDF."
        )
      }
    }


  // ==================================================
  // FORMATTING
  // ==================================================

  const formatDate = (
    date
  ) => {
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


  const formatDateTime = (
    date
  ) => {
    if (!date) {
      return "—"
    }

    return new Date(
      date
    ).toLocaleString(
      "en-AU",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
      }
    )
  }


  const formatTime = (
    time
  ) => {
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

      {/* ==================================================
          BACK BUTTON
      ================================================== */}

      <button
        onClick={() =>
          navigate(
            "/meetings"
          )
        }
        className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-[#9b7c3f]"
      >
        <ArrowLeft
          size={17}
        />

        Back to Meetings
      </button>


      {/* ==================================================
          MEETING HEADER
      ================================================== */}

      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-7">

        <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">

          <div>

            <div className="flex flex-wrap gap-2">

              <span className="rounded-full bg-[#f1eadc] px-3 py-1 text-xs font-semibold capitalize text-[#9b7c3f]">
                {
                  meeting.meeting_type
                }
              </span>

              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold capitalize text-slate-600">
                {
                  meeting.status
                }
              </span>

            </div>


            <h1 className="mt-4 text-3xl font-bold text-slate-900">
              {
                meeting.title
              }
            </h1>


            {meeting.agenda && (
              <p className="mt-3 max-w-3xl leading-7 text-slate-500">
                {
                  meeting.agenda
                }
              </p>
            )}

          </div>


          <div className="space-y-3 text-sm text-slate-600">

            <InfoRow
              icon={
                CalendarDays
              }
              value={
                formatDate(
                  meeting.meeting_date
                )
              }
            />

            {meeting.start_time && (
              <InfoRow
                icon={
                  Clock3
                }
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
                icon={
                  MapPin
                }
                value={
                  meeting.location
                }
              />
            )}

          </div>

        </div>

      </div>


      {/* ==================================================
          MESSAGES
      ================================================== */}

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


      {/* ==================================================
          ATTENDANCE
      ================================================== */}

      <div className="mt-8 rounded-2xl border border-slate-200 bg-white">

        <SectionHeader
          title="Attendance"
          description="Record who attended this meeting."
          icon={Users}
        />

        <div className="divide-y divide-slate-100">

          {members.map(
            (member) => {
              const status =
                getAttendanceStatus(
                  member.id
                )

              return (
                <div
                  key={
                    member.id
                  }
                  className="flex flex-col gap-4 px-6 py-5 md:flex-row md:items-center md:justify-between"
                >

                  <div>
                    <p className="font-semibold text-slate-900">
                      {
                        member.full_name
                      }
                    </p>

                    <p className="mt-1 text-sm text-slate-500">
                      {
                        member.company_position
                      }
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
                        icon={
                          XCircle
                        }
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
                      {
                        status
                      }
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
                <Save
                  size={17}
                />
              )}

              {savingAttendance
                ? "Saving..."
                : "Save Attendance"}

            </button>

          </div>

        )}

      </div>


      {/* ==================================================
          MINUTES
      ================================================== */}

      <div className="mt-8 rounded-2xl border border-slate-200 bg-white">

        <SectionHeader
          title="Meeting Minutes"
          description="Official notes and supporting document for this meeting."
          icon={FileText}
        />


        <div className="p-6">

          {isMainAdmin ? (

            <>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Minutes
              </label>

              <textarea
                value={
                  minutesText
                }
                onChange={(
                  event
                ) =>
                  setMinutesText(
                    event.target
                      .value
                  )
                }
                rows={10}
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
                      {
                        minutesFile
                          ? minutesFile.name
                          : "Upload PDF or document"
                      }
                    </p>

                    <p className="mt-1 text-xs text-slate-400">
                      Stored privately
                    </p>
                  </div>

                  <input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    className="hidden"
                    onChange={(
                      event
                    ) =>
                      setMinutesFile(
                        event
                          .target
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
                    <Save
                      size={17}
                    />
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
                  {
                    minutesText
                  }
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


      {/* ==================================================
          MEETING DOCUMENTS
      ================================================== */}

      <div className="mt-8 rounded-2xl border border-slate-200 bg-white">

        <div className="flex flex-col gap-4 border-b border-slate-200 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">

          <div className="flex items-start gap-3">

            <div className="rounded-xl bg-[#f1eadc] p-2">

              <FolderOpen
                size={20}
                className="text-[#9b7c3f]"
              />

            </div>

            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Meeting Documents
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Notices, agendas, attendance sheets and supporting documents.
              </p>
            </div>

          </div>


          {isMainAdmin && (

            <button
              onClick={() =>
                setShowDocumentModal(
                  true
                )
              }
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#111315] px-4 py-3 text-sm font-semibold text-white"
            >

              <Plus
                size={17}
              />

              Add Document

            </button>

          )}

        </div>


        <div className="p-6">

          {meetingDocuments.length ===
          0 ? (

            <div className="py-10 text-center">

              <Paperclip
                size={35}
                className="mx-auto text-slate-300"
              />

              <h3 className="mt-4 font-semibold text-slate-800">
                No documents uploaded
              </h3>

              <p className="mt-2 text-sm text-slate-500">
                Documents related to this meeting will appear here.
              </p>

            </div>

          ) : (

            <div className="space-y-3">

              {meetingDocuments.map(
                (document) => (

                  <div
                    key={
                      document.id
                    }
                    className="flex flex-col gap-4 rounded-xl border border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between"
                  >

                    <div className="flex items-start gap-3">

                      <div className="rounded-xl bg-[#f8f7f3] p-3">

                        <FileText
                          size={20}
                          className="text-[#9b7c3f]"
                        />

                      </div>

                      <div>

                        <p className="font-semibold text-slate-900">
                          {
                            document.title
                          }
                        </p>

                        <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-[#9b7c3f]">
                          {
                            formatDocumentType(
                              document.document_type
                            )
                          }
                        </p>

                        {document.original_file_name && (
                          <p className="mt-2 text-xs text-slate-400">
                            {
                              document.original_file_name
                            }
                          </p>
                        )}

                        {document.description && (
                          <p className="mt-2 max-w-xl text-sm text-slate-500">
                            {
                              document.description
                            }
                          </p>
                        )}

                        <p className="mt-2 text-xs text-slate-400">
                          Uploaded{" "}
                          {
                            formatDateTime(
                              document.created_at
                            )
                          }
                        </p>

                      </div>

                    </div>


                    <div className="flex gap-2">

                      <button
                        onClick={() =>
                          viewMeetingDocument(
                            document.file_path
                          )
                        }
                        className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:border-[#c5a66a]"
                      >

                        <ExternalLink
                          size={15}
                        />

                        View

                      </button>


                      {isMainAdmin && (

                        <button
                          onClick={() =>
                            deleteMeetingDocument(
                              document
                            )
                          }
                          className="inline-flex items-center gap-2 rounded-xl border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50"
                        >

                          <Trash2
                            size={15}
                          />

                          Delete

                        </button>

                      )}

                    </div>

                  </div>

                )
              )}

            </div>

          )}

        </div>

      </div>


      {/* ==================================================
          RESOLUTIONS
      ================================================== */}

      <div className="mt-8 rounded-2xl border border-slate-200 bg-white">

        <div className="flex flex-col gap-4 border-b border-slate-200 px-6 py-5 md:flex-row md:items-center md:justify-between">

          <div>

            <h2 className="text-lg font-semibold text-slate-900">
              Resolutions
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Formal decisions, member signatures and final signed documents.
            </p>

          </div>


          {isMainAdmin && (

            <button
              onClick={() =>
                setShowResolutionModal(
                  true
                )
              }
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#111315] px-4 py-3 text-sm font-semibold text-white"
            >

              <Plus
                size={17}
              />

              Create Resolution

            </button>

          )}

        </div>


        <div className="p-6">

          {resolutions.length ===
          0 ? (

            <div className="py-12 text-center">

              <ShieldCheck
                size={38}
                className="mx-auto text-slate-300"
              />

              <h3 className="mt-4 font-semibold text-slate-900">
                No resolutions yet
              </h3>

              <p className="mt-2 text-sm text-slate-500">
                Resolutions created from this meeting will appear here.
              </p>

            </div>

          ) : (

            <div className="space-y-6">

              {resolutions.map(
                (resolution) => {

                  const myRecord =
                    getMySignatoryRecord(
                      resolution
                    )

                  const signedCount =
                    resolution
                      .resolution_signatories
                      ?.filter(
                        (
                          record
                        ) =>
                          record.status ===
                          "signed"
                      ).length ||
                    0

                  const total =
                    resolution
                      .resolution_signatories
                      ?.length ||
                    0

                  const isGenerating =
                    generatingPdfId ===
                    resolution.id

                  return (
                    <div
                      key={
                        resolution.id
                      }
                      className="rounded-2xl border border-slate-200 p-6"
                    >

                      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">

                        <div>

                          <ResolutionStatus
                            status={
                              resolution.status
                            }
                          />

                          <h3 className="mt-3 text-xl font-bold text-slate-900">
                            {
                              resolution.title
                            }
                          </h3>

                        </div>


                        <div className="text-sm font-semibold text-slate-500">
                          {
                            signedCount
                          }{" "}
                          /{" "}
                          {
                            total
                          }{" "}
                          signed
                        </div>

                      </div>


                      <div className="mt-5 whitespace-pre-wrap rounded-xl bg-[#f8f7f3] p-5 text-sm leading-7 text-slate-700">
                        {
                          resolution.resolution_text
                        }
                      </div>


                      <div className="mt-6">

                        <p className="text-sm font-semibold text-slate-900">
                          Required Signatories
                        </p>


                        <div className="mt-3 divide-y divide-slate-100 rounded-xl border border-slate-200">

                          {resolution
                            .resolution_signatories
                            ?.map(
                              (
                                signatory
                              ) => {

                                const signer =
                                  getMember(
                                    signatory.member_id
                                  )

                                return (
                                  <div
                                    key={
                                      signatory.id
                                    }
                                    className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
                                  >

                                    <div>

                                      <p className="text-sm font-semibold text-slate-800">
                                        {
                                          signer?.full_name ||
                                          "Member"
                                        }
                                      </p>

                                      {signatory.signed_at && (

                                        <p className="mt-1 text-xs text-slate-400">
                                          Signed{" "}
                                          {
                                            formatDateTime(
                                              signatory.signed_at
                                            )
                                          }
                                        </p>

                                      )}

                                    </div>


                                    <div className="flex items-center gap-2">

                                      {signatory.status ===
                                      "signed" ? (

                                        <>

                                          <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">

                                            <CheckCircle2
                                              size={13}
                                            />

                                            Signed

                                          </span>


                                          {signatory.signature_path && (

                                            <button
                                              onClick={() =>
                                                viewSignature(
                                                  signatory.signature_path
                                                )
                                              }
                                              className="text-xs font-semibold text-[#9b7c3f]"
                                            >
                                              View Signature
                                            </button>

                                          )}

                                        </>

                                      ) : (

                                        <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                                          Pending
                                        </span>

                                      )}

                                    </div>

                                  </div>
                                )
                              }
                            )}

                        </div>

                      </div>


                      {/* SIGN BUTTON */}

                      {myRecord?.status ===
                        "pending" &&
                        resolution.status ===
                          "pending_signatures" && (

                          <button
                            onClick={() =>
                              openSignatureModal(
                                resolution
                              )
                            }
                            className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#c5a66a] px-5 py-3 text-sm font-bold text-[#111315] sm:w-auto"
                          >

                            <PenLine
                              size={17}
                            />

                            Sign Resolution

                          </button>

                        )}


                      {myRecord?.status ===
                        "signed" && (

                          <div className="mt-6 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-semibold text-green-700">
                            ✓ You have signed this resolution.
                          </div>

                        )}


                      {/* FINAL SIGNED PDF */}

                      {resolution.status ===
                        "completed" && (

                        <div className="mt-6 rounded-2xl border border-[#e0d4bb] bg-[#faf8f3] p-5">

                          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

                            <div className="flex items-start gap-3">

                              <div className="rounded-xl bg-[#eee4d1] p-3">

                                <FileCheck2
                                  size={22}
                                  className="text-[#9b7c3f]"
                                />

                              </div>


                              <div>

                                <p className="font-bold text-slate-900">
                                  Official Signed Resolution
                                </p>

                                {resolution.final_pdf_path ? (

                                  <p className="mt-1 text-sm text-slate-500">
                                    Generated{" "}
                                    {
                                      formatDateTime(
                                        resolution.pdf_generated_at
                                      )
                                    }
                                  </p>

                                ) : (

                                  <p className="mt-1 text-sm text-slate-500">
                                    All signatures are complete. The official PDF is ready to be generated.
                                  </p>

                                )}

                              </div>

                            </div>


                            <div className="flex flex-col gap-2 sm:flex-row">

                              {resolution.final_pdf_path && (

                                <button
                                  onClick={() =>
                                    viewSignedResolutionPdf(
                                      resolution.final_pdf_path
                                    )
                                  }
                                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#c5a66a] bg-white px-4 py-3 text-sm font-semibold text-[#8b6c35]"
                                >

                                  <ExternalLink
                                    size={16}
                                  />

                                  View Signed PDF

                                </button>

                              )}


                              {isMainAdmin && (

                                <button
                                  onClick={() =>
                                    generateSignedResolutionPdf(
                                      resolution
                                    )
                                  }
                                  disabled={
                                    isGenerating
                                  }
                                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#111315] px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
                                >

                                  {isGenerating ? (

                                    <LoaderCircle
                                      size={16}
                                      className="animate-spin"
                                    />

                                  ) : (

                                    <Download
                                      size={16}
                                    />

                                  )}

                                  {isGenerating
                                    ? "Generating..."
                                    : resolution.final_pdf_path
                                      ? "Regenerate PDF"
                                      : "Generate Signed PDF"}

                                </button>

                              )}

                            </div>

                          </div>

                        </div>

                      )}

                    </div>
                  )
                }
              )}

            </div>

          )}

        </div>

      </div>


      {/* ==================================================
          ADD DOCUMENT MODAL
      ================================================== */}

      {showDocumentModal && (

        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">

          <div className="w-full max-w-xl rounded-3xl bg-white">

            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">

              <div>

                <h2 className="text-xl font-bold text-slate-900">
                  Add Meeting Document
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Upload a document related to this meeting.
                </p>

              </div>


              <button
                type="button"
                onClick={() =>
                  setShowDocumentModal(
                    false
                  )
                }
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"
              >

                <X
                  size={20}
                />

              </button>

            </div>


            <form
              onSubmit={
                uploadMeetingDocument
              }
              className="space-y-5 p-6"
            >

              <div>

                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Document Title
                </label>

                <input
                  value={
                    documentForm.title
                  }
                  onChange={(
                    event
                  ) =>
                    setDocumentForm(
                      (
                        previous
                      ) => ({
                        ...previous,

                        title:
                          event
                            .target
                            .value,
                      })
                    )
                  }
                  placeholder="Meeting Notice"
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-[#c5a66a]"
                />

              </div>


              <div>

                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Document Type
                </label>

                <select
                  value={
                    documentForm.documentType
                  }
                  onChange={(
                    event
                  ) =>
                    setDocumentForm(
                      (
                        previous
                      ) => ({
                        ...previous,

                        documentType:
                          event
                            .target
                            .value,
                      })
                    )
                  }
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-[#c5a66a]"
                >

                  <option value="meeting_notice">
                    Meeting Notice
                  </option>

                  <option value="agenda">
                    Agenda
                  </option>

                  <option value="attendance_sheet">
                    Attendance Sheet
                  </option>

                  <option value="minutes">
                    Minutes
                  </option>

                  <option value="supporting_document">
                    Supporting Document
                  </option>

                  <option value="other">
                    Other
                  </option>

                </select>

              </div>


              <div>

                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Description
                </label>

                <textarea
                  value={
                    documentForm.description
                  }
                  onChange={(
                    event
                  ) =>
                    setDocumentForm(
                      (
                        previous
                      ) => ({
                        ...previous,

                        description:
                          event
                            .target
                            .value,
                      })
                    )
                  }
                  rows={3}
                  placeholder="Optional description..."
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-[#c5a66a]"
                />

              </div>


              <div>

                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  File
                </label>

                <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-5">

                  <Upload
                    size={21}
                    className="text-[#9b7c3f]"
                  />

                  <div>

                    <p className="text-sm font-semibold text-slate-700">
                      {
                        documentForm.file
                          ? documentForm.file.name
                          : "Choose document"
                      }
                    </p>

                    <p className="mt-1 text-xs text-slate-400">
                      PDF, DOC, DOCX, JPG or PNG • Maximum 10 MB
                    </p>

                  </div>


                  <input
                    type="file"
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                    className="hidden"
                    onChange={(
                      event
                    ) =>
                      setDocumentForm(
                        (
                          previous
                        ) => ({
                          ...previous,

                          file:
                            event
                              .target
                              .files?.[0] ||
                            null,
                        })
                      )
                    }
                  />

                </label>

              </div>


              <div className="flex justify-end gap-3 border-t border-slate-100 pt-5">

                <button
                  type="button"
                  onClick={() =>
                    setShowDocumentModal(
                      false
                    )
                  }
                  className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700"
                >
                  Cancel
                </button>


                <button
                  type="submit"
                  disabled={
                    uploadingDocument
                  }
                  className="inline-flex items-center gap-2 rounded-xl bg-[#c5a66a] px-5 py-3 text-sm font-bold text-[#111315] disabled:opacity-50"
                >

                  {uploadingDocument ? (

                    <LoaderCircle
                      size={17}
                      className="animate-spin"
                    />

                  ) : (

                    <Upload
                      size={17}
                    />

                  )}

                  {uploadingDocument
                    ? "Uploading..."
                    : "Upload Document"}

                </button>

              </div>

            </form>

          </div>

        </div>

      )}


      {/* ==================================================
          CREATE RESOLUTION MODAL
      ================================================== */}

      {showResolutionModal && (

        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">

          <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white">

            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">

              <div>

                <h2 className="text-xl font-bold text-slate-900">
                  Create Resolution
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Create a formal resolution and choose who must sign.
                </p>

              </div>


              <button
                type="button"
                onClick={() =>
                  setShowResolutionModal(
                    false
                  )
                }
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"
              >

                <X
                  size={20}
                />

              </button>

            </div>


            <form
              onSubmit={
                createResolution
              }
              className="space-y-6 p-6"
            >

              <div>

                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Resolution Title
                </label>

                <input
                  value={
                    resolutionForm.title
                  }
                  onChange={(
                    event
                  ) =>
                    setResolutionForm(
                      (
                        previous
                      ) => ({
                        ...previous,

                        title:
                          event
                            .target
                            .value,
                      })
                    )
                  }
                  placeholder="Elgon View Land Purchase"
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-[#c5a66a]"
                />

              </div>


              <div>

                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Resolution
                </label>

                <textarea
                  value={
                    resolutionForm.resolutionText
                  }
                  onChange={(
                    event
                  ) =>
                    setResolutionForm(
                      (
                        previous
                      ) => ({
                        ...previous,

                        resolutionText:
                          event
                            .target
                            .value,
                      })
                    )
                  }
                  rows={8}
                  placeholder="RESOLVED THAT..."
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 leading-7 outline-none focus:border-[#c5a66a]"
                />

              </div>


              <div>

                <div className="flex flex-wrap items-center justify-between gap-3">

                  <div>

                    <p className="text-sm font-semibold text-slate-900">
                      Required Signatories
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      Select every director who must sign this resolution.
                    </p>

                  </div>


                  <div className="flex gap-2">

                    <button
                      type="button"
                      onClick={
                        selectAllSignatories
                      }
                      className="text-xs font-semibold text-[#9b7c3f]"
                    >
                      Select All
                    </button>

                    <button
                      type="button"
                      onClick={
                        clearSignatories
                      }
                      className="text-xs font-semibold text-slate-400"
                    >
                      Clear
                    </button>

                  </div>

                </div>


                <div className="mt-4 space-y-2">

                  {members.map(
                    (member) => {

                      const selected =
                        resolutionForm
                          .signatoryIds
                          .includes(
                            member.id
                          )

                      const accountApproved =
                        member.account_status ===
                        "approved"

                      return (
                        <label
                          key={
                            member.id
                          }
                          className={`flex items-center justify-between rounded-xl border p-4 ${
                            accountApproved
                              ? "cursor-pointer border-slate-200"
                              : "cursor-not-allowed border-slate-100 bg-slate-50 opacity-60"
                          }`}
                        >

                          <div>

                            <p className="text-sm font-semibold text-slate-800">
                              {
                                member.full_name
                              }
                            </p>

                            <p className="mt-1 text-xs text-slate-400">
                              {
                                accountApproved
                                  ? member.company_position
                                  : "Portal account not approved"
                              }
                            </p>

                          </div>


                          <input
                            type="checkbox"
                            checked={
                              selected
                            }
                            disabled={
                              !accountApproved
                            }
                            onChange={() =>
                              toggleSignatory(
                                member.id
                              )
                            }
                            className="h-5 w-5 accent-[#c5a66a]"
                          />

                        </label>
                      )
                    }
                  )}

                </div>

              </div>


              <div className="flex justify-end gap-3 border-t border-slate-100 pt-5">

                <button
                  type="button"
                  onClick={() => {
                    setShowResolutionModal(
                      false
                    )

                    resetResolutionForm()
                  }}
                  className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700"
                >
                  Cancel
                </button>


                <button
                  type="submit"
                  disabled={
                    creatingResolution
                  }
                  className="inline-flex items-center gap-2 rounded-xl bg-[#c5a66a] px-5 py-3 text-sm font-bold text-[#111315] disabled:opacity-50"
                >

                  {creatingResolution ? (

                    <LoaderCircle
                      size={17}
                      className="animate-spin"
                    />

                  ) : (

                    <Plus
                      size={17}
                    />

                  )}

                  {creatingResolution
                    ? "Creating..."
                    : "Create Resolution"}

                </button>

              </div>

            </form>

          </div>

        </div>

      )}


      {/* ==================================================
          SIGNATURE MODAL
      ================================================== */}

      {showSignatureModal &&
        selectedResolution && (

          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-3 sm:p-4">

            <div className="max-h-[95vh] w-full max-w-xl overflow-y-auto rounded-3xl bg-white">

              <div className="border-b border-slate-200 px-5 py-5 sm:px-6">

                <div className="flex items-start justify-between gap-4">

                  <div>

                    <p className="text-xs font-bold uppercase tracking-wider text-[#9b7c3f]">
                      BNE Construction Ltd
                    </p>

                    <h2 className="mt-2 text-xl font-bold text-slate-900">
                      Sign Resolution
                    </h2>

                  </div>


                  <button
                    onClick={() =>
                      setShowSignatureModal(
                        false
                      )
                    }
                    className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"
                  >

                    <X
                      size={20}
                    />

                  </button>

                </div>

              </div>


              <div className="p-5 sm:p-6">

                <h3 className="font-bold text-slate-900">
                  {
                    selectedResolution.title
                  }
                </h3>


                <div className="mt-4 max-h-44 overflow-y-auto rounded-xl bg-[#f8f7f3] p-4 text-sm leading-7 text-slate-700">
                  {
                    selectedResolution.resolution_text
                  }
                </div>


                <div className="mt-6">

                  <div className="flex items-center justify-between">

                    <label className="text-sm font-bold text-slate-900">
                      Your Signature
                    </label>

                    <button
                      type="button"
                      onClick={
                        clearSignature
                      }
                      className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500"
                    >

                      <RotateCcw
                        size={14}
                      />

                      Clear

                    </button>

                  </div>


                  <p className="mt-1 text-xs text-slate-500">
                    Sign inside the box using your finger, stylus or mouse.
                  </p>


                  <div className="mt-3 overflow-hidden rounded-xl border-2 border-dashed border-slate-300 bg-white">

                    <canvas
                      ref={
                        canvasRef
                      }
                      className="block h-[220px] w-full touch-none"
                    />

                  </div>

                </div>


                <label className="mt-5 flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 p-4">

                  <input
                    type="checkbox"
                    checked={
                      confirmSignature
                    }
                    onChange={(
                      event
                    ) =>
                      setConfirmSignature(
                        event.target
                          .checked
                      )
                    }
                    className="mt-1 h-5 w-5 accent-[#c5a66a]"
                  />

                  <span className="text-sm leading-6 text-slate-600">
                    I confirm that I have read this resolution and that this signature is mine.
                  </span>

                </label>


                <div className="mt-5 rounded-xl bg-slate-50 p-4">

                  <p className="text-xs leading-5 text-slate-500">
                    Signed as{" "}
                    <strong className="text-slate-700">
                      {
                        loggedInMember?.full_name
                      }
                    </strong>
                    . Your portal account and signing time will be recorded with this signature.
                  </p>

                </div>


                <button
                  onClick={
                    submitSignature
                  }
                  disabled={
                    signing ||
                    !confirmSignature
                  }
                  className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#c5a66a] px-5 py-4 font-bold text-[#111315] disabled:cursor-not-allowed disabled:opacity-50"
                >

                  {signing ? (

                    <LoaderCircle
                      size={19}
                      className="animate-spin"
                    />

                  ) : (

                    <PenLine
                      size={19}
                    />

                  )}

                  {signing
                    ? "Signing..."
                    : "Confirm & Sign"}

                </button>

              </div>

            </div>

          </div>

        )}

    </div>
  )
}


// ==================================================
// COMPONENT HELPERS
// ==================================================

function SectionHeader({
  title,
  description,
  icon: Icon,
}) {
  return (
    <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">

      <div>

        <h2 className="text-lg font-semibold text-slate-900">
          {title}
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          {description}
        </p>

      </div>

      <Icon
        size={22}
        className="text-[#9b7c3f]"
      />

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

      <Icon
        size={14}
      />

      {label}

    </button>
  )
}


function ResolutionStatus({
  status,
}) {
  const styles = {
    draft:
      "bg-slate-100 text-slate-600",

    pending_signatures:
      "bg-amber-50 text-amber-700",

    completed:
      "bg-green-50 text-green-700",

    cancelled:
      "bg-red-50 text-red-700",
  }

  const labels = {
    draft:
      "Draft",

    pending_signatures:
      "Pending Signatures",

    completed:
      "Completed",

    cancelled:
      "Cancelled",
  }

  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
        styles[status] ||
        "bg-slate-100 text-slate-600"
      }`}
    >
      {
        labels[status] ||
        status
      }
    </span>
  )
}


function formatDocumentType(
  type
) {
  const types = {
    meeting_notice:
      "Meeting Notice",

    agenda:
      "Agenda",

    attendance_sheet:
      "Attendance Sheet",

    minutes:
      "Minutes",

    supporting_document:
      "Supporting Document",

    other:
      "Other",
  }

  return (
    types[type] ||
    type
  )
}


// ==================================================
// PDF HELPERS
// ==================================================

function wrapPdfText(
  text,
  font,
  fontSize,
  maxWidth
) {
  const words =
    String(text)
      .trim()
      .split(/\s+/)

  const lines = []

  let currentLine = ""

  for (
    const word of words
  ) {
    const testLine =
      currentLine
        ? `${currentLine} ${word}`
        : word

    const width =
      font.widthOfTextAtSize(
        testLine,
        fontSize
      )

    if (
      width <=
        maxWidth ||
      currentLine === ""
    ) {
      currentLine =
        testLine
    } else {
      lines.push(
        currentLine
      )

      currentLine =
        word
    }
  }

  if (currentLine) {
    lines.push(
      currentLine
    )
  }

  return lines
}


function drawPdfFooter(
  page,
  font,
  pageWidth,
  pageNumber = null,
  totalPages = null
) {
  const footerY = 24

  page.drawLine({
    start: {
      x: 55,
      y: 38,
    },

    end: {
      x:
        pageWidth -
        55,
      y: 38,
    },

    thickness: 0.4,

    color:
      rgb(
        0.82,
        0.82,
        0.82
      ),
  })

  page.drawText(
    "BNE Construction Ltd • Official Resolution",
    {
      x: 55,
      y: footerY,
      size: 7.5,
      font,
      color:
        rgb(
          0.5,
          0.5,
          0.5
        ),
    }
  )

  if (
    pageNumber !== null &&
    totalPages !== null
  ) {
    const pageText =
      `Page ${pageNumber} of ${totalPages}`

    const width =
      font.widthOfTextAtSize(
        pageText,
        7.5
      )

    page.drawText(
      pageText,
      {
        x:
          pageWidth -
          55 -
          width,

        y:
          footerY,

        size:
          7.5,

        font,

        color:
          rgb(
            0.5,
            0.5,
            0.5
          ),
      }
    )
  }
}


export default MeetingDetails