import { useEffect, useState } from "react";
import { useAuth, useUser } from "@clerk/clerk-react";
import axios from "axios";
import ReviewerNavbar from "../../components/ReviewerNavbar";
import { toast } from "react-toastify";
import { FaEye, FaTrash } from "react-icons/fa";

import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import HodReviewModal from "../hod/HodReviewModal";

export default function AllPlaceApplications() {
  const { getToken } = useAuth();
  const { user } = useUser();

  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selected, setSelected] = useState(null);

  const [search, setSearch] = useState("");
  const [sortAsc, setSortAsc] = useState(true);

  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Multiple selection
  const [selectedApplications, setSelectedApplications] = useState([]);

  // Delete states
  const [deletingId, setDeletingId] = useState(null);
  const [bulkDeleting, setBulkDeleting] = useState(false);

  const backendUrl = import.meta.env.VITE_BACKEND_URL;

  // Pull role & department from Clerk metadata
  const role = user?.publicMetadata?.role;
  const hodDepartment = user?.publicMetadata?.department;

  /* =========================================================
     FETCH APPLICATIONS
  ========================================================= */

  const fetchApplications = async () => {
    try {
      setLoading(true);

      const token = await getToken();

      const res = await axios.get(
        backendUrl + "/api/students/getAllApplications",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      let data = res.data;

      // HOD / Cohort Owner sees only their department
      if (role === "hod" || role === "cohortOwner") {
        data = data.filter(
          (app) => app.department === hodDepartment
        );
      } else if (role === "student") {
        data = [];
      }

      setApps(data);
    } catch (err) {
      console.error(
        "❌ Failed to fetch:",
        err.response?.data || err.message
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (role) {
      fetchApplications();
    }
  }, [getToken, hodDepartment, role, backendUrl]);

  /* =========================================================
     EXCEL DOWNLOAD
  ========================================================= */

  const downloadExcel = () => {
    const data = apps.map((app) => ({
      "Reg Number": app.regNumber,
      Name: app.name,
      Phone: app.phoneNumber,
      Department: app.department,
      Company: app.companyName,
      "Company Contact": app.companyContact,
      Email: app.companyEmail,

      "Month 1": app.attendance?.month1 ?? "-",
      "Month 2": app.attendance?.month2 ?? "-",
      "Month 3": app.attendance?.month3 ?? "-",
      "Month 4": app.attendance?.month4 ?? "-",
      "Month 5": app.attendance?.month5 ?? "-",

      "CIE 1 Total": app.marks?.cie1?.total ?? "-",
      "CIE 1 Report": app.marks?.cie1?.report ?? "-",
      "CIE 1 Presentation":
        app.marks?.cie1?.presentation ?? "-",

      "CIE 2 Total": app.marks?.cie2?.total ?? "-",
      "CIE 2 Report": app.marks?.cie2?.report ?? "-",
      "CIE 2 Use Case":
        app.marks?.cie2?.useCase ?? "-",

      "CIE 3 Total": app.marks?.cie3?.total ?? "-",
      "CIE 3 Report": app.marks?.cie3?.report ?? "-",
      "CIE 3 Use Case":
        app.marks?.cie3?.useCase ?? "-",

      "Start Date": app.startDate
        ? new Date(app.startDate).toLocaleDateString()
        : "-",

      "End Date": app.endDate
        ? new Date(app.endDate).toLocaleDateString()
        : "-",

      "Working Hours": app.workingHours ?? "-",
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);

    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(
      workbook,
      worksheet,
      "Internship Report"
    );

    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });

    const file = new Blob([excelBuffer], {
      type: "application/octet-stream",
    });

    saveAs(file, "Internship_Report.xlsx");
  };

  /* =========================================================
     SINGLE DELETE
  ========================================================= */

  const handleDelete = async (id) => {
    const app = apps.find((item) => item._id === id);

    const confirmDelete = window.confirm(
      `Are you sure you want to delete this application?\n\n` +
        `Student: ${app?.name || "-"}\n` +
        `Reg No: ${app?.regNumber || "-"}\n` +
        `Company: ${app?.companyName || "-"}\n\n` +
        `This action cannot be undone.`
    );

    if (!confirmDelete) return;

    try {
      setDeletingId(id);

      const token = await getToken();

      await axios.delete(
        backendUrl + `/api/students/deleteApplication/${id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // Remove from application list
      setApps((prev) =>
        prev.filter((app) => app._id !== id)
      );

      // Remove from selection if present
      setSelectedApplications((prev) =>
        prev.filter((applicationId) => applicationId !== id)
      );

      toast.success("Application deleted successfully");
    } catch (err) {
      console.error(
        "❌ Failed to delete:",
        err.response?.data || err.message
      );

      toast.error(
        err.response?.data?.message ||
          "Failed to delete application"
      );
    } finally {
      setDeletingId(null);
    }
  };

  /* =========================================================
     SELECTION
  ========================================================= */

  const toggleApplicationSelection = (id) => {
    setSelectedApplications((prev) => {
      if (prev.includes(id)) {
        return prev.filter(
          (applicationId) => applicationId !== id
        );
      }

      return [...prev, id];
    });
  };

  /*
   * Select All applies to ALL FILTERED applications,
   * not just the current pagination page.
   *
   * This allows the user to select applications across
   * multiple pages.
   */

  const filteredApplicationIds = apps
    .filter((app) => {
      const q = search.toLowerCase();

      return (
        (app.regNumber || "")
          .toLowerCase()
          .includes(q) ||
        (app.name || "")
          .toLowerCase()
          .includes(q) ||
        (app.companyName || "")
          .toLowerCase()
          .includes(q)
      );
    })
    .map((app) => app._id);

  const allFilteredSelected =
    filteredApplicationIds.length > 0 &&
    filteredApplicationIds.every((id) =>
      selectedApplications.includes(id)
    );

  const someFilteredSelected =
    selectedApplications.length > 0 &&
    filteredApplicationIds.some((id) =>
      selectedApplications.includes(id)
    ) &&
    !allFilteredSelected;

  const toggleSelectAll = () => {
    if (allFilteredSelected) {
      // Remove all filtered applications from selection
      setSelectedApplications((prev) =>
        prev.filter(
          (id) => !filteredApplicationIds.includes(id)
        )
      );
    } else {
      // Add all filtered applications
      setSelectedApplications((prev) => [
        ...new Set([
          ...prev,
          ...filteredApplicationIds,
        ]),
      ]);
    }
  };

  const clearSelection = () => {
    setSelectedApplications([]);
  };

  /* =========================================================
     BULK DELETE
  ========================================================= */

  const handleBulkDelete = async () => {
    if (selectedApplications.length === 0) {
      toast.info("Please select at least one application");
      return;
    }

    const count = selectedApplications.length;

    // Get selected application details
    const selectedApps = apps.filter((app) =>
      selectedApplications.includes(app._id)
    );

    const confirmDelete = window.confirm(
      `Are you sure you want to delete ${count} selected ${
        count === 1
          ? "application"
          : "applications"
      }?\n\n` +
        `Selected: ${selectedApps.length}\n\n` +
        `This action cannot be undone.`
    );

    if (!confirmDelete) return;

    try {
      setBulkDeleting(true);

      const token = await getToken();

      /*
       * Delete every selected application using
       * the existing backend endpoint.
       *
       * Promise.allSettled ensures that if one
       * deletion fails, the remaining deletions
       * are still attempted.
       */

      const results = await Promise.allSettled(
        selectedApplications.map((id) =>
          axios.delete(
            backendUrl +
              `/api/students/deleteApplication/${id}`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          )
        )
      );

      const successfulIds = [];

      let failedCount = 0;

      results.forEach((result, index) => {
        if (result.status === "fulfilled") {
          successfulIds.push(
            selectedApplications[index]
          );
        } else {
          failedCount++;
        }
      });

      // Remove successfully deleted applications
      setApps((prev) =>
        prev.filter(
          (app) =>
            !successfulIds.includes(app._id)
        )
      );

      // Keep only failed selections
      setSelectedApplications((prev) =>
        prev.filter(
          (id) => !successfulIds.includes(id)
        )
      );

      if (failedCount === 0) {
        toast.success(
          `${successfulIds.length} ${
            successfulIds.length === 1
              ? "application"
              : "applications"
          } deleted successfully`
        );
      } else {
        toast.warning(
          `${successfulIds.length} deleted successfully. ` +
            `${failedCount} could not be deleted.`
        );
      }
    } catch (err) {
      console.error(
        "❌ Bulk delete failed:",
        err.response?.data || err.message
      );

      toast.error(
        err.response?.data?.message ||
          "Failed to delete selected applications"
      );
    } finally {
      setBulkDeleting(false);
    }
  };

  /* =========================================================
     STATUS BADGE
  ========================================================= */

  const StatusBadge = ({ status }) => {
    let color =
      status === "approved"
        ? "bg-green-100 text-green-700"
        : status === "rejected"
        ? "bg-red-100 text-red-700"
        : "bg-gray-100 text-gray-700";

    return (
      <span
        className={`px-2 py-1 text-xs rounded font-medium ${color}`}
      >
        {status
          ? status.charAt(0).toUpperCase() +
            status.slice(1)
          : "Pending"}
      </span>
    );
  };

  /* =========================================================
     FILTER + SORT
  ========================================================= */

  const filteredApps = apps
    .filter((app) => {
      const q = search.toLowerCase();

      return (
        (app.regNumber || "")
          .toLowerCase()
          .includes(q) ||
        (app.name || "")
          .toLowerCase()
          .includes(q) ||
        (app.companyName || "")
          .toLowerCase()
          .includes(q)
      );
    })
    .sort((a, b) =>
      sortAsc
        ? (a.regNumber || "").localeCompare(
            b.regNumber || ""
          )
        : (b.regNumber || "").localeCompare(
            a.regNumber || ""
          )
    );

  /* =========================================================
     PAGINATION
  ========================================================= */

  const totalPages = Math.max(
    1,
    Math.ceil(filteredApps.length / pageSize)
  );

  /*
   * If deletion/search causes current page to exceed
   * available pages, move back to the last page.
   */
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  /*
   * Reset to first page when search changes.
   */
  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  const paginatedApps = filteredApps.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <>
      <ReviewerNavbar />

      <div className="min-h-screen bg-slate-50 p-4 md:p-5">

        <div className="max-w-[1800px] mx-auto">

          {/* =================================================
              HEADER
          ================================================= */}

          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 mb-4">

            <div>
              <h2 className="text-xl font-semibold text-slate-800">
                {role === "principal" ||
                role === "placement"
                  ? "All Department Applications"
                  : role === "hod" ||
                    role === "cohortOwner"
                  ? `Applications (${hodDepartment?.toUpperCase()})`
                  : "Applications"}
              </h2>

              <p className="text-xs text-slate-500 mt-1">
                Showing {filteredApps.length} of{" "}
                {apps.length} applications
              </p>
            </div>

            {/* =================================================
                SELECTION CONTROLS
            ================================================= */}

            <div className="flex flex-wrap items-center gap-2">

              <span
                className={`px-3 py-1.5 rounded-lg text-sm font-semibold ${
                  selectedApplications.length > 0
                    ? "bg-indigo-100 text-indigo-700 border border-indigo-200"
                    : "bg-white text-gray-500 border border-gray-200"
                }`}
              >
                Selected: {selectedApplications.length}
              </span>

              <button
                type="button"
                onClick={clearSelection}
                disabled={
                  selectedApplications.length === 0 ||
                  bulkDeleting
                }
                className="px-3 py-1.5 rounded-lg
                text-sm font-medium
                bg-white border border-gray-300
                text-gray-700
                hover:bg-gray-100
                disabled:opacity-40
                disabled:cursor-not-allowed
                transition"
              >
                Clear
              </button>

              <button
                type="button"
                onClick={handleBulkDelete}
                disabled={
                  selectedApplications.length === 0 ||
                  bulkDeleting
                }
                className="px-3 py-1.5 rounded-lg
                text-sm font-semibold
                bg-red-600 text-white
                hover:bg-red-700
                disabled:bg-gray-300
                disabled:text-gray-500
                disabled:cursor-not-allowed
                transition"
              >
                {bulkDeleting
                  ? "Deleting..."
                  : `🗑️ Delete Selected${
                      selectedApplications.length > 0
                        ? ` (${selectedApplications.length})`
                        : ""
                    }`}
              </button>

            </div>
          </div>

          {/* =================================================
              SEARCH + SORT + EXCEL
          ================================================= */}

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-3 mb-4">

            <div className="flex flex-col lg:flex-row gap-2">

              <input
                type="text"
                placeholder="🔍 Search by Reg No, Name, or Company"
                value={search}
                onChange={(e) =>
                  setSearch(e.target.value)
                }
                className="border border-slate-300 rounded-lg
                px-3 py-2 text-sm
                focus:ring-2 focus:ring-blue-200
                focus:border-blue-500
                focus:outline-none
                w-full lg:w-80"
              />

              <button
                type="button"
                onClick={() =>
                  setSortAsc(!sortAsc)
                }
                className="px-3 py-2
                bg-blue-600 text-white
                rounded-lg text-sm font-medium
                shadow-sm hover:bg-blue-700"
              >
                Sort by Reg No{" "}
                {sortAsc ? "↑" : "↓"}
              </button>

              <button
                type="button"
                onClick={downloadExcel}
                className="px-4 py-2
                bg-green-600 text-white
                rounded-lg text-sm font-medium
                shadow-sm hover:bg-green-700"
              >
                📥 Download Excel Report
              </button>

            </div>
          </div>

          {/* =================================================
              LOADING
          ================================================= */}

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">

              <div
                className="animate-spin rounded-full
                h-12 w-12
                border-t-4 border-blue-600
                border-solid"
              />

              <p className="mt-4 text-gray-600">
                Fetching applications...
              </p>
            </div>
          ) : filteredApps.length === 0 ? (

            <div className="bg-white rounded-xl border border-slate-200 py-12 text-center">

              <p className="text-gray-600">
                No applications found for your department.
              </p>
            </div>

          ) : (

            <>
              {/* =================================================
                  TABLE
              ================================================= */}

              <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-sm bg-white">

                <table className="w-full min-w-[1450px] text-sm border-collapse">

                  {/* ================= HEADER ================= */}

                  <thead className="sticky top-0 z-10 bg-slate-100 text-slate-700 border-b">

                    <tr>

                      {/* Select All */}
                      <th className="p-3 text-center w-12">

                        <input
                          type="checkbox"
                          checked={allFilteredSelected}
                          ref={(element) => {
                            if (element) {
                              element.indeterminate =
                                someFilteredSelected;
                            }
                          }}
                          onChange={toggleSelectAll}
                          className="h-4 w-4 cursor-pointer accent-blue-600"
                          title={
                            allFilteredSelected
                              ? "Deselect all"
                              : "Select all"
                          }
                        />

                      </th>

                      <th className="p-3 text-left">
                        Sl
                      </th>

                      <th className="p-3 text-center">
                        Photo
                      </th>

                      <th className="p-3 text-left">
                        Reg No
                      </th>

                      <th className="p-3 text-left">
                        Name
                      </th>

                      <th className="p-3 text-left">
                        Phone
                      </th>

                      <th className="p-3 text-center">
                        Dept
                      </th>

                      <th className="p-3 text-left">
                        Company
                      </th>

                      <th className="p-3 text-left">
                        Email
                      </th>

                      <th className="p-3 text-center">
                        M1
                      </th>

                      <th className="p-3 text-center">
                        M2
                      </th>

                      <th className="p-3 text-center">
                        M3
                      </th>

                      <th className="p-3 text-center">
                        M4
                      </th>

                      <th className="p-3 text-center">
                        M5
                      </th>

                      <th className="p-3 text-center">
                        CIE-I
                      </th>

                      <th className="p-3 text-center">
                        CIE-II
                      </th>

                      <th className="p-3 text-center">
                        CIE-III
                      </th>

                      <th className="p-3 text-center">
                        Actions
                      </th>

                    </tr>
                  </thead>

                  {/* ================= BODY ================= */}

                  <tbody>

                    {paginatedApps.map(
                      (app, index) => {

                        const isSelected =
                          selectedApplications.includes(
                            app._id
                          );

                        return (
                          <tr
                            key={app._id}
                            className={`border-b transition ${
                              isSelected
                                ? "bg-red-50"
                                : index % 2 === 0
                                ? "bg-white"
                                : "bg-slate-50"
                            } hover:bg-blue-50`}
                          >

                            {/* ================= CHECKBOX ================= */}

                            <td className="p-3 text-center">

                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() =>
                                  toggleApplicationSelection(
                                    app._id
                                  )
                                }
                                className="h-4 w-4 cursor-pointer accent-blue-600"
                              />

                            </td>

                            {/* ================= SL ================= */}

                            <td className="p-3 text-center text-slate-600">
                              {(currentPage - 1) *
                                pageSize +
                                index +
                                1}
                            </td>

                            {/* ================= PHOTO ================= */}

                            <td className="p-3 text-center">

                              <img
                                src={
                                  app.image ||
                                  "/default-avatar.png"
                                }
                                alt={app.name}
                                className="h-9 w-9 rounded-full
                                object-cover mx-auto
                                border border-slate-300"
                              />

                            </td>

                            {/* ================= REG NUMBER ================= */}

                            <td className="p-3 font-medium whitespace-nowrap">
                              {app.regNumber}
                            </td>

                            {/* ================= NAME ================= */}

                            <td className="p-3 font-semibold text-slate-800 whitespace-nowrap">
                              {app.name}
                            </td>

                            {/* ================= PHONE ================= */}

                            <td className="p-3 whitespace-nowrap">
                              {app.phoneNumber || "-"}
                            </td>

                            {/* ================= DEPARTMENT ================= */}

                            <td className="p-3 text-center">

                              <span
                                className="px-2 py-0.5
                                text-xs rounded-full
                                bg-slate-200
                                text-slate-700
                                font-semibold"
                              >
                                {app.department?.toUpperCase()}
                              </span>

                            </td>

                            {/* ================= COMPANY ================= */}

                            <td className="p-3 whitespace-nowrap">
                              {app.companyName || "-"}
                            </td>

                            {/* ================= EMAIL ================= */}

                            <td className="p-3 whitespace-nowrap">
                              {app.companyEmail || "-"}
                            </td>

                            {/* ================= ATTENDANCE ================= */}

                            {[1, 2, 3, 4, 5].map(
                              (m) => (
                                <td
                                  key={m}
                                  className="p-3 text-center text-slate-600"
                                >
                                  {app.attendance?.[
                                    `month${m}`
                                  ] ?? "-"}
                                </td>
                              )
                            )}

                            {/* ================= CIE I ================= */}

                            <td className="p-3 text-center">

                              <div className="text-lg font-semibold text-emerald-700">
                                {app.marks?.cie1
                                  ?.total ?? "-"}
                                <span className="text-xs text-slate-500">
                                  {" "}
                                  / 80
                                </span>
                              </div>

                              <div className="text-[11px] text-slate-500">
                                R{" "}
                                {app.marks?.cie1
                                  ?.report ?? 0}{" "}
                                · P{" "}
                                {app.marks?.cie1
                                  ?.presentation ?? 0}
                              </div>

                            </td>

                            {/* ================= CIE II ================= */}

                            <td className="p-3 text-center">

                              <div className="text-lg font-semibold text-blue-700">
                                {app.marks?.cie2
                                  ?.total ?? "-"}
                                <span className="text-xs text-slate-500">
                                  {" "}
                                  / 80
                                </span>
                              </div>

                              <div className="text-[11px] text-slate-500">
                                R{" "}
                                {app.marks?.cie2
                                  ?.report ?? 0}{" "}
                                · UC{" "}
                                {app.marks?.cie2
                                  ?.useCase ?? 0}
                              </div>

                            </td>

                            {/* ================= CIE III ================= */}

                            <td className="p-3 text-center">

                              <div className="text-lg font-semibold text-purple-700">
                                {app.marks?.cie3
                                  ?.total ?? "-"}
                                <span className="text-xs text-slate-500">
                                  {" "}
                                  / 80
                                </span>
                              </div>

                              <div className="text-[11px] text-slate-500">
                                R{" "}
                                {app.marks?.cie3
                                  ?.report ?? 0}{" "}
                                · UC{" "}
                                {app.marks?.cie3
                                  ?.useCase ?? 0}
                              </div>

                            </td>

                            {/* ================= ACTIONS ================= */}

                            <td className="p-3 text-center">

                              <div className="flex justify-center gap-2">

                                {/* View */}
                                <button
                                  type="button"
                                  onClick={() =>
                                    setSelected(app)
                                  }
                                  className="p-2 rounded
                                  border border-blue-300
                                  text-blue-700
                                  hover:bg-blue-50
                                  disabled:opacity-50"
                                  title="View"
                                  disabled={bulkDeleting}
                                >
                                  <FaEye size={12} />
                                </button>

                                {/* Delete */}
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleDelete(
                                      app._id
                                    )
                                  }
                                  disabled={
                                    deletingId ===
                                      app._id ||
                                    bulkDeleting
                                  }
                                  className="p-2 rounded
                                  border border-red-300
                                  text-red-600
                                  hover:bg-red-50
                                  disabled:opacity-40
                                  disabled:cursor-not-allowed"
                                  title="Delete"
                                >
                                  <FaTrash size={10} />
                                </button>

                              </div>

                            </td>

                          </tr>
                        );
                      }
                    )}

                  </tbody>
                </table>
              </div>

              {/* =================================================
                  PAGINATION
              ================================================= */}

              <div className="flex flex-col sm:flex-row justify-center items-center gap-3 mt-4">

                <button
                  type="button"
                  onClick={() =>
                    setCurrentPage((p) =>
                      Math.max(p - 1, 1)
                    )
                  }
                  disabled={currentPage === 1}
                  className="px-3 py-1.5
                  border rounded-lg
                  disabled:opacity-50
                  bg-white hover:bg-gray-100
                  text-sm"
                >
                  Previous
                </button>

                <span className="text-sm text-gray-600">
                  Page {currentPage} of{" "}
                  {totalPages}
                </span>

                <button
                  type="button"
                  onClick={() =>
                    setCurrentPage((p) =>
                      Math.min(
                        p + 1,
                        totalPages
                      )
                    )
                  }
                  disabled={
                    currentPage === totalPages
                  }
                  className="px-3 py-1.5
                  border rounded-lg
                  disabled:opacity-50
                  bg-white hover:bg-gray-100
                  text-sm"
                >
                  Next
                </button>

              </div>
            </>
          )}

          {/* =================================================
              REVIEW MODAL
          ================================================= */}

          {selected && (
            <HodReviewModal
              selected={selected}
              setSelected={setSelected}
              role="hod"
              setApps={setApps}
              getToken={getToken}
            />
          )}

        </div>
      </div>
    </>
  );
}