// src/pages/hod/AllApplications.jsx
import { useEffect, useState } from "react";
import { useAuth, useUser } from "@clerk/clerk-react";
import axios from "axios";
import ReviewerNavbar from "../../components/ReviewerNavbar"; // HOD navbar
import HodReviewModal from "./HodReviewModal";
import { FaEye, FaTrash } from "react-icons/fa";

import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
export default function AllApplications() {
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
    // ✅ Sort by Register Number
    const sortedApps = [...apps].sort((a, b) =>
      a.regNumber.localeCompare(b.regNumber)
    );

    // ================= TABLE DATA =================
    const tableData = sortedApps.map((app) => ({
      "Reg Number": app.regNumber,
      Name: app.name,
      Phone: app.phoneNumber,
      Department: app.department,
      Company: app.companyName,
      Email: app.companyEmail,

      "Month 1": app.attendance?.month1 ?? 0,
      "Month 2": app.attendance?.month2 ?? 0,
      "Month 3": app.attendance?.month3 ?? 0,
      "Month 4": app.attendance?.month4 ?? 0,
      "Month 5": app.attendance?.month5 ?? 0,

      "CIE-I Report (50)": app.marks?.cie1?.report ?? 0,
      "CIE-I Presentation (30)": app.marks?.cie1?.presentation ?? 0,
      "CIE-I Total (80)": app.marks?.cie1?.total ?? 0,

      "CIE-II Report (50)": app.marks?.cie2?.report ?? 0,
      "CIE-II Use Case (30)": app.marks?.cie2?.useCase ?? 0,
      "CIE-II Total (80)": app.marks?.cie2?.total ?? 0,

      "CIE-III Report (50)": app.marks?.cie3?.report ?? 0,
      "CIE-III Use Case (30)": app.marks?.cie3?.useCase ?? 0,
      "CIE-III Total (80)": app.marks?.cie3?.total ?? 0,
    }));

    // ================= CREATE WORKSHEET =================
    const worksheet = XLSX.utils.json_to_sheet(tableData, {
      origin: "A7", // 👈 table starts from row 7
    });

    // ================= HEADING ROWS =================
    const headings = [
      ["GOVERNMENT OF KARNATAKA"],
      ["DEPARTMENT OF COLLEGIATE AND TECHNICAL EDUCATION"],
      ["KARNATAKA (GOVT.) POLYTECHNIC, MANGALURU"],
      ["(First Autonomous Polytechnic in India from AICTE, New Delhi)"],
      ["Kadri Hills, Mangaluru – 575004, Dakshina Kannada, Karnataka"],
    ];

    XLSX.utils.sheet_add_aoa(worksheet, headings, { origin: "A1" });

    // ================= MERGE & STYLE =================
    const totalColumns = Object.keys(tableData[0] || {}).length;

    worksheet["!merges"] = headings.map((_, i) => ({
      s: { r: i, c: 0 },
      e: { r: i, c: totalColumns - 1 },
    }));

    // Column width auto-adjust
    worksheet["!cols"] = Array(totalColumns).fill({ wch: 20 });

    // ================= WORKBOOK =================
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Internship Report");

    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });

    const file = new Blob([excelBuffer], {
      type: "application/octet-stream",
    });

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

  const CieCell = ({ report, second, total }) => (
    <div className="grid grid-cols-3 h-full border border-slate-300 rounded-md overflow-hidden text-center text-xs bg-white">
      {/* Report */}
      <div className="flex flex-col justify-center border-r border-slate-200 px-2 py-1">
        <span className="text-[10px] text-slate-500 uppercase tracking-wide">
          R
        </span>
        <span className="text-sm font-semibold text-slate-800">
          {report ?? "-"}
        </span>
      </div>

      {/* Use Case / Presentation */}
      <div className="flex flex-col justify-center border-r border-slate-200 px-2 py-1">
        <span className="text-[10px] text-slate-500 uppercase tracking-wide">
          UC
        </span>
        <span className="text-sm font-semibold text-slate-800">
          {second ?? "-"}
        </span>
      </div>

      {/* Total */}
      <div className="flex flex-col justify-center px-2 py-1 bg-slate-50">
        <span className="text-[10px] text-slate-500 uppercase tracking-wide">
          T
        </span>
        <span className="text-sm font-bold text-slate-900">{total ?? "-"}</span>
        <span className="text-[9px] text-slate-500"></span>
      </div>
    </div>
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
            <div className="overflow-x-auto rounded-lg shadow">
              <table className="w-full text-sm border-collapse rounded-xl shadow-md overflow-hidden">
                <thead>
                  <tr className="bg-gradient-to-r from-[#dce7ff] to-[#eef4ff] text-gray-800">
                    <th rowSpan="2" className="p-3 border font-semibold">
                      Sl. No
                    </th>
                    <th rowSpan="2" className="p-3 border font-semibold">
                      Photo
                    </th>
                    <th rowSpan="2" className="p-3 border font-semibold">
                      Reg No
                    </th>
                    <th rowSpan="2" className="p-3 border font-semibold">
                      Name
                    </th>
                    <th rowSpan="2" className="p-3 border font-semibold">
                      Phone
                    </th>
                    {/* <th rowSpan="2" className="p-3 border font-semibold">
                      Department
                    </th> */}
                    <th rowSpan="2" className="p-3 border font-semibold">
                      Company
                    </th>
                    {/* <th rowSpan="2" className="p-3 border font-semibold">
                      Email
                    </th> */}

                    {/* Attendance Header */}
                    <th
                      colSpan="5"
                      className="p-3 border font-bold text-center tracking-wide"
                    >
                      Attendance (Monthly)
                    </th>

                    {/* Marks Header */}
                    <th
                      colSpan="3"
                      className="p-3 border font-bold text-center bg-[#e7f0ff] text-[#1d3b8b] tracking-wide"
                    >
                      Marks (Evaluation)
                    </th>

                    <th
                      rowSpan="2"
                      className="p-3 border font-semibold text-center"
                    >
                      Actions
                    </th>
                  </tr>

                  <tr className=" bg-[#e7f0ff] text-gray-600 text-center">
                    <th className="p-2 border">M1</th>
                    <th className="p-2 border">M2</th>
                    <th className="p-2 border">M3</th>
                    <th className="p-2 border">M4</th>
                    <th className="p-2 border">M5</th>

                    <th className="p-2 border">CIE 1</th>
                    <th className="p-2 border">CIE 2</th>
                    <th className="p-2 border">CIE 3</th>
                  </tr>
                </thead>

                <tbody>
                  {paginatedApps.map((app, index) => (
                    <tr
                      key={app._id}
                      className="hover:bg-slate-50 even:bg-white transition"
                    >
                      <td className="p-3 border text-center">
                        {(currentPage - 1) * pageSize + index + 1}
                      </td>

                      <td className="p-3 border text-center">
                        <img
                          src={app.image || "/default-avatar.png"}
                          className="h-12 w-12 object-cover rounded-full border shadow-sm mx-auto"
                        />
                      </td>
                      <td className="p-3 border">{app.regNumber}</td>
                      <td className="p-3 border font-medium">{app.name}</td>
                      <td className="p-3 border">{app.phoneNumber}</td>
                      {/* <td className="p-3 border uppercase">{app.department}</td> */}
                      <td className="p-3 border">{app.companyName}</td>
                      {/* <td className="p-3 border">{app.companyEmail}</td> */}
                      {[1, 2, 3, 4, 5].map((m) => (
                        <td
                          key={m}
                          className="p-3 border bg-pink-50 border-black text-center font-semibold  text-[#8a5a00] "
                        >
                          {app.attendance?.[`month${m}`] ?? "-"}
                        </td>
                      ))}
                      <td className="p-0 border align-middle">
                        <CieCell
                          report={app.marks?.cie1?.report}
                          second={app.marks?.cie1?.presentation}
                          total={app.marks?.cie1?.total}
                        />
                      </td>

                      <td className="p-3 border align-top">
                        <CieCell
                          report={app.marks?.cie2?.report}
                          second={app.marks?.cie2?.useCase}
                          total={app.marks?.cie2?.total}
                        />
                      </td>

                      <td className="p-3 border align-top">
                        <CieCell
                          report={app.marks?.cie3?.report}
                          second={app.marks?.cie3?.useCase}
                          total={app.marks?.cie3?.total}
                        />
                      </td>

                      <td className="p-3 border  gap-3 justify-center">
                        <button
                          onClick={() => setSelected(app)}
                          className="p-2 flex justify-center items-center gap-1 bg-blue-500 text-white rounded-md hover:bg-blue-700"
                        >
                          <FaEye size={12} /> View
                        </button>
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
