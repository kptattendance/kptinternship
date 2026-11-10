import React, { useEffect, useState } from "react";
import { useUser, useAuth } from "@clerk/clerk-react";
import axios from "axios";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import ReviewerNavbar from "../../components/ReviewerNavbar";
import ReviewModal from "./ReviewModal";
import { ClipboardCheck, Inbox, SearchX } from "lucide-react";
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
} from "../../components/ui";
import {
  DEPARTMENT_OPTIONS,
  INTERNSHIP_TYPE_OPTIONS,
  REVIEW_STAGES,
  ROLE_LABELS,
  workplaceLabel,
} from "../../constants";

const CARD_GRADIENTS = [
  "from-indigo-400 via-violet-400 to-pink-400",
  "from-sky-400 via-indigo-400 to-violet-400",
  "from-amber-300 via-pink-400 to-rose-400",
  "from-emerald-300 via-teal-400 to-sky-400",
];

export default function ReviewList() {
  const { user, isLoaded } = useUser();
  const { getToken } = useAuth();
  const role = user?.publicMetadata?.role || "student";
  const department = user?.publicMetadata?.department || "";

  const [loading, setLoading] = useState(false);
  const [apps, setApps] = useState([]);
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState("");

  const backendUrl = import.meta.env.VITE_BACKEND_URL;

  useEffect(() => {
    if (!isLoaded) return;
    fetchPending();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded, role]);

 const fetchPending = async () => {
  try {
    setLoading(true);

    const token = await getToken();

    const resp = await axios.get(
      `${backendUrl}/api/reviewers/list`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (resp.data?.success) {
      const applications = resp.data.data || [];

      // Sort by Register Number in ascending order
      const sortedApplications = [...applications].sort(
        (a, b) =>
          (a.regNumber || "").localeCompare(
            b.regNumber || "",
            undefined,
            {
              numeric: true,
              sensitivity: "base",
            }
          )
      );

      setApps(sortedApplications);
    } else {
      setApps([]);
    }
  } catch (err) {
    console.error(
      "Failed to fetch pending:",
      err.response?.data || err.message
    );

    toast.error("Failed to load applications");
  } finally {
    setLoading(false);
  }
};
  const [departmentFilter, setDepartmentFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [sortBy, setSortBy] = useState("reg");

  const filteredApps = apps
    .filter((app) => {
      if (departmentFilter && app.department !== departmentFilter) return false;
      if (typeFilter && app.internhsipType !== typeFilter) return false;

      const term = search.toLowerCase().trim();
      if (!term) return true;

      return (
        app.name?.toLowerCase().includes(term) ||
        app.regNumber?.toLowerCase().includes(term) ||
        app.companyName?.toLowerCase().includes(term) ||
        app.projectTitle?.toLowerCase().includes(term)
      );
    })
    .sort((a, b) =>
      sortBy === "newest"
        ? new Date(b.createdAt) - new Date(a.createdAt)
        : sortBy === "oldest"
        ? new Date(a.createdAt) - new Date(b.createdAt)
        : (a.regNumber || "").localeCompare(b.regNumber || "", undefined, {
            numeric: true,
          })
    );

  const resetFilters = () => {
    setSearch("");
    setDepartmentFilter("");
    setTypeFilter("");
    setSortBy("reg");
  };

  const title =
    role === "hod"
      ? `HOD Dashboard — ${department?.toUpperCase() || ""}`
      : `${ROLE_LABELS[role] || "Reviewer"} Dashboard`;

  return (
    <>
      <ReviewerNavbar />
      <Page>
        <PageHeader
          icon={ClipboardCheck}
          title={title}
          subtitle="Applications waiting for your review"
          actions={
            <span className="badge badge-violet text-sm">
              {apps.length} pending
            </span>
          }
        />

        <FilterBar resultCount={filteredApps.length} onReset={resetFilters}>
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Name, reg no or company"
          />
          <FilterSelect
            label="Department"
            value={departmentFilter}
            onChange={setDepartmentFilter}
            allLabel="All departments"
            options={DEPARTMENT_OPTIONS}
          />
          <FilterSelect
            label="Type"
            value={typeFilter}
            onChange={setTypeFilter}
            allLabel="Internship & project"
            options={INTERNSHIP_TYPE_OPTIONS}
          />
          <FilterSelect
            label="Sort by"
            value={sortBy}
            onChange={setSortBy}
            options={[
              { value: "reg", label: "Reg No" },
              { value: "newest", label: "Newest first" },
              { value: "oldest", label: "Oldest first" },
            ]}
          />
        </FilterBar>

        {loading ? (
          <Spinner label="Fetching applications..." />
        ) : apps.length === 0 ? (
          <EmptyState
            icon={Inbox}
            title="No pending applications"
            message="New applications will appear here automatically."
          />
        ) : filteredApps.length === 0 ? (
          <EmptyState
            icon={SearchX}
            title="No applications match your filters"
            message="Try changing the filters or the search text."
          />
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {filteredApps.map((app, idx) => (
              <div
                key={app._id}
                className={`rounded-2xl bg-gradient-to-br p-[1.5px] shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg ${
                  CARD_GRADIENTS[idx % CARD_GRADIENTS.length]
                }`}
              >
                <div className="flex h-full flex-col rounded-[15px] bg-white p-5">
                  {/* Student */}
                  <div className="flex items-start gap-3">
                    <Avatar src={app.image} name={app.name} size="h-14 w-14" />
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate text-lg font-bold text-slate-800">
                        {app.name}
                      </h3>
                      <p className="text-sm text-slate-500">
                        <span className="font-semibold uppercase">{app.department}</span>
                        {" • "}
                        {app.regNumber}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-400">
                        Applied {new Date(app.createdAt).toLocaleDateString("en-GB")}
                        {app.phoneNumber && ` • 📞 ${app.phoneNumber}`}
                      </p>
                    </div>
                  </div>

                  {app.companyName && (
                    <p className="mt-3 truncate rounded-xl bg-indigo-50 px-3 py-2 text-sm font-medium text-indigo-800">
                      {app.internhsipType === "Project" ? "🎓" : "🏢"} {workplaceLabel(app)}
                    </p>
                  )}

                  {/* Review progress */}
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    {REVIEW_STAGES.map((stage) => (
                      <div
                        key={stage.key}
                        className="flex items-center justify-between gap-2 rounded-lg bg-slate-50 px-2.5 py-1.5 text-xs text-slate-600"
                      >
                        {stage.label}
                        <StatusBadge status={app[stage.key]?.status} />
                      </div>
                    ))}
                  </div>

                  {REVIEW_STAGES.some((stage) => stage.key === role) && (
                    <button
                      type="button"
                      onClick={() => setSelected(app)}
                      className="btn btn-primary mt-5 w-full"
                    >
                      Review Application
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {selected && (
          <ReviewModal
            selected={selected}
            setSelected={setSelected}
            role={role}
            setApps={setApps}
            getToken={getToken}
          />
        )}
      </Page>
    </>
  );
}
