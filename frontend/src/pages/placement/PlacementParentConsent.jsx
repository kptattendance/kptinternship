import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useAuth } from "@clerk/clerk-react";
import { toast } from "react-toastify";
import ReviewerNavbar from "../../components/ReviewerNavbar";

export default function PlacementParentConsent() {
  const { getToken } = useAuth();

  const [applications, setApplications] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);

  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [departmentFilter, setDepartmentFilter] = useState("all");

  const [selectedLetter, setSelectedLetter] = useState(null);
  const [selectedInternshipImage, setSelectedInternshipImage] = useState(null);

  // Separate bulk selections
  const [selectedConsentIds, setSelectedConsentIds] = useState([]);
  const [selectedInternshipImageIds, setSelectedInternshipImageIds] = useState([]);

  const [deletingConsent, setDeletingConsent] = useState(false);
  const [deletingInternshipImages, setDeletingInternshipImages] = useState(false);

  // Separate bulk-delete filters
  const [consentDeleteFilter, setConsentDeleteFilter] = useState("submitted");
  const [internshipDeleteFilter, setInternshipDeleteFilter] = useState("submitted");

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

      // Fetch parent consent, internship photos, and current user separately.
      // The parent-consent endpoint and internship-images endpoint return
      // separate document data, so we merge them below.
      const [consentRes, internshipImageRes, meRes] =
        await Promise.all([
          axios.get(
            `${backendUrl}/api/students/parent-consent`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          ),

          axios.get(
            `${backendUrl}/api/students/internship-images`,
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
      // MERGE INTERNSHIP IMAGE DATA
      // =====================================================

      const internshipImageApplications =
        internshipImageRes.data.data || [];

      // Map internship image records by application _id.
      const internshipImageMap = new Map();

      internshipImageApplications.forEach((app) => {
        if (app?._id) {
          internshipImageMap.set(
            String(app._id),
            app.internshipImage || null
          );
        }
      });

      // Add internshipImage to the applications already loaded
      // from the parent-consent endpoint.
      apps = apps.map((app) => ({
        ...app,
        internshipImage:
          internshipImageMap.get(String(app._id)) || {
            submitted: false,
            imageUrl: "",
            publicId: "",
            uploadedAt: null,
          },
      }));

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
        "❌ Failed to fetch placement document records:",
        err.response?.data || err.message
      );

      toast.error(
        err.response?.data?.message ||
          "Failed to load parent consent and internship image records."
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

  const isInternshipImageSubmitted = (app) =>
    app.internshipImage?.submitted &&
    app.internshipImage?.imageUrl;

  // =========================================================
  // BULK DOCUMENT SELECTION
  // =========================================================

  const consentDeleteApplications = useMemo(() => {
    return filteredApplications.filter((app) => {
      const submitted = isSubmitted(app);

      if (consentDeleteFilter === "submitted") return submitted;
      if (consentDeleteFilter === "pending") return !submitted;

      return true;
    });
  }, [filteredApplications, consentDeleteFilter]);

  const internshipDeleteApplications = useMemo(() => {
    return filteredApplications.filter((app) => {
      const submitted = isInternshipImageSubmitted(app);

      if (internshipDeleteFilter === "submitted") return submitted;
      if (internshipDeleteFilter === "pending") return !submitted;

      return true;
    });
  }, [filteredApplications, internshipDeleteFilter]);

  const toggleConsentSelection = (id) => {
    setSelectedConsentIds((prev) =>
      prev.includes(id)
        ? prev.filter((item) => item !== id)
        : [...prev, id]
    );
  };

  const toggleInternshipImageSelection = (id) => {
    setSelectedInternshipImageIds((prev) =>
      prev.includes(id)
        ? prev.filter((item) => item !== id)
        : [...prev, id]
    );
  };

  const selectAllConsent = () => {
    const ids = consentDeleteApplications
      .filter(isSubmitted)
      .map((app) => app._id);

    setSelectedConsentIds(ids);
  };

  const selectAllInternshipImages = () => {
    const ids = internshipDeleteApplications
      .filter(isInternshipImageSubmitted)
      .map((app) => app._id);

    setSelectedInternshipImageIds(ids);
  };

  const clearConsentSelection = () => {
    setSelectedConsentIds([]);
  };

  const clearInternshipImageSelection = () => {
    setSelectedInternshipImageIds([]);
  };

  // =========================================================
  // BULK DELETE PARENT CONSENT LETTERS
  // =========================================================

  const handleBulkDeleteConsent = async () => {
    if (selectedConsentIds.length === 0) {
      toast.warning("Please select at least one consent letter.");
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to delete ${selectedConsentIds.length} parent consent letter(s)?\n\nThis will permanently remove the selected files from Cloudinary.`
    );

    if (!confirmed) return;

    try {
      setDeletingConsent(true);

      const token = await getToken();

      const res = await axios.delete(
        `${backendUrl}/api/students/parent-consent/bulk-delete`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          data: {
            applicationIds: selectedConsentIds,
          },
        }
      );

      if (res.data.success) {
        toast.success(
          res.data.message || "Consent letters deleted successfully."
        );

        setSelectedConsentIds([]);

        await fetchData(true);
      }
    } catch (err) {
      console.error(
        "❌ Bulk consent delete error:",
        err.response?.data || err.message
      );

      toast.error(
        err.response?.data?.message ||
          "Failed to delete consent letters."
      );
    } finally {
      setDeletingConsent(false);
    }
  };

  // =========================================================
  // BULK DELETE INTERNSHIP IMAGES
  // =========================================================

  const handleBulkDeleteInternshipImages = async () => {
    if (selectedInternshipImageIds.length === 0) {
      toast.warning("Please select at least one internship image.");
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to delete ${selectedInternshipImageIds.length} internship image(s)?\n\nThis will permanently remove the selected files from Cloudinary.`
    );

    if (!confirmed) return;

    try {
      setDeletingInternshipImages(true);

      const token = await getToken();

      const res = await axios.delete(
        `${backendUrl}/api/students/internship-images/bulk-delete`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          data: {
            applicationIds: selectedInternshipImageIds,
          },
        }
      );

      if (res.data.success) {
        toast.success(
          res.data.message ||
            "Internship images deleted successfully."
        );

        setSelectedInternshipImageIds([]);

        await fetchData(true);
      }
    } catch (err) {
      console.error(
        "❌ Bulk internship image delete error:",
        err.response?.data || err.message
      );

      toast.error(
        err.response?.data?.message ||
          "Failed to delete internship images."
      );
    } finally {
      setDeletingInternshipImages(false);
    }
  };

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
              Loading document records...
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
              STAT CARDS
          ================================================== */}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">

            {/* Total */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-5">
              <div className="flex items-center justify-between">

                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
                    Total Students
                  </p>

                  <p className="mt-1 text-2xl sm:text-3xl font-bold text-slate-800">
                    {totalCount}
                  </p>
                </div>

                <div className="w-11 h-11 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-xl">
                  👥
                </div>

              </div>
            </div>


            {/* Submitted */}
            <div className="bg-white rounded-2xl border border-emerald-100 shadow-sm p-4 sm:p-5">
              <div className="flex items-center justify-between">

                <div>
                  <p className="text-xs font-semibold text-emerald-500 uppercase tracking-wide">
                    Submitted
                  </p>

                  <p className="mt-1 text-2xl sm:text-3xl font-bold text-emerald-700">
                    {submittedCount}
                  </p>
                </div>

                <div className="w-11 h-11 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-xl">
                  ✓
                </div>

              </div>
            </div>


            {/* Pending */}
            <div className="bg-white rounded-2xl border border-amber-100 shadow-sm p-4 sm:p-5">
              <div className="flex items-center justify-between">

                <div>
                  <p className="text-xs font-semibold text-amber-500 uppercase tracking-wide">
                    Pending
                  </p>

                  <p className="mt-1 text-2xl sm:text-3xl font-bold text-amber-700">
                    {pendingCount}
                  </p>
                </div>

                <div className="w-11 h-11 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-xl">
                  !
                </div>

              </div>
            </div>

          </div>


       

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


              {/* Department */}
              <select
                value={departmentFilter}
                onChange={(e) =>
                  setDepartmentFilter(e.target.value)
                }
                className="h-11 px-4 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-700 outline-none focus:bg-white focus:border-violet-400 focus:ring-4 focus:ring-violet-50"
              >
                <option value="all">
                  All Departments
                </option>

                <option value="cs">CS</option>
                <option value="ec">EC</option>
                <option value="eee">EEE</option>
                <option value="me">ME</option>
                <option value="po">PO</option>
                <option value="ch">CH</option>
                <option value="ce">CE</option>
                <option value="at">AT</option>
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
              BULK DOCUMENT MANAGEMENT
          ================================================== */}

          {currentUser &&
            ["placement", "admin"].includes(currentUser.role) && (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-5 mb-6">

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">

                  {/* Parent Consent Bulk Delete */}
                  <div className="rounded-2xl bg-violet-50/50 border border-violet-100 p-4">

                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-sm font-bold text-violet-900">
                          📜 Parent Consent Letters
                        </h3>
                        <p className="text-xs text-violet-600/70 mt-1">
                          Select multiple submitted consent letters and delete them together.
                        </p>
                      </div>

                      <span className="shrink-0 px-2.5 py-1 rounded-full bg-white border border-violet-200 text-violet-700 text-[10px] font-bold">
                        {selectedConsentIds.length} Selected
                      </span>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2 mt-4">

                      <select
                        value={consentDeleteFilter}
                        onChange={(e) => {
                          setConsentDeleteFilter(e.target.value);
                          setSelectedConsentIds([]);
                        }}
                        className="h-10 flex-1 px-3 rounded-xl border border-violet-200 bg-white text-xs font-semibold text-slate-700 outline-none focus:border-violet-400"
                      >
                        <option value="submitted">
                          Submitted Consent Letters
                        </option>
                        <option value="pending">
                          Pending Consent Letters
                        </option>
                        <option value="all">
                          All Students
                        </option>
                      </select>

                      <button
                        type="button"
                        onClick={selectAllConsent}
                        disabled={
                          consentDeleteApplications.filter(isSubmitted).length === 0
                        }
                        className="h-10 px-4 rounded-xl bg-violet-600 hover:bg-violet-700 disabled:bg-slate-300 text-white text-xs font-bold transition"
                      >
                        Select All
                      </button>

                      <button
                        type="button"
                        onClick={clearConsentSelection}
                        disabled={selectedConsentIds.length === 0}
                        className="h-10 px-4 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 disabled:opacity-40 text-slate-600 text-xs font-bold transition"
                      >
                        Clear
                      </button>

                    </div>

                    <button
                      type="button"
                      onClick={handleBulkDeleteConsent}
                      disabled={
                        selectedConsentIds.length === 0 ||
                        deletingConsent
                      }
                      className="w-full mt-3 h-10 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:bg-slate-300 text-white text-xs font-bold transition"
                    >
                      {deletingConsent
                        ? "Deleting Consent Letters..."
                        : `🗑 Delete Selected Consent (${selectedConsentIds.length})`}
                    </button>

                  </div>


                  {/* Internship Image Bulk Delete */}
                  <div className="rounded-2xl bg-sky-50/50 border border-sky-100 p-4">

                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-sm font-bold text-sky-900">
                          📷 Internship Photos
                        </h3>
                        <p className="text-xs text-sky-600/70 mt-1">
                          Select multiple submitted internship photos and delete them together.
                        </p>
                      </div>

                      <span className="shrink-0 px-2.5 py-1 rounded-full bg-white border border-sky-200 text-sky-700 text-[10px] font-bold">
                        {selectedInternshipImageIds.length} Selected
                      </span>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2 mt-4">

                      <select
                        value={internshipDeleteFilter}
                        onChange={(e) => {
                          setInternshipDeleteFilter(e.target.value);
                          setSelectedInternshipImageIds([]);
                        }}
                        className="h-10 flex-1 px-3 rounded-xl border border-sky-200 bg-white text-xs font-semibold text-slate-700 outline-none focus:border-sky-400"
                      >
                        <option value="submitted">
                          Submitted Internship Photos
                        </option>
                        <option value="pending">
                          Pending Internship Photos
                        </option>
                        <option value="all">
                          All Students
                        </option>
                      </select>

                      <button
                        type="button"
                        onClick={selectAllInternshipImages}
                        disabled={
                          internshipDeleteApplications.filter(
                            isInternshipImageSubmitted
                          ).length === 0
                        }
                        className="h-10 px-4 rounded-xl bg-sky-600 hover:bg-sky-700 disabled:bg-slate-300 text-white text-xs font-bold transition"
                      >
                        Select All
                      </button>

                      <button
                        type="button"
                        onClick={clearInternshipImageSelection}
                        disabled={selectedInternshipImageIds.length === 0}
                        className="h-10 px-4 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 disabled:opacity-40 text-slate-600 text-xs font-bold transition"
                      >
                        Clear
                      </button>

                    </div>

                    <button
                      type="button"
                      onClick={handleBulkDeleteInternshipImages}
                      disabled={
                        selectedInternshipImageIds.length === 0 ||
                        deletingInternshipImages
                      }
                      className="w-full mt-3 h-10 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:bg-slate-300 text-white text-xs font-bold transition"
                    >
                      {deletingInternshipImages
                        ? "Deleting Internship Photos..."
                        : `🗑 Delete Selected Photos (${selectedInternshipImageIds.length})`}
                    </button>

                  </div>

                </div>

                <div className="mt-4 pt-3 border-t border-slate-100">
                  <p className="text-[11px] text-slate-400">
                    The two selections are independent. Deleting a consent letter will not delete the internship photo, and deleting an internship photo will not delete the consent letter.
                  </p>
                </div>

              </div>
            )}


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
                      Parent Consent
                    </th>

                    <th className="px-5 py-4 text-center text-xs font-bold text-slate-500 uppercase tracking-wide">
                      Internship Photo
                    </th>

                  </tr>
                </thead>


                <tbody>

                  {filteredApplications.length === 0 ? (

                    <tr>
                      <td
                        colSpan="8"
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


                          {/* Parent Consent */}
                          <td className="px-5 py-4 text-center">

                            {submitted ? (

                              <div className="flex items-center justify-center gap-2">

                                <input
                                  type="checkbox"
                                  checked={selectedConsentIds.includes(app._id)}
                                  onChange={() =>
                                    toggleConsentSelection(app._id)
                                  }
                                  className="w-4 h-4 accent-violet-600 cursor-pointer"
                                  title="Select consent letter"
                                />

                                <button
                                  type="button"
                                  onClick={() =>
                                    setSelectedLetter(app)
                                  }
                                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-50 border border-violet-200 text-violet-700 hover:bg-violet-100 text-xs font-bold transition"
                                >
                                  👁 View Letter
                                </button>

                              </div>

                            ) : (

                              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-xs font-bold">
                                ! Pending
                              </span>

                            )}

                          </td>


                          {/* Internship Photo */}
                          <td className="px-5 py-4 text-center">

                            {isInternshipImageSubmitted(app) ? (

                              <div className="flex items-center justify-center gap-2">

                                <input
                                  type="checkbox"
                                  checked={selectedInternshipImageIds.includes(app._id)}
                                  onChange={() =>
                                    toggleInternshipImageSelection(app._id)
                                  }
                                  className="w-4 h-4 accent-sky-600 cursor-pointer"
                                  title="Select internship image"
                                />

                                <button
                                  type="button"
                                  onClick={() =>
                                    setSelectedInternshipImage(app)
                                  }
                                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-sky-50 border border-sky-200 text-sky-700 hover:bg-sky-100 text-xs font-bold transition"
                                >
                                  👁 View Photo
                                </button>

                              </div>

                            ) : (

                              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-xs font-bold">
                                ! Pending
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


                    <div className="mt-3 space-y-2">

                      {submitted ? (

                        <div className="flex gap-2">

                          <input
                            type="checkbox"
                            checked={selectedConsentIds.includes(app._id)}
                            onChange={() =>
                              toggleConsentSelection(app._id)
                            }
                            className="w-4 h-4 mt-3 accent-violet-600 cursor-pointer"
                            title="Select consent letter"
                          />

                          <button
                            type="button"
                            onClick={() =>
                              setSelectedLetter(app)
                            }
                            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold transition"
                          >
                            👁 View Consent Letter
                          </button>

                        </div>

                      ) : (

                        <div className="w-full text-center px-4 py-2.5 rounded-xl bg-amber-100/60 border border-amber-200 text-amber-700 text-xs font-semibold">
                          Parent consent letter not submitted
                        </div>

                      )}

                      {isInternshipImageSubmitted(app) ? (

                        <div className="flex gap-2">

                          <input
                            type="checkbox"
                            checked={selectedInternshipImageIds.includes(app._id)}
                            onChange={() =>
                              toggleInternshipImageSelection(app._id)
                            }
                            className="w-4 h-4 mt-3 accent-sky-600 cursor-pointer"
                            title="Select internship image"
                          />

                          <button
                            type="button"
                            onClick={() =>
                              setSelectedInternshipImage(app)
                            }
                            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold transition"
                          >
                            👁 View Internship Photo
                          </button>

                        </div>

                      ) : (

                        <div className="w-full text-center px-4 py-2.5 rounded-xl bg-sky-50 border border-sky-100 text-sky-600 text-xs font-semibold">
                          Internship photo not submitted
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


      {/* =====================================================
          VIEW INTERNSHIP IMAGE MODAL
      ====================================================== */}

      {selectedInternshipImage && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5"
          onClick={() => setSelectedInternshipImage(null)}
        >

          <div
            className="w-full max-w-5xl max-h-[95vh] bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >

            {/* Modal header */}
            <div className="flex items-center justify-between gap-4 px-4 sm:px-6 py-4 border-b border-slate-200">

              <div className="flex items-center gap-3 min-w-0">

                <img
                  src={
                    selectedInternshipImage.image ||
                    "/default-avatar.png"
                  }
                  alt={selectedInternshipImage.name}
                  className="w-10 h-10 rounded-xl object-cover border border-slate-200"
                />

                <div className="min-w-0">

                  <h2 className="text-sm sm:text-base font-bold text-slate-800 truncate">
                    {selectedInternshipImage.name}
                  </h2>

                  <p className="text-xs text-slate-400">
                    {selectedInternshipImage.regNumber} •{" "}
                    {selectedInternshipImage.department?.toUpperCase()}
                  </p>

                </div>

              </div>

              <button
                type="button"
                onClick={() => setSelectedInternshipImage(null)}
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
                    selectedInternshipImage.internshipImage
                      ?.imageUrl
                  }
                  alt="Internship"
                  className="max-w-full max-h-[70vh] object-contain rounded-xl shadow-md bg-white"
                />

              </div>

            </div>


            {/* Footer */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 sm:px-6 py-4 border-t border-slate-200">

              <div>

                <p className="text-xs font-semibold text-slate-600">
                  Internship Photo
                </p>

                {selectedInternshipImage.internshipImage
                  ?.uploadedAt && (
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Uploaded on{" "}
                    {new Date(
                      selectedInternshipImage.internshipImage.uploadedAt
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
                  selectedInternshipImage.internshipImage
                    ?.imageUrl
                }
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold transition"
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