import {
  useEffect,
  useMemo,
  useState,
} from "react"

import {
  useNavigate,
  useParams,
} from "react-router-dom"

import {
  ArrowLeft,
  Archive,
  Building2,
  CalendarDays,
  CheckCircle2,
  CircleDollarSign,
  ExternalLink,
  FileText,
  FolderOpen,
  Image,
  LoaderCircle,
  MapPin,
  Plus,
  ReceiptText,
  Save,
  Trash2,
  Upload,
  Video,
  Wallet,
  X,
  XCircle,
} from "lucide-react"

import { supabase } from "../lib/supabase"
import { useAuth } from "../context/AuthContext"


function ProjectDetails() {
  const { projectId } = useParams()

  const navigate = useNavigate()

  const {
    user,
    isMainAdmin,
    isTreasurer,
  } = useAuth()


  const [project, setProject] =
    useState(null)

  const [documents, setDocuments] =
    useState([])

  const [expenses, setExpenses] =
    useState([])

  const [progressUpdates, setProgressUpdates] =
    useState([])


  const [loading, setLoading] =
    useState(true)

  const [savingProject, setSavingProject] =
    useState(false)

  const [
    uploadingDocument,
    setUploadingDocument,
  ] = useState(false)

  const [
    submittingExpense,
    setSubmittingExpense,
  ] = useState(false)

  const [
    reviewingExpenseId,
    setReviewingExpenseId,
  ] = useState(null)

  const [
    savingProgress,
    setSavingProgress,
  ] = useState(false)

  const [
    deletingProgressId,
    setDeletingProgressId,
  ] = useState(null)


  const [error, setError] =
    useState("")

  const [message, setMessage] =
    useState("")


  const [
    showDocumentModal,
    setShowDocumentModal,
  ] = useState(false)

  const [
    showExpenseModal,
    setShowExpenseModal,
  ] = useState(false)

  const [
    showProgressModal,
    setShowProgressModal,
  ] = useState(false)


  const [projectForm, setProjectForm] =
    useState({
      title: "",
      description: "",
      location: "",
      projectStatus: "planning",
      startDate: "",
      expectedCompletionDate: "",
      actualCompletionDate: "",
      budget: "",
    })


  const [documentForm, setDocumentForm] =
    useState({
      title: "",
      category: "other",
      description: "",
      file: null,
    })


  const [expenseForm, setExpenseForm] =
    useState({
      expenseDate: "",
      expenseTitle: "",
      category: "",
      supplier: "",
      amount: "",
      transactionReference: "",
      notes: "",
      evidence: null,
    })


  const [progressForm, setProgressForm] =
    useState({
      progressDate: "",
      stage: "",
      completionPercentage: "",
      caption: "",
      media: null,
    })


  useEffect(() => {
    loadProject()
  }, [projectId])


  const loadProject = async () => {
    try {
      setLoading(true)
      setError("")

      const [
        projectResult,
        documentsResult,
        expensesResult,
        progressResult,
      ] = await Promise.all([
        supabase
          .from("projects")
          .select("*")
          .eq("id", projectId)
          .single(),

        supabase
          .from("project_documents")
          .select("*")
          .eq("project_id", projectId)
          .order("created_at", {
            ascending: false,
          }),

        supabase
          .from("project_expenses")
          .select("*")
          .eq("project_id", projectId)
          .order("expense_date", {
            ascending: false,
          }),

        supabase
          .from("project_progress")
          .select("*")
          .eq("project_id", projectId)
          .order("progress_date", {
            ascending: false,
          })
          .order("created_at", {
            ascending: false,
          }),
      ])


      if (projectResult.error) {
        throw projectResult.error
      }

      if (documentsResult.error) {
        throw documentsResult.error
      }

      if (expensesResult.error) {
        throw expensesResult.error
      }

      if (progressResult.error) {
        throw progressResult.error
      }


      setProject(
        projectResult.data
      )

      setDocuments(
        documentsResult.data || []
      )

      setExpenses(
        expensesResult.data || []
      )

      setProgressUpdates(
        progressResult.data || []
      )


      setProjectForm({
        title:
          projectResult.data.title || "",

        description:
          projectResult.data.description || "",

        location:
          projectResult.data.location || "",

        projectStatus:
          projectResult.data.project_status || "planning",

        startDate:
          projectResult.data.start_date || "",

        expectedCompletionDate:
          projectResult.data.expected_completion_date || "",

        actualCompletionDate:
          projectResult.data.actual_completion_date || "",

        budget:
          projectResult.data.budget ?? "",
      })

    } catch (error) {

      console.error(
        "Load project error:",
        error
      )

      setError(
        error.message ||
        "Unable to load project."
      )

    } finally {
      setLoading(false)
    }
  }


  // ==================================================
  // FINANCIAL SUMMARY
  // ==================================================

  const approvedExpenses =
    useMemo(
      () =>
        expenses.filter(
          (expense) =>
            expense.approval_status ===
            "approved"
        ),
      [expenses]
    )


  const pendingExpenses =
    useMemo(
      () =>
        expenses.filter(
          (expense) =>
            expense.approval_status ===
            "pending"
        ),
      [expenses]
    )


  const totalApprovedSpent =
    approvedExpenses.reduce(
      (total, expense) =>
        total +
        Number(
          expense.amount || 0
        ),
      0
    )


  const projectBudget =
    Number(
      project?.budget || 0
    )


  const remainingBudget =
    projectBudget -
    totalApprovedSpent


  const latestProgress =
    progressUpdates.length > 0
      ? progressUpdates[0]
      : null


  const currentCompletion =
    Number(
      latestProgress
        ?.completion_percentage || 0
    )


  const isArchived =
    project?.is_archived === true


  // ==================================================
  // UPDATE PROJECT
  // ==================================================

  const saveProject =
    async () => {
      try {
        setSavingProject(true)
        setError("")
        setMessage("")

        if (!isMainAdmin) {
          throw new Error(
            "Only the Main Admin can edit projects."
          )
        }

        if (isArchived) {
          throw new Error(
            "Archived projects are read-only. Restore this project before editing it."
          )
        }

        if (
          !projectForm.title.trim()
        ) {
          throw new Error(
            "Project title is required."
          )
        }

        if (
          projectForm.budget &&
          Number(
            projectForm.budget
          ) < 0
        ) {
          throw new Error(
            "Budget cannot be negative."
          )
        }


        const actualCompletionDate =
          projectForm.projectStatus ===
          "completed"
            ? projectForm.actualCompletionDate ||
              null
            : null


        const { error } =
          await supabase
            .from("projects")
            .update({
              title:
                projectForm.title.trim(),

              description:
                projectForm.description.trim() ||
                null,

              location:
                projectForm.location.trim() ||
                null,

              project_status:
                projectForm.projectStatus,

              start_date:
                projectForm.startDate ||
                null,

              expected_completion_date:
                projectForm.expectedCompletionDate ||
                null,

              actual_completion_date:
                actualCompletionDate,

              budget:
                projectForm.budget !== ""
                  ? Number(
                      projectForm.budget
                    )
                  : null,

              updated_at:
                new Date()
                  .toISOString(),
            })
            .eq(
              "id",
              projectId
            )


        if (error) {
          throw error
        }


        setMessage(
          "Project updated successfully."
        )

        await loadProject()

      } catch (error) {

        console.error(
          "Update project error:",
          error
        )

        setError(
          error.message ||
          "Unable to update project."
        )

      } finally {
        setSavingProject(false)
      }
    }


  // ==================================================
  // PROJECT DOCUMENTS
  // ==================================================

  const uploadProjectDocument =
    async (event) => {
      event.preventDefault()

      let uploadedPath = null

      try {
        setUploadingDocument(true)
        setError("")
        setMessage("")

        if (!isMainAdmin) {
          throw new Error(
            "Only the Main Admin can upload project documents."
          )
        }

        if (isArchived) {
          throw new Error(
            "Archived projects are read-only. Restore this project before adding documents."
          )
        }

        if (
          !documentForm.title.trim()
        ) {
          throw new Error(
            "Enter a document title."
          )
        }

        if (!documentForm.file) {
          throw new Error(
            "Select a document."
          )
        }


        const allowedTypes = [
          "application/pdf",
          "application/msword",
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          "application/vnd.ms-excel",
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "image/jpeg",
          "image/png",
        ]


        if (
          !allowedTypes.includes(
            documentForm.file.type
          )
        ) {
          throw new Error(
            "Only PDF, DOC, DOCX, XLS, XLSX, JPG and PNG files are allowed."
          )
        }


        const maxSize =
          15 * 1024 * 1024


        if (
          documentForm.file.size >
          maxSize
        ) {
          throw new Error(
            "Document must be 15 MB or smaller."
          )
        }


        const safeName =
          documentForm.file.name.replace(
            /[^a-zA-Z0-9._-]/g,
            "_"
          )


        uploadedPath =
          `${projectId}/${user.id}/${crypto.randomUUID()}-${safeName}`


        const {
          error: uploadError,
        } =
          await supabase.storage
            .from(
              "project-documents"
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
          error: databaseError,
        } =
          await supabase
            .from(
              "project_documents"
            )
            .insert({
              project_id:
                projectId,

              title:
                documentForm.title.trim(),

              document_category:
                documentForm.category,

              description:
                documentForm.description.trim() ||
                null,

              file_path:
                uploadedPath,

              original_file_name:
                documentForm.file.name,

              uploaded_by:
                user.id,
            })


        if (databaseError) {
          throw databaseError
        }


        setDocumentForm({
          title: "",
          category: "other",
          description: "",
          file: null,
        })


        setShowDocumentModal(
          false
        )


        setMessage(
          "Project document uploaded successfully."
        )


        await loadProject()

      } catch (error) {

        console.error(
          "Upload project document error:",
          error
        )


        if (uploadedPath) {
          await supabase.storage
            .from(
              "project-documents"
            )
            .remove([
              uploadedPath,
            ])
        }


        setError(
          error.message ||
          "Unable to upload project document."
        )

      } finally {
        setUploadingDocument(false)
      }
    }


  const viewProjectDocument =
    async (filePath) => {
      try {
        setError("")

        const {
          data,
          error,
        } =
          await supabase.storage
            .from(
              "project-documents"
            )
            .createSignedUrl(
              filePath,
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

        setError(
          error.message ||
          "Unable to open document."
        )
      }
    }


  const deleteProjectDocument =
    async (document) => {
      const confirmed =
        window.confirm(
          `Delete "${document.title}"?`
        )


      if (!confirmed) {
        return
      }


      try {
        setError("")
        setMessage("")

        if (isArchived) {
          throw new Error(
            "Archived projects are read-only. Restore this project before deleting documents."
          )
        }


        const {
          error: storageError,
        } =
          await supabase.storage
            .from(
              "project-documents"
            )
            .remove([
              document.file_path,
            ])


        if (storageError) {
          throw storageError
        }


        const {
          error: databaseError,
        } =
          await supabase
            .from(
              "project_documents"
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
          "Project document deleted."
        )


        await loadProject()

      } catch (error) {

        setError(
          error.message ||
          "Unable to delete project document."
        )
      }
    }


  // ==================================================
  // EXPENSES
  // ==================================================

  const submitExpense =
    async (event) => {
      event.preventDefault()

      let evidencePath = null


      try {
        setSubmittingExpense(true)
        setError("")
        setMessage("")

        if (isArchived) {
          throw new Error(
            "Archived projects are read-only. Restore this project before adding expenses."
          )
        }


        if (
          !expenseForm.expenseDate
        ) {
          throw new Error(
            "Expense date is required."
          )
        }


        if (
          !expenseForm.expenseTitle.trim()
        ) {
          throw new Error(
            "Expense title is required."
          )
        }


        if (
          !expenseForm.category.trim()
        ) {
          throw new Error(
            "Expense category is required."
          )
        }


        if (
          !expenseForm.amount ||
          Number(
            expenseForm.amount
          ) <= 0
        ) {
          throw new Error(
            "Enter a valid expense amount."
          )
        }


        if (
          expenseForm.evidence
        ) {
          const allowedTypes = [
            "application/pdf",
            "image/jpeg",
            "image/png",
          ]


          if (
            !allowedTypes.includes(
              expenseForm.evidence.type
            )
          ) {
            throw new Error(
              "Expense evidence must be PDF, JPG or PNG."
            )
          }


          const maxSize =
            5 * 1024 * 1024


          if (
            expenseForm.evidence.size >
            maxSize
          ) {
            throw new Error(
              "Expense evidence must be 5 MB or smaller."
            )
          }


          const safeName =
            expenseForm.evidence.name.replace(
              /[^a-zA-Z0-9._-]/g,
              "_"
            )


          evidencePath =
            `${user.id}/${projectId}/${crypto.randomUUID()}-${safeName}`


          const {
            error: uploadError,
          } =
            await supabase.storage
              .from(
                "project-expense-evidence"
              )
              .upload(
                evidencePath,
                expenseForm.evidence,
                {
                  cacheControl:
                    "3600",

                  upsert: false,
                }
              )


          if (uploadError) {
            throw uploadError
          }
        }


        const {
          error: databaseError,
        } =
          await supabase
            .from(
              "project_expenses"
            )
            .insert({
              project_id:
                projectId,

              expense_date:
                expenseForm.expenseDate,

              expense_title:
                expenseForm.expenseTitle.trim(),

              category:
                expenseForm.category.trim(),

              supplier:
                expenseForm.supplier.trim() ||
                null,

              amount:
                Number(
                  expenseForm.amount
                ),

              transaction_reference:
                expenseForm.transactionReference.trim() ||
                null,

              notes:
                expenseForm.notes.trim() ||
                null,

              evidence_path:
                evidencePath,

              submitted_by:
                user.id,

              approval_status:
                "pending",
            })


        if (databaseError) {
          throw databaseError
        }


        setExpenseForm({
          expenseDate: "",
          expenseTitle: "",
          category: "",
          supplier: "",
          amount: "",
          transactionReference: "",
          notes: "",
          evidence: null,
        })


        setShowExpenseModal(
          false
        )


        setMessage(
          "Project expense submitted for approval."
        )


        await loadProject()

      } catch (error) {

        console.error(
          "Submit expense error:",
          error
        )


        if (evidencePath) {
          await supabase.storage
            .from(
              "project-expense-evidence"
            )
            .remove([
              evidencePath,
            ])
        }


        setError(
          error.message ||
          "Unable to submit project expense."
        )

      } finally {
        setSubmittingExpense(false)
      }
    }


  const approveExpense =
    async (expense) => {
      try {
        setReviewingExpenseId(
          expense.id
        )

        setError("")
        setMessage("")


        const { error } =
          await supabase.rpc(
            "approve_project_expense",
            {
              p_expense_id:
                expense.id,
            }
          )


        if (error) {
          throw error
        }


        setMessage(
          "Project expense approved."
        )


        await loadProject()

      } catch (error) {

        setError(
          error.message ||
          "Unable to approve expense."
        )

      } finally {
        setReviewingExpenseId(
          null
        )
      }
    }


  const rejectExpense =
    async (expense) => {
      const reason =
        window.prompt(
          "Enter rejection reason:"
        )


      if (reason === null) {
        return
      }


      try {
        setReviewingExpenseId(
          expense.id
        )

        setError("")
        setMessage("")


        const { error } =
          await supabase.rpc(
            "reject_project_expense",
            {
              p_expense_id:
                expense.id,

              p_reason:
                reason.trim() ||
                null,
            }
          )


        if (error) {
          throw error
        }


        setMessage(
          "Project expense rejected."
        )


        await loadProject()

      } catch (error) {

        setError(
          error.message ||
          "Unable to reject expense."
        )

      } finally {
        setReviewingExpenseId(
          null
        )
      }
    }


  const viewExpenseEvidence =
    async (evidencePath) => {
      try {
        const {
          data,
          error,
        } =
          await supabase.storage
            .from(
              "project-expense-evidence"
            )
            .createSignedUrl(
              evidencePath,
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

        setError(
          error.message ||
          "Unable to open expense evidence."
        )
      }
    }


  // ==================================================
  // PROJECT PROGRESS
  // ==================================================

  const submitProgress =
    async (event) => {
      event.preventDefault()

      let mediaPath = null

      try {
        setSavingProgress(true)
        setError("")
        setMessage("")


        if (!isMainAdmin) {
          throw new Error(
            "Only the Main Admin can add project progress updates."
          )
        }

        if (isArchived) {
          throw new Error(
            "Archived projects are read-only. Restore this project before adding progress updates."
          )
        }


        if (
          !progressForm.progressDate
        ) {
          throw new Error(
            "Progress date is required."
          )
        }


        if (
          !progressForm.stage.trim()
        ) {
          throw new Error(
            "Enter the construction stage."
          )
        }


        const percentage =
          Number(
            progressForm.completionPercentage
          )


        if (
          progressForm.completionPercentage === "" ||
          percentage < 0 ||
          percentage > 100
        ) {
          throw new Error(
            "Completion percentage must be between 0 and 100."
          )
        }


        let mediaType = null


        if (progressForm.media) {
          const file =
            progressForm.media


          const allowedImageTypes = [
            "image/jpeg",
            "image/png",
            "image/webp",
          ]


          const allowedVideoTypes = [
            "video/mp4",
            "video/webm",
            "video/quicktime",
          ]


          if (
            allowedImageTypes.includes(
              file.type
            )
          ) {
            mediaType = "image"

            if (
              file.size >
              10 * 1024 * 1024
            ) {
              throw new Error(
                "Progress image must be 10 MB or smaller."
              )
            }

          } else if (
            allowedVideoTypes.includes(
              file.type
            )
          ) {
            mediaType = "video"

            if (
              file.size >
              100 * 1024 * 1024
            ) {
              throw new Error(
                "Progress video must be 100 MB or smaller."
              )
            }

          } else {
            throw new Error(
              "Progress media must be JPG, PNG, WEBP, MP4, WEBM or MOV."
            )
          }


          const safeName =
            file.name.replace(
              /[^a-zA-Z0-9._-]/g,
              "_"
            )


          mediaPath =
            `${projectId}/${user.id}/${crypto.randomUUID()}-${safeName}`


          const {
            error: uploadError,
          } =
            await supabase.storage
              .from(
                "project-progress-media"
              )
              .upload(
                mediaPath,
                file,
                {
                  cacheControl:
                    "3600",

                  upsert: false,
                }
              )


          if (uploadError) {
            throw uploadError
          }
        }


        const {
          error: databaseError,
        } =
          await supabase
            .from(
              "project_progress"
            )
            .insert({
              project_id:
                projectId,

              progress_date:
                progressForm.progressDate,

              stage:
                progressForm.stage.trim(),

              completion_percentage:
                percentage,

              caption:
                progressForm.caption.trim() ||
                null,

              media_path:
                mediaPath,

              media_type:
                mediaType,

              uploaded_by:
                user.id,
            })


        if (databaseError) {
          throw databaseError
        }


        setProgressForm({
          progressDate: "",
          stage: "",
          completionPercentage: "",
          caption: "",
          media: null,
        })


        setShowProgressModal(
          false
        )


        setMessage(
          "Project progress update added successfully."
        )


        await loadProject()

      } catch (error) {

        console.error(
          "Progress update error:",
          error
        )


        if (mediaPath) {
          await supabase.storage
            .from(
              "project-progress-media"
            )
            .remove([
              mediaPath,
            ])
        }


        setError(
          error.message ||
          "Unable to add progress update."
        )

      } finally {
        setSavingProgress(false)
      }
    }


  const openProgressMedia =
    async (progress) => {
      try {
        if (!progress.media_path) {
          return
        }


        const {
          data,
          error,
        } =
          await supabase.storage
            .from(
              "project-progress-media"
            )
            .createSignedUrl(
              progress.media_path,
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

        setError(
          error.message ||
          "Unable to open progress media."
        )
      }
    }


  const deleteProgress =
    async (progress) => {
      const confirmed =
        window.confirm(
          `Delete the progress update "${progress.stage}"?`
        )


      if (!confirmed) {
        return
      }


      try {
        setDeletingProgressId(
          progress.id
        )

        setError("")
        setMessage("")

        if (isArchived) {
          throw new Error(
            "Archived projects are read-only. Restore this project before deleting progress updates."
          )
        }


        if (
          progress.media_path
        ) {
          const {
            error: storageError,
          } =
            await supabase.storage
              .from(
                "project-progress-media"
              )
              .remove([
                progress.media_path,
              ])


          if (storageError) {
            throw storageError
          }
        }


        const {
          error: databaseError,
        } =
          await supabase
            .from(
              "project_progress"
            )
            .delete()
            .eq(
              "id",
              progress.id
            )


        if (databaseError) {
          throw databaseError
        }


        setMessage(
          "Progress update deleted."
        )


        await loadProject()

      } catch (error) {

        setError(
          error.message ||
          "Unable to delete progress update."
        )

      } finally {
        setDeletingProgressId(
          null
        )
      }
    }


  // ==================================================
  // LOADING
  // ==================================================

  if (loading) {
    return (
      <div className="flex min-h-[450px] items-center justify-center">

        <div className="text-center">

          <LoaderCircle
            size={34}
            className="mx-auto animate-spin text-[#9b7c3f]"
          />

          <p className="mt-3 text-sm text-slate-500">
            Loading project...
          </p>

        </div>

      </div>
    )
  }


  if (!project) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-8">

        <h1 className="text-xl font-bold text-red-700">
          Project not found
        </h1>

      </div>
    )
  }


  return (
    <div>

      <button
        onClick={() =>
          navigate(
            "/projects"
          )
        }
        className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-[#9b7c3f]"
      >

        <ArrowLeft size={17} />

        Back to Projects

      </button>


      {/* HEADER */}

      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-7">

        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">

          <div>

            <ProjectStatus
              status={
                project.project_status
              }
            />


            {isArchived && (
              <span className="ml-2 inline-flex items-center gap-1.5 rounded-full bg-[#f1eadc] px-3 py-1 text-xs font-semibold text-[#80662f]">
                <Archive size={13} />
                Archived
              </span>
            )}

            <h1 className="mt-4 text-3xl font-bold text-slate-900">
              {project.title}
            </h1>


            {project.description && (
              <p className="mt-3 max-w-3xl leading-7 text-slate-500">
                {project.description}
              </p>
            )}

          </div>


          <div className="space-y-3 text-sm text-slate-600">

            {project.location && (
              <InfoRow
                icon={MapPin}
                value={
                  project.location
                }
              />
            )}

            {project.start_date && (
              <InfoRow
                icon={
                  CalendarDays
                }
                value={`Started ${formatDate(
                  project.start_date
                )}`}
              />
            )}

            <InfoRow
              icon={
                CircleDollarSign
              }
              value={`Budget ${formatKES(
                project.budget || 0
              )}`}
            />

          </div>

        </div>


        {/* PROGRESS BAR */}

        <div className="mt-7 border-t border-slate-100 pt-6">

          <div className="flex items-center justify-between">

            <p className="text-sm font-semibold text-slate-700">
              Project Completion
            </p>

            <p className="text-sm font-bold text-[#9b7c3f]">
              {currentCompletion}%
            </p>

          </div>


          <div className="mt-3 h-3 overflow-hidden rounded-full bg-slate-100">

            <div
              className="h-full rounded-full bg-[#c5a66a] transition-all"
              style={{
                width:
                  `${currentCompletion}%`,
              }}
            />

          </div>


          {latestProgress && (
            <p className="mt-3 text-xs text-slate-400">
              Latest stage:{" "}
              <span className="font-semibold text-slate-600">
                {latestProgress.stage}
              </span>
            </p>
          )}

        </div>

      </div>


      {isArchived && (
        <div className="mt-6 rounded-2xl border border-[#e2d4b7] bg-[#faf7f0] px-5 py-4">
          <div className="flex items-start gap-3">
            <Archive
              size={20}
              className="mt-0.5 shrink-0 text-[#9b7c3f]"
            />

            <div>
              <p className="text-sm font-bold text-slate-800">
                Archived Project
              </p>

              <p className="mt-1 text-sm leading-6 text-slate-600">
                This project is being kept as a historical company record.
                Existing documents, expenses and progress remain available,
                but project details and records cannot be changed until the
                project is restored from the Projects page.
              </p>

              {project.archived_at && (
                <p className="mt-2 text-xs font-semibold text-[#80662f]">
                  Archived {formatDateTime(project.archived_at)}
                </p>
              )}
            </div>
          </div>
        </div>
      )}


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


      {/* FINANCIAL SUMMARY */}

      <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">

        <SummaryCard
          title="Project Budget"
          value={
            formatKES(
              projectBudget
            )
          }
          icon={
            CircleDollarSign
          }
        />

        <SummaryCard
          title="Approved Spent"
          value={
            formatKES(
              totalApprovedSpent
            )
          }
          icon={Wallet}
        />

        <SummaryCard
          title="Remaining"
          value={
            formatKES(
              remainingBudget
            )
          }
          icon={
            Building2
          }
        />

        <SummaryCard
          title="Pending Expenses"
          value={
            pendingExpenses.length
          }
          icon={
            ReceiptText
          }
        />

      </div>


      {/* PROJECT DETAILS */}

      <div className="mt-8 rounded-2xl border border-slate-200 bg-white">

        <SectionHeader
          title="Project Details"
          description="General project information and project status."
          icon={
            Building2
          }
        />


        <div className="p-6">

          {isMainAdmin && !isArchived ? (

            <div className="grid gap-5 md:grid-cols-2">

              <FormField label="Project Title">

                <input
                  value={
                    projectForm.title
                  }
                  onChange={(event) =>
                    setProjectForm(
                      (previous) => ({
                        ...previous,

                        title:
                          event.target.value,
                      })
                    )
                  }
                  className="input-style"
                />

              </FormField>


              <FormField label="Location">

                <input
                  value={
                    projectForm.location
                  }
                  onChange={(event) =>
                    setProjectForm(
                      (previous) => ({
                        ...previous,

                        location:
                          event.target.value,
                      })
                    )
                  }
                  className="input-style"
                />

              </FormField>


              <FormField label="Status">

                <select
                  value={
                    projectForm.projectStatus
                  }
                  onChange={(event) =>
                    setProjectForm(
                      (previous) => ({
                        ...previous,

                        projectStatus:
                          event.target.value,
                      })
                    )
                  }
                  className="input-style bg-white"
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

              </FormField>


              <FormField label="Budget">

                <input
                  type="number"
                  min="0"
                  value={
                    projectForm.budget
                  }
                  onChange={(event) =>
                    setProjectForm(
                      (previous) => ({
                        ...previous,

                        budget:
                          event.target.value,
                      })
                    )
                  }
                  className="input-style"
                />

              </FormField>


              <FormField label="Start Date">

                <input
                  type="date"
                  value={
                    projectForm.startDate
                  }
                  onChange={(event) =>
                    setProjectForm(
                      (previous) => ({
                        ...previous,

                        startDate:
                          event.target.value,
                      })
                    )
                  }
                  className="input-style"
                />

              </FormField>


              <FormField label="Expected Completion">

                <input
                  type="date"
                  value={
                    projectForm.expectedCompletionDate
                  }
                  onChange={(event) =>
                    setProjectForm(
                      (previous) => ({
                        ...previous,

                        expectedCompletionDate:
                          event.target.value,
                      })
                    )
                  }
                  className="input-style"
                />

              </FormField>


              {projectForm.projectStatus ===
                "completed" && (

                <FormField label="Actual Completion">

                  <input
                    type="date"
                    value={
                      projectForm.actualCompletionDate
                    }
                    onChange={(event) =>
                      setProjectForm(
                        (previous) => ({
                          ...previous,

                          actualCompletionDate:
                            event.target.value,
                        })
                      )
                    }
                    className="input-style"
                  />

                </FormField>

              )}


              <div className="md:col-span-2">

                <FormField label="Description">

                  <textarea
                    rows={5}
                    value={
                      projectForm.description
                    }
                    onChange={(event) =>
                      setProjectForm(
                        (previous) => ({
                          ...previous,

                          description:
                            event.target.value,
                        })
                      )
                    }
                    className="input-style"
                  />

                </FormField>

              </div>


              <div className="md:col-span-2">

                <button
                  onClick={
                    saveProject
                  }
                  disabled={
                    savingProject
                  }
                  className="inline-flex items-center gap-2 rounded-xl bg-[#c5a66a] px-5 py-3 text-sm font-bold text-[#111315] disabled:opacity-50"
                >

                  {savingProject ? (
                    <LoaderCircle
                      size={17}
                      className="animate-spin"
                    />
                  ) : (
                    <Save
                      size={17}
                    />
                  )}

                  {savingProject
                    ? "Saving..."
                    : "Save Project"}

                </button>

              </div>

            </div>

          ) : (

            <div className="grid gap-5 md:grid-cols-2">

              <ReadOnlyDetail
                label="Location"
                value={
                  project.location ||
                  "Not set"
                }
              />

              <ReadOnlyDetail
                label="Status"
                value={
                  formatProjectStatus(
                    project.project_status
                  )
                }
              />

              <ReadOnlyDetail
                label="Start Date"
                value={
                  formatDate(
                    project.start_date
                  )
                }
              />

              <ReadOnlyDetail
                label="Expected Completion"
                value={
                  formatDate(
                    project.expected_completion_date
                  )
                }
              />

            </div>

          )}

        </div>

      </div>


      {/* DOCUMENTS */}

      <div className="mt-8 rounded-2xl border border-slate-200 bg-white">

        <div className="flex flex-col gap-4 border-b border-slate-200 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">

          <div>

            <h2 className="text-lg font-semibold text-slate-900">
              Project Documents
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              QS, architecture, legal, engineering and approval documents.
            </p>

          </div>


          {isMainAdmin && !isArchived && (

            <button
              onClick={() =>
                setShowDocumentModal(
                  true
                )
              }
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#111315] px-4 py-3 text-sm font-semibold text-white"
            >

              <Plus size={17} />

              Add Document

            </button>

          )}

        </div>


        <div className="p-6">

          {documents.length === 0 ? (

            <EmptyState
              icon={
                FolderOpen
              }
              title="No project documents"
              text="Project documents will appear here."
            />

          ) : (

            <div className="space-y-3">

              {documents.map(
                (document) => (

                  <div
                    key={
                      document.id
                    }
                    className="flex flex-col gap-4 rounded-xl border border-slate-200 p-4 md:flex-row md:items-center md:justify-between"
                  >

                    <div>

                      <p className="font-semibold text-slate-900">
                        {document.title}
                      </p>

                      <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-[#9b7c3f]">
                        {formatDocumentCategory(
                          document.document_category
                        )}
                      </p>

                      {document.description && (
                        <p className="mt-2 text-sm text-slate-500">
                          {document.description}
                        </p>
                      )}

                    </div>


                    <div className="flex gap-2">

                      <button
                        onClick={() =>
                          viewProjectDocument(
                            document.file_path
                          )
                        }
                        className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700"
                      >

                        <ExternalLink
                          size={15}
                        />

                        View

                      </button>


                      {isMainAdmin && !isArchived && (

                        <button
                          onClick={() =>
                            deleteProjectDocument(
                              document
                            )
                          }
                          className="inline-flex items-center gap-2 rounded-xl border border-red-200 px-4 py-2 text-sm font-semibold text-red-600"
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


      {/* EXPENSES */}

      <div className="mt-8 rounded-2xl border border-slate-200 bg-white">

        <div className="flex flex-col gap-4 border-b border-slate-200 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">

          <div>

            <h2 className="text-lg font-semibold text-slate-900">
              Project Expenses
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Only approved expenses count toward project spending.
            </p>

          </div>


          {!isArchived && (
            <button
              onClick={() =>
                setShowExpenseModal(
                  true
                )
              }
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#111315] px-4 py-3 text-sm font-semibold text-white"
            >

              <Plus size={17} />

              Add Expense

            </button>
          )}

        </div>


        <div className="overflow-x-auto">

          {expenses.length === 0 ? (

            <div className="p-6">

              <EmptyState
                icon={
                  ReceiptText
                }
                title="No expenses recorded"
                text="Project expenses will appear here."
              />

            </div>

          ) : (

            <table className="min-w-full">

              <thead className="bg-slate-50">

                <tr className="text-left text-xs uppercase tracking-wide text-slate-500">

                  <th className="px-5 py-4">
                    Expense
                  </th>

                  <th className="px-5 py-4">
                    Date
                  </th>

                  <th className="px-5 py-4">
                    Category
                  </th>

                  <th className="px-5 py-4">
                    Amount
                  </th>

                  <th className="px-5 py-4">
                    Status
                  </th>

                  <th className="px-5 py-4">
                    Evidence
                  </th>

                  {(isMainAdmin ||
                    isTreasurer) && (

                    <th className="px-5 py-4">
                      Review
                    </th>

                  )}

                </tr>

              </thead>


              <tbody className="divide-y divide-slate-100">

                {expenses.map(
                  (expense) => {

                    const reviewing =
                      reviewingExpenseId ===
                      expense.id

                    return (
                      <tr
                        key={
                          expense.id
                        }
                        className="text-sm"
                      >

                        <td className="px-5 py-4">

                          <p className="font-semibold text-slate-900">
                            {expense.expense_title}
                          </p>

                          {expense.supplier && (
                            <p className="mt-1 text-xs text-slate-400">
                              {expense.supplier}
                            </p>
                          )}

                        </td>


                        <td className="px-5 py-4 text-slate-500">
                          {formatDate(
                            expense.expense_date
                          )}
                        </td>


                        <td className="px-5 py-4 text-slate-500">
                          {expense.category}
                        </td>


                        <td className="px-5 py-4 font-semibold text-slate-900">
                          {formatKES(
                            expense.amount
                          )}
                        </td>


                        <td className="px-5 py-4">

                          <ExpenseStatus
                            status={
                              expense.approval_status
                            }
                          />

                          {expense.rejection_reason && (

                            <p className="mt-2 max-w-[180px] text-xs text-red-500">
                              {expense.rejection_reason}
                            </p>

                          )}

                        </td>


                        <td className="px-5 py-4">

                          {expense.evidence_path ? (

                            <button
                              onClick={() =>
                                viewExpenseEvidence(
                                  expense.evidence_path
                                )
                              }
                              className="text-xs font-semibold text-[#9b7c3f]"
                            >
                              View
                            </button>

                          ) : (

                            <span className="text-xs text-slate-400">
                              None
                            </span>

                          )}

                        </td>


                        {(isMainAdmin ||
                          isTreasurer) && (

                          <td className="px-5 py-4">

                            {expense.approval_status ===
                            "pending" ? (

                              <div className="flex gap-2">

                                <button
                                  disabled={
                                    reviewing
                                  }
                                  onClick={() =>
                                    approveExpense(
                                      expense
                                    )
                                  }
                                  className="inline-flex items-center gap-1 rounded-lg bg-green-50 px-3 py-2 text-xs font-semibold text-green-700 disabled:opacity-50"
                                >

                                  <CheckCircle2
                                    size={14}
                                  />

                                  Approve

                                </button>


                                <button
                                  disabled={
                                    reviewing
                                  }
                                  onClick={() =>
                                    rejectExpense(
                                      expense
                                    )
                                  }
                                  className="inline-flex items-center gap-1 rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-600 disabled:opacity-50"
                                >

                                  <XCircle
                                    size={14}
                                  />

                                  Reject

                                </button>

                              </div>

                            ) : (

                              <span className="text-xs text-slate-400">
                                Reviewed
                              </span>

                            )}

                          </td>

                        )}

                      </tr>
                    )
                  }
                )}

              </tbody>

            </table>

          )}

        </div>

      </div>


      {/* PROJECT PROGRESS */}

      <div className="mt-8 rounded-2xl border border-slate-200 bg-white">

        <div className="flex flex-col gap-4 border-b border-slate-200 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">

          <div>

            <h2 className="text-lg font-semibold text-slate-900">
              Project Progress
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Track construction stages, completion percentage, photos and videos.
            </p>

          </div>


          {isMainAdmin && !isArchived && (

            <button
              onClick={() =>
                setShowProgressModal(
                  true
                )
              }
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#111315] px-4 py-3 text-sm font-semibold text-white"
            >

              <Plus size={17} />

              Add Progress

            </button>

          )}

        </div>


        <div className="p-6">

          {progressUpdates.length === 0 ? (

            <EmptyState
              icon={
                Building2
              }
              title="No progress updates yet"
              text="Construction progress updates will appear here."
            />

          ) : (

            <div className="relative">

              <div className="absolute bottom-5 left-[15px] top-5 w-px bg-slate-200" />


              <div className="space-y-6">

                {progressUpdates.map(
                  (progress) => (

                    <div
                      key={
                        progress.id
                      }
                      className="relative pl-12"
                    >

                      <div className="absolute left-0 top-1 flex h-8 w-8 items-center justify-center rounded-full border-4 border-white bg-[#c5a66a] shadow-sm" />


                      <div className="rounded-2xl border border-slate-200 p-5">

                        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">

                          <div>

                            <p className="text-xs font-semibold uppercase tracking-wide text-[#9b7c3f]">
                              {formatDate(
                                progress.progress_date
                              )}
                            </p>

                            <h3 className="mt-2 text-lg font-bold text-slate-900">
                              {progress.stage}
                            </h3>

                          </div>


                          <span className="rounded-full bg-[#f1eadc] px-3 py-1 text-sm font-bold text-[#8b6c35]">
                            {progress.completion_percentage}%
                          </span>

                        </div>


                        <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">

                          <div
                            className="h-full rounded-full bg-[#c5a66a]"
                            style={{
                              width:
                                `${progress.completion_percentage}%`,
                            }}
                          />

                        </div>


                        {progress.caption && (

                          <p className="mt-4 text-sm leading-6 text-slate-600">
                            {progress.caption}
                          </p>

                        )}


                        <div className="mt-5 flex flex-wrap gap-2">

                          {progress.media_path && (

                            <button
                              onClick={() =>
                                openProgressMedia(
                                  progress
                                )
                              }
                              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700"
                            >

                              {progress.media_type ===
                              "video" ? (

                                <Video
                                  size={16}
                                />

                              ) : (

                                <Image
                                  size={16}
                                />

                              )}

                              View{" "}
                              {progress.media_type ===
                              "video"
                                ? "Video"
                                : "Photo"}

                            </button>

                          )}


                          {isMainAdmin && !isArchived && (

                            <button
                              onClick={() =>
                                deleteProgress(
                                  progress
                                )
                              }
                              disabled={
                                deletingProgressId ===
                                progress.id
                              }
                              className="inline-flex items-center gap-2 rounded-xl border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 disabled:opacity-50"
                            >

                              {deletingProgressId ===
                              progress.id ? (

                                <LoaderCircle
                                  size={15}
                                  className="animate-spin"
                                />

                              ) : (

                                <Trash2
                                  size={15}
                                />

                              )}

                              Delete

                            </button>

                          )}

                        </div>

                      </div>

                    </div>

                  )
                )}

              </div>

            </div>

          )}

        </div>

      </div>


      {/* DOCUMENT MODAL */}

      {showDocumentModal && (

        <Modal
          title="Add Project Document"
          onClose={() =>
            setShowDocumentModal(
              false
            )
          }
        >

          <form
            onSubmit={
              uploadProjectDocument
            }
            className="space-y-5"
          >

            <FormField label="Document Title">

              <input
                value={
                  documentForm.title
                }
                onChange={(event) =>
                  setDocumentForm(
                    (previous) => ({
                      ...previous,

                      title:
                        event.target.value,
                    })
                  )
                }
                className="input-style"
              />

            </FormField>


            <FormField label="Category">

              <select
                value={
                  documentForm.category
                }
                onChange={(event) =>
                  setDocumentForm(
                    (previous) => ({
                      ...previous,

                      category:
                        event.target.value,
                    })
                  )
                }
                className="input-style bg-white"
              >

                <option value="quantity_surveyor">
                  Quantity Surveyor
                </option>

                <option value="architecture">
                  Architecture
                </option>

                <option value="legal">
                  Legal
                </option>

                <option value="engineering">
                  Engineering
                </option>

                <option value="government_approval">
                  Government Approval
                </option>

                <option value="other">
                  Other
                </option>

              </select>

            </FormField>


            <FormField label="Description">

              <textarea
                rows={3}
                value={
                  documentForm.description
                }
                onChange={(event) =>
                  setDocumentForm(
                    (previous) => ({
                      ...previous,

                      description:
                        event.target.value,
                    })
                  )
                }
                className="input-style"
              />

            </FormField>


            <FormField label="File">

              <input
                type="file"
                accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
                onChange={(event) =>
                  setDocumentForm(
                    (previous) => ({
                      ...previous,

                      file:
                        event.target.files?.[0] ||
                        null,
                    })
                  )
                }
                className="input-style"
              />

            </FormField>


            <ModalButtons
              loading={
                uploadingDocument
              }
              actionLabel="Upload Document"
              onCancel={() =>
                setShowDocumentModal(
                  false
                )
              }
            />

          </form>

        </Modal>

      )}


      {/* EXPENSE MODAL */}

      {showExpenseModal && (

        <Modal
          title="Add Project Expense"
          onClose={() =>
            setShowExpenseModal(
              false
            )
          }
        >

          <form
            onSubmit={
              submitExpense
            }
            className="space-y-5"
          >

            <div className="grid gap-5 md:grid-cols-2">

              <FormField label="Expense Date *">

                <input
                  type="date"
                  value={
                    expenseForm.expenseDate
                  }
                  onChange={(event) =>
                    setExpenseForm(
                      (previous) => ({
                        ...previous,

                        expenseDate:
                          event.target.value,
                      })
                    )
                  }
                  className="input-style"
                />

              </FormField>


              <FormField label="Amount *">

                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={
                    expenseForm.amount
                  }
                  onChange={(event) =>
                    setExpenseForm(
                      (previous) => ({
                        ...previous,

                        amount:
                          event.target.value,
                      })
                    )
                  }
                  className="input-style"
                />

              </FormField>

            </div>


            <FormField label="Expense Title *">

              <input
                value={
                  expenseForm.expenseTitle
                }
                onChange={(event) =>
                  setExpenseForm(
                    (previous) => ({
                      ...previous,

                      expenseTitle:
                        event.target.value,
                    })
                  )
                }
                className="input-style"
              />

            </FormField>


            <div className="grid gap-5 md:grid-cols-2">

              <FormField label="Category *">

                <input
                  value={
                    expenseForm.category
                  }
                  onChange={(event) =>
                    setExpenseForm(
                      (previous) => ({
                        ...previous,

                        category:
                          event.target.value,
                      })
                    )
                  }
                  className="input-style"
                />

              </FormField>


              <FormField label="Supplier / Payee">

                <input
                  value={
                    expenseForm.supplier
                  }
                  onChange={(event) =>
                    setExpenseForm(
                      (previous) => ({
                        ...previous,

                        supplier:
                          event.target.value,
                      })
                    )
                  }
                  className="input-style"
                />

              </FormField>

            </div>


            <FormField label="Transaction Reference">

              <input
                value={
                  expenseForm.transactionReference
                }
                onChange={(event) =>
                  setExpenseForm(
                    (previous) => ({
                      ...previous,

                      transactionReference:
                        event.target.value,
                    })
                  )
                }
                className="input-style"
              />

            </FormField>


            <FormField label="Notes">

              <textarea
                rows={3}
                value={
                  expenseForm.notes
                }
                onChange={(event) =>
                  setExpenseForm(
                    (previous) => ({
                      ...previous,

                      notes:
                        event.target.value,
                    })
                  )
                }
                className="input-style"
              />

            </FormField>


            <FormField label="Receipt / Evidence">

              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(event) =>
                  setExpenseForm(
                    (previous) => ({
                      ...previous,

                      evidence:
                        event.target.files?.[0] ||
                        null,
                    })
                  )
                }
                className="input-style"
              />

            </FormField>


            <ModalButtons
              loading={
                submittingExpense
              }
              actionLabel="Submit Expense"
              onCancel={() =>
                setShowExpenseModal(
                  false
                )
              }
            />

          </form>

        </Modal>

      )}


      {/* PROGRESS MODAL */}

      {showProgressModal && (

        <Modal
          title="Add Project Progress"
          onClose={() =>
            setShowProgressModal(
              false
            )
          }
        >

          <form
            onSubmit={
              submitProgress
            }
            className="space-y-5"
          >

            <div className="grid gap-5 md:grid-cols-2">

              <FormField label="Progress Date *">

                <input
                  type="date"
                  value={
                    progressForm.progressDate
                  }
                  onChange={(event) =>
                    setProgressForm(
                      (previous) => ({
                        ...previous,

                        progressDate:
                          event.target.value,
                      })
                    )
                  }
                  className="input-style"
                />

              </FormField>


              <FormField label="Completion % *">

                <input
                  type="number"
                  min="0"
                  max="100"
                  value={
                    progressForm.completionPercentage
                  }
                  onChange={(event) =>
                    setProgressForm(
                      (previous) => ({
                        ...previous,

                        completionPercentage:
                          event.target.value,
                      })
                    )
                  }
                  placeholder="40"
                  className="input-style"
                />

              </FormField>

            </div>


            <FormField label="Construction Stage *">

              <input
                value={
                  progressForm.stage
                }
                onChange={(event) =>
                  setProgressForm(
                    (previous) => ({
                      ...previous,

                      stage:
                        event.target.value,
                    })
                  )
                }
                placeholder="Foundation works completed"
                className="input-style"
              />

            </FormField>


            <FormField label="Progress Notes">

              <textarea
                rows={4}
                value={
                  progressForm.caption
                }
                onChange={(event) =>
                  setProgressForm(
                    (previous) => ({
                      ...previous,

                      caption:
                        event.target.value,
                    })
                  )
                }
                placeholder="Describe what was completed during this stage..."
                className="input-style"
              />

            </FormField>


            <FormField label="Photo or Video">

              <input
                type="file"
                accept=".jpg,.jpeg,.png,.webp,.mp4,.webm,.mov,image/*,video/*"
                onChange={(event) =>
                  setProgressForm(
                    (previous) => ({
                      ...previous,

                      media:
                        event.target.files?.[0] ||
                        null,
                    })
                  )
                }
                className="input-style"
              />


              <p className="mt-2 text-xs text-slate-400">
                Images up to 10 MB. Videos up to 100 MB.
              </p>

            </FormField>


            <ModalButtons
              loading={
                savingProgress
              }
              actionLabel="Add Progress Update"
              onCancel={() =>
                setShowProgressModal(
                  false
                )
              }
            />

          </form>

        </Modal>

      )}

    </div>
  )
}


// ==================================================
// HELPERS
// ==================================================

function SummaryCard({
  title,
  value,
  icon: Icon,
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">

      <div className="flex justify-between gap-4">

        <div>

          <p className="text-sm text-slate-500">
            {title}
          </p>

          <p className="mt-2 text-xl font-bold text-slate-900">
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
        size={21}
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


function FormField({
  label,
  children,
}) {
  return (
    <div>

      <label className="mb-2 block text-sm font-semibold text-slate-700">
        {label}
      </label>

      {children}

    </div>
  )
}


function ReadOnlyDetail({
  label,
  value,
}) {
  return (
    <div className="rounded-xl bg-slate-50 p-4">

      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </p>

      <p className="mt-2 font-semibold text-slate-800">
        {value}
      </p>

    </div>
  )
}


function EmptyState({
  icon: Icon,
  title,
  text,
}) {
  return (
    <div className="py-10 text-center">

      <Icon
        size={38}
        className="mx-auto text-slate-300"
      />

      <h3 className="mt-4 font-semibold text-slate-900">
        {title}
      </h3>

      <p className="mt-2 text-sm text-slate-500">
        {text}
      </p>

    </div>
  )
}


function Modal({
  title,
  onClose,
  children,
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">

      <div className="max-h-[94vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white">

        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">

          <h2 className="text-xl font-bold text-slate-900">
            {title}
          </h2>


          <button
            type="button"
            onClick={
              onClose
            }
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"
          >

            <X
              size={20}
            />

          </button>

        </div>


        <div className="p-6">
          {children}
        </div>

      </div>

    </div>
  )
}


function ModalButtons({
  loading,
  actionLabel,
  onCancel,
}) {
  return (
    <div className="flex justify-end gap-3 border-t border-slate-100 pt-5">

      <button
        type="button"
        onClick={
          onCancel
        }
        className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700"
      >
        Cancel
      </button>


      <button
        type="submit"
        disabled={
          loading
        }
        className="inline-flex items-center gap-2 rounded-xl bg-[#c5a66a] px-5 py-3 text-sm font-bold text-[#111315] disabled:opacity-50"
      >

        {loading ? (

          <LoaderCircle
            size={17}
            className="animate-spin"
          />

        ) : (

          <Upload
            size={17}
          />

        )}

        {loading
          ? "Processing..."
          : actionLabel}

      </button>

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


  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
        styles[status] ||
        styles.planning
      }`}
    >
      {formatProjectStatus(
        status
      )}
    </span>
  )
}


function ExpenseStatus({
  status,
}) {
  const styles = {
    pending:
      "bg-amber-50 text-amber-700",

    approved:
      "bg-green-50 text-green-700",

    rejected:
      "bg-red-50 text-red-700",
  }


  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-semibold ${
        styles[status] ||
        "bg-slate-100 text-slate-600"
      }`}
    >
      {status
        ? status.charAt(0).toUpperCase() +
          status.slice(1)
        : "Unknown"}
    </span>
  )
}


function formatProjectStatus(
  status
) {
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

  return (
    labels[status] ||
    status ||
    "Unknown"
  )
}


function formatDocumentCategory(
  category
) {
  const labels = {
    quantity_surveyor:
      "Quantity Surveyor",

    architecture:
      "Architecture",

    legal:
      "Legal",

    engineering:
      "Engineering",

    government_approval:
      "Government Approval",

    other:
      "Other",
  }

  return (
    labels[category] ||
    category
  )
}


function formatKES(value) {
  return new Intl.NumberFormat(
    "en-KE",
    {
      style: "currency",
      currency: "KES",
      maximumFractionDigits: 0,
    }
  ).format(
    Number(
      value || 0
    )
  )
}


function formatDateTime(value) {
  if (!value) {
    return "Not set"
  }

  return new Date(
    value
  ).toLocaleDateString(
    "en-GB",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  )
}


function formatDate(date) {
  if (!date) {
    return "Not set"
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


export default ProjectDetails