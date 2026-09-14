import {
  useEffect,
  useMemo,
  useState,
} from "react"

import {
  Building2,
  CalendarDays,
  ExternalLink,
  FileArchive,
  FileCheck2,
  FileText,
  FolderOpen,
  Landmark,
  LoaderCircle,
  Plus,
  Search,
  ShieldCheck,
  Trash2,
  Upload,
  X,
} from "lucide-react"

import { supabase } from "../lib/supabase"
import { useAuth } from "../context/AuthContext"


function CompanyDocuments() {
  const {
    user,
    isMainAdmin,
  } = useAuth()


  const [documents, setDocuments] =
    useState([])

  const [loading, setLoading] =
    useState(true)

  const [uploading, setUploading] =
    useState(false)

  const [deletingId, setDeletingId] =
    useState(null)

  const [error, setError] =
    useState("")

  const [message, setMessage] =
    useState("")

  const [search, setSearch] =
    useState("")

  const [categoryFilter, setCategoryFilter] =
    useState("all")

  const [showModal, setShowModal] =
    useState(false)


  const [form, setForm] =
    useState({
      title: "",
      category: "other",
      description: "",
      documentDate: "",
      file: null,
    })


  useEffect(() => {
    loadDocuments()
  }, [])


  const loadDocuments = async () => {
    try {
      setLoading(true)
      setError("")

      const {
        data,
        error,
      } =
        await supabase
          .from(
            "company_documents"
          )
          .select("*")
          .order(
            "created_at",
            {
              ascending: false,
            }
          )


      if (error) {
        throw error
      }


      setDocuments(
        data || []
      )

    } catch (error) {

      console.error(
        "Load company documents error:",
        error
      )

      setError(
        error.message ||
          "Unable to load company documents."
      )

    } finally {
      setLoading(false)
    }
  }


  const resetForm = () => {
    setForm({
      title: "",
      category: "other",
      description: "",
      documentDate: "",
      file: null,
    })
  }


  const closeModal = () => {
    setShowModal(false)
    resetForm()
  }


  // ==================================================
  // FILTERS
  // ==================================================

  const filteredDocuments =
    useMemo(() => {
      const query =
        search
          .trim()
          .toLowerCase()


      return documents.filter(
        (document) => {
          const matchesCategory =
            categoryFilter ===
              "all" ||
            document.document_category ===
              categoryFilter


          const matchesSearch =
            !query ||
            document.title
              ?.toLowerCase()
              .includes(query) ||
            document.description
              ?.toLowerCase()
              .includes(query) ||
            document.original_file_name
              ?.toLowerCase()
              .includes(query) ||
            formatCategory(
              document.document_category
            )
              .toLowerCase()
              .includes(query)


          return (
            matchesCategory &&
            matchesSearch
          )
        }
      )
    }, [
      documents,
      search,
      categoryFilter,
    ])


  // ==================================================
  // SUMMARY
  // ==================================================

  const landDocuments =
    documents.filter(
      (document) =>
        document.document_category ===
        "land"
    ).length


  const contracts =
    documents.filter(
      (document) =>
        document.document_category ===
          "contract" ||
        document.document_category ===
          "sale_agreement"
    ).length


  const governmentDocuments =
    documents.filter(
      (document) =>
        document.document_category ===
        "government"
    ).length


  // ==================================================
  // UPLOAD
  // ==================================================

  const uploadDocument =
    async (event) => {
      event.preventDefault()

      let uploadedPath = null


      try {
        setUploading(true)
        setError("")
        setMessage("")


        if (!isMainAdmin) {
          throw new Error(
            "Only the Main Admin can upload company documents."
          )
        }


        if (
          !form.title.trim()
        ) {
          throw new Error(
            "Document title is required."
          )
        }


        if (!form.file) {
          throw new Error(
            "Select a file to upload."
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
            form.file.type
          )
        ) {
          throw new Error(
            "Only PDF, DOC, DOCX, XLS, XLSX, JPG and PNG files are allowed."
          )
        }


        const maxSize =
          20 * 1024 * 1024


        if (
          form.file.size >
          maxSize
        ) {
          throw new Error(
            "Document must be 20 MB or smaller."
          )
        }


        const safeName =
          form.file.name.replace(
            /[^a-zA-Z0-9._-]/g,
            "_"
          )


        uploadedPath =
          `${form.category}/${user.id}/${crypto.randomUUID()}-${safeName}`


        const {
          error: uploadError,
        } =
          await supabase.storage
            .from(
              "company-documents"
            )
            .upload(
              uploadedPath,
              form.file,
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
              "company_documents"
            )
            .insert({
              title:
                form.title.trim(),

              document_category:
                form.category,

              description:
                form.description.trim() ||
                null,

              document_date:
                form.documentDate ||
                null,

              file_path:
                uploadedPath,

              original_file_name:
                form.file.name,

              uploaded_by:
                user.id,
            })


        if (databaseError) {
          throw databaseError
        }


        closeModal()


        setMessage(
          "Company document uploaded successfully."
        )


        await loadDocuments()

      } catch (error) {

        console.error(
          "Upload company document error:",
          error
        )


        if (uploadedPath) {
          await supabase.storage
            .from(
              "company-documents"
            )
            .remove([
              uploadedPath,
            ])
        }


        setError(
          error.message ||
            "Unable to upload company document."
        )

      } finally {
        setUploading(false)
      }
    }


  // ==================================================
  // VIEW
  // ==================================================

  const viewDocument =
    async (document) => {
      try {
        setError("")


        const {
          data,
          error,
        } =
          await supabase.storage
            .from(
              "company-documents"
            )
            .createSignedUrl(
              document.file_path,
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
            "Unable to open company document."
        )
      }
    }


  // ==================================================
  // DELETE
  // ==================================================

  const deleteDocument =
    async (document) => {
      const confirmed =
        window.confirm(
          `Delete "${document.title}"?`
        )


      if (!confirmed) {
        return
      }


      try {
        setDeletingId(
          document.id
        )

        setError("")
        setMessage("")


        if (!isMainAdmin) {
          throw new Error(
            "Only the Main Admin can delete company documents."
          )
        }


        const {
          error: databaseError,
        } =
          await supabase
            .from(
              "company_documents"
            )
            .delete()
            .eq(
              "id",
              document.id
            )


        if (databaseError) {
          throw databaseError
        }


        const {
          error: storageError,
        } =
          await supabase.storage
            .from(
              "company-documents"
            )
            .remove([
              document.file_path,
            ])


        if (storageError) {
          console.error(
            "Storage cleanup error:",
            storageError
          )
        }


        setMessage(
          "Company document deleted."
        )


        await loadDocuments()

      } catch (error) {

        console.error(
          "Delete company document error:",
          error
        )

        setError(
          error.message ||
            "Unable to delete company document."
        )

      } finally {
        setDeletingId(null)
      }
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
            Loading company documents...
          </p>

        </div>

      </div>
    )
  }


  return (
    <div>

      {/* HEADER */}

      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">

        <div>

          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#9b7c3f]">
            BNE Construction Ltd
          </p>

          <h1 className="mt-2 text-3xl font-bold text-slate-900">
            Company Documents
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            Private company document vault for legal,
            registration, land, banking, contracts and
            other important BNE Construction records.
          </p>

        </div>


        {isMainAdmin && (

          <button
            type="button"
            onClick={() =>
              setShowModal(true)
            }
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#111315] px-5 py-3 text-sm font-semibold text-white"
          >
            <Plus size={17} />
            Add Document
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


      {/* SUMMARY */}

      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

        <SummaryCard
          title="Total Documents"
          value={
            documents.length
          }
          icon={
            FileArchive
          }
        />


        <SummaryCard
          title="Land Documents"
          value={
            landDocuments
          }
          icon={
            Landmark
          }
        />


        <SummaryCard
          title="Contracts"
          value={
            contracts
          }
          icon={
            FileCheck2
          }
        />


        <SummaryCard
          title="Government Records"
          value={
            governmentDocuments
          }
          icon={
            ShieldCheck
          }
        />

      </div>


      {/* SEARCH + FILTER */}

      <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-5">

        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

          <div className="relative w-full lg:max-w-md">

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
              placeholder="Search company documents..."
              className="w-full rounded-xl border border-slate-200 py-3 pl-11 pr-4 text-sm outline-none focus:border-[#c5a66a]"
            />

          </div>


          <select
            value={
              categoryFilter
            }
            onChange={(event) =>
              setCategoryFilter(
                event.target.value
              )
            }
            className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-600 outline-none focus:border-[#c5a66a]"
          >

            <option value="all">
              All Categories
            </option>

            <option value="incorporation">
              Incorporation
            </option>

            <option value="company_registration">
              Company Registration
            </option>

            <option value="company_records">
              Company Records
            </option>

            <option value="land">
              Land
            </option>

            <option value="sale_agreement">
              Sale Agreements
            </option>

            <option value="contract">
              Contracts
            </option>

            <option value="bank">
              Bank Documents
            </option>

            <option value="insurance">
              Insurance
            </option>

            <option value="government">
              Government
            </option>

            <option value="other">
              Other
            </option>

          </select>

        </div>

      </div>


      {/* DOCUMENT LIST */}

      <div className="mt-6">

        {filteredDocuments.length ===
        0 ? (

          <EmptyState
            icon={
              FolderOpen
            }
            title={
              documents.length ===
              0
                ? "No company documents"
                : "No documents found"
            }
            text={
              documents.length ===
              0
                ? "Important BNE Construction documents will appear here."
                : "Try changing the search or category filter."
            }
          />

        ) : (

          <div className="grid gap-5 xl:grid-cols-2">

            {filteredDocuments.map(
              (document) => (

                <DocumentCard
                  key={
                    document.id
                  }
                  document={
                    document
                  }
                  isMainAdmin={
                    isMainAdmin
                  }
                  deleting={
                    deletingId ===
                    document.id
                  }
                  onView={() =>
                    viewDocument(
                      document
                    )
                  }
                  onDelete={() =>
                    deleteDocument(
                      document
                    )
                  }
                />

              )
            )}

          </div>

        )}

      </div>


      {/* UPLOAD MODAL */}

      {showModal && (

        <Modal
          title="Add Company Document"
          onClose={
            closeModal
          }
        >

          <form
            onSubmit={
              uploadDocument
            }
            className="space-y-5"
          >

            <FormField label="Document Title *">

              <input
                value={
                  form.title
                }
                onChange={(event) =>
                  setForm(
                    (previous) => ({
                      ...previous,

                      title:
                        event.target.value,
                    })
                  )
                }
                placeholder="Certificate of Incorporation"
                className="input-style"
              />

            </FormField>


            <FormField label="Category *">

              <select
                value={
                  form.category
                }
                onChange={(event) =>
                  setForm(
                    (previous) => ({
                      ...previous,

                      category:
                        event.target.value,
                    })
                  )
                }
                className="input-style bg-white"
              >

                <option value="incorporation">
                  Incorporation
                </option>

                <option value="company_registration">
                  Company Registration
                </option>

                <option value="company_records">
                  Company Records
                </option>

                <option value="land">
                  Land
                </option>

                <option value="sale_agreement">
                  Sale Agreement
                </option>

                <option value="contract">
                  Contract
                </option>

                <option value="bank">
                  Bank Document
                </option>

                <option value="insurance">
                  Insurance
                </option>

                <option value="government">
                  Government Document
                </option>

                <option value="other">
                  Other
                </option>

              </select>

            </FormField>


            <FormField label="Document Date">

              <input
                type="date"
                value={
                  form.documentDate
                }
                onChange={(event) =>
                  setForm(
                    (previous) => ({
                      ...previous,

                      documentDate:
                        event.target.value,
                    })
                  )
                }
                className="input-style"
              />

            </FormField>


            <FormField label="Description">

              <textarea
                rows={4}
                value={
                  form.description
                }
                onChange={(event) =>
                  setForm(
                    (previous) => ({
                      ...previous,

                      description:
                        event.target.value,
                    })
                  )
                }
                placeholder="Optional notes about this document..."
                className="input-style"
              />

            </FormField>


            <FormField label="File *">

              <input
                type="file"
                accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
                onChange={(event) =>
                  setForm(
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


              <p className="mt-2 text-xs text-slate-400">
                PDF, DOC, DOCX, XLS, XLSX, JPG or PNG.
                Maximum 20 MB.
              </p>

            </FormField>


            <div className="flex justify-end gap-3 border-t border-slate-100 pt-5">

              <button
                type="button"
                onClick={
                  closeModal
                }
                className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700"
              >
                Cancel
              </button>


              <button
                type="submit"
                disabled={
                  uploading
                }
                className="inline-flex items-center gap-2 rounded-xl bg-[#c5a66a] px-5 py-3 text-sm font-bold text-[#111315] disabled:cursor-not-allowed disabled:opacity-50"
              >

                {uploading ? (

                  <LoaderCircle
                    size={17}
                    className="animate-spin"
                  />

                ) : (

                  <Upload
                    size={17}
                  />

                )}

                {uploading
                  ? "Uploading..."
                  : "Upload Document"}

              </button>

            </div>

          </form>

        </Modal>

      )}

    </div>
  )
}


// ==================================================
// DOCUMENT CARD
// ==================================================

function DocumentCard({
  document,
  isMainAdmin,
  deleting,
  onView,
  onDelete,
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 transition hover:border-[#d6c39d] hover:shadow-sm">

      <div className="flex items-start justify-between gap-4">

        <div className="flex min-w-0 items-start gap-4">

          <div className="shrink-0 rounded-xl bg-[#f1eadc] p-3">

            <FileText
              size={22}
              className="text-[#9b7c3f]"
            />

          </div>


          <div className="min-w-0">

            <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
              {formatCategory(
                document.document_category
              )}
            </span>


            <h2 className="mt-3 text-lg font-bold text-slate-900">
              {document.title}
            </h2>


            {document.description && (

              <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-500">
                {document.description}
              </p>

            )}

          </div>

        </div>

      </div>


      <div className="mt-5 space-y-2 border-t border-slate-100 pt-4">

        {document.document_date && (

          <div className="flex items-center gap-2 text-sm text-slate-500">

            <CalendarDays
              size={15}
              className="text-[#9b7c3f]"
            />

            Document date:{" "}
            {formatDate(
              document.document_date
            )}

          </div>

        )}


        <p className="truncate text-xs text-slate-400">
          {document.original_file_name}
        </p>


        <p className="text-xs text-slate-400">
          Uploaded{" "}
          {formatDateTime(
            document.created_at
          )}
        </p>

      </div>


      <div className="mt-5 flex flex-wrap gap-2">

        <button
          type="button"
          onClick={
            onView
          }
          className="inline-flex items-center gap-2 rounded-xl bg-[#111315] px-4 py-2.5 text-sm font-semibold text-white"
        >
          <ExternalLink size={15} />
          View Document
        </button>


        {isMainAdmin && (

          <button
            type="button"
            onClick={
              onDelete
            }
            disabled={
              deleting
            }
            className="inline-flex items-center gap-2 rounded-xl border border-red-200 px-4 py-2.5 text-sm font-semibold text-red-600 disabled:opacity-50"
          >

            {deleting ? (

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
  )
}


// ==================================================
// SMALL COMPONENTS
// ==================================================

function SummaryCard({
  title,
  value,
  icon: Icon,
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">

      <div className="flex items-start justify-between gap-4">

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


function EmptyState({
  icon: Icon,
  title,
  text,
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white py-16 text-center">

      <Icon
        size={42}
        className="mx-auto text-slate-300"
      />

      <h2 className="mt-5 text-lg font-bold text-slate-900">
        {title}
      </h2>

      <p className="mx-auto mt-2 max-w-lg text-sm text-slate-500">
        {text}
      </p>

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

            <X size={20} />

          </button>

        </div>


        <div className="p-6">
          {children}
        </div>

      </div>

    </div>
  )
}


// ==================================================
// FORMATTERS
// ==================================================

function formatCategory(
  category
) {
  const categories = {
    incorporation:
      "Incorporation",

    company_registration:
      "Company Registration",

    company_records:
      "Company Records",

    land:
      "Land",

    sale_agreement:
      "Sale Agreement",

    contract:
      "Contract",

    bank:
      "Bank Document",

    insurance:
      "Insurance",

    government:
      "Government",

    other:
      "Other",
  }


  return (
    categories[category] ||
    category ||
    "Other"
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


function formatDateTime(date) {
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


export default CompanyDocuments