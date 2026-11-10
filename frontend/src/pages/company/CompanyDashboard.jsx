import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useAuth } from "@clerk/clerk-react";
import ReviewerNavbar from "../../components/ReviewerNavbar";
import Footer from "../Footer";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { FaSave } from "react-icons/fa";
import AttendanceNotePanel from "./AttendanceNotePanel";
import { Briefcase, CalendarCheck, Mail, Phone, SearchX, Users } from "lucide-react";
import {
  Avatar,
  EmptyState,
  FilterBar,
  FilterSelect,
  Page,
  PageHeader,
  SearchInput,
  Spinner,
  StatCard,
} from "../../components/ui";
import { DEPARTMENT_OPTIONS } from "../../constants";

export default function CompanyDashboard() {
  const { getToken } = useAuth();
  const [company, setCompany] = useState(null);
  const [applications, setApplications] = useState([]);
  const [staff, setStaff] = useState({
    principal: null,
    hods: [],
    cohortOwners: [],
  });

  const [savingAttendance, setSavingAttendance] = useState(false);
  const [savingMarks, setSavingMarks] = useState(false);

  const [loading, setLoading] = useState(true);
  const [isGuide, setIsGuide] = useState(false);
  const [showCIE, setShowCIE] = useState(false); // toggle CIE details
  const [search, setSearch] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("");

  // Filters only change what is shown — "Save" still saves every student
  const filteredApplications = useMemo(() => {
    const q = search.toLowerCase().trim();
    return applications.filter(
      (a) =>
        (!departmentFilter || a.department === departmentFilter) &&
        (!q ||
          a.name?.toLowerCase().includes(q) ||
          a.regNumber?.toLowerCase().includes(q))
    );
  }, [applications, search, departmentFilter]);

  const departmentOptions = DEPARTMENT_OPTIONS.filter((o) =>
    applications.some((a) => a.department === o.value)
  );
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
        setIsGuide(Boolean(res.data.isGuide));
      }

      // Staff guides are college staff themselves — the college contacts
      // section is only for companies
      if (res.data.isGuide) return;

      // Fetch staff (principal, hod, cohort owners)
      const staffRes = await axios.get(`${backendUrl}/api/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const departments = [
        ...new Set(
          res.data.applications
            .map((a) => a.department?.toLowerCase())
            .filter(Boolean)
        ),
      ];
      if (staffRes.data.ok) {
        const users = staffRes.data.users;

        const principal = users.find((u) => u.role === "principal");

        const hods = users.filter(
          (u) =>
            u.role?.toLowerCase() === "hod" &&
            departments.includes(u.department?.toLowerCase())
        );
        const cohortOwners = users.filter(
          (u) =>
            u.role?.toLowerCase() === "cohortowner" &&
            departments.includes(u.department?.toLowerCase())
        );
        setStaff({
          principal,
          hods,
          cohortOwners,
        });
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

  const renderStaffCard = (person, compact = false) => {
    if (!person) return null;

    const gradient =
      gradients[
        person.department
          ? person.department.charCodeAt(0) % gradients.length
          : 0
      ];

    return (
      <div
        className={`
        rounded-2xl shadow-md 
        bg-gradient-to-br ${gradient}
        flex flex-col items-center text-center
        transition hover:scale-[1.03] hover:shadow-xl
        ${compact ? "w-44 p-4" : "w-56 p-6"}
      `}
      >
        <img loading="lazy" decoding="async"
          src={person.photoUrl || "/default-avatar.svg"}
          alt={person.name}
          className={`rounded-full object-cover border-2 border-white shadow
          ${compact ? "h-16 w-16" : "h-20 w-20"}
        `}
        />

        <h3 className="mt-3 text-sm font-bold text-gray-900">{person.name}</h3>

        <p className="text-[11px] text-gray-800 truncate w-full">
          {person.email}
        </p>

        <p className="text-[11px] text-gray-800">{person.phoneNumber || "—"}</p>

        <span
          className="mt-2 px-3 py-0.5 text-[10px] rounded-full 
        bg-white/70 text-gray-800 font-semibold"
        >
          {person.department?.toUpperCase() || "GEN"}
        </span>
      </div>
    );
  };

  const saveCompanyMarks = async () => {
    try {
      setSavingMarks(true);
      const token = await getToken();

      // Save every student's marks in a single request
      await axios.put(
        `${backendUrl}/api/company/applications/company-marks`,
        {
          applications: applications.map((app) => ({
            _id: app._id,
            cie2: app.marks.cie2,
            cie3: app.marks.cie3,
          })),
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      toast.success("✅ Company CIE marks saved successfully");
    } catch (err) {
      console.error(err);
      toast.error("❌ Failed to save company marks");
    } finally {
      setSavingMarks(false);
    }
  };

  // ================= SAVE ATTENDANCE =================
  const handleSaveAttendance = async () => {
    try {
      setSavingAttendance(true);
      const token = await getToken();

      // Save every student's attendance in a single request
      await axios.put(
        `${backendUrl}/api/company/applications/attendance`,
        {
          applications: applications.map((app) => ({
            _id: app._id,
            month1: Number(app.attendance?.month1) || 0,
            month2: Number(app.attendance?.month2) || 0,
            month3: Number(app.attendance?.month3) || 0,
            month4: Number(app.attendance?.month4) || 0,
            month5: Number(app.attendance?.month5) || 0,
          })),
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      toast.success("✅ Attendance updated successfully!");
    } catch (err) {
      console.error("Attendance save error:", err);
      toast.error("❌ Error saving attendance");
    } finally {
      setSavingAttendance(false);
    }
  };

  return (
    <>
      <ReviewerNavbar />
      <Page className="max-w-[1600px]">
        {loading ? (
          <Spinner label="Loading dashboard..." />
        ) : (
          <>
            {company && (
              <>
                <PageHeader
                  icon={Briefcase}
                  title={isGuide ? "My Students (Guide)" : `Welcome, ${company.name}`}
                  subtitle={
                    isGuide
                      ? "Students who chose you as their project guide — enter monthly attendance and CIE-II / CIE-III marks"
                      : "Track your interns, enter monthly attendance and CIE-II / CIE-III marks"
                  }
                >
                  <div className="mt-3 flex flex-wrap gap-2 text-sm">
                    {company.email && (
                      <span className="badge badge-blue">
                        <Mail className="h-3.5 w-3.5" /> {company.email}
                      </span>
                    )}
                    {company.phoneNumber && (
                      <span className="badge badge-violet">
                        <Phone className="h-3.5 w-3.5" /> {company.phoneNumber}
                      </span>
                    )}
                  </div>
                </PageHeader>

                <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <StatCard label="Interns" value={applications.length} icon={Users} tone="indigo" />
                  <StatCard
                    label="CIE-II entered"
                    value={applications.filter((a) => a.marks?.cie2?.total > 0).length}
                    icon={CalendarCheck}
                    tone="amber"
                  />
                  <StatCard
                    label="CIE-III entered"
                    value={applications.filter((a) => a.marks?.cie3?.total > 0).length}
                    icon={CalendarCheck}
                    tone="emerald"
                  />
                </div>
              </>
            )}

            <FilterBar
              resultCount={filteredApplications.length}
              onReset={() => {
                setSearch("");
                setDepartmentFilter("");
              }}
            >
              <SearchInput value={search} onChange={setSearch} placeholder="Reg no or name" />
              <FilterSelect
                label="Department"
                value={departmentFilter}
                onChange={setDepartmentFilter}
                allLabel="All departments"
                options={departmentOptions}
              />
            </FilterBar>

            <div className="mb-4 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 px-5 py-3 text-center text-sm font-semibold text-white shadow-md">
              🏭 Enter monthly attendance and Internal-2 & Internal-3 marks, then press Save below
            </div>

            {filteredApplications.length === 0 ? (
              <EmptyState
                icon={SearchX}
                title={applications.length ? "No students match your filters" : "No interns yet"}
                message={
                  applications.length
                    ? "Try changing the filters."
                    : isGuide
                    ? "Students who choose you as their project guide will appear here."
                    : "Students who list your company email will appear here."
                }
              />
            ) : (
            <div className="table-wrap">
              <table className="min-w-full text-sm text-slate-700">
                <thead className="sticky top-0 z-10">
                  <tr className="text-center text-xs font-bold tracking-wide text-white uppercase">
                    <th className="bg-indigo-600 p-3 text-left" colSpan="2">Student</th>
                    <th className="bg-indigo-600 p-3">Phone</th>
                    <th className="bg-indigo-600 p-3">Dept</th>

                    {/* Attendance */}
                    {[1, 2, 3, 4, 5].map((m) => (
                      <th key={m} className="bg-emerald-600 p-3">Month-{m}</th>
                    ))}

                    {/* Internal 1 */}
                    <th className="bg-violet-600 p-3">
                      Internal Mark-1 <br />
                      <span className="text-[10px] font-normal normal-case">(College)</span>
                    </th>

                    {/* Company marks */}
                    <th className="bg-orange-600 p-3">
                      Internal Mark-2 <br />
                      <span className="text-[10px] font-normal normal-case">(Company)</span>
                    </th>
                    <th className="bg-orange-600 p-3">
                      Internal Mark-3 <br />
                      <span className="text-[10px] font-normal normal-case">(Company)</span>
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {filteredApplications.map((app, index) => (
                    <tr
                      key={app._id}
                      className={`border-b hover:bg-slate-50 transition ${
                        index % 2 === 0 ? "bg-white" : "bg-gray-50"
                      }`}
                    >
                      {/* Student */}
                      <td className="p-3">
                        <Avatar src={app.image} name={app.name} size="h-10 w-10" />
                      </td>
                      <td className="p-3">
                        <p className="font-semibold whitespace-nowrap text-slate-800">{app.name}</p>
                        <p className="text-xs text-slate-500">{app.regNumber}</p>
                      </td>
                      <td className="p-3 text-center">{app.phoneNumber}</td>
                      <td className="p-3 text-center font-semibold uppercase text-slate-600">
                        {app.department}
                      </td>

                      {/* Attendance Inputs (GREEN) */}
                      {["month1", "month2", "month3", "month4", "month5"].map(
                        (month, idx) => (
                          <td
                            key={month}
                            className="p-3 text-center bg-emerald-50"
                          >
                            <input
                              type="text"
                              inputMode="numeric"
                              min="0"
                              max="30"
                              value={app.attendance?.[month] ?? ""}
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
                              className="w-16 px-2 py-1 
                  border border-emerald-300 rounded-lg 
                  text-center bg-white 
                  focus:ring-2 focus:ring-emerald-400 outline-none"
                            />
                            <p className="text-[10px] text-emerald-600 italic mt-1">
                              No of Classes Present in Month {idx + 1}
                            </p>
                          </td>
                        )
                      )}

                      {/* ===== CIE-I (READ ONLY – SAME LAYOUT AS CIE-II) ===== */}
                      <td className="p-3 text-center bg-purple-50 border-r-4 border-purple-300">
                        <div className="flex flex-col gap-2 items-center">
                          {/* Top two boxes (same as company) */}
                          <div className="flex gap-3">
                            {/* Report (50) */}
                            <div
                              className="w-16 px-2 py-1 border-2 border-purple-400 rounded-lg
                   text-center font-bold text-purple-700 bg-white"
                            >
                              {app.marks?.cie1?.report ?? 0}
                            </div>

                            {/* Presentation (30) */}
                            <div
                              className="w-16 px-2 py-1 border-2 border-purple-400 rounded-lg
                   text-center font-bold text-purple-700 bg-white"
                            >
                              {app.marks?.cie1?.presentation ?? 0}
                            </div>
                          </div>

                          {/* Total */}
                          <div className="text-sm font-bold text-purple-800">
                            Total: {app.marks?.cie1?.total ?? 0} / 80
                          </div>

                          {/* Footer label */}
                          <p className="text-[10px] text-purple-600 italic">
                            CIE-I (4th Week)
                          </p>
                        </div>
                      </td>

                      {/* ===== CIE-II (Company) ===== */}
                      <td className="p-3 text-center bg-amber-50 border-l-4 border-orange-300">
                        <div className="flex gap-2 items-center justify-center">
                          {/* Report (50) */}
                          <input
                            type="text"
                            inputMode="numeric"
                            placeholder="Rpt /50"
                            value={app.marks?.cie2?.report ?? ""}
                            onChange={(e) => {
                              const val = e.target.value;
                              if (/^\d{0,2}$/.test(val) && Number(val) <= 50) {
                                const v = Number(val || 0);
                                setApplications((prev) =>
                                  prev.map((a) =>
                                    a._id === app._id
                                      ? {
                                          ...a,
                                          marks: {
                                            ...a.marks,
                                            cie2: {
                                              ...a.marks.cie2,
                                              report: v,
                                              total:
                                                v +
                                                (a.marks.cie2?.useCase || 0),
                                            },
                                          },
                                        }
                                      : a
                                  )
                                );
                              }
                            }}
                            className="w-16 px-2 py-1 border-2 border-orange-400 rounded-lg
                 text-center font-semibold text-orange-700"
                          />

                          {/* Use Case (30) */}
                          <input
                            type="text"
                            inputMode="numeric"
                            placeholder="UC /30"
                            value={app.marks?.cie2?.useCase ?? ""}
                            onChange={(e) => {
                              const val = e.target.value;
                              if (/^\d{0,2}$/.test(val) && Number(val) <= 30) {
                                const v = Number(val || 0);
                                setApplications((prev) =>
                                  prev.map((a) =>
                                    a._id === app._id
                                      ? {
                                          ...a,
                                          marks: {
                                            ...a.marks,
                                            cie2: {
                                              ...a.marks.cie2,
                                              useCase: v,
                                              total:
                                                (a.marks.cie2?.report || 0) + v,
                                            },
                                          },
                                        }
                                      : a
                                  )
                                );
                              }
                            }}
                            className="w-16 px-2 py-1 border-2 border-orange-400 rounded-lg
                 text-center font-semibold text-orange-700"
                          />
                        </div>

                        {/* Total */}
                        <div className="mt-1 text-sm font-bold text-orange-800">
                          Total: {app.marks?.cie2?.total || 0} / 80
                        </div>

                        {/* Label */}
                        <p className="text-[10px] text-orange-600 italic">
                          CIE-II (8th Week)
                        </p>
                      </td>

                      {/* ===== CIE-III (Company) ===== */}
                      <td className="p-3 text-center bg-amber-50 border-r-4 border-orange-300">
                        <div className="flex gap-2 items-center justify-center">
                          {/* Report (50) */}
                          <input
                            type="text"
                            inputMode="numeric"
                            placeholder="Rpt /50"
                            value={app.marks?.cie3?.report ?? ""}
                            onChange={(e) => {
                              const val = e.target.value;
                              if (/^\d{0,2}$/.test(val) && Number(val) <= 50) {
                                const v = Number(val || 0);
                                setApplications((prev) =>
                                  prev.map((a) =>
                                    a._id === app._id
                                      ? {
                                          ...a,
                                          marks: {
                                            ...a.marks,
                                            cie3: {
                                              ...a.marks.cie3,
                                              report: v,
                                              total:
                                                v +
                                                (a.marks.cie3?.useCase || 0),
                                            },
                                          },
                                        }
                                      : a
                                  )
                                );
                              }
                            }}
                            className="w-16 px-2 py-1 border-2 border-orange-400 rounded-lg
                 text-center font-semibold text-orange-700"
                          />

                          {/* Use Case (30) */}
                          <input
                            type="text"
                            inputMode="numeric"
                            placeholder="UC /30"
                            value={app.marks?.cie3?.useCase ?? ""}
                            onChange={(e) => {
                              const val = e.target.value;
                              if (/^\d{0,2}$/.test(val) && Number(val) <= 30) {
                                const v = Number(val || 0);
                                setApplications((prev) =>
                                  prev.map((a) =>
                                    a._id === app._id
                                      ? {
                                          ...a,
                                          marks: {
                                            ...a.marks,
                                            cie3: {
                                              ...a.marks.cie3,
                                              useCase: v,
                                              total:
                                                (a.marks.cie3?.report || 0) + v,
                                            },
                                          },
                                        }
                                      : a
                                  )
                                );
                              }
                            }}
                            className="w-16 px-2 py-1 border-2 border-orange-400 rounded-lg
                 text-center font-semibold text-orange-700"
                          />
                        </div>

                        {/* Total */}
                        <div className="mt-1 text-sm font-bold text-orange-800">
                          Total: {app.marks?.cie3?.total || 0} / 80
                        </div>

                        {/* Label */}
                        <p className="text-[10px] text-orange-600 italic">
                          CIE-III (12th Week)
                        </p>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            )}

            {/* ===== ACTION BUTTONS ===== */}
            <div className="mt-8 mb-4 flex flex-wrap gap-6 justify-center">
              <button
                disabled={savingAttendance}
                onClick={handleSaveAttendance}
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

              <button
                onClick={saveCompanyMarks}
                disabled={savingMarks}
                className={`px-7 py-3 rounded-xl text-white font-semibold shadow-lg transition
${savingMarks ? "bg-gray-400" : "bg-orange-600 hover:bg-orange-700"}`}
              >
                {savingMarks ? "Saving..." : "Save Company Marks"}
              </button>
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

            <div className="mb-10 flex flex-col items-center">
              <h2
                className="text-2xl font-extrabold mb-8
    bg-gradient-to-r from-indigo-600 to-purple-600
    text-transparent bg-clip-text flex items-center gap-2"
              >
                👥 Staff Members
              </h2>

              {/* ===== Principal ===== */}
              {staff.principal && (
                <div className="mb-10 text-center">
                  <h3 className="text-sm font-semibold text-gray-600 mb-4">
                    Principal
                  </h3>
                  <div className="flex justify-center">
                    {renderStaffCard(staff.principal)}
                  </div>
                </div>
              )}

              {/* ===== HODs ===== */}
              {staff.hods?.length > 0 && (
                <div className="mb-10 w-full text-center">
                  <h3 className="text-sm font-semibold text-gray-600 mb-4">
                    Heads of Departments
                  </h3>

                  <div className="flex justify-center">
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-5">
                      {staff.hods.map((hod) => (
                        <div key={hod._id}>{renderStaffCard(hod, true)}</div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* ===== Cohort Owners ===== */}
              {staff.cohortOwners?.length > 0 && (
                <div className="w-full text-center">
                  <h3 className="text-sm font-semibold text-gray-600 mb-4">
                    Cohort Owners
                  </h3>

                  <div className="flex justify-center">
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
                      {staff.cohortOwners.map((cohort) => (
                        <div key={cohort._id}>
                          {renderStaffCard(cohort, true)}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </Page>
      <Footer />
    </>
  );
}
