import { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "@clerk/clerk-react";
import { toast } from "react-toastify";
import Loader from "../Loader";
import ReviewerNavbar from "../../components/ReviewerNavbar";

export default function InternalMark() {
  const { getToken } = useAuth();
  const [applications, setApplications] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const backendUrl = import.meta.env.VITE_BACKEND_URL;

  // Fetch apps + current user
  const fetchData = async () => {
    try {
      setLoading(true);
      const token = await getToken();

      // Fetch applications
      const appRes = await axios.get(
        `${backendUrl}/api/students/getAllApplications`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (appRes.data) {
        setApplications(appRes.data);
      }

      // Fetch current logged-in user
      const meRes = await axios.get(`${backendUrl}/api/users/sync`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (meRes.data.ok) {
        setCurrentUser(meRes.data.user);
      }
    } catch (err) {
      console.error("❌ Error fetching internal mark data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Permission helpers
  const canEditInternal1 = (app) => {
    if (!currentUser) return false;
    return (
      currentUser.role === "cohortOwner" &&
      currentUser.department?.toLowerCase() === app.department?.toLowerCase()
    );
  };

  const canEditCompanyMarks = () => {
    return currentUser?.role === "company";
  };

  // Save marks
  const handleSave = async () => {
    const token = await getToken();

    for (let app of applications) {
      const payload = {};
      if (canEditInternal1(app)) {
        payload.internal1 = app.marks.internal1;
      }
      if (canEditCompanyMarks()) {
        payload.internal2 = app.marks.internal2;
        payload.internal3 = app.marks.internal3;
      }

      if (Object.keys(payload).length > 0) {
        await axios.put(
          `${backendUrl}/api/company/applications/${app._id}/cohortmarks`,
          payload,
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }
    }
    toast.success("Marks updated successfully");
  };

  if (loading) return <Loader message="Fetching internal marks..." />;

  return (
    <>
      <ReviewerNavbar />
      <div className="max-w-6xl mx-auto p-6">
        <h2 className="text-2xl font-bold mb-6">📊 Internal Marks Entry</h2>

        <table className="min-w-full border rounded shadow-sm overflow-hidden">
          <thead className="bg-gray-100">
            <tr>
              <th className="border p-2">Photo</th>
              <th className="border p-2">Roll No</th>
              <th className="border p-2">Name</th>
              <th className="border p-2">Phone</th>
              <th className="border p-2">Department</th>
              <th className="border p-2">Internal 1 (Cohort)</th>
              <th className="border p-2">Internal 2 (Company)</th>
              <th className="border p-2">Internal 3 (Company)</th>
            </tr>
          </thead>
          <tbody>
            {applications.map((app, index) => (
              <tr
                key={app._id}
                className={`${
                  index % 2 === 0 ? "bg-white" : "bg-gray-50"
                } hover:bg-blue-50 transition`}
              >
                <td className="p-2 border text-center">
                  <img
                    src={app.image}
                    alt={app.name}
                    className="h-12 w-12 rounded-full mx-auto"
                  />
                </td>
                <td className="p-2 border">{app.regNumber}</td>
                <td className="p-2 border">{app.name}</td>
                <td className="p-2 border">{app.phoneNumber}</td>
                <td className="p-2 border">{app.department}</td>

                {/* Internal 1 */}
                <td className="p-2 border text-center">
                  {canEditInternal1(app) ? (
                    <>
                      <input
                        type="text"
                        value={app.marks.internal1}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (/^\d{0,2}$/.test(val)) {
                            setApplications((prev) =>
                              prev.map((a) =>
                                a._id === app._id
                                  ? {
                                      ...a,
                                      marks: { ...a.marks, internal1: val },
                                    }
                                  : a
                              )
                            );
                          }
                        }}
                        className="w-20 px-2 py-1 border border-gray-300 rounded-md shadow-sm text-center focus:ring-2 focus:ring-blue-400 focus:outline-none"
                        placeholder="marks"
                      />
                      <p className="text-[11px] text-red-500 mt-2 italic">
                        Assess at the end of 4th week
                      </p>
                    </>
                  ) : (
                    app.marks.internal1
                  )}
                </td>

                {/* Internal 2 */}
                <td className="p-2 border text-center">
                  {canEditCompanyMarks() ? (
                    <>
                      <input
                        type="text"
                        value={app.marks.internal2}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (/^\d{0,2}$/.test(val)) {
                            setApplications((prev) =>
                              prev.map((a) =>
                                a._id === app._id
                                  ? {
                                      ...a,
                                      marks: { ...a.marks, internal2: val },
                                    }
                                  : a
                              )
                            );
                          }
                        }}
                        className="w-20 px-2 py-1 border border-gray-300 rounded-md shadow-sm text-center focus:ring-2 focus:ring-blue-400 focus:outline-none"
                        placeholder="marks"
                      />
                      <p className="text-[11px] text-red-500 mt-2 italic">
                        End of 8th week
                      </p>
                    </>
                  ) : (
                    app.marks.internal2
                  )}
                </td>

                {/* Internal 3 */}
                <td className="p-2 border text-center">
                  {canEditCompanyMarks() ? (
                    <>
                      <input
                        type="text"
                        value={app.marks.internal3}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (/^\d{0,2}$/.test(val)) {
                            setApplications((prev) =>
                              prev.map((a) =>
                                a._id === app._id
                                  ? {
                                      ...a,
                                      marks: { ...a.marks, internal3: val },
                                    }
                                  : a
                              )
                            );
                          }
                        }}
                        className="w-20 px-2 py-1 border border-gray-300 rounded-md shadow-sm text-center focus:ring-2 focus:ring-blue-400 focus:outline-none"
                        placeholder="marks"
                      />
                      <p className="text-[11px] text-red-500 mt-2 italic">
                        End of 12th week
                      </p>
                    </>
                  ) : (
                    app.marks.internal3
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Save Button */}
        <button
          onClick={handleSave}
          className="mt-6 bg-blue-600 hover:bg-blue-700 text-white py-2 px-6 rounded shadow"
        >
          Save Marks
        </button>
      </div>
    </>
  );
}
