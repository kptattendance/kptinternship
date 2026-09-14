import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useAuth } from "@clerk/clerk-react";
import { toast } from "react-toastify";
import ReviewerNavbar from "../../components/ReviewerNavbar";

export default function ParentConsent() {
  const { getToken } = useAuth();

  const [applications, setApplications] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);

  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [departmentFilter, setDepartmentFilter] = useState("all");

  const [selectedLetter, setSelectedLetter] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const backendUrl = import.meta.env.VITE_BACKEND_URL;

  // =========================================================
  // FETCH DATA
  // =========================================================

  const fetchData = async (showRefresh = false) => {
    try {
      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const token = await getToken();

      const [consentRes, meRes] = await Promise.all([
        axios.get(
          `${backendUrl}/api/students/parent-consent`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        ),

        axios.get(
          `${backendUrl}/api/users/sync`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        ),
      ]);

      if (!meRes.data.ok) {
        throw new Error("Unable to identify current user.");
      }

      const user = meRes.data.user;
      setCurrentUser(user);

      let apps = consentRes.data.data || [];

      // =====================================================
      // COHORT OWNER → ONLY THEIR DEPARTMENT
      // =====================================================

      if (user.role === "cohortOwner") {
        apps = apps.filter(
          (app) =>
            app.department?.toLowerCase() ===
            user.department?.toLowerCase()
        );
      }

      // Sort by register number
      apps.sort((a, b) =>
        (a.regNumber || "").localeCompare(
          b.regNumber || "",
          undefined,
          { numeric: true }
        )
      );

      setApplications(apps);
    } catch (err) {
      console.error(
        "❌ Failed to fetch parent consent:",
        err.response?.data || err.message
      );

      toast.error(
        err.response?.data?.message ||
          "Failed to load parent consent records."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // =========================================================
  // FILTER
  // =========================================================

  const filteredApplications = useMemo(() => {
    let result = [...applications];

    // Search
    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase().trim();

      result = result.filter((app) => {
        const name = app.name?.toLowerCase() || "";
        const regNumber =
          app.regNumber?.toLowerCase() || "";
        const phone =
          app.phoneNumber?.toLowerCase() || "";

        return (
          name.includes(search) ||
          regNumber.includes(search) ||
          phone.includes(search)
        );
      });
    }

    // Status
    if (statusFilter === "submitted") {
      result = result.filter(
        (app) =>
          app.parentConsentLetter?.submitted &&
          app.parentConsentLetter?.imageUrl
      );
    }

    if (statusFilter === "pending") {
      result = result.filter(
        (app) =>
          !app.parentConsentLetter?.submitted ||
          !app.parentConsentLetter?.imageUrl
      );
    }

    // Department
    if (departmentFilter !== "all") {
      result = result.filter(
        (app) =>
          app.department?.toLowerCase() ===
          departmentFilter.toLowerCase()
      );
    }

    return result;
  }, [
    applications,
    searchTerm,
    statusFilter,
    departmentFilter,
  ]);

  // =========================================================
  // COUNTS
  // =========================================================

  const totalCount = applications.length;

  const submittedCount = applications.filter(
    (app) =>
      app.parentConsentLetter?.submitted &&
      app.parentConsentLetter?.imageUrl
  ).length;

  const pendingCount = totalCount - submittedCount;

  const submissionPercentage =
    totalCount > 0
      ? Math.round((submittedCount / totalCount) * 100)
      : 0;

  // =========================================================
  // STATUS
  // =========================================================

  const isSubmitted = (app) =>
    app.parentConsentLetter?.submitted &&
    app.parentConsentLetter?.imageUrl;

  // =========================================================
  // LOADING
  // =========================================================

  if (loading) {
    return (
      <>
        <ReviewerNavbar />

        <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
          <div className="text-center">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-violet-50 border border-violet-100 flex items-center justify-center">
              <div className="w-7 h-7 border-4 border-violet-200 border-t-violet-600 rounded-full animate-spin" />
            </div>

            <p className="mt-4 text-sm font-semibold text-slate-600">
              Loading parent consent records...
            </p>

            <p className="mt-1 text-xs text-slate-400">
              Please wait
            </p>
          </div>
        </div>
      </>
    );
  }

  // =========================================================
  // MAIN UI
  // =========================================================

  return (
    <>
      <ReviewerNavbar />

      <main className="min-h-screen bg-slate-50">
        <div className="max-w-7xl mx-auto px-3 py-5 sm:px-5 sm:py-7 lg:px-8">


       

          {/* =================================================
              SEARCH + FILTERS
          ================================================== */}

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-5 mb-6">

            <div className="flex flex-col lg:flex-row gap-3">

              {/* Search */}
              <div className="relative flex-1">

                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                  🔍
                </span>

                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) =>
                    setSearchTerm(e.target.value)
                  }
                  placeholder="Search by name, register number or phone..."
                  className="w-full h-11 pl-10 pr-4 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-700 placeholder:text-slate-400 outline-none focus:bg-white focus:border-violet-400 focus:ring-4 focus:ring-violet-50 transition"
                />

              </div>


              {/* Status */}
              <select
                value={statusFilter}
                onChange={(e) =>
                  setStatusFilter(e.target.value)
                }
                className="h-11 px-4 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-700 outline-none focus:bg-white focus:border-violet-400 focus:ring-4 focus:ring-violet-50"
              >
                <option value="all">
                  All Status
                </option>

                <option value="submitted">
                  ✓ Submitted
                </option>

                <option value="pending">
                  ! Pending
                </option>
              </select>


              {/* Clear */}
              {(searchTerm ||
                statusFilter !== "all" ||
                departmentFilter !== "all") && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchTerm("");
                    setStatusFilter("all");
                    setDepartmentFilter("all");
                  }}
                  className="h-11 px-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-sm font-semibold text-slate-600 transition"
                >
                  Clear
                </button>
              )}

            </div>

            <div className="mt-3 text-xs text-slate-400">
              Showing{" "}
              <span className="font-semibold text-slate-600">
                {filteredApplications.length}
              </span>{" "}
              of{" "}
              <span className="font-semibold text-slate-600">
                {applications.length}
              </span>{" "}
              students
            </div>

          </div>


          {/* =================================================
              DESKTOP TABLE
          ================================================== */}

          <div className="hidden md:block bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">

            <div className="overflow-x-auto">

              <table className="w-full text-sm">

                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">

                    <th className="px-5 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wide">
                      Sl No
                    </th>

                    <th className="px-5 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wide">
                      Student
                    </th>

                    <th className="px-5 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wide">
                      Register No
                    </th>

                    <th className="px-5 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wide">
                      Phone
                    </th>

                    <th className="px-5 py-4 text-center text-xs font-bold text-slate-500 uppercase tracking-wide">
                      Department
                    </th>

                    <th className="px-5 py-4 text-center text-xs font-bold text-slate-500 uppercase tracking-wide">
                      Consent Status
                    </th>

                    <th className="px-5 py-4 text-center text-xs font-bold text-slate-500 uppercase tracking-wide">
                      Action
                    </th>

                  </tr>
                </thead>


                <tbody>

                  {filteredApplications.length === 0 ? (

                    <tr>
                      <td
                        colSpan="7"
                        className="px-5 py-16 text-center"
                      >
                        <div className="text-4xl">
                          🔎
                        </div>

                        <p className="mt-3 text-sm font-semibold text-slate-700">
                          No students found
                        </p>

                        <p className="mt-1 text-xs text-slate-400">
                          Try changing your search or filters.
                        </p>
                      </td>
                    </tr>

                  ) : (

                    filteredApplications.map((app, index) => {

                      const submitted = isSubmitted(app);

                      return (
                        <tr
                          key={app._id}
                          className={`border-b border-slate-100 transition ${
                            submitted
                              ? "hover:bg-emerald-50/40"
                              : "bg-amber-50/30 hover:bg-amber-50/60"
                          }`}
                        >

                          {/* Sl No */}
                          <td className="px-5 py-4 text-slate-400 font-semibold">
                            {index + 1}
                          </td>


                          {/* Student */}
                          <td className="px-5 py-4">

                            <div className="flex items-center gap-3">

                              <img
                                src={
                                  app.image ||
                                  "/default-avatar.png"
                                }
                                alt={app.name}
                                className="w-11 h-11 rounded-xl object-cover border border-slate-200 shadow-sm"
                              />

                              <div>
                                <p className="font-bold text-slate-800">
                                  {app.name}
                                </p>

                                <p className="text-xs text-slate-400 mt-0.5">
                                  Student
                                </p>
                              </div>

                            </div>

                          </td>


                          {/* Reg */}
                          <td className="px-5 py-4 font-semibold text-slate-700">
                            {app.regNumber}
                          </td>


                          {/* Phone */}
                          <td className="px-5 py-4 text-slate-600">
                            {app.phoneNumber || "—"}
                          </td>


                          {/* Department */}
                          <td className="px-5 py-4 text-center">

                            <span className="inline-flex px-2.5 py-1 rounded-full bg-violet-50 border border-violet-100 text-violet-700 text-xs font-bold">
                              {app.department?.toUpperCase() || "—"}
                            </span>

                          </td>


                          {/* Status */}
                          <td className="px-5 py-4 text-center">

                            {submitted ? (

                              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold">
                                ✓ Submitted
                              </span>

                            ) : (

                              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-xs font-bold">
                                ! Pending
                              </span>

                            )}

                          </td>


                          {/* Action */}
                          <td className="px-5 py-4 text-center">

                            {submitted ? (

                              <button
                                type="button"
                                onClick={() =>
                                  setSelectedLetter(app)
                                }
                                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-50 border border-violet-200 text-violet-700 hover:bg-violet-100 text-xs font-bold transition"
                              >
                                👁 View Letter
                              </button>

                            ) : (

                              <span className="text-xs font-semibold text-amber-600">
                                Awaiting Upload
                              </span>

                            )}

                          </td>

                        </tr>
                      );
                    })

                  )}

                </tbody>

              </table>

            </div>

          </div>


          {/* =================================================
              MOBILE CARDS
          ================================================== */}

          <div className="md:hidden space-y-3">

            {filteredApplications.length === 0 ? (

              <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center">

                <div className="text-4xl">
                  🔎
                </div>

                <p className="mt-3 text-sm font-semibold text-slate-700">
                  No students found
                </p>

                <p className="mt-1 text-xs text-slate-400">
                  Try changing your search or filters.
                </p>

              </div>

            ) : (

              filteredApplications.map((app, index) => {

                const submitted = isSubmitted(app);

                return (
                  <div
                    key={app._id}
                    className={`rounded-2xl border shadow-sm p-4 ${
                      submitted
                        ? "bg-white border-emerald-100"
                        : "bg-amber-50/50 border-amber-200"
                    }`}
                  >

                    <div className="flex items-start gap-3">

                      <img
                        src={
                          app.image ||
                          "/default-avatar.png"
                        }
                        alt={app.name}
                        className="w-14 h-14 rounded-2xl object-cover border border-slate-200 shadow-sm shrink-0"
                      />

                      <div className="min-w-0 flex-1">

                        <div className="flex items-start justify-between gap-2">

                          <div>
                            <h3 className="font-bold text-slate-800 text-sm">
                              {app.name}
                            </h3>

                            <p className="text-xs text-slate-500 mt-0.5">
                              {app.regNumber}
                            </p>
                          </div>

                          {submitted ? (

                            <span className="shrink-0 px-2 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-bold">
                              ✓ Submitted
                            </span>

                          ) : (

                            <span className="shrink-0 px-2 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-[10px] font-bold">
                              ! Pending
                            </span>

                          )}

                        </div>

                      </div>

                    </div>


                    <div className="grid grid-cols-2 gap-3 mt-4">

                      <div className="rounded-xl bg-white/70 border border-slate-100 p-3">
                        <p className="text-[10px] uppercase tracking-wide text-slate-400 font-bold">
                          Phone
                        </p>

                        <p className="text-xs font-semibold text-slate-700 mt-1 break-all">
                          {app.phoneNumber || "—"}
                        </p>
                      </div>


                      <div className="rounded-xl bg-white/70 border border-slate-100 p-3">
                        <p className="text-[10px] uppercase tracking-wide text-slate-400 font-bold">
                          Department
                        </p>

                        <p className="text-xs font-semibold text-violet-700 mt-1">
                          {app.department?.toUpperCase() || "—"}
                        </p>
                      </div>

                    </div>


                    <div className="mt-3">

                      {submitted ? (

                        <button
                          type="button"
                          onClick={() =>
                            setSelectedLetter(app)
                          }
                          className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold transition"
                        >
                          👁 View Consent Letter
                        </button>

                      ) : (

                        <div className="w-full text-center px-4 py-2.5 rounded-xl bg-amber-100/60 border border-amber-200 text-amber-700 text-xs font-semibold">
                          Parent consent letter not submitted
                        </div>

                      )}

                    </div>

                  </div>
                );
              })

            )}

          </div>

        </div>
      </main>


      {/* =====================================================
          VIEW LETTER MODAL
      ====================================================== */}

      {selectedLetter && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5"
          onClick={() => setSelectedLetter(null)}
        >

          <div
            className="w-full max-w-4xl max-h-[95vh] bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >

            {/* Modal header */}
            <div className="flex items-center justify-between gap-4 px-4 sm:px-6 py-4 border-b border-slate-200">

              <div className="flex items-center gap-3 min-w-0">

                <img
                  src={
                    selectedLetter.image ||
                    "/default-avatar.png"
                  }
                  alt={selectedLetter.name}
                  className="w-10 h-10 rounded-xl object-cover border border-slate-200"
                />

                <div className="min-w-0">

                  <h2 className="text-sm sm:text-base font-bold text-slate-800 truncate">
                    {selectedLetter.name}
                  </h2>

                  <p className="text-xs text-slate-400">
                    {selectedLetter.regNumber} •{" "}
                    {selectedLetter.department?.toUpperCase()}
                  </p>

                </div>

              </div>


              <button
                type="button"
                onClick={() => setSelectedLetter(null)}
                className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center text-lg shrink-0 transition"
              >
                ×
              </button>

            </div>


            {/* Image */}
            <div className="flex-1 overflow-auto bg-slate-100 p-3 sm:p-5">

              <div className="min-h-full flex items-center justify-center">

                <img
                  src={
                    selectedLetter.parentConsentLetter
                      ?.imageUrl
                  }
                  alt="Parent Consent Letter"
                  className="max-w-full max-h-[70vh] object-contain rounded-xl shadow-md bg-white"
                />

              </div>

            </div>


            {/* Footer */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 sm:px-6 py-4 border-t border-slate-200">

              <div>
                <p className="text-xs font-semibold text-slate-600">
                  Parent Consent / Undertaking
                </p>

                {selectedLetter.parentConsentLetter
                  ?.uploadedAt && (
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Uploaded on{" "}
                    {new Date(
                      selectedLetter.parentConsentLetter.uploadedAt
                    ).toLocaleDateString("en-IN", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                )}
              </div>


              <a
                href={
                  selectedLetter.parentConsentLetter
                    ?.imageUrl
                }
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold transition"
              >
                ↗ Open Full Image
              </a>

            </div>

          </div>

        </div>
      )}

    </>
  );
}