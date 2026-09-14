// src/pages/students/InternshipApplicationStatus.jsx

import { useEffect, useRef, useState } from "react";
import { useAuth } from "@clerk/clerk-react";
import axios from "axios";
import StudentNavbar from "../../components/StudentNavbar";

export default function InternshipApplicationStatus() {
  const { getToken } = useAuth();

  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState("");
  const [uploadError, setUploadError] = useState("");

  const fileInputRef = useRef(null);

  // Internship image upload state
const [internshipImageFile, setInternshipImageFile] = useState(null);
const [internshipImagePreview, setInternshipImagePreview] = useState("");
const [internshipImageUploading, setInternshipImageUploading] = useState(false);
const [internshipImageMessage, setInternshipImageMessage] = useState("");
const [internshipImageError, setInternshipImageError] = useState("");

const internshipImageInputRef = useRef(null);

  const backendUrl = import.meta.env.VITE_BACKEND_URL;

  const CONSENT_UPLOAD_URL =
    `${backendUrl}/api/students/myApplications/parent-consent`;

    const INTERNSHIP_IMAGE_UPLOAD_URL =
  `${backendUrl}/api/students/myApplications/internship-image`;

  // ---------------------------------------------------------
  // Fetch student's applications
  // ---------------------------------------------------------

  const fetchMyApplications = async () => {
    try {
      setLoading(true);

      const token = await getToken();

      const res = await axios.get(
        `${backendUrl}/api/students/myApplications`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (res.data.success) {
        setApps(res.data.data || []);
      } else {
        setApps([]);
      }
    } catch (err) {
      console.error(
        "❌ Failed to fetch:",
        err.response?.data || err.message
      );

      setApps([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyApplications();
  }, [getToken, backendUrl]);

  // ---------------------------------------------------------
  // Current application
  // ---------------------------------------------------------

  const currentApplication =
    apps.length > 0 ? apps[0] : null;

  const consentLetter =
    currentApplication?.parentConsentLetter || null;

  const consentUploaded =
    consentLetter?.submitted &&
    consentLetter?.imageUrl;

    const internshipImage =
  currentApplication?.internshipImage || null;

const internshipImageUploaded =
  internshipImage?.submitted &&
  internshipImage?.imageUrl;


  // ---------------------------------------------------------
// Internship image selection
// ---------------------------------------------------------

const handleInternshipImageSelect = (event) => {
  const file = event.target.files?.[0];

  setInternshipImageMessage("");
  setInternshipImageError("");

  if (!file) return;

  const allowedTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
  ];

  if (!allowedTypes.includes(file.type)) {
    setInternshipImageError(
      "Please select a JPG, JPEG, or PNG image."
    );

    event.target.value = "";
    return;
  }

  const maxSize = 5 * 1024 * 1024;

  if (file.size > maxSize) {
    setInternshipImageError(
      "File size must be less than 5 MB."
    );

    event.target.value = "";
    return;
  }

  setInternshipImageFile(file);

  const objectUrl = URL.createObjectURL(file);
  setInternshipImagePreview(objectUrl);
};


// ---------------------------------------------------------
// Remove selected internship image
// ---------------------------------------------------------

const handleRemoveInternshipImage = () => {
  setInternshipImageFile(null);
  setInternshipImagePreview("");
  setInternshipImageError("");
  setInternshipImageMessage("");

  if (internshipImageInputRef.current) {
    internshipImageInputRef.current.value = "";
  }
};

// ---------------------------------------------------------
// Upload internship image
// ---------------------------------------------------------

const handleUploadInternshipImage = async () => {
  if (!internshipImageFile) {
    setInternshipImageError(
      "Please select an internship image first."
    );
    return;
  }

  if (!currentApplication) {
    setInternshipImageError(
      "Your internship application could not be found."
    );
    return;
  }

  try {
    setInternshipImageUploading(true);
    setInternshipImageError("");
    setInternshipImageMessage("");

    const token = await getToken();

    const formData = new FormData();

    formData.append(
      "internshipImage",
      internshipImageFile
    );

    const res = await axios.post(
      INTERNSHIP_IMAGE_UPLOAD_URL,
      formData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (res.data.success) {
      setInternshipImageMessage(
        "Internship image uploaded successfully."
      );

      setInternshipImageFile(null);
      setInternshipImagePreview("");

      if (internshipImageInputRef.current) {
        internshipImageInputRef.current.value = "";
      }

      await fetchMyApplications();
    } else {
      setInternshipImageError(
        res.data.message ||
          "Failed to upload internship image."
      );
    }
  } catch (err) {
    console.error(
      "❌ Internship image upload error:",
      err.response?.data || err.message
    );

    setInternshipImageError(
      err.response?.data?.message ||
        "Failed to upload internship image."
    );
  } finally {
    setInternshipImageUploading(false);
  }
};
  // ---------------------------------------------------------
  // File selection
  // ---------------------------------------------------------

  const handleFileSelect = (event) => {
    const file = event.target.files?.[0];

    setUploadMessage("");
    setUploadError("");

    if (!file) return;

    const allowedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
    ];

    if (!allowedTypes.includes(file.type)) {
      setUploadError(
        "Please select a JPG, JPEG, or PNG image."
      );

      event.target.value = "";
      return;
    }

    const maxSize = 5 * 1024 * 1024;

    if (file.size > maxSize) {
      setUploadError(
        "File size must be less than 5 MB."
      );

      event.target.value = "";
      return;
    }

    setSelectedFile(file);

    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
  };

  // ---------------------------------------------------------
  // Remove selected file
  // ---------------------------------------------------------

  const handleRemoveSelectedFile = () => {
    setSelectedFile(null);
    setPreviewUrl("");
    setUploadError("");
    setUploadMessage("");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // ---------------------------------------------------------
  // Upload consent letter
  // ---------------------------------------------------------

  const handleUploadConsent = async () => {
    if (!selectedFile) {
      setUploadError(
        "Please select a consent letter first."
      );
      return;
    }

    if (!currentApplication) {
      setUploadError(
        "Your internship application could not be found."
      );
      return;
    }

    try {
      setUploading(true);
      setUploadError("");
      setUploadMessage("");

      const token = await getToken();

      const formData = new FormData();

      formData.append(
        "parentConsentLetter",
        selectedFile
      );

      const res = await axios.post(
        CONSENT_UPLOAD_URL,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (res.data.success) {
        setUploadMessage(
          "Parent consent letter uploaded successfully."
        );

        setSelectedFile(null);
        setPreviewUrl("");

        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }

        await fetchMyApplications();
      } else {
        setUploadError(
          res.data.message ||
            "Failed to upload consent letter."
        );
      }
    } catch (err) {
      console.error(
        "❌ Consent upload error:",
        err.response?.data || err.message
      );

      setUploadError(
        err.response?.data?.message ||
          "Failed to upload parent consent letter."
      );
    } finally {
      setUploading(false);
    }
  };

  // ---------------------------------------------------------
  // Status component
  // ---------------------------------------------------------

  const StatusWithComment = ({ reviewer }) => {
    if (!reviewer) {
      return (
        <span className="text-slate-400 text-sm">
          Pending
        </span>
      );
    }

    const color =
      reviewer.status === "approved"
        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
        : reviewer.status === "rejected"
        ? "bg-rose-50 text-rose-700 border-rose-200"
        : "bg-slate-50 text-slate-600 border-slate-200";

    return (
      <div className="flex flex-col gap-1.5 min-w-[95px]">

        <span
          className={`inline-flex w-fit items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${color}`}
        >
          {reviewer.status
            ? reviewer.status.charAt(0).toUpperCase() +
              reviewer.status.slice(1)
            : "Pending"}
        </span>

        {reviewer.comment && (
          <span className="text-xs text-slate-500 italic max-w-[170px] break-words">
            “{reviewer.comment}”
          </span>
        )}

      </div>
    );
  };

  // ---------------------------------------------------------
  // Loading
  // ---------------------------------------------------------

  if (loading) {
    return (
      <>
        <StudentNavbar />

        <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">

          <div className="text-center">

            <div className="w-12 h-12 mx-auto border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>

            <p className="mt-4 text-sm font-medium text-slate-600">
              Loading your application...
            </p>

          </div>

        </div>
      </>
    );
  }

  // ---------------------------------------------------------
  // No applications
  // ---------------------------------------------------------

  if (apps.length === 0) {
    return (
      <>
        <StudentNavbar />

        <div className="min-h-screen bg-slate-50 px-4 py-8">

          <div className="max-w-3xl mx-auto">

            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-8 sm:p-12 text-center">

              <div className="w-16 h-16 mx-auto rounded-2xl bg-blue-50 flex items-center justify-center text-3xl">
                📄
              </div>

              <h2 className="mt-5 text-xl font-bold text-slate-800">
                No application found
              </h2>

              <p className="mt-2 text-sm text-slate-500">
                You haven’t submitted any internship applications yet.
              </p>

            </div>

          </div>

        </div>
      </>
    );
  }

  // ---------------------------------------------------------
  // Main UI
  // ---------------------------------------------------------

  return (
    <>
      <StudentNavbar />

      <main className="min-h-screen bg-slate-50">

        <div className="max-w-7xl mx-auto px-3 py-5 sm:px-5 sm:py-7 lg:px-8">



          {/* =====================================================
              APPLICATION STATUS
          ====================================================== */}

          <section className="mb-8">

            {/* Section header */}

            <div className="rounded-2xl bg-blue-50 border border-blue-100 px-4 py-4 sm:px-5 sm:py-5 mb-3">

              <div className="flex items-center gap-3">

                <div className="w-10 h-10 rounded-xl bg-white border border-blue-100 flex items-center justify-center text-lg shadow-sm">
                  📊
                </div>

                <div>

                  <h2 className="text-base sm:text-lg font-bold text-blue-950">
                    Application Status
                  </h2>

                  <p className="text-xs sm:text-sm text-blue-700/70">
                    Track the progress of your internship application.
                  </p>

                </div>

              </div>

            </div>


            {/* Table */}

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">

              {/* Mobile hint */}

              <div className="sm:hidden px-4 py-2.5 bg-blue-50/50 border-b border-blue-100 text-center text-[11px] font-medium text-blue-600">
                Swipe left or right to view all details →
              </div>


              <div className="overflow-x-auto">

                <table className="min-w-[950px] w-full">

                  <thead>

                    <tr className="bg-slate-50">

                      <th className="px-4 py-3.5 text-left text-xs font-semibold text-slate-500 border-b border-slate-200 whitespace-nowrap">
                        Reg No
                      </th>

                      <th className="px-4 py-3.5 text-left text-xs font-semibold text-slate-500 border-b border-slate-200 whitespace-nowrap">
                        Name
                      </th>

                      <th className="px-4 py-3.5 text-left text-xs font-semibold text-slate-500 border-b border-slate-200 whitespace-nowrap">
                        Department
                      </th>

                      <th className="px-4 py-3.5 text-left text-xs font-semibold text-slate-500 border-b border-slate-200 whitespace-nowrap">
                        Company
                      </th>

                      <th className="px-4 py-3.5 text-left text-xs font-semibold text-slate-500 border-b border-slate-200 whitespace-nowrap">
                        Cohort Owner
                      </th>

                      <th className="px-4 py-3.5 text-left text-xs font-semibold text-slate-500 border-b border-slate-200 whitespace-nowrap">
                        HOD
                      </th>

                      <th className="px-4 py-3.5 text-left text-xs font-semibold text-slate-500 border-b border-slate-200 whitespace-nowrap">
                        Placement
                      </th>

                      <th className="px-4 py-3.5 text-left text-xs font-semibold text-slate-500 border-b border-slate-200 whitespace-nowrap">
                        Principal
                      </th>

                      <th className="px-4 py-3.5 text-left text-xs font-semibold text-slate-500 border-b border-slate-200 whitespace-nowrap">
                        Download
                      </th>

                    </tr>

                  </thead>


                  <tbody>

                    {apps.map((app) => (

                      <tr
                        key={app._id}
                        className="hover:bg-blue-50/30 transition"
                      >

                        <td className="px-4 py-4 border-b border-slate-100 font-semibold text-slate-700 whitespace-nowrap">
                          {app.regNumber}
                        </td>

                        <td className="px-4 py-4 border-b border-slate-100 text-slate-700 whitespace-nowrap">
                          {app.name}
                        </td>

                        <td className="px-4 py-4 border-b border-slate-100 uppercase text-slate-600 whitespace-nowrap">
                          {app.department}
                        </td>

                        <td className="px-4 py-4 border-b border-slate-100 text-slate-700 max-w-[200px]">
                          <span className="block truncate">
                            {app.companyName}
                          </span>
                        </td>

                        <td className="px-4 py-4 border-b border-slate-100">
                          <StatusWithComment
                            reviewer={app.cohortOwner}
                          />
                        </td>

                        <td className="px-4 py-4 border-b border-slate-100">
                          <StatusWithComment
                            reviewer={app.hod}
                          />
                        </td>

                        <td className="px-4 py-4 border-b border-slate-100">
                          <StatusWithComment
                            reviewer={app.placement}
                          />
                        </td>

                        <td className="px-4 py-4 border-b border-slate-100">
                          <StatusWithComment
                            reviewer={app.principal}
                          />
                        </td>

                        <td className="px-4 py-4 border-b border-slate-100">

                          {app.principal?.status ===
                          "approved" ? (

                            <a
                              href={`${backendUrl}/api/students/download/${app._id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-semibold transition whitespace-nowrap"
                            >
                              ↗ View / Print
                            </a>

                          ) : (

                            <button
                              disabled
                              className="px-3 py-2 rounded-lg bg-slate-100 text-slate-400 border border-slate-200 text-xs font-semibold cursor-not-allowed whitespace-nowrap"
                            >
                              Awaiting Approval
                            </button>

                          )}

                        </td>

                      </tr>

                    ))}

                  </tbody>

                </table>

              </div>

            </div>

          </section>


      

<section>
  {/* Section header */}
  <div className="rounded-2xl bg-violet-50 border border-violet-100 px-4 py-4 sm:px-5 sm:py-5 mb-3">
    <div className="flex items-center gap-3">

      <div className="w-10 h-10 rounded-xl bg-white border border-violet-100 flex items-center justify-center text-lg shadow-sm">
        📜
      </div>

      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">

          <h2 className="text-base sm:text-lg font-bold text-violet-950">
            Parent Consent / Undertaking
          </h2>

          {consentUploaded ? (
            <span className="px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] sm:text-xs font-semibold">
              ✓ Submitted
            </span>
          ) : (
            <span className="px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-[10px] sm:text-xs font-semibold">
              ! Required
            </span>
          )}

        </div>

        <p className="text-xs sm:text-sm text-violet-700/70 mt-0.5">
          Upload the signed parent consent document.
        </p>
      </div>

    </div>
  </div>


  {/* =====================================================
      CONSENT CARD
  ====================================================== */}

  <div className="bg-white rounded-2xl border border-violet-100 shadow-sm overflow-hidden">

    <div className="p-4 sm:p-6 md:p-7">

      {/* =================================================
          ALREADY SUBMITTED
      ================================================= */}

      {consentUploaded ? (

        <div className="rounded-2xl bg-emerald-50 border border-emerald-100 p-4 sm:p-5">

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">

            {/* Status */}
            <div className="flex items-center gap-3 min-w-0">

              <div className="w-11 h-11 rounded-xl bg-white border border-emerald-100 flex items-center justify-center text-lg text-emerald-600 shadow-sm shrink-0">
                ✓
              </div>

              <div className="min-w-0">

                <p className="text-sm sm:text-base font-semibold text-emerald-800">
                  Consent letter submitted
                </p>

                {consentLetter.uploadedAt && (
                  <p className="text-xs sm:text-sm text-emerald-600 mt-0.5">
                    Uploaded on{" "}
                    {new Date(
                      consentLetter.uploadedAt
                    ).toLocaleDateString("en-IN", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                )}

              </div>

            </div>


            {/* VIEW ONLY */}
            <a
              href={consentLetter.imageUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto inline-flex justify-center items-center gap-2 px-5 py-2.5 rounded-xl bg-white border border-emerald-200 text-emerald-700 hover:bg-emerald-100 text-sm font-semibold transition"
            >
              👁 View Letter
            </a>

          </div>

        </div>

      ) : (

        /* =================================================
           NOT SUBMITTED YET
        ================================================= */

        <>
          {/* Success message */}
          {uploadMessage && (
            <div className="mb-5 rounded-xl bg-emerald-50 border border-emerald-200 p-4">

              <div className="flex items-start gap-3">

                <span className="text-emerald-600 text-lg">
                  ✓
                </span>

                <div>
                  <p className="text-sm font-semibold text-emerald-800">
                    Upload successful
                  </p>

                  <p className="text-xs text-emerald-700 mt-0.5">
                    {uploadMessage}
                  </p>
                </div>

              </div>

            </div>
          )}


          {/* Error message */}
          {uploadError && (
            <div className="mb-5 rounded-xl bg-rose-50 border border-rose-200 p-4">

              <div className="flex items-start gap-3">

                <span className="text-rose-600 text-lg">
                  !
                </span>

                <div>
                  <p className="text-sm font-semibold text-rose-800">
                    Upload failed
                  </p>

                  <p className="text-xs text-rose-700 mt-0.5">
                    {uploadError}
                  </p>
                </div>

              </div>

            </div>
          )}


          {/* =================================================
              SELECTED FILE PREVIEW
          ================================================= */}

          {selectedFile ? (

            <div className="rounded-2xl bg-violet-50/50 border border-violet-100 p-4 sm:p-5">

              <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] gap-5">

                {/* Image preview */}
                <div className="h-60 sm:h-72 md:h-64 rounded-xl bg-white border border-violet-100 overflow-hidden">

                  <img
                    src={previewUrl}
                    alt="Consent letter preview"
                    className="w-full h-full object-contain"
                  />

                </div>


                {/* File details */}
                <div className="flex flex-col justify-center">

                  <p className="text-[10px] uppercase tracking-wider font-bold text-violet-400">
                    Selected document
                  </p>

                  <h4 className="mt-1 text-sm sm:text-base font-semibold text-slate-800 break-all">
                    {selectedFile.name}
                  </h4>

                  <p className="text-xs sm:text-sm text-slate-500 mt-1">
                    {(
                      selectedFile.size /
                      (1024 * 1024)
                    ).toFixed(2)}{" "}
                    MB
                  </p>


                  <div className="flex flex-col sm:flex-row gap-2.5 mt-5">

                    <button
                      type="button"
                      onClick={handleUploadConsent}
                      disabled={uploading}
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white text-sm font-semibold transition shadow-sm"
                    >
                      {uploading ? (
                        <>
                          <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                          Uploading...
                        </>
                      ) : (
                        <>
                          ☁ Upload Consent Letter
                        </>
                      )}
                    </button>


                    <button
                      type="button"
                      onClick={handleRemoveSelectedFile}
                      disabled={uploading}
                      className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-sm font-medium transition"
                    >
                      Remove
                    </button>

                  </div>


                  <p className="text-[10px] sm:text-xs text-slate-400 mt-4">
                    JPG, JPEG or PNG • Maximum 5 MB
                  </p>

                </div>

              </div>

            </div>

          ) : (

            /* =================================================
               UPLOAD AREA
               SHOWN ONLY BEFORE FIRST SUBMISSION
            ================================================= */

            <div
              onClick={() =>
                fileInputRef.current?.click()
              }
              className="group cursor-pointer rounded-2xl border-2 border-dashed border-violet-200 bg-violet-50/30 hover:bg-violet-50 hover:border-violet-400 transition-all duration-200 p-6 sm:p-9"
            >

              <div className="flex flex-col items-center text-center">

                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white border border-violet-100 shadow-sm flex items-center justify-center text-3xl sm:text-4xl group-hover:scale-105 transition-transform">
                  📤
                </div>

                <h3 className="mt-5 text-sm sm:text-base font-bold text-slate-800">
                  Upload parent consent letter
                </h3>

                <p className="mt-1 text-xs sm:text-sm text-slate-500">
                  Select a clear image of the signed document.
                </p>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    fileInputRef.current?.click();
                  }}
                  className="mt-5 inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold shadow-sm transition"
                >
                  📎 Choose Image
                </button>

                <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-[10px] sm:text-xs text-slate-400">

                  <span className="px-2.5 py-1 rounded-full bg-white border border-slate-200">
                    JPG
                  </span>

                  <span className="px-2.5 py-1 rounded-full bg-white border border-slate-200">
                    JPEG
                  </span>

                  <span className="px-2.5 py-1 rounded-full bg-white border border-slate-200">
                    PNG
                  </span>

                  <span className="px-2.5 py-1 rounded-full bg-white border border-slate-200">
                    Max 5 MB
                  </span>

                </div>

              </div>

            </div>

          )}


          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png"
            onChange={handleFileSelect}
            className="hidden"
          />

        </>

      )}

    </div>

  </div>

</section>


{/* =========================================================
    INTERNSHIP IMAGE
========================================================= */}

<section className="mt-8">

  {/* Section header */}
  <div className="rounded-2xl bg-sky-50 border border-sky-100 px-4 py-4 sm:px-5 sm:py-5 mb-3">

    <div className="flex items-center gap-3">

      <div className="w-10 h-10 rounded-xl bg-white border border-sky-100 flex items-center justify-center text-lg shadow-sm">
        📷
      </div>

      <div className="min-w-0">

        <div className="flex flex-wrap items-center gap-2">

          <h2 className="text-base sm:text-lg font-bold text-sky-950">
            Internship Image
          </h2>

          {internshipImageUploaded ? (
            <span className="px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] sm:text-xs font-semibold">
              ✓ Submitted
            </span>
          ) : (
            <span className="px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-[10px] sm:text-xs font-semibold">
              ! Required
            </span>
          )}

        </div>

        <p className="text-xs sm:text-sm text-sky-700/70 mt-0.5">
          Upload a clear image related to your internship.
        </p>

      </div>

    </div>

  </div>


  {/* =====================================================
      INTERNSHIP IMAGE CARD
  ====================================================== */}

  <div className="bg-white rounded-2xl border border-sky-100 shadow-sm overflow-hidden">

    <div className="p-4 sm:p-6 md:p-7">

      {/* =================================================
          ALREADY SUBMITTED
      ================================================= */}

      {internshipImageUploaded ? (

        <div className="rounded-2xl bg-emerald-50 border border-emerald-100 p-4 sm:p-5">

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">

            {/* Status */}
            <div className="flex items-center gap-3 min-w-0">

              <div className="w-11 h-11 rounded-xl bg-white border border-emerald-100 flex items-center justify-center text-lg text-emerald-600 shadow-sm shrink-0">
                ✓
              </div>

              <div className="min-w-0">

                <p className="text-sm sm:text-base font-semibold text-emerald-800">
                  Internship image submitted
                </p>

                {internshipImage.uploadedAt && (
                  <p className="text-xs sm:text-sm text-emerald-600 mt-0.5">

                    Uploaded on{" "}

                    {new Date(
                      internshipImage.uploadedAt
                    ).toLocaleDateString("en-IN", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}

                  </p>
                )}

              </div>

            </div>


            {/* VIEW ONLY */}
            <a
              href={internshipImage.imageUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto inline-flex justify-center items-center gap-2 px-5 py-2.5 rounded-xl bg-white border border-emerald-200 text-emerald-700 hover:bg-emerald-100 text-sm font-semibold transition"
            >
              👁 View Image
            </a>

          </div>

        </div>

      ) : (

        /* =================================================
           NOT SUBMITTED YET
        ================================================= */

        <>

          {/* Success message */}
          {internshipImageMessage && (
            <div className="mb-5 rounded-xl bg-emerald-50 border border-emerald-200 p-4">

              <div className="flex items-start gap-3">

                <span className="text-emerald-600 text-lg">
                  ✓
                </span>

                <div>

                  <p className="text-sm font-semibold text-emerald-800">
                    Upload successful
                  </p>

                  <p className="text-xs text-emerald-700 mt-0.5">
                    {internshipImageMessage}
                  </p>

                </div>

              </div>

            </div>
          )}


          {/* Error message */}
          {internshipImageError && (
            <div className="mb-5 rounded-xl bg-rose-50 border border-rose-200 p-4">

              <div className="flex items-start gap-3">

                <span className="text-rose-600 text-lg">
                  !
                </span>

                <div>

                  <p className="text-sm font-semibold text-rose-800">
                    Upload failed
                  </p>

                  <p className="text-xs text-rose-700 mt-0.5">
                    {internshipImageError}
                  </p>

                </div>

              </div>

            </div>
          )}


          {/* =================================================
              SELECTED IMAGE PREVIEW
          ================================================= */}

          {internshipImageFile ? (

            <div className="rounded-2xl bg-sky-50/50 border border-sky-100 p-4 sm:p-5">

              <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] gap-5">

                {/* Image preview */}
                <div className="h-60 sm:h-72 md:h-64 rounded-xl bg-white border border-sky-100 overflow-hidden">

                  <img
                    src={internshipImagePreview}
                    alt="Internship image preview"
                    className="w-full h-full object-contain"
                  />

                </div>


                {/* File details */}
                <div className="flex flex-col justify-center">

                  <p className="text-[10px] uppercase tracking-wider font-bold text-sky-400">
                    Selected image
                  </p>

                  <h4 className="mt-1 text-sm sm:text-base font-semibold text-slate-800 break-all">
                    {internshipImageFile.name}
                  </h4>

                  <p className="text-xs sm:text-sm text-slate-500 mt-1">
                    {(
                      internshipImageFile.size /
                      (1024 * 1024)
                    ).toFixed(2)}{" "}
                    MB
                  </p>


                  <div className="flex flex-col sm:flex-row gap-2.5 mt-5">

                    <button
                      type="button"
                      onClick={handleUploadInternshipImage}
                      disabled={internshipImageUploading}
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 disabled:bg-sky-300 text-white text-sm font-semibold transition shadow-sm"
                    >

                      {internshipImageUploading ? (
                        <>
                          <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                          Uploading...
                        </>
                      ) : (
                        <>
                          ☁ Upload Internship Image
                        </>
                      )}

                    </button>


                    <button
                      type="button"
                      onClick={handleRemoveInternshipImage}
                      disabled={internshipImageUploading}
                      className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-sm font-medium transition"
                    >
                      Remove
                    </button>

                  </div>


                  <p className="text-[10px] sm:text-xs text-slate-400 mt-4">
                    JPG, JPEG or PNG • Maximum 5 MB
                  </p>

                </div>

              </div>

            </div>

          ) : (

            /* =================================================
               UPLOAD AREA
               SHOWN ONLY BEFORE FIRST SUBMISSION
            ================================================= */

            <div
              onClick={() =>
                internshipImageInputRef.current?.click()
              }
              className="group cursor-pointer rounded-2xl border-2 border-dashed border-sky-200 bg-sky-50/30 hover:bg-sky-50 hover:border-sky-400 transition-all duration-200 p-6 sm:p-9"
            >

              <div className="flex flex-col items-center text-center">

                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white border border-sky-100 shadow-sm flex items-center justify-center text-3xl sm:text-4xl group-hover:scale-105 transition-transform">
                  📷
                </div>

                <h3 className="mt-5 text-sm sm:text-base font-bold text-slate-800">
                  Upload internship image
                </h3>

                <p className="mt-1 text-xs sm:text-sm text-slate-500">
                  Select a clear image related to your internship.
                </p>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    internshipImageInputRef.current?.click();
                  }}
                  className="mt-5 inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-sm font-semibold shadow-sm transition"
                >
                  📎 Choose Image
                </button>

                <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-[10px] sm:text-xs text-slate-400">

                  <span className="px-2.5 py-1 rounded-full bg-white border border-slate-200">
                    JPG
                  </span>

                  <span className="px-2.5 py-1 rounded-full bg-white border border-slate-200">
                    JPEG
                  </span>

                  <span className="px-2.5 py-1 rounded-full bg-white border border-slate-200">
                    PNG
                  </span>

                  <span className="px-2.5 py-1 rounded-full bg-white border border-slate-200">
                    Max 5 MB
                  </span>

                </div>

              </div>

            </div>

          )}


          {/* Hidden internship image input */}
          <input
            ref={internshipImageInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png"
            onChange={handleInternshipImageSelect}
            className="hidden"
          />

        </>

      )}

    </div>

  </div>

</section>

        </div>

      </main>
    </>
  );
}