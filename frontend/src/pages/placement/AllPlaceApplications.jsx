// src/pages/hod/AllApplications.jsx
import { useEffect, useState } from "react";
import { useAuth, useUser } from "@clerk/clerk-react";
import axios from "axios";
import ReviewerNavbar from "../../components/ReviewerNavbar"; // HOD navbar
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
  const [selected, setSelected] = useState(null); // selected app for modal
  const [search, setSearch] = useState(""); // 🔍 search box
  const [sortAsc, setSortAsc] = useState(true); // ⬆️⬇️ sort toggle
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  const backendUrl = import.meta.env.VITE_BACKEND_URL;

  // Pull role & department from Clerk metadata
  const role = user?.publicMetadata?.role; // 👈 role
  const hodDepartment = user?.publicMetadata?.department; // 👈 department

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
      "CIE 1 Presentation": app.marks?.cie1?.presentation ?? "-",

      "CIE 2 Total": app.marks?.cie2?.total ?? "-",
      "CIE 2 Report": app.marks?.cie2?.report ?? "-",
      "CIE 2 Use Case": app.marks?.cie2?.useCase ?? "-",

      "CIE 3 Total": app.marks?.cie3?.total ?? "-",
      "CIE 3 Report": app.marks?.cie3?.report ?? "-",
      "CIE 3 Use Case": app.marks?.cie3?.useCase ?? "-",

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
    XLSX.utils.book_append_sheet(workbook, worksheet, "Internship Report");

    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });
    const file = new Blob([excelBuffer], { type: "application/octet-stream" });

    saveAs(file, "Internship_Report.xlsx");
  };

  useEffect(() => {
    const fetchApplications = async () => {
      try {
        setLoading(true);
        const token = await getToken();
        const res = await axios.get(
          backendUrl + "/api/students/getAllApplications",
          { headers: { Authorization: `Bearer ${token}` } }
        );

        let data = res.data;

        if (role === "hod" || role === "cohortOwner") {
          data = data.filter((app) => app.department === hodDepartment);
        } else if (role === "student") {
          data = []; // students shouldn't see anything
        }
        setApps(data);
      } catch (err) {
        console.error("❌ Failed to fetch:", err.response?.data || err.message);
      } finally {
        setLoading(false);
      }
    };

    if (role) fetchApplications();
  }, [getToken, hodDepartment, role, backendUrl]);

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this application?"))
      return;

    try {
      const token = await getToken();
      await axios.delete(backendUrl + `/api/students/deleteApplication/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setApps(apps.filter((app) => app._id !== id));
      toast.success("Application deleted successfully");
    } catch (err) {
      console.error("❌ Failed to delete:", err.response?.data || err.message);
      toast.error("Failed to delete application");
    }
  };

  const StatusBadge = ({ status }) => {
    let color =
      status === "approved"
        ? "bg-green-100 text-green-700"
        : status === "rejected"
        ? "bg-red-100 text-red-700"
        : "bg-gray-100 text-gray-700";
    return (
      <span className={`px-2 py-1 text-xs rounded font-medium ${color}`}>
        {status ? status.charAt(0).toUpperCase() + status.slice(1) : "Pending"}
      </span>
    );
  };

  // 🔍 Filter + sort logic
  const filteredApps = apps
    .filter((app) => {
      const q = search.toLowerCase();
      return (
        app.regNumber.toLowerCase().includes(q) ||
        app.name.toLowerCase().includes(q) ||
        app.companyName.toLowerCase().includes(q)
      );
    })
    .sort((a, b) =>
      sortAsc
        ? a.regNumber.localeCompare(b.regNumber)
        : b.regNumber.localeCompare(a.regNumber)
    );

  // 🔹 Pagination logic
  const totalPages = Math.ceil(filteredApps.length / pageSize);
  const paginatedApps = filteredApps.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  return (
    <>
      {/* ✅ Navbar always visible */}
      <ReviewerNavbar />

      <div className="p-6">
        <h2 className="text-xl font-semibold mb-4">
          {role === "principal" || role === "placement"
            ? "All Department Applications"
            : role === "hod" || role === "cohortOwner"
            ? `Applications (${hodDepartment?.toUpperCase()})`
            : "Applications"}
        </h2>

        {/* 🔍 Search + sort controls */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
          <input
            type="text"
            placeholder="Search by Reg No, Name, or Company"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border rounded px-3 py-2 shadow-sm focus:ring focus:ring-blue-300 w-full sm:w-64"
          />
          <button
            onClick={() => setSortAsc(!sortAsc)}
            className="px-3 py-2 bg-blue-600 text-white rounded shadow hover:bg-blue-700"
          >
            Sort by Reg No {sortAsc ? "↑" : "↓"}
          </button>
          <button
            onClick={downloadExcel}
            className="px-4 py-2 bg-green-600 text-white rounded-lg shadow hover:bg-green-700"
          >
            📥 Download Excel Report
          </button>
        </div>

        {loading ? (
          // ✅ Centered spinner while fetching
          <div className="flex flex-col items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-600 border-solid"></div>
            <p className="mt-4 text-gray-600">Fetching applications...</p>
          </div>
        ) : filteredApps.length === 0 ? (
          <p className="text-gray-600">
            No applications found for your department.
          </p>
        ) : (
          <>
            <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-sm bg-white">
              <table className="w-full text-sm border-collapse">
                {/* ================= HEADER ================= */}
                <thead className="sticky top-0 z-10 bg-slate-100 text-slate-700 border-b">
                  <tr>
                    <th className="p-3 text-left">Sl</th>
                    <th className="p-3 text-center">Photo</th>
                    <th className="p-3 text-left">Reg No</th>
                    <th className="p-3 text-left">Name</th>
                    <th className="p-3 text-left">Phone</th>
                    <th className="p-3 text-center">Dept</th>
                    <th className="p-3 text-left">Company</th>
                    <th className="p-3 text-left">Email</th>

                    <th className="p-3 text-center">M1</th>
                    <th className="p-3 text-center">M2</th>
                    <th className="p-3 text-center">M3</th>
                    <th className="p-3 text-center">M4</th>
                    <th className="p-3 text-center">M5</th>

                    <th className="p-3 text-center">CIE-I</th>
                    <th className="p-3 text-center">CIE-II</th>
                    <th className="p-3 text-center">CIE-III</th>

                    <th className="p-3 text-center">Actions</th>
                  </tr>
                </thead>

                {/* ================= BODY ================= */}
                <tbody>
                  {paginatedApps.map((app, index) => (
                    <tr
                      key={app._id}
                      className="border-b hover:bg-slate-50 even:bg-white transition"
                    >
                      {/* Sl No */}
                      <td className="p-3 text-center text-slate-600">
                        {(currentPage - 1) * pageSize + index + 1}
                      </td>

                      {/* Photo */}
                      <td className="p-3 text-center">
                        <img
                          src={app.image || "/default-avatar.png"}
                          alt={app.name}
                          className="h-9 w-9 rounded-full object-cover mx-auto border border-slate-300"
                        />
                      </td>

                      <td className="p-3 font-medium">{app.regNumber}</td>
                      <td className="p-3 font-semibold text-slate-800">
                        {app.name}
                      </td>
                      <td className="p-3">{app.phoneNumber}</td>

                      <td className="p-3 text-center">
                        <span className="px-2 py-0.5 text-xs rounded-full bg-slate-200 text-slate-700 font-semibold">
                          {app.department?.toUpperCase()}
                        </span>
                      </td>

                      <td className="p-3">{app.companyName}</td>
                      <td className="p-3">{app.companyEmail}</td>

                      {/* Attendance */}
                      {[1, 2, 3, 4, 5].map((m) => (
                        <td key={m} className="p-3 text-center text-slate-600">
                          {app.attendance?.[`month${m}`] ?? "-"}
                        </td>
                      ))}

                      {/* ================= CIE I ================= */}
                      <td className="p-3 text-center">
                        <div className="text-lg font-semibold text-emerald-700">
                          {app.marks?.cie1?.total ?? "-"}
                          <span className="text-xs text-slate-500"> / 80</span>
                        </div>
                        <div className="text-[11px] text-slate-500">
                          R {app.marks?.cie1?.report ?? 0} · P{" "}
                          {app.marks?.cie1?.presentation ?? 0}
                        </div>
                      </td>

                      {/* ================= CIE II ================= */}
                      <td className="p-3 text-center">
                        <div className="text-lg font-semibold text-blue-700">
                          {app.marks?.cie2?.total ?? "-"}
                          <span className="text-xs text-slate-500"> / 80</span>
                        </div>
                        <div className="text-[11px] text-slate-500">
                          R {app.marks?.cie2?.report ?? 0} · UC{" "}
                          {app.marks?.cie2?.useCase ?? 0}
                        </div>
                      </td>

                      {/* ================= CIE III ================= */}
                      <td className="p-3 text-center">
                        <div className="text-lg font-semibold text-purple-700">
                          {app.marks?.cie3?.total ?? "-"}
                          <span className="text-xs text-slate-500"> / 80</span>
                        </div>
                        <div className="text-[11px] text-slate-500">
                          R {app.marks?.cie3?.report ?? 0} · UC{" "}
                          {app.marks?.cie3?.useCase ?? 0}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="p-3 text-center">
                        <div className="flex justify-center gap-2">
                          <button
                            onClick={() => setSelected(app)}
                            className="p-2 rounded border border-blue-300 text-blue-700 hover:bg-blue-50"
                            title="View"
                          >
                            <FaEye size={12} />
                          </button>

                          <button
                            onClick={() => handleDelete(app._id)}
                            className="p-2 rounded border border-red-300 text-red-600 hover:bg-red-50"
                            title="Delete"
                          >
                            <FaTrash size={10} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* 🔹 Pagination Controls */}
            <div className="flex justify-center items-center gap-3 mt-4">
              <button
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 border rounded disabled:opacity-50 bg-gray-100 hover:bg-gray-200"
              >
                Previous
              </button>
              <span>
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() =>
                  setCurrentPage((p) => Math.min(p + 1, totalPages))
                }
                disabled={currentPage === totalPages}
                className="px-3 py-1 border rounded disabled:opacity-50 bg-gray-100 hover:bg-gray-200"
              >
                Next
              </button>
            </div>
          </>
        )}
      </div>

      {/* ✅ Single modal rendered outside the table */}
      {selected && (
        <HodReviewModal
          selected={selected}
          setSelected={setSelected}
          role="hod"
          setApps={setApps}
          getToken={getToken}
        />
      )}
    </>
  );
}
