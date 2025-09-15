// src/pages/Home.jsx
import { useEffect, useState } from "react";
import axios from "axios";
import Navbar from "../components/Navbar";

const DEPARTMENTS = [
  { value: "at", label: "Automobile" },
  { value: "ch", label: "Chemical" },
  { value: "ce", label: "Civil Engineering" }, // ✅ CE corrected
  { value: "cs", label: "Computer Science" },
  { value: "eee", label: "EEE" },
  { value: "me", label: "Mechanical" },
  { value: "po", label: "Polymer" },
].sort((a, b) => a.label.localeCompare(b.label)); // ✅ alphabetical

export default function Home() {
  const [applications, setApplications] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedDept, setSelectedDept] = useState("all");
  const [sortAsc, setSortAsc] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState("");

  const backendUrl = import.meta.env.VITE_BACKEND_URL;
  const pageSize = 10;

  useEffect(() => {
    const fetchApplications = async () => {
      try {
        const res = await axios.get(
          backendUrl + "/api/students/getAllApplications"
        );
        setApplications(res.data);
        setFiltered(res.data);
      } catch (err) {
        console.error("Failed to fetch applications:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchApplications();
  }, []);

  // Filtering, searching, sorting
  useEffect(() => {
    let data = [...applications];

    if (selectedDept !== "all") {
      data = data.filter((app) => app.department === selectedDept);
    }

    if (search.trim() !== "") {
      const query = search.toLowerCase();
      data = data.filter(
        (app) =>
          app.regNumber.toLowerCase().includes(query) ||
          app.name.toLowerCase().includes(query)
      );
    }

    data.sort((a, b) =>
      sortAsc
        ? a.regNumber.localeCompare(b.regNumber)
        : b.regNumber.localeCompare(a.regNumber)
    );

    setFiltered(data);
    setCurrentPage(1);
  }, [selectedDept, sortAsc, search, applications]);

  // Pagination
  const totalPages = Math.ceil(filtered.length / pageSize);
  const paginated = filtered.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

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

  return (
    <>
      {/* Navbar always visible */}
      <Navbar />

      <div className="p-6 space-y-4">
        {loading ? (
          // ✅ Loading animation
          <div className="flex flex-col items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-600 border-solid"></div>
            <p className="mt-4 text-gray-600">Fetching applications...</p>
          </div>
        ) : (
          <>
            {/* Header + filter controls */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <h2 className="text-2xl font-semibold">
                All Internship Applications
              </h2>
              <div className="flex flex-wrap gap-3">
                <select
                  value={selectedDept}
                  onChange={(e) => setSelectedDept(e.target.value)}
                  className="border rounded px-3 py-2 shadow-sm focus:ring focus:ring-blue-300"
                >
                  <option value="all">All Departments</option>
                  {DEPARTMENTS.map((d) => (
                    <option key={d.value} value={d.value}>
                      {d.label}
                    </option>
                  ))}
                </select>

                <input
                  type="text"
                  placeholder="Search by Reg No or Name"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="border rounded px-3 py-2 shadow-sm focus:ring focus:ring-blue-300"
                />

                <button
                  onClick={() => setSortAsc(!sortAsc)}
                  className="px-3 py-2 bg-blue-600 text-white rounded shadow hover:bg-blue-700"
                >
                  Sort by Reg No {sortAsc ? "↑" : "↓"}
                </button>
              </div>
            </div>

            {/* Applications table */}
            <div className="overflow-x-auto rounded-lg shadow">
              <table className="min-w-full border-collapse">
                <thead>
                  <tr className="bg-blue-50 text-left text-sm font-semibold text-gray-700">
                    <th className="p-3 border">Sl. No</th>
                    <th className="p-3 border">Reg No</th>
                    <th className="p-3 border">Name</th>
                    <th className="p-3 border">Department</th>
                    <th className="p-3 border">Phone</th>
                    <th className="p-3 border">Date</th>
                    <th className="p-3 border">Cohort Owner</th>
                    <th className="p-3 border">HOD</th>
                    <th className="p-3 border">Placement</th>
                    <th className="p-3 border">Principal</th>
                  </tr>
                </thead>
                <tbody>
                  {paginated.length > 0 ? (
                    paginated.map((app, idx) => (
                      <tr
                        key={app._id}
                        className="hover:bg-gray-50 text-sm even:bg-gray-100"
                      >
                        <td className="p-3 border">
                          {(currentPage - 1) * pageSize + idx + 1}
                        </td>
                        <td className="p-3 border">{app.regNumber}</td>
                        <td className="p-3 border">{app.name}</td>
                        <td className="p-3 border uppercase">
                          {app.department}
                        </td>
                        <td className="p-3 border">{app.phoneNumber}</td>
                        <td className="p-3 border">
                          {new Date(app.dateOfApplication).toLocaleDateString()}
                        </td>
                        <td className="p-3 border">
                          <StatusBadge status={app.cohortOwner?.status} />
                        </td>
                        <td className="p-3 border">
                          <StatusBadge status={app.hod?.status} />
                        </td>
                        <td className="p-3 border">
                          <StatusBadge status={app.placement?.status} />
                        </td>
                        <td className="p-3 border">
                          <StatusBadge status={app.principal?.status} />
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan="11"
                        className="text-center p-4 text-gray-500 italic"
                      >
                        No applications found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
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
    </>
  );
}
