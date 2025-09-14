// src/pages/students/InternshipApplicationStatus.jsx
import { useEffect, useState } from "react";
import { useAuth } from "@clerk/clerk-react";
import axios from "axios";
import StudentNavbar from "../../components/StudentNavbar";

export default function InternshipApplicationStatus() {
  const { getToken } = useAuth();
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);

  const backendUrl = import.meta.env.VITE_BACKEND_URL;
  useEffect(() => {
    const fetchMyApplications = async () => {
      try {
        const token = await getToken();
        const res = await axios.get(
          backendUrl + "/api/students/myApplications",
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (res.data.success) setApps(res.data.data);
      } catch (err) {
        console.error("❌ Failed to fetch:", err.response?.data || err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchMyApplications();
  }, [getToken]);

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

  if (loading) {
    return <div className="p-6 text-center">Loading your application…</div>;
  }

  return (
    <>
      <StudentNavbar />
      <div className="p-6">
        <h2 className="text-xl font-semibold mb-4">
          My Internship Application
        </h2>

        {apps.length === 0 ? (
          <p className="text-gray-600">
            You haven’t submitted any applications yet.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-lg shadow">
            <table className="min-w-full border-collapse">
              <thead>
                <tr className="bg-blue-50 text-left text-sm font-semibold text-gray-700">
                  <th className="p-3 border">Reg No</th>
                  <th className="p-3 border">Name</th>
                  <th className="p-3 border">Department</th>
                  <th className="p-3 border">Company</th>
                  <th className="p-3 border">Cohort Owner</th>
                  <th className="p-3 border">HOD</th>
                  <th className="p-3 border">Placement</th>
                  <th className="p-3 border">Principal</th>
                  <th className="p-3 border">Download</th>
                </tr>
              </thead>
              <tbody>
                {apps.map((app) => (
                  <tr key={app._id} className="hover:bg-gray-50 text-sm">
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
                    <td className="p-3 border">
                      {app.principal?.status === "approved" ? (
                        <a
                          href={`http://localhost:5000/api/students/download/${app._id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="bg-green-300 hover:bg-green-500 text-white px-3 py-1 rounded"
                        >
                          Download
                        </a>
                      ) : (
                        <button
                          disabled
                          className="bg-gray-400 text-white px-3 py-1 rounded"
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
        )}
      </div>
    </>
  );
}
