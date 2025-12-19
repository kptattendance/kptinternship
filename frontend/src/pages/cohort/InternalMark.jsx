import { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { useAuth } from "@clerk/clerk-react";
import { toast } from "react-toastify";
import Loader from "../Loader";
import ReviewerNavbar from "../../components/ReviewerNavbar";

export default function InternalMark() {
  const { getToken } = useAuth();
  const [applications, setApplications] = useState([]);
  const [filteredApps, setFilteredApps] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("name");

  const backendUrl = import.meta.env.VITE_BACKEND_URL;

  // Fetch applications + current user
  const fetchData = async () => {
    try {
      setLoading(true);
      const token = await getToken();

      const [appRes, meRes] = await Promise.all([
        axios.get(`${backendUrl}/api/students/getAllApplications`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get(`${backendUrl}/api/users/sync`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (meRes.data.ok) {
        const user = meRes.data.user;
        setCurrentUser(user);

        // Filter by department for cohort owners
        let apps = appRes.data;
        if (user.role === "cohortOwner" && user.department) {
          const dept = user.department.toLowerCase();
          apps = apps.filter((a) => a.department?.toLowerCase() === dept);
        }

        setApplications(apps);
        setFilteredApps(apps);
      }
    } catch (err) {
      console.error("❌ Error fetching internal mark data:", err);
      toast.error("Failed to fetch applications");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Permission helpers
  const canEditInternal1 = (app) =>
    currentUser?.role === "cohortOwner" &&
    currentUser.department?.toLowerCase() === app.department?.toLowerCase();

  const canEditCompanyMarks = () => currentUser?.role === "company";

  // Save marks
  const handleSave = async () => {
    const token = await getToken();
    try {
      for (let app of filteredApps) {
        const payload = {};
        if (canEditInternal1(app)) payload.internal1 = app.marks.internal1;
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
    } catch (err) {
      console.error("❌ Error saving marks:", err);
      toast.error("Failed to save marks");
    }
  };

  // Search + Sort
  useEffect(() => {
    let results = [...applications];

    // Search filter
    if (searchTerm.trim() !== "") {
      results = results.filter(
        (a) =>
          a.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          a.regNumber.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Sorting
    results.sort((a, b) => {
      if (sortBy === "name") return a.name.localeCompare(b.name);
      if (sortBy === "regNumber") return a.regNumber.localeCompare(b.regNumber);
      if (sortBy === "department")
        return a.department.localeCompare(b.department);
      return 0;
    });

    setFilteredApps(results);
  }, [searchTerm, sortBy, applications]);

  if (loading) return <Loader message="Fetching internal marks..." />;

  return (
    <>
      <ReviewerNavbar />

      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-6 px-3">
        <div className="max-w-7xl mx-auto">
          {/* Header Card */}
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
            <h2 className="text-2xl font-bold text-indigo-700 mb-1">
              📊 Internal Marks Entry
            </h2>
            <p className="text-sm text-gray-600">
              Enter and update internal assessment marks securely
            </p>
          </div>

          {/* Search & Sort Card */}
          <div className="bg-white rounded-xl shadow p-4 mb-6">
            <div className="flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
              <input
                type="text"
                placeholder="🔍 Search by name or roll number"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full sm:w-1/2 px-4 py-2 rounded-lg border border-gray-300 
                         focus:ring-2 focus:ring-indigo-400 focus:outline-none"
              />

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-2 rounded-lg border border-gray-300 
                         focus:ring-2 focus:ring-indigo-400 focus:outline-none"
              >
                <option value="name">Sort by Name</option>
                <option value="regNumber">Sort by Roll No</option>
                <option value="department">Sort by Department</option>
              </select>
            </div>
          </div>

          {/* Table Card */}
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-indigo-600 text-white sticky top-0">
                  <tr>
                    <th className="px-3 py-3">Photo</th>
                    <th className="px-3 py-3">Roll No</th>
                    <th className="px-3 py-3">Name</th>
                    <th className="px-3 py-3">Phone</th>
                    <th className="px-3 py-3">Dept</th>
                    <th className="px-3 py-3">Internal-1</th>
                    <th className="px-3 py-3">Internal-2</th>
                    <th className="px-3 py-3">Internal-3</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredApps.map((app, index) => (
                    <tr
                      key={app._id}
                      className={`${
                        index % 2 === 0 ? "bg-white" : "bg-indigo-50"
                      } hover:bg-indigo-100 transition`}
                    >
                      {/* Photo */}
                      <td className="px-3 py-3 text-center">
                        <img
                          src={app.image}
                          alt={app.name}
                          className="h-11 w-11 rounded-full mx-auto border shadow"
                        />
                      </td>

                      <td className="px-3 py-3 font-medium">{app.regNumber}</td>
                      <td className="px-3 py-3 font-semibold">{app.name}</td>
                      <td className="px-3 py-3">{app.phoneNumber}</td>

                      <td className="px-3 py-3">
                        <span className="px-2 py-1 rounded-full text-xs font-semibold bg-indigo-200 text-indigo-800">
                          {app.department}
                        </span>
                      </td>

                      {/* Internal 1 */}
                      <td className="px-3 py-3 text-center">
                        {canEditInternal1(app) ? (
                          <>
                            <input
                              type="text"
                              value={app.marks.internal1}
                              onChange={(e) => {
                                const val = e.target.value;
                                if (/^\d{0,2}$/.test(val)) {
                                  setFilteredApps((prev) =>
                                    prev.map((a) =>
                                      a._id === app._id
                                        ? {
                                            ...a,
                                            marks: {
                                              ...a.marks,
                                              internal1: val,
                                            },
                                          }
                                        : a
                                    )
                                  );
                                }
                              }}
                              className="w-16 px-2 py-1 rounded-md border border-indigo-300 
                                       text-center focus:ring-2 focus:ring-indigo-400"
                            />
                            <p className="text-[10px] text-indigo-600 mt-1 italic">
                              4th week
                            </p>
                          </>
                        ) : (
                          <span className="font-semibold">
                            {app.marks.internal1}
                          </span>
                        )}
                      </td>

                      {/* Internal 2 */}
                      <td className="px-3 py-3 text-center">
                        {canEditCompanyMarks() ? (
                          <>
                            <input
                              type="text"
                              value={app.marks.internal2}
                              onChange={(e) => {
                                const val = e.target.value;
                                if (/^\d{0,2}$/.test(val)) {
                                  setFilteredApps((prev) =>
                                    prev.map((a) =>
                                      a._id === app._id
                                        ? {
                                            ...a,
                                            marks: {
                                              ...a.marks,
                                              internal2: val,
                                            },
                                          }
                                        : a
                                    )
                                  );
                                }
                              }}
                              className="w-16 px-2 py-1 rounded-md border border-green-300 
                                       text-center focus:ring-2 focus:ring-green-400"
                            />
                            <p className="text-[10px] text-green-700 mt-1 italic">
                              8th week
                            </p>
                          </>
                        ) : (
                          <span className="font-semibold">
                            {app.marks.internal2}
                          </span>
                        )}
                      </td>

                      {/* Internal 3 */}
                      <td className="px-3 py-3 text-center">
                        {canEditCompanyMarks() ? (
                          <>
                            <input
                              type="text"
                              value={app.marks.internal3}
                              onChange={(e) => {
                                const val = e.target.value;
                                if (/^\d{0,2}$/.test(val)) {
                                  setFilteredApps((prev) =>
                                    prev.map((a) =>
                                      a._id === app._id
                                        ? {
                                            ...a,
                                            marks: {
                                              ...a.marks,
                                              internal3: val,
                                            },
                                          }
                                        : a
                                    )
                                  );
                                }
                              }}
                              className="w-16 px-2 py-1 rounded-md border border-orange-300 
                                       text-center focus:ring-2 focus:ring-orange-400"
                            />
                            <p className="text-[10px] text-orange-700 mt-1 italic">
                              12th week
                            </p>
                          </>
                        ) : (
                          <span className="font-semibold">
                            {app.marks.internal3}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end mt-6">
            <button
              onClick={handleSave}
              className="bg-gradient-to-r from-indigo-600 to-blue-600 
                       hover:from-indigo-700 hover:to-blue-700
                       text-white px-8 py-2 rounded-xl shadow-lg font-semibold"
            >
              💾 Save Marks
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
