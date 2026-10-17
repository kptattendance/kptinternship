// src/components/homeDashboard/ApplicationsTable.jsx
import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, FileText, SearchX } from "lucide-react";
import {
  EmptyState,
  FilterBar,
  FilterSelect,
  SearchInput,
  StatusBadge,
} from "../ui";
import {
  INTERNSHIP_TYPE_OPTIONS,
  REVIEW_STAGES,
  REVIEW_STATUS_OPTIONS,
  overallStatus,
} from "../../constants";

const SORT_OPTIONS = [
  { value: "reg-asc", label: "Reg No (ascending)" },
  { value: "reg-desc", label: "Reg No (descending)" },
  { value: "name-asc", label: "Name (A–Z)" },
  { value: "date-desc", label: "Newest first" },
  { value: "date-asc", label: "Oldest first" },
];

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100].map((n) => ({
  value: String(n),
  label: `${n} per page`,
}));

const EMPTY_FILTERS = {
  department: "",
  type: "",
  status: "",
  sort: "reg-asc",
  search: "",
};

const location = (app) => app.companyTaluk || app.companyCity || "-";

export default function ApplicationsTable({ applications, departments }) {
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const setFilter = (key) => (value) =>
    setFilters((prev) => ({ ...prev, [key]: value }));

  const filtered = useMemo(() => {
    const query = filters.search.toLowerCase().trim();

    const data = applications.filter((app) => {
      if (filters.department && app.department !== filters.department) return false;
      if (
        filters.type &&
        app.internhsipType?.toLowerCase() !== filters.type.toLowerCase()
      )
        return false;
      if (filters.status && overallStatus(app) !== filters.status) return false;
      if (!query) return true;

      return [
        app.regNumber,
        app.name,
        app.companyName,
        app.companyVillage,
        app.companyCity,
        app.companyTaluk,
        app.companyDistrict,
        app.companyState,
      ].some((field) => field?.toLowerCase().includes(query));
    });

    const byReg = (a, b) =>
      (a.regNumber || "").localeCompare(b.regNumber || "", undefined, {
        numeric: true,
      });
    const byDate = (a, b) =>
      new Date(a.dateOfApplication) - new Date(b.dateOfApplication);

    const sorters = {
      "reg-asc": byReg,
      "reg-desc": (a, b) => byReg(b, a),
      "name-asc": (a, b) => (a.name || "").localeCompare(b.name || ""),
      "date-desc": (a, b) => byDate(b, a),
      "date-asc": byDate,
    };

    return data.sort(sorters[filters.sort] || byReg);
  }, [applications, filters]);

  // Back to page 1 whenever the list changes
  useEffect(() => {
    setCurrentPage(1);
  }, [filters, pageSize]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginated = filtered.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const departmentOptions = departments.map((d) => ({
    value: d.value,
    label: d.label,
  }));

  return (
    <section>
      <div className="mb-4 flex items-center gap-2">
        <FileText className="h-5 w-5 text-violet-600" />
        <h2 className="text-xl font-bold text-slate-800 sm:text-2xl">Applications</h2>
      </div>

      <FilterBar
        resultCount={filtered.length}
        onReset={() => setFilters(EMPTY_FILTERS)}
      >
        <SearchInput
          value={filters.search}
          onChange={setFilter("search")}
          placeholder="Reg No, name, company or place"
        />
        <FilterSelect
          label="Department"
          value={filters.department}
          onChange={setFilter("department")}
          allLabel="All departments"
          options={departmentOptions}
        />
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

      {paginated.length === 0 ? (
        <EmptyState
          icon={SearchX}
          title="No applications found"
          message="Try changing the filters or the search text."
        />
      ) : (
        <>
          {/* Phones: cards */}
          <div className="space-y-3 md:hidden">
            {paginated.map((app, idx) => (
              <div key={app._id} className="card p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-400">
                      #{(currentPage - 1) * pageSize + idx + 1} • {app.regNumber}
                    </p>
                    <h3 className="truncate font-bold text-slate-800">{app.name}</h3>
                    <p className="text-xs text-slate-500">
                      <span className="font-semibold uppercase">{app.department}</span>
                      {" • "}
                      {app.internhsipType || "-"}
                    </p>
                  </div>
                  <StatusBadge status={overallStatus(app)} />
                </div>

                <div className="mt-3 rounded-xl bg-slate-50 p-3 text-sm">
                  <p className="font-semibold text-slate-700">{app.companyName || "-"}</p>
                  <p className="text-xs text-slate-500">
                    {location(app)}
                    {app.stipendAmount ? ` • Stipend ₹${app.stipendAmount}` : ""}
                  </p>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2">
                  {REVIEW_STAGES.map((stage) => (
                    <div
                      key={stage.key}
                      className="flex items-center justify-between gap-2 text-xs text-slate-500"
                    >
                      {stage.label}
                      <StatusBadge status={app[stage.key]?.status} />
                    </div>
                  ))}
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
                  <th>Reg No</th>
                  <th>Name</th>
                  <th>Dept</th>
                  <th>Date</th>
                  <th>Type</th>
                  <th>Stipend</th>
                  <th>Internship Company</th>
                  <th>Location</th>
                  <th>Placed At</th>
                  {REVIEW_STAGES.map((stage) => (
                    <th key={stage.key}>{stage.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginated.map((app, idx) => (
                  <tr key={app._id}>
                    <td className="text-slate-400">
                      {(currentPage - 1) * pageSize + idx + 1}
                    </td>
                    <td className="font-semibold whitespace-nowrap">{app.regNumber}</td>
                    <td className="font-medium whitespace-nowrap text-slate-800">
                      {app.name}
                    </td>
                    <td>
                      <span className="badge badge-violet uppercase">{app.department}</span>
                    </td>
                    <td className="whitespace-nowrap">
                      {app.dateOfApplication
                        ? new Date(app.dateOfApplication).toLocaleDateString("en-GB")
                        : "-"}
                    </td>
                    <td>{app.internhsipType || "-"}</td>
                    <td>{app.stipendAmount ? `₹${app.stipendAmount}` : "-"}</td>
                    <td className="min-w-40">{app.companyName || "-"}</td>
                    <td>{location(app)}</td>
                    <td>{app.PlacedCompany || "-"}</td>
                    {REVIEW_STAGES.map((stage) => (
                      <td key={stage.key}>
                        <StatusBadge status={app[stage.key]?.status} />
                      </td>
                    ))}
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
              Page <span className="font-bold text-indigo-700">{currentPage}</span> of{" "}
              {totalPages}
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
    </section>
  );
}
