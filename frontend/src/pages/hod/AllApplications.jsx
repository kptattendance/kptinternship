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

  const backendUrl = import.meta.env.VITE_BACKEND_URL;
  const hodDepartment = user?.publicMetadata?.department;

  useEffect(() => {
    const fetchApplications = async () => {
      try {
        const token = await getToken();
        const res = await axios.get(
          backendUrl + "/api/students/getAllApplications",
          { headers: { Authorization: `Bearer ${token}` } }
        );

        const filtered = res.data.filter(
          (app) => app.department === hodDepartment
        );

        setApps(filtered);
      } catch (err) {
        console.error("❌ Failed to fetch:", err.response?.data || err.message);
      } finally {
        setLoading(false);
      }
    };

    if (hodDepartment) fetchApplications();
  }, [getToken, hodDepartment]);

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

  return (
    <>
      {/* ✅ Navbar always visible */}
      <ReviewerNavbar />

      <div className="p-6">
        <h2 className="text-xl font-semibold mb-4">
          Applications ({hodDepartment?.toUpperCase()})
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
          <div className="overflow-x-auto rounded-lg shadow">
            <table className="min-w-full border-collapse text-sm">
              <thead>
                <tr className="bg-blue-50 text-left font-semibold text-gray-700">
                  <th className="p-3 border">Reg No</th>
                  <th className="p-3 border">Name</th>
                  <th className="p-3 border">Department</th>
                  <th className="p-3 border">Company</th>
                  <th className="p-3 border">Cohort Owner</th>
                  <th className="p-3 border">HOD</th>
                  <th className="p-3 border">Placement</th>
                  <th className="p-3 border">Principal</th>
                  <th className="p-3 border text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredApps.map((app) => (
                  <tr
                    key={app._id}
                    className="hover:bg-gray-50 border-b text-gray-700"
                  >
                    <td className="p-3 border">{app.regNumber}</td>
                    <td className="p-3 border">{app.name}</td>
                    <td className="p-3 border uppercase">{app.department}</td>
                    <td className="p-3 border">{app.companyName}</td>
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
                        onClick={() => setSelected(app)} // ⬅️ opens modal
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
