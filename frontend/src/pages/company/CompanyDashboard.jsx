import { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "@clerk/clerk-react";
import ReviewerNavbar from "../../components/ReviewerNavbar";
import Footer from "../Footer";

export default function CompanyDashboard() {
  const { getToken } = useAuth();
  const [company, setCompany] = useState(null);
  const [applications, setApplications] = useState([]);
  const [staff, setStaff] = useState({
    principal: null,
    hod: null,
    cohort: null,
  });

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
      console.log(staffRes.data.users);
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

  const renderStaffCard = (person, role) => {
    if (!person) return null;
    return (
      <div className="bg-white shadow-md rounded-2xl p-4 flex flex-col items-center text-center hover:shadow-xl transition">
        <img
          src={person.photoUrl || "/default-avatar.png"}
          alt={person.name}
          className="h-20 w-20 rounded-full object-cover mb-3 border"
        />
        <h3 className="text-lg font-bold">{person.name}</h3>
        <p className="text-sm text-gray-500">{role}</p>
        <p className="text-sm text-gray-700">{person.email}</p>
        <p className="text-sm text-gray-700">{person.phoneNumber || "N/A"}</p>
        {role.toLowerCase() !== "principal" && (
          <span className="mt-2 inline-block bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full">
            {person.department || "General"}
          </span>
        )}
      </div>
    );
  };

  return (
    <>
      <ReviewerNavbar />
      <div className="max-w-6xl mx-auto p-6">
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
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
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

            {/* ===== Table ===== */}
            <table className="min-w-full border rounded shadow-sm overflow-hidden">
              <thead className="bg-gray-100">
                <tr>
                  <th className="border p-2">Photo</th>
                  <th className="border p-2">Roll No</th>
                  <th className="border p-2">Name</th>
                  <th className="border p-2">Phone</th>
                  <th className="border p-2">Department</th>
                  <th className="border p-2">Internal 1 (HOD)</th>
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
                    <td className="p-2 border text-center">
                      {app.marks.internal1}
                    </td>

                    {/* Internal 2 */}
                    <td className="p-2 text-center border">
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
                        Should be entered at the end of 8th week
                      </p>
                    </td>

                    {/* Internal 3 */}
                    <td className="p-2 text-center border">
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
                        Should be entered at the end of 12th week
                      </p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Save Button */}
            <button
              onClick={async () => {
                const token = await getToken();
                for (let app of applications) {
                  await axios.put(
                    `${backendUrl}/api/company/applications/${app._id}/marks`,
                    {
                      internal2: app.marks.internal2,
                      internal3: app.marks.internal3,
                    },
                    { headers: { Authorization: `Bearer ${token}` } }
                  );
                }
                alert("Marks updated successfully");
              }}
              className="mt-6 bg-blue-600 hover:bg-blue-700 text-white py-2 px-6 rounded shadow"
            >
              Save Marks
            </button>
          </>
        )}
      </div>
      <Footer />
    </>
  );
}
