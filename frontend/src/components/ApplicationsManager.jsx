// src/components/ApplicationsManager.jsx
// Applications list with attendance and marks, shared by the HOD page and
// the placement / principal page (which can also delete).
import { useEffect, useMemo, useState } from "react";
import { useAuth, useUser } from "@clerk/clerk-react";
import axios from "axios";
import { toast } from "react-toastify";
import {
  ChevronLeft,
  ChevronRight,
  Eye,
  FileSpreadsheet,
  FolderOpen,
  SearchX,
  Trash2,
  X,
} from "lucide-react";
import ReviewerNavbar from "./ReviewerNavbar";
import HodReviewModal from "../pages/hod/HodReviewModal";
import {
  Avatar,
  EmptyState,
  FilterBar,
  FilterSelect,
  Page,
  PageHeader,
  SearchInput,
  Spinner,
  StatusBadge,
} from "./ui";
import {
  DEPARTMENT_OPTIONS,
  INTERNSHIP_TYPE_OPTIONS,
  REVIEW_STATUS_OPTIONS,
  overallStatus,
  workplaceLabel,
} from "../constants";
import { exportApplicationsExcel } from "../utils/exportExcel";

const SORT_OPTIONS = [
  { value: "reg-asc", label: "Reg No (ascending)" },
  { value: "reg-desc", label: "Reg No (descending)" },
  { value: "name-asc", label: "Name (A–Z)" },
  { value: "company-asc", label: "Company (A–Z)" },
  { value: "cie-desc", label: "Total marks (high → low)" },
];

const MARKS_OPTIONS = [
  { value: "complete", label: "All CIE marks entered" },
  { value: "incomplete", label: "CIE marks missing" },
];

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100].map((n) => ({
  value: String(n),
  label: `${n} per page`,
}));

const EMPTY_FILTERS = {
  search: "",
  department: "",
  type: "",
  status: "",
  marks: "",
  sort: "reg-asc",
};

const cieTotal = (app) =>
  (app.marks?.cie1?.total || 0) +
  (app.marks?.cie2?.total || 0) +
  (app.marks?.cie3?.total || 0);

const hasAllMarks = (app) =>
  ["cie1", "cie2", "cie3"].every((key) => (app.marks?.[key]?.total || 0) > 0);

function CieCell({ total, first, second, firstLabel, secondLabel, tone }) {
  return (
    <div className="text-center">
      <div className={`text-base font-bold ${tone}`}>
        {total ?? "-"}
        <span className="text-xs font-medium text-slate-400"> / 80</span>
      </div>
      <div className="text-[11px] whitespace-nowrap text-slate-500">
        {firstLabel} {first ?? 0} · {secondLabel} {second ?? 0}
      </div>
    </div>
  );
}

