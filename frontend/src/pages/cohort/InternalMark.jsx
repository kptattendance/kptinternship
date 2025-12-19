import { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "@clerk/clerk-react";
import { toast } from "react-toastify";
import ReviewerNavbar from "../../components/ReviewerNavbar";
import { FaSpinner } from "react-icons/fa";

export default function InternalMark() {
  const { getToken } = useAuth();
  const [applications, setApplications] = useState([]);
  const [filteredApps, setFilteredApps] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const backendUrl = import.meta.env.VITE_BACKEND_URL;

  // ---------------- FETCH DATA ----------------
  const fetchData = async () => {
    try {
      setLoading(true);
      const token = await getToken();

      const [appsRes, meRes] = await Promise.all([
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

        let apps = appsRes.data;
        if (user.role === "cohortOwner") {
          apps = apps.filter(
            (a) =>
              a.department?.toLowerCase() === user.department?.toLowerCase()
          );
        }

        setApplications(apps);
        setFilteredApps(apps);
      }
    } catch (err) {
      toast.error("Failed to fetch applications", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // ---------------- PERMISSIONS ----------------
  const canEditCIE1 = (app) =>
    currentUser?.role === "cohortOwner" &&
    currentUser.department?.toLowerCase() === app.department?.toLowerCase();

  const canEditCompany = () => currentUser?.role === "company";

  // ---------------- SAVE ----------------
  const handleSave = async (app) => {
    try {
      setSaving(true);
      const token = await getToken();

      await axios.put(
        `${backendUrl}/api/company/applications/${app._id}/cohortmarks`,
        {
          report: app.marks?.cie1?.report ?? 0,
          presentation: app.marks?.cie1?.presentation ?? 0,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success(`CIE-I saved for ${app.regNumber}`);
    } catch (err) {
      toast.error("Failed to save CIE-I marks", err);
    } finally {
      setSaving(false);
    }
  };

  // ---------------- SEARCH ----------------
  useEffect(() => {
    let res = [...applications];
    if (searchTerm.trim()) {
      res = res.filter(
        (a) =>
          a.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          a.regNumber.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    setFilteredApps(res);
  }, [searchTerm, applications]);

  if (loading) {
    return (
      <>
        <ReviewerNavbar />
        <div className="p-10 text-center">Loading internal marks…</div>
      </>
    );
  }

  return (
    <>
      <ReviewerNavbar />

      <div className="p-6 bg-slate-100 min-h-screen">
        <div className="mb-4 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 p-4 text-white shadow">
          <h2 className="text-xl font-bold tracking-wide">
            📊 Continuous Internal Evaluation (CIE)
          </h2>
          <p className="text-xs text-indigo-100 mt-1">
            CIE-I entered by Cohort Owner • CIE-II & III entered by Company
          </p>
        </div>

        <div className="overflow-x-auto rounded-xl border bg-white shadow-sm">
          <table className="w-full text-sm border-collapse">
            <thead className="bg-gradient-to-r from-indigo-600 to-indigo-700 text-white sticky top-0 z-10">
              <tr>
                <th className="p-3 text-center">Sl No</th>
                <th className="p-3 text-center">Photo</th>
                <th className="p-3 text-left">Reg No</th>
                <th className="p-3 text-left">Name</th>
                <th className="p-3 text-center">Dept</th>
                <th className="p-3 text-center">
                  Report (50) + presentation (30) = CIE-I (80)
                </th>
                <th className="p-3 text-center">CIE-II (80)</th>
                <th className="p-3 text-center">CIE-III (80)</th>
                <th className="p-3 text-center">Action</th>
              </tr>
            </thead>

            <tbody>
              {filteredApps.map((app, i) => (
                <tr
                  key={app._id}
                  className={`border-b ${
                    i % 2 === 0 ? "bg-white" : "bg-slate-50"
                  } hover:bg-indigo-50`}
                >
                  <td className="p-3 text-center font-medium">{i + 1}</td>
                  <td className="p-3 text-center">
                    <img
                      src={app.image || "/default-avatar.png"}
                      alt={app.name}
                      className="h-10 w-10 rounded-full object-cover mx-auto border border-indigo-300 shadow-sm"
                    />
                  </td>

                  <td className="p-3 font-medium">{app.regNumber}</td>

                  <td className="p-3 font-semibold text-gray-800">
                    {app.name}
                  </td>

                  <td className="p-3 text-center">
                    <span className="px-2 py-0.5 text-xs rounded-full bg-indigo-100 text-indigo-700 font-semibold">
                      {app.department.toUpperCase()}
                    </span>
                  </td>

                  <td className="p-3 text-center">
                    {canEditCIE1(app) ? (
                      <div className="flex gap-1 items-center justify-center">
                        {/* Report */}
                        <input
                          type="text"
                          inputMode="numeric"
                          placeholder="Report /50"
                          value={app.marks?.cie1?.report ?? ""}
                          onKeyDown={(e) => {
                            if (e.key === "ArrowDown") {
                              document
                                .querySelector(`#cie1-report-${i + 1}`)
                                ?.focus();
                            }
                          }}
                          id={`cie1-report-${i}`}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (/^\d{0,2}$/.test(val) && Number(val) <= 50) {
                              const v = Number(val || 0);
                              setFilteredApps((prev) =>
                                prev.map((a) =>
                                  a._id === app._id
                                    ? {
                                        ...a,
                                        marks: {
                                          ...a.marks,
                                          cie1: {
                                            ...a.marks.cie1,
                                            report: v,
                                            total:
                                              v +
                                              (a.marks.cie1?.presentation || 0),
                                          },
                                        },
                                      }
                                    : a
                                )
                              );
                            }
                          }}
                          className="w-24 px-2 py-1 border-2 border-blue-400
                   rounded-md text-center font-semibold text-blue-700
                   focus:ring-1 focus:ring-blue-300"
                        />

                        {/* Presentation */}
                        <input
                          type="text"
                          inputMode="numeric"
                          placeholder="Pres /30"
                          value={app.marks?.cie1?.presentation ?? ""}
                          onKeyDown={(e) => {
                            if (e.key === "ArrowDown") {
                              document
                                .querySelector(`#cie1-pres-${i + 1}`)
                                ?.focus();
                            }
                          }}
                          id={`cie1-pres-${i}`}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (/^\d{0,2}$/.test(val) && Number(val) <= 30) {
                              const v = Number(val || 0);
                              setFilteredApps((prev) =>
                                prev.map((a) =>
                                  a._id === app._id
                                    ? {
                                        ...a,
                                        marks: {
                                          ...a.marks,
                                          cie1: {
                                            ...a.marks.cie1,
                                            presentation: v,
                                            total:
                                              (a.marks.cie1?.report || 0) + v,
                                          },
                                        },
                                      }
                                    : a
                                )
                              );
                            }
                          }}
                          className="w-24 px-2 py-1 border-2 border-purple-400
                   rounded-md text-center font-semibold text-purple-700
                   focus:ring-1 focus:ring-purple-300"
                        />

                        <div className="text-[11px] font-bold text-gray-700 mt-0.5">
                          Total: {app.marks?.cie1?.total || 0} / 80
                        </div>
                      </div>
                    ) : (
                      <span className="font-bold text-indigo-700">
                        {app.marks?.cie1?.total || 0}
                      </span>
                    )}
                  </td>

                  {/* ================= CIE II ================= */}
                  <td className="p-3 text-center font-semibold text-emerald-700">
                    {app.marks?.cie2?.total || 0}
                  </td>

                  {/* ================= CIE III ================= */}
                  <td className="p-3 text-center font-semibold text-orange-700">
                    {app.marks?.cie3?.total || 0}
                  </td>

                  {/* ACTION */}
                  <td className="p-3 text-center">
                    {canEditCIE1(app) && (
                      <button
                        onClick={() => handleSave(app)}
                        className="px-4 py-1.5 text-xs rounded-md 
                       bg-green-600 hover:bg-green-700 
                       text-white font-semibold"
                      >
                        Save
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
