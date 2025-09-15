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
        setLoading(true);
        const token = await getToken();
        const res = await axios.get(
          `${backendUrl}/api/students/myApplications`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (res.data.success) {
          setApps(res.data.data);
        } else {
          setApps([]);
        }
      } catch (err) {
        console.error("❌ Failed to fetch:", err.response?.data || err.message);
        setApps([]);
      } finally {
        setLoading(false);
      }
    };

    fetchMyApplications();
  }, [getToken, backendUrl]);

  const StatusWithComment = ({ reviewer }) => {
    if (!reviewer) return <span className="text-gray-500">Pending</span>;

    let color =
      reviewer.status === "approved"
        ? "bg-green-100 text-green-700"
        : reviewer.status === "rejected"
        ? "bg-red-100 text-red-700"
        : "bg-gray-100 text-gray-700";

    return (
      <div className="flex flex-col gap-1">
        <span className={`px-2 py-0.5 text-xs rounded font-medium ${color}`}>
          {reviewer.status
            ? reviewer.status.charAt(0).toUpperCase() + reviewer.status.slice(1)
            : "Pending"}
        </span>
        {reviewer.comment && (
          <span className="text-xs text-gray-600 italic break-words">
            “{reviewer.comment}”
          </span>
        )}
      </div>
    );
  };

  return (
    <>
      <StudentNavbar />
      <div className="p-6">
        <h2 className="text-xl font-semibold mb-4">
          My Internship Application
        </h2>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <div className="w-14 h-14 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-blue-600 font-medium animate-pulse">
              Loading your applications…
            </p>
          </div>
        ) : apps.length === 0 ? (
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
                  <tr
                    key={app._id}
                    className="hover:bg-gray-50 text-sm align-top"
                  >
                    <td className="p-3 border">{app.regNumber}</td>
                    <td className="p-3 border">{app.name}</td>
                    <td className="p-3 border uppercase">{app.department}</td>
                    <td className="p-3 border">{app.companyName}</td>
                    <td className="p-3 border">
                      <StatusWithComment reviewer={app.cohortOwner} />
                    </td>
                    <td className="p-3 border">
                      <StatusWithComment reviewer={app.hod} />
                    </td>
                    <td className="p-3 border">
                      <StatusWithComment reviewer={app.placement} />
                    </td>
                    <td className="p-3 border">
                      <StatusWithComment reviewer={app.principal} />
                    </td>
                    <td className="p-3 border">
                      {app.principal?.status === "approved" ? (
                        <a
                          href={`${backendUrl}/api/students/download/${app._id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded"
                        >
                          View / Print
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
