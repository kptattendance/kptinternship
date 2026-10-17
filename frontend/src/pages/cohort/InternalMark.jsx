import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useAuth } from "@clerk/clerk-react";
import { toast } from "react-toastify";
import { Award, Loader2, Save, SearchX } from "lucide-react";
import ReviewerNavbar from "../../components/ReviewerNavbar";
import {
  Avatar,
  EmptyState,
  FilterBar,
  FilterSelect,
  Page,
  PageHeader,
  SearchInput,
  Spinner,
} from "../../components/ui";

const MARK_FILTERS = [
  { value: "entered", label: "CIE-I entered" },
  { value: "missing", label: "CIE-I not entered" },
  { value: "companyMissing", label: "Company marks missing" },
];

const SORT_OPTIONS = [
  { value: "reg", label: "Reg No" },
  { value: "name", label: "Name (A–Z)" },
  { value: "cie1-desc", label: "CIE-I (high → low)" },
  { value: "cie1-asc", label: "CIE-I (low → high)" },
];

const LIMITS = { report: 50, presentation: 30 };

const sortByRegNumber = (list) =>
  [...list].sort((a, b) =>
    (a.regNumber || "").localeCompare(b.regNumber || "", undefined, { numeric: true })
  );

export default function InternalMark() {
  const { getToken } = useAuth();
  const [applications, setApplications] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null); // which row is saving
  const [searchTerm, setSearchTerm] = useState("");
  const [markFilter, setMarkFilter] = useState("");
  const [sortBy, setSortBy] = useState("reg");

  const backendUrl = import.meta.env.VITE_BACKEND_URL;

  // ---------------- FETCH DATA ----------------
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const token = await getToken();

        // The backend already returns only the cohort owner's department
        const [appsRes, meRes] = await Promise.all([
          axios.get(`${backendUrl}/api/students/getAllApplications`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get(`${backendUrl}/api/users/sync`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        if (meRes.data.ok) setCurrentUser(meRes.data.user);
        setApplications(sortByRegNumber(appsRes.data));
      } catch (err) {
        console.error(err);
        toast.error("Failed to fetch applications");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [getToken, backendUrl]);

  // ---------------- PERMISSIONS ----------------
  const canEditCIE1 = (app) =>
    currentUser?.role === "cohortOwner" &&
    currentUser.department?.toLowerCase() === app.department?.toLowerCase();

  // ---------------- EDIT ----------------
  const updateMark = (appId, field, raw) => {
    if (!/^\d{0,2}$/.test(raw) || Number(raw) > LIMITS[field]) return;
    const value = Number(raw || 0);

    setApplications((prev) =>
      prev.map((a) => {
        if (a._id !== appId) return a;
        const cie1 = { ...a.marks?.cie1, [field]: value };
        cie1.total = (cie1.report || 0) + (cie1.presentation || 0);
        return { ...a, marks: { ...a.marks, cie1 } };
      })
    );
  };

  // Arrow keys move between rows like a spreadsheet
  const moveFocus = (e, field, index, scope) => {
    const next = e.key === "ArrowDown" ? index + 1 : e.key === "ArrowUp" ? index - 1 : null;
    if (next === null) return;
    e.preventDefault();
    document.getElementById(`${scope}-cie1-${field}-${next}`)?.focus();
  };

  // ---------------- SAVE ----------------
  const handleSave = async (app) => {
    try {
      setSavingId(app._id);
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
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to save CIE-I marks");
    } finally {
      setSavingId(null);
    }
  };

  // ---------------- FILTER ----------------
  const filteredApps = useMemo(() => {
    const q = searchTerm.toLowerCase().trim();

    const list = applications.filter((a) => {
      const cie1 = a.marks?.cie1?.total || 0;
      const company = (a.marks?.cie2?.total || 0) && (a.marks?.cie3?.total || 0);
      if (markFilter === "entered" && !cie1) return false;
      if (markFilter === "missing" && cie1) return false;
      if (markFilter === "companyMissing" && company) return false;
      if (!q) return true;
      return a.name?.toLowerCase().includes(q) || a.regNumber?.toLowerCase().includes(q);
    });

    if (sortBy === "name") return list.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
    if (sortBy === "cie1-desc")
      return list.sort((a, b) => (b.marks?.cie1?.total || 0) - (a.marks?.cie1?.total || 0));
    if (sortBy === "cie1-asc")
      return list.sort((a, b) => (a.marks?.cie1?.total || 0) - (b.marks?.cie1?.total || 0));
    return list;
  }, [applications, searchTerm, markFilter, sortBy]);

  // scope keeps the phone and desktop inputs from sharing ids
  const markInput = (app, field, index, tone, scope = "d") => (
    <input
      id={`${scope}-cie1-${field}-${index}`}
      type="text"
      inputMode="numeric"
      placeholder={`/${LIMITS[field]}`}
      aria-label={`${field} marks for ${app.regNumber}`}
      value={app.marks?.cie1?.[field] ?? ""}
      onKeyDown={(e) => moveFocus(e, field, index, scope)}
      onChange={(e) => updateMark(app._id, field, e.target.value)}
      className={`w-16 rounded-lg border-2 px-2 py-1.5 text-center font-bold focus:ring-4 focus:outline-none ${tone}`}
    />
  );

  const saveButton = (app) => (
    <button
      type="button"
      onClick={() => handleSave(app)}
      disabled={savingId === app._id}
      className="btn btn-success btn-sm"
    >
      {savingId === app._id ? (
        <>
          <Loader2 className="h-3.5 w-3.5 animate-spin" /> Saving...
        </>
      ) : (
        <>
          <Save className="h-3.5 w-3.5" /> Save
        </>
      )}
    </button>
  );

  return (
    <>
      <ReviewerNavbar />
      <Page>
        <PageHeader
          icon={Award}
          title="Continuous Internal Evaluation"
          subtitle="CIE-I (report 50 + presentation 30) is entered by you • CIE-II & III by the company"
        />

        <FilterBar
          resultCount={filteredApps.length}
          onReset={() => {
            setSearchTerm("");
            setMarkFilter("");
            setSortBy("reg");
          }}
        >
          <SearchInput value={searchTerm} onChange={setSearchTerm} placeholder="Reg no or name" />
          <FilterSelect
            label="Marks"
            value={markFilter}
            onChange={setMarkFilter}
            allLabel="All students"
            options={MARK_FILTERS}
          />
          <FilterSelect label="Sort by" value={sortBy} onChange={setSortBy} options={SORT_OPTIONS} />
        </FilterBar>

        {loading ? (
          <Spinner label="Loading internal marks..." />
        ) : filteredApps.length === 0 ? (
          <EmptyState icon={SearchX} title="No students found" message="Try changing the filters." />
        ) : (
          <>
            {/* Phones: cards */}
            <div className="space-y-3 md:hidden">
              {filteredApps.map((app, i) => (
                <div key={app._id} className="card p-4">
                  <div className="flex items-center gap-3">
                    <Avatar src={app.image} name={app.name} size="h-11 w-11" />
                    <div className="min-w-0">
                      <p className="truncate font-bold text-slate-800">{app.name}</p>
                      <p className="text-xs text-slate-500">{app.regNumber}</p>
                    </div>
                  </div>

                  {canEditCIE1(app) ? (
                    <div className="mt-3 flex flex-wrap items-center gap-3">
                      <label className="text-xs font-semibold text-slate-500">
                        Report {markInput(app, "report", i, "border-sky-300 text-sky-700 focus:ring-sky-100", "m")}
                      </label>
                      <label className="text-xs font-semibold text-slate-500">
                        Presentation {markInput(app, "presentation", i, "border-violet-300 text-violet-700 focus:ring-violet-100", "m")}
                      </label>
                      <span className="badge badge-violet">CIE-I {app.marks?.cie1?.total || 0}/80</span>
                    </div>
                  ) : (
                    <p className="mt-3 text-sm font-bold text-indigo-700">
                      CIE-I: {app.marks?.cie1?.total || 0}/80
                    </p>
                  )}

                  <div className="mt-3 flex items-center justify-between gap-2">
                    <div className="flex gap-2 text-xs">
                      <span className="badge badge-green">CIE-II {app.marks?.cie2?.total || 0}</span>
                      <span className="badge badge-amber">CIE-III {app.marks?.cie3?.total || 0}</span>
                    </div>
                    {canEditCIE1(app) && saveButton(app)}
                  </div>
                </div>
              ))}
            </div>

            {/* Tablets & desktops: table */}
            <div className="table-wrap hidden md:block">
              <table className="table-std">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Student</th>
                    <th className="text-center">Dept</th>
                    <th className="text-center">Report (50) + Presentation (30) = CIE-I (80)</th>
                    <th className="text-center">CIE-II (80)</th>
                    <th className="text-center">CIE-III (80)</th>
                    <th className="text-center">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredApps.map((app, i) => (
                    <tr key={app._id}>
                      <td className="text-slate-400">{i + 1}</td>
                      <td>
                        <div className="flex items-center gap-3">
                          <Avatar src={app.image} name={app.name} size="h-9 w-9" />
                          <div>
                            <p className="font-semibold whitespace-nowrap text-slate-800">{app.name}</p>
                            <p className="text-xs text-slate-500">{app.regNumber}</p>
                          </div>
                        </div>
                      </td>
                      <td className="text-center">
                        <span className="badge badge-violet uppercase">{app.department}</span>
                      </td>
                      <td>
                        {canEditCIE1(app) ? (
                          <div className="flex items-center justify-center gap-2">
                            {markInput(app, "report", i, "border-sky-300 text-sky-700 focus:ring-sky-100")}
                            <span className="text-slate-400">+</span>
                            {markInput(app, "presentation", i, "border-violet-300 text-violet-700 focus:ring-violet-100")}
                            <span className="text-slate-400">=</span>
                            <span className="w-14 text-center font-extrabold text-indigo-700">
                              {app.marks?.cie1?.total || 0}
                            </span>
                          </div>
                        ) : (
                          <p className="text-center font-bold text-indigo-700">{app.marks?.cie1?.total || 0}</p>
                        )}
                      </td>
                      <td className="text-center font-bold text-emerald-700">{app.marks?.cie2?.total || 0}</td>
                      <td className="text-center font-bold text-amber-700">{app.marks?.cie3?.total || 0}</td>
                      <td className="text-center">{canEditCIE1(app) && saveButton(app)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </Page>
    </>
  );
}