export default function ApplicationsManager({ canDelete = false }) {
  const { getToken } = useAuth();
  const { user } = useUser();
  const backendUrl = import.meta.env.VITE_BACKEND_URL;

  const role = user?.publicMetadata?.role;
  const userDepartment = user?.publicMetadata?.department;
  const seesAllDepartments = ["placement", "principal", "admin"].includes(role);

  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [exporting, setExporting] = useState(false);

  // Delete (placement / principal only)
  const [selectedIds, setSelectedIds] = useState([]);
  const [deletingId, setDeletingId] = useState(null);
  const [bulkDeleting, setBulkDeleting] = useState(false);

  const setFilter = (key) => (value) =>
    setFilters((prev) => ({ ...prev, [key]: value }));

  // The backend already limits HOD / cohort owner to their own department
  useEffect(() => {
    if (!role) return;

    const fetchApplications = async () => {
      try {
        setLoading(true);
        const token = await getToken();
        const res = await axios.get(`${backendUrl}/api/students/getAllApplications`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setApps(res.data);
      } catch (err) {
        console.error("❌ Failed to fetch:", err.response?.data || err.message);
        toast.error(err.response?.data?.message || "Failed to load applications");
      } finally {
        setLoading(false);
      }
    };

    fetchApplications();
  }, [getToken, role, backendUrl]);

  const filteredApps = useMemo(() => {
    const q = filters.search.toLowerCase().trim();

    const list = apps.filter((app) => {
      if (filters.department && app.department !== filters.department) return false;
      if (filters.type && app.internhsipType !== filters.type) return false;
      if (filters.status && overallStatus(app) !== filters.status) return false;
      if (filters.marks === "complete" && !hasAllMarks(app)) return false;
      if (filters.marks === "incomplete" && hasAllMarks(app)) return false;
      if (!q) return true;

      return [app.regNumber, app.name, app.companyName, app.projectTitle, app.phoneNumber].some(
        (field) => (field || "").toLowerCase().includes(q)
      );
    });

    const byText = (key) => (a, b) =>
      (a[key] || "").localeCompare(b[key] || "", undefined, { numeric: true });

    const sorters = {
      "reg-asc": byText("regNumber"),
      "reg-desc": (a, b) => byText("regNumber")(b, a),
      "name-asc": byText("name"),
      "company-asc": byText("companyName"),
      "cie-desc": (a, b) => cieTotal(b) - cieTotal(a),
    };

    return list.sort(sorters[filters.sort] || sorters["reg-asc"]);
  }, [apps, filters]);

  const totalPages = Math.max(1, Math.ceil(filteredApps.length / pageSize));

  useEffect(() => {
    setCurrentPage(1);
  }, [filters, pageSize]);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  const paginatedApps = filteredApps.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  /* ---------------- Export ---------------- */

  const handleExport = async () => {
    try {
      setExporting(true);
      await exportApplicationsExcel(filteredApps);
    } catch (err) {
      console.error("Excel export failed:", err);
      toast.error("Could not create the Excel report");
    } finally {
      setExporting(false);
    }
  };

  /* ---------------- Selection ---------------- */

  const filteredIds = filteredApps.map((app) => app._id);
  const allFilteredSelected =
    filteredIds.length > 0 && filteredIds.every((id) => selectedIds.includes(id));
  const someFilteredSelected =
    !allFilteredSelected && filteredIds.some((id) => selectedIds.includes(id));

  const toggleSelection = (id) =>
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );

  // "Select all" covers every filtered application, on all pages
  const toggleSelectAll = () =>
    setSelectedIds((prev) =>
      allFilteredSelected
        ? prev.filter((id) => !filteredIds.includes(id))
        : [...new Set([...prev, ...filteredIds])]
    );

  /* ---------------- Delete ---------------- */

  const removeFromList = (ids) => {
    setApps((prev) => prev.filter((app) => !ids.includes(app._id)));
    setSelectedIds((prev) => prev.filter((id) => !ids.includes(id)));
  };

  const handleDelete = async (app) => {
    const confirmed = window.confirm(
      `Delete this application?\n\nStudent: ${app.name}\nReg No: ${app.regNumber}\nCompany: ${
        app.companyName || "-"
      }\n\nThis cannot be undone.`
    );
    if (!confirmed) return;

    try {
      setDeletingId(app._id);
      const token = await getToken();
      await axios.delete(`${backendUrl}/api/students/deleteApplication/${app._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      removeFromList([app._id]);
      toast.success("Application deleted");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete application");
    } finally {
      setDeletingId(null);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;

    const confirmed = window.confirm(
      `Delete ${selectedIds.length} selected application(s)?\n\nThis cannot be undone.`
    );
    if (!confirmed) return;

    try {
      setBulkDeleting(true);
      const token = await getToken();

      // One request deletes all selected applications
      const res = await axios.delete(`${backendUrl}/api/students/applications/bulk-delete`, {
        headers: { Authorization: `Bearer ${token}` },
        data: { applicationIds: selectedIds },
      });

      const deletedIds = res.data.deletedIds || [];
      removeFromList(deletedIds);

      if (res.data.failedCount) {
        toast.warning(
          `${deletedIds.length} deleted. ${res.data.failedCount} could not be deleted.`
        );
      } else {
        toast.success(`${deletedIds.length} application(s) deleted`);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete selected applications");
    } finally {
      setBulkDeleting(false);
    }
  };

  /* ---------------- Render ---------------- */

  const title = seesAllDepartments
    ? "All Department Applications"
    : `Applications — ${userDepartment?.toUpperCase() || ""}`;

  return (
    <>
      <ReviewerNavbar />
      <Page className="max-w-[1600px]">
        <PageHeader
          icon={FolderOpen}
          title={title}
          subtitle={`${apps.length} applications • attendance and CIE marks`}
          actions={
            <button
              type="button"
              onClick={handleExport}
              disabled={exporting || filteredApps.length === 0}
              className="btn btn-success"
            >
              <FileSpreadsheet className="h-4 w-4" />
              {exporting ? "Preparing..." : "Export to Excel"}
            </button>
          }
        />

        <FilterBar resultCount={filteredApps.length} onReset={() => setFilters(EMPTY_FILTERS)}>
          <SearchInput
            value={filters.search}
            onChange={setFilter("search")}
            placeholder="Reg no, name, company, phone"
          />
          {seesAllDepartments && (
            <FilterSelect
              label="Department"
              value={filters.department}
              onChange={setFilter("department")}
              allLabel="All departments"
              options={DEPARTMENT_OPTIONS}
            />
          )}
          <FilterSelect
            label="Type"
            value={filters.type}
            onChange={setFilter("type")}
            allLabel="Internship & project"
            options={INTERNSHIP_TYPE_OPTIONS}
          />
          <FilterSelect
            label="Approval status"
            value={filters.status}
            onChange={setFilter("status")}
            allLabel="All statuses"
            options={REVIEW_STATUS_OPTIONS}
          />
          <FilterSelect
            label="Marks"
            value={filters.marks}
            onChange={setFilter("marks")}
            allLabel="All"
            options={MARKS_OPTIONS}
          />
          <FilterSelect
            label="Sort by"
            value={filters.sort}
            onChange={setFilter("sort")}
            options={SORT_OPTIONS}
          />
          <FilterSelect
            label="Rows"
            value={String(pageSize)}
            onChange={(v) => setPageSize(Number(v))}
            options={PAGE_SIZE_OPTIONS}
          />
        </FilterBar>

        {/* Bulk actions */}
        {canDelete && filteredApps.length > 0 && (
          <div className="card mb-4 flex flex-wrap items-center gap-2 px-4 py-3">
            <label className="flex cursor-pointer items-center gap-2 text-sm font-semibold text-slate-700">
              <input
                type="checkbox"
                checked={allFilteredSelected}
                ref={(el) => el && (el.indeterminate = someFilteredSelected)}
                onChange={toggleSelectAll}
                className="h-4 w-4 accent-indigo-600"
              />
              Select all {filteredApps.length}
            </label>
            <span className={`badge ${selectedIds.length ? "badge-violet" : "badge-slate"}`}>
              {selectedIds.length} selected
            </span>
            <div className="ml-auto flex gap-2">
              <button
                type="button"
                onClick={() => setSelectedIds([])}
                disabled={selectedIds.length === 0 || bulkDeleting}
                className="btn btn-secondary btn-sm"
              >
                <X className="h-3.5 w-3.5" /> Clear
              </button>
              <button
                type="button"
                onClick={handleBulkDelete}
                disabled={selectedIds.length === 0 || bulkDeleting}
                className="btn btn-danger btn-sm"
              >
                <Trash2 className="h-3.5 w-3.5" />
                {bulkDeleting ? "Deleting..." : `Delete selected (${selectedIds.length})`}
              </button>
            </div>
          </div>
        )}

        {loading ? (
          <Spinner label="Fetching applications..." />
        ) : filteredApps.length === 0 ? (
          <EmptyState
            icon={SearchX}
            title={apps.length ? "No applications match your filters" : "No applications yet"}
            message={apps.length ? "Try changing the filters or the search text." : undefined}
          />
        ) : (
          <>
            {/* Phones: cards */}
            <div className="space-y-3 md:hidden">
              {paginatedApps.map((app) => (
                <div
                  key={app._id}
                  className={`card p-4 ${selectedIds.includes(app._id) ? "ring-2 ring-rose-300" : ""}`}
                >
                  <div className="flex items-start gap-3">
                    {canDelete && (
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(app._id)}
                        onChange={() => toggleSelection(app._id)}
                        className="mt-1 h-4 w-4 accent-indigo-600"
                      />
                    )}
                    <Avatar src={app.image} name={app.name} size="h-12 w-12" />
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate font-bold text-slate-800">{app.name}</h3>
                      <p className="text-xs text-slate-500">
                        {app.regNumber} • <span className="uppercase">{app.department}</span>
                      </p>
                      <p className="truncate text-xs text-slate-500">{workplaceLabel(app)}</p>
                    </div>
                    <StatusBadge status={overallStatus(app)} />
                  </div>

                  <div className="mt-3 grid grid-cols-5 gap-1 text-center">
                    {[1, 2, 3, 4, 5].map((m) => (
                      <div key={m} className="rounded-lg bg-amber-50 py-1">
                        <p className="text-[10px] font-semibold text-amber-600">M{m}</p>
                        <p className="text-sm font-bold text-amber-800">
                          {app.attendance?.[`month${m}`] ?? "-"}
                        </p>
                      </div>
                    ))}
                  </div>

                  <div className="mt-2 grid grid-cols-3 gap-2 rounded-xl bg-slate-50 p-2">
                    <CieCell total={app.marks?.cie1?.total} first={app.marks?.cie1?.report} second={app.marks?.cie1?.presentation} firstLabel="R" secondLabel="P" tone="text-emerald-700" />
                    <CieCell total={app.marks?.cie2?.total} first={app.marks?.cie2?.report} second={app.marks?.cie2?.useCase} firstLabel="R" secondLabel="UC" tone="text-sky-700" />
                    <CieCell total={app.marks?.cie3?.total} first={app.marks?.cie3?.report} second={app.marks?.cie3?.useCase} firstLabel="R" secondLabel="UC" tone="text-violet-700" />
                  </div>

                  <div className="mt-3 flex gap-2">
                    <button type="button" onClick={() => setSelected(app)} className="btn btn-secondary btn-sm flex-1">
                      <Eye className="h-3.5 w-3.5" /> View
                    </button>
                    {canDelete && (
                      <button
                        type="button"
                        onClick={() => handleDelete(app)}
                        disabled={deletingId === app._id || bulkDeleting}
                        className="btn btn-danger btn-sm"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Tablets & desktops: table */}
            <div className="table-wrap hidden md:block">
              <table className="table-std">
                <thead>
                  <tr>
                    {canDelete && <th className="w-10" />}
                    <th>#</th>
                    <th>Student</th>
                    {seesAllDepartments && <th>Dept</th>}
                    <th>Phone</th>
                    <th>Company</th>
                    {[1, 2, 3, 4, 5].map((m) => (
                      <th key={m} className="text-center">M{m}</th>
                    ))}
                    <th className="text-center">CIE-I</th>
                    <th className="text-center">CIE-II</th>
                    <th className="text-center">CIE-III</th>
                    <th>Status</th>
                    <th className="text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedApps.map((app, index) => (
                    <tr
                      key={app._id}
                      className={selectedIds.includes(app._id) ? "bg-rose-50/60" : ""}
                    >
                      {canDelete && (
                        <td>
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(app._id)}
                            onChange={() => toggleSelection(app._id)}
                            className="h-4 w-4 cursor-pointer accent-indigo-600"
                          />
                        </td>
                      )}
                      <td className="text-slate-400">{(currentPage - 1) * pageSize + index + 1}</td>
                      <td>
                        <div className="flex items-center gap-3">
                          <Avatar src={app.image} name={app.name} size="h-9 w-9" />
                          <div>
                            <p className="font-semibold whitespace-nowrap text-slate-800">{app.name}</p>
                            <p className="text-xs text-slate-500">{app.regNumber}</p>
                          </div>
                        </div>
                      </td>
                      {seesAllDepartments && (
                        <td>
                          <span className="badge badge-violet uppercase">{app.department}</span>
                        </td>
                      )}
                      <td className="whitespace-nowrap">{app.phoneNumber || "-"}</td>
                      <td className="min-w-40">
                        <p className="font-medium">{workplaceLabel(app)}</p>
                        <p className="text-xs text-slate-400">{app.companyEmail}</p>
                      </td>
                      {[1, 2, 3, 4, 5].map((m) => (
                        <td key={m} className="text-center font-semibold text-amber-700">
                          {app.attendance?.[`month${m}`] ?? "-"}
                        </td>
                      ))}
                      <td><CieCell total={app.marks?.cie1?.total} first={app.marks?.cie1?.report} second={app.marks?.cie1?.presentation} firstLabel="R" secondLabel="P" tone="text-emerald-700" /></td>
                      <td><CieCell total={app.marks?.cie2?.total} first={app.marks?.cie2?.report} second={app.marks?.cie2?.useCase} firstLabel="R" secondLabel="UC" tone="text-sky-700" /></td>
                      <td><CieCell total={app.marks?.cie3?.total} first={app.marks?.cie3?.report} second={app.marks?.cie3?.useCase} firstLabel="R" secondLabel="UC" tone="text-violet-700" /></td>
                      <td><StatusBadge status={overallStatus(app)} /></td>
                      <td>
                        <div className="flex justify-center gap-2">
                          <button
                            type="button"
                            onClick={() => setSelected(app)}
                            className="btn btn-secondary btn-sm"
                            title="View application"
                          >
                            <Eye className="h-3.5 w-3.5" /> View
                          </button>
                          {canDelete && (
                            <button
                              type="button"
                              onClick={() => handleDelete(app)}
                              disabled={deletingId === app._id || bulkDeleting}
                              className="btn btn-sm border border-rose-200 bg-white text-rose-600 hover:bg-rose-50"
                              title="Delete application"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="mt-5 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                disabled={currentPage === 1}
                className="btn btn-secondary btn-sm"
              >
                <ChevronLeft className="h-4 w-4" /> Previous
              </button>
              <span className="text-sm text-slate-600">
                Page <span className="font-bold text-indigo-700">{currentPage}</span> of {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="btn btn-secondary btn-sm"
              >
                Next <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </>
        )}

        {selected && <HodReviewModal selected={selected} setSelected={setSelected} />}
      </Page>
    </>
  );
}
