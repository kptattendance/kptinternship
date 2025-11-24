import { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "@clerk/clerk-react";
import ReviewerNavbar from "../../components/ReviewerNavbar";
import Footer from "../Footer";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { FaSave } from "react-icons/fa";
import AttendanceNotePanel from "./AttendanceNotePanel";

export default function CompanyDashboard() {
  const { getToken } = useAuth();
  const [company, setCompany] = useState(null);
  const [applications, setApplications] = useState([]);
  const [staff, setStaff] = useState({
    principal: null,
    hod: null,
    cohort: null,
  });
  const [savingAttendance, setSavingAttendance] = useState(false);
  const [savingMarks, setSavingMarks] = useState(false);

  const [loading, setLoading] = useState(true);
  const [showCIE, setShowCIE] = useState(false); // toggle CIE details
  const backendUrl = import.meta.env.VITE_BACKEND_URL;

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const token = await getToken();

      // Fetch company + applications
      const res = await axios.get(`${backendUrl}/api/company/dashboard`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.data.ok) {
        setCompany(res.data.company);
        setApplications(res.data.applications);
      }

      // Fetch staff (principal, hod, cohort owners)
      const staffRes = await axios.get(`${backendUrl}/api/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (staffRes.data.ok) {
        const users = staffRes.data.users;

        const principal = users.find((u) => u.role === "principal");

        const dept =
          res.data.applications[0]?.department?.toLowerCase() || null;

        const hod = dept
          ? users.find(
              (u) => u.role === "hod" && u.department?.toLowerCase() === dept
            )
          : null;

        const cohortOwners = dept
          ? users.filter(
              (u) =>
                u.role === "cohortOwner" && u.department?.toLowerCase() === dept
            )
          : [];

        setStaff({ principal, hod, cohortOwners });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const gradients = [
    "from-indigo-300 via-purple-300 to-pink-300",
    "from-emerald-300 via-teal-300 to-cyan-300",
    "from-fuchsia-200 via-rose-100 to-orange-200",
    "from-blue-100 via-sky-100 to-indigo-300",
    "from-amber-300 via-orange-300 to-rose-300",
    "from-pink-100 via-purple-300 to-violet-300",
    "from-lime-300 via-emerald-300 to-green-300",
    "from-red-300 via-pink-300 to-fuchsia-300",
  ];

  const getRandomGradient = () =>
    gradients[Math.floor(Math.random() * gradients.length)];

  const renderStaffCard = (person) => {
    if (!person) return null;

    const gradient = getRandomGradient();

    return (
      <div
        className={`
    w-full max-w-xs text-white 
    rounded-2xl shadow-lg p-5 flex flex-col items-center text-center 
    bg-gradient-to-br ${gradient} 
    transition-transform hover:scale-105 hover:shadow-2xl duration-10 
  `}
      >
        <img
          src={person.photoUrl || "/default-avatar.png"}
          alt={person.name}
          className="h-34 w-34 rounded-full object-cover border-1 border-gray-900 shadow-md mb-3"
        />

        <h3 className="text-lg text-black font-bold">{person.name}</h3>

        <p className="text-sm  text-black  opacity-90">{person.email}</p>
        <p className="text-sm  text-black  opacity-90">
          {person.phoneNumber || "N/A"}
        </p>

        <span className="mt-3 text-gray-800 bg-white/25 backdrop-blur-md px-3 py-1 text-xs font-semibold rounded-full shadow">
          {person.department || "General"}
        </span>
      </div>
    );
  };

  return (
    <>
      <ReviewerNavbar />
      <div className="max-w-9xl mx-auto p-6">
        {/* <h2 className="text-2xl font-bold mb-6">Company Dashboard</h2> */}

        {/* ===== Company Info ===== */}
        {loading ? (
          <p>Loading...</p>
        ) : (
          <>
            {company && (
              <div className="mb-8 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl shadow-md border border-blue-100">
                <h2 className="text-2xl font-bold align-center justify-center flex mb-6">
                  Company Dashboard
                </h2>
                <h2 className="text-2xl font-extrabold text-gray-800 mb-2">
                  👋 Welcome,{" "}
                  <span className="text-blue-600">{company.name}</span>
                </h2>
                <p className="text-gray-600 mb-4">
                  Here’s your company dashboard. Manage students, track their
                  progress, and update evaluations with ease.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-gray-700">
                  <div className="flex items-center gap-2">
                    <span className="text-blue-600 font-semibold">
                      📧 Email:
                    </span>
                    <span>{company.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-blue-600 font-semibold">
                      📞 Phone:
                    </span>
                    <span>{company.phoneNumber}</span>
                  </div>
                </div>
              </div>
            )}
            {/* Staff Section */}
            {/* Staff Section */}
            <div className="mb-8">
              <h2 className="text-xl font-bold mb-4">Staff Members</h2>
              <div
                className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6
"
              >
                {/* Principal */}
                {renderStaffCard(staff.principal, "Principal")}

                {/* HOD */}
                {renderStaffCard(staff.hod, "Head of Department")}

                {/* Cohort Owners */}
                {staff.cohortOwners?.map((cohort) =>
                  renderStaffCard(cohort, "Cohort Owner")
                )}
              </div>
            </div>

            {/* ===== CIE Section ===== */}
            <div className="mb-6 border border-blue-300 rounded-lg shadow bg-blue-50">
              <div
                className="flex justify-between items-center p-4 cursor-pointer"
                onClick={() => setShowCIE(!showCIE)}
              >
                <h3 className="text-lg font-semibold text-blue-800">
                  📘 Continuous Internal Evaluation (CIE) Guidelines
                </h3>
                <button className="text-sm text-blue-600 underline">
                  {showCIE ? "Hide" : "View Details"}
                </button>
              </div>

              {showCIE && (
                <div className="p-5 space-y-6 text-gray-800 text-sm leading-relaxed">
                  <p>
                    The <strong>Formative Assessment (CIE)</strong> is conducted
                    for <strong>240 marks</strong> in three phases: CIE-I,
                    CIE-II, and CIE-III. Students must complete them
                    sequentially to be eligible for the Semester End
                    Examination.
                  </p>

                  {/* CIE I */}
                  <div className="bg-white border rounded p-4 shadow-sm">
                    <h4 className="font-semibold text-blue-700 mb-2">
                      CIE-I (End of 4th Week) – 80 Marks
                    </h4>
                    <ul className="list-disc pl-6 space-y-1">
                      <li>
                        Submit a report: organization overview, vision/mission,
                        structure, roles, products, performance (50 marks)
                      </li>
                      <li>Presentation on the above (30 marks)</li>
                    </ul>
                    <p className="mt-2 text-xs text-gray-600 italic">
                      Assessed by Cohort Owner using rubrics
                    </p>
                  </div>

                  {/* CIE II */}
                  <div className="bg-white border rounded p-4 shadow-sm">
                    <h4 className="font-semibold text-blue-700 mb-2">
                      CIE-II (End of 8th Week) – 80 Marks
                    </h4>
                    <ul className="list-disc pl-6 space-y-1">
                      <li>
                        Report on OJT-1: ability, performance, and value
                        addition (50 marks)
                      </li>
                      <li>Document a Use Case (30 marks)</li>
                    </ul>
                    <p className="mt-2 text-xs text-gray-600 italic">
                      Assessed by Industrial Training Supervisor (with Cohort
                      Owner’s assistance)
                    </p>
                  </div>

                  {/* CIE III */}
                  <div className="bg-white border rounded p-4 shadow-sm">
                    <h4 className="font-semibold text-blue-700 mb-2">
                      CIE-III (End of 12th Week) – 80 Marks
                    </h4>
                    <ul className="list-disc pl-6 space-y-1">
                      <li>
                        Report on OJT-2: ability, performance, and value
                        addition (50 marks)
                      </li>
                      <li>Document another Use Case (30 marks)</li>
                    </ul>
                    <p className="mt-2 text-xs text-gray-600 italic">
                      Assessed by Industrial Training Supervisor (with Cohort
                      Owner’s assistance)
                    </p>
                  </div>
                </div>
              )}
            </div>
            <AttendanceNotePanel />

            {/* ===== Table ===== */}
            <div className="overflow-x-auto rounded-xl shadow-lg border border-gray-300 bg-white">
              <table className="min-w-full text-sm text-gray-700">
                <thead className="bg-blue-600 text-white sticky top-0 z-10">
                  <tr className="text-center">
                    <th className="p-3">Photo</th>
                    <th className="p-3">Roll No</th>
                    <th className="p-3">Name</th>
                    <th className="p-3">Phone</th>
                    <th className="p-3">Department</th>
                    <th className="p-3">1st Month Attendance</th>
                    <th className="p-3">2nd Month Attendance</th>
                    <th className="p-3">3rd Month Attendance</th>
                    <th className="p-3">4th Month Attendance</th>
                    <th className="p-3">5th Month Attendance</th>
                    <th className="p-3">Internal Mark 1</th>
                    <th className="p-3">Internal Mark 2</th>
                    <th className="p-3">Internal Mark 3</th>
                  </tr>
                </thead>

                <tbody>
                  {applications.map((app, index) => (
                    <tr
                      key={app._id}
                      className={`border-b transition-all duration-200 hover:bg-blue-50 ${
                        index % 2 === 0 ? "bg-white" : "bg-gray-50"
                      }`}
                    >
                      {/* Photo */}
                      <td className="p-3 text-center">
                        <img
                          src={app.image}
                          alt={app.name}
                          className="h-12 w-12 rounded-full mx-auto shadow"
                        />
                      </td>

                      <td className="p-3 text-center font-semibold">
                        {app.regNumber}
                      </td>
                      <td className="p-3">{app.name}</td>
                      <td className="p-3 text-center">{app.phoneNumber}</td>
                      <td className="p-3 text-center uppercase font-medium text-yellow-600">
                        {app.department}
                      </td>

                      {/* Attendance Inputs */}
                      {["month1", "month2", "month3", "month4", "month5"].map(
                        (month, idx) => (
                          <td key={month} className="p-3 text-center">
                            <input
                              type="number"
                              min="0"
                              max="30"
                              value={app.attendance[month] ?? ""}
                              onChange={(e) => {
                                const val = e.target.value;
                                if (/^\d{0,2}$/.test(val)) {
                                  setApplications((prev) =>
                                    prev.map((a) =>
                                      a._id === app._id
                                        ? {
                                            ...a,
                                            attendance: {
                                              ...a.attendance,
                                              [month]: val,
                                            },
                                          }
                                        : a
                                    )
                                  );
                                }
                              }}
                              className="w-20 px-2 py-1 border border-gray-300 rounded-lg text-center focus:ring-2 focus:ring-blue-400 outline-none transition"
                              placeholder="Days"
                            />
                            <p className="text-[10px] text-blue-500 mt-1 italic">
                              After Month {idx + 1}
                            </p>
                          </td>
                        )
                      )}

                      <td className="p-3 text-center font-semibold text-gray-700">
                        {app.marks.internal1}
                      </td>

                      {/* Internal 2 */}
                      <td className="p-3 text-center">
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
                          className="w-20 px-2 py-1 border border-gray-300 rounded-lg text-center focus:ring-2 focus:ring-blue-400 outline-none transition"
                          placeholder="Marks"
                        />
                        <p className="text-[10px] text-red-600 mt-1 italic">
                          Enter at 8th week
                        </p>
                      </td>

                      {/* Internal 3 */}
                      <td className="p-3 text-center">
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
                          className="w-20 px-2 py-1 border border-gray-300 rounded-lg text-center focus:ring-2 focus:ring-blue-400 outline-none transition"
                          placeholder="Marks"
                        />
                        <p className="text-[10px] text-red-600 mt-1 italic">
                          Enter at 12th week
                        </p>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Button Row */}
            <div className="mt-6 flex gap-4 items-center justify-center">
              {/* --- Save Attendance Button --- */}
              <button
                disabled={savingAttendance}
                onClick={async () => {
                  try {
                    setSavingAttendance(true);
                    const token = await getToken();

                    for (let app of applications) {
                      await axios.put(
                        `${backendUrl}/api/company/applications/${app._id}/attendance`,
                        {
                          month1: Number(app.attendance?.month1) || 0,
                          month2: Number(app.attendance?.month2) || 0,
                          month3: Number(app.attendance?.month3) || 0,
                          month4: Number(app.attendance?.month4) || 0,
                          month5: Number(app.attendance?.month5) || 0,
                        },
                        { headers: { Authorization: `Bearer ${token}` } }
                      );
                    }

                    toast.success("Attendance updated successfully!");
                  } catch (err) {
                    toast.error("Error saving attendance.");
                    console.error(err);
                  } finally {
                    setSavingAttendance(false);
                  }
                }}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl shadow-lg text-white transition duration-300 
      ${
        savingAttendance
          ? "bg-gray-400 cursor-not-allowed"
          : "bg-green-600 hover:bg-green-700"
      }`}
              >
                {savingAttendance ? (
                  <span className="animate-spin border-2 border-white border-t-transparent rounded-full w-5 h-5"></span>
                ) : (
                  <FaSave />
                )}
                {savingAttendance ? "Saving..." : "Save Attendance"}
              </button>

              {/* --- Save Marks Button --- */}
              <button
                disabled={savingMarks}
                onClick={async () => {
                  try {
                    setSavingMarks(true);
                    const token = await getToken();

                    for (let app of applications) {
                      await axios.put(
                        `${backendUrl}/api/company/applications/${app._id}/marks`,
                        {
                          internal2: Number(app.marks.internal2) || 0,
                          internal3: Number(app.marks.internal3) || 0,
                        },
                        { headers: { Authorization: `Bearer ${token}` } }
                      );
                    }

                    toast.success("Marks updated successfully!");
                  } catch (err) {
                    toast.error("Error updating marks.");
                    console.error(err);
                  } finally {
                    setSavingMarks(false);
                  }
                }}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl shadow-lg text-white transition duration-300
      ${
        savingMarks
          ? "bg-gray-400 cursor-not-allowed"
          : "bg-blue-600 hover:bg-blue-700"
      }`}
              >
                {savingMarks ? (
                  <span className="animate-spin border-2 border-white border-t-transparent rounded-full w-5 h-5"></span>
                ) : (
                  <FaSave />
                )}
                {savingMarks ? "Saving..." : "Save Marks"}
              </button>
            </div>
          </>
        )}
      </div>
      <Footer />
    </>
  );
}
