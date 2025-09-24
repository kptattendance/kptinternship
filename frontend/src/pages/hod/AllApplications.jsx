// src/pages/hod/AllApplications.jsx
import { useEffect, useState } from "react";
import { useAuth, useUser } from "@clerk/clerk-react";
import axios from "axios";
import ReviewerNavbar from "../../components/ReviewerNavbar"; // HOD navbar
import { toast } from "react-toastify";
import HodReviewModal from "./HodReviewModal";

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

        // 🟢 Logic:
        // principal / placement => all
        // hod / cohortOwner => filter by department
        // student => nothing
        if (role === "hod" || role === "cohortOwner") {
          data = data.filter((app) => app.department === hodDepartment);
        } else if (role === "student") {
          data = []; // students shouldn't see anything
        }
        // principal & placement see everything (no filtering)

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
              <table className="min-w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-blue-50 text-left font-semibold text-gray-700">
                    <th rowSpan="2" className="p-3 border">
                      Sl. No
                    </th>
                    <th rowSpan="2" className="p-3 border">
                      Photo
                    </th>
                    <th rowSpan="2" className="p-3 border">
                      Reg No
                    </th>
                    <th rowSpan="2" className="p-3 border">
                      Name
                    </th>
                    <th rowSpan="2" className="p-3 border">
                      Phone
                    </th>
                    <th rowSpan="2" className="p-3 border">
                      Department
                    </th>
                    <th rowSpan="2" className="p-3 border">
                      Company
                    </th>

                    {/* ✅ Grouped Marks header */}
                    <th colSpan="3" className="p-3 border text-center">
                      Marks
                    </th>

                    <th rowSpan="2" className="p-3 border">
                      Cohort Owner
                    </th>
                    <th rowSpan="2" className="p-3 border">
                      HOD
                    </th>
                    <th rowSpan="2" className="p-3 border">
                      Placement
                    </th>
                    <th rowSpan="2" className="p-3 border">
                      Principal
                    </th>
                    <th rowSpan="2" className="p-3 border text-center">
                      Actions
                    </th>
                  </tr>

                  {/* ✅ Sub-header row for marks */}
                  <tr className="bg-blue-50 text-left font-semibold text-gray-700">
                    <th className="p-3 border text-center">CIE 1</th>
                    <th className="p-3 border text-center">CIE 2</th>
                    <th className="p-3 border text-center">CIE 3</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedApps.map((app, index) => (
                    <tr
                      key={app._id}
                      className="hover:bg-gray-50 border-b text-gray-700"
                    >
                      <td className="p-3 border text-center">
                        {(currentPage - 1) * pageSize + index + 1}
                      </td>
                      <td className="p-3 border text-center">
                        {app.image ? (
                          <img
                            src={app.image}
                            alt={app.name}
                            className="h-12 w-12 object-cover rounded-full border mx-auto"
                          />
                        ) : (
                          <span className="text-gray-400 text-xs">
                            No Image
                          </span>
                        )}
                      </td>
                      <td className="p-3 border">{app.regNumber}</td>
                      <td className="p-3 border">{app.name}</td>
                      <td className="p-3 border">{app.phoneNumber}</td>
                      <td className="p-3 border uppercase">{app.department}</td>
                      <td className="p-3 border">{app.companyName}</td>

                      {/* ✅ Marks column */}
                      <td className="p-3 border text-center">
                        {app.marks?.internal1 ?? 0}
                      </td>
                      <td className="p-3 border text-center">
                        {app.marks?.internal2 ?? 0}
                      </td>
                      <td className="p-3 border text-center">
                        {app.marks?.internal3 ?? 0}
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
                      <td className="p-3 border text-right space-x-2">
                        <button
                          onClick={() => setSelected(app)}
                          className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
                        >
                          View
                        </button>
                        <button
                          onClick={() => handleDelete(app._id)}
                          className="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600"
                        >
                          Delete
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
