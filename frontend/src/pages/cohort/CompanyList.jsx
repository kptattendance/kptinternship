import React, { useEffect, useState } from "react";
import axios from "axios";
import { useAuth, useUser } from "@clerk/clerk-react";
import { Building, Trash2, X } from "lucide-react";
import { Avatar, EmptyState, FilterBar, FilterSelect, SearchInput, Spinner } from "../../components/ui";
import { DEPARTMENT_OPTIONS } from "../../constants";

const SORT_OPTIONS = [
  { value: "newest", label: "Newest first" },
  { value: "name", label: "Name (A–Z)" },
  { value: "oldest", label: "Oldest first" },
];

const CompanyList = ({ refreshKey }) => {
  const { getToken } = useAuth();
  const { user, isLoaded } = useUser();

  const [companies, setCompanies] = useState([]);
  const [search, setSearch] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [selectedCompanies, setSelectedCompanies] = useState([]);

  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [bulkDeleting, setBulkDeleting] = useState(false);

  const backendUrl = import.meta.env.VITE_BACKEND_URL;

  const canDelete = [
    "placement",
    "principal",
    "admin",
  ].includes(user?.publicMetadata?.role);

  /* ================= FETCH COMPANIES ================= */

  const fetchCompanies = async () => {
    try {
      setLoading(true);

      const token = await getToken();

      const res = await axios.get(
        `${backendUrl}/api/company`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (res.data.ok) {
        setCompanies(res.data.companies || []);
      }
    } catch (err) {
      console.error("Failed to load companies:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isLoaded) {
      fetchCompanies();
    }
  }, [refreshKey, isLoaded]);

  if (!isLoaded) return null;

  /* ================= FILTER ================= */

  const filteredCompanies = companies
    .filter((company) => {
    const searchText = search.toLowerCase();

    const searchMatch =
      (company.name || "")
        .toLowerCase()
        .includes(searchText) ||
      (company.email || "")
        .toLowerCase()
        .includes(searchText) ||
      (company.phoneNumber || "")
        .toLowerCase()
        .includes(searchText);

    const departments = company.departments || [];

    const deptMatch =
      !departmentFilter ||
      departments.includes(departmentFilter);

    return searchMatch && deptMatch;
  })
    .sort((a, b) =>
      sortBy === "name"
        ? (a.name || "").localeCompare(b.name || "")
        : sortBy === "oldest"
        ? new Date(a.createdAt) - new Date(b.createdAt)
        : new Date(b.createdAt) - new Date(a.createdAt)
    );

  /* ================= SELECTION ================= */

  const filteredIds = filteredCompanies.map(
    (company) => company._id
  );

  const allSelected =
    filteredCompanies.length > 0 &&
    filteredCompanies.every((company) =>
      selectedCompanies.includes(company._id)
    );

  const someSelected =
    selectedCompanies.length > 0 && !allSelected;

  const toggleCompanySelection = (companyId) => {
    setSelectedCompanies((prev) => {
      if (prev.includes(companyId)) {
        return prev.filter((id) => id !== companyId);
      }

      return [...prev, companyId];
    });
  };

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedCompanies((prev) =>
        prev.filter((id) => !filteredIds.includes(id))
      );
    } else {
      setSelectedCompanies((prev) => [
        ...new Set([...prev, ...filteredIds]),
      ]);
    }
  };

  const clearSelection = () => {
    setSelectedCompanies([]);
  };

  /* ================= SINGLE DELETE ================= */

  const handleDelete = async (companyId, companyName) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete ${
        companyName || "this company"
      }?\n\nThis action cannot be undone.`
    );

    if (!confirmed) return;

    try {
      setDeletingId(companyId);

      const token = await getToken();

      await axios.delete(
        `${backendUrl}/api/company/${companyId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setSelectedCompanies((prev) =>
        prev.filter((id) => id !== companyId)
      );

      await fetchCompanies();
    } catch (err) {
      console.error("Delete failed:", err);

      alert(
        err.response?.data?.message ||
          "Failed to delete company"
      );
    } finally {
      setDeletingId(null);
    }
  };

  /* ================= BULK DELETE ================= */

  const handleBulkDelete = async () => {
    if (selectedCompanies.length === 0) {
      return;
    }

    const count = selectedCompanies.length;

    const confirmed = window.confirm(
      `Are you sure you want to delete ${count} selected ${
        count === 1 ? "company" : "companies"
      }?\n\nThis action cannot be undone.`
    );

    if (!confirmed) return;

    try {
      setBulkDeleting(true);

      const token = await getToken();

      /*
       * Uses the existing DELETE /api/company/:id
       * endpoint for each selected company.
       */
      const results = await Promise.allSettled(
        selectedCompanies.map((companyId) =>
          axios.delete(
            `${backendUrl}/api/company/${companyId}`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          )
        )
      );

      const successful = results.filter(
        (result) => result.status === "fulfilled"
      ).length;

      const failed = results.length - successful;

      if (failed === 0) {
        alert(
          `${successful} ${
            successful === 1
              ? "company"
              : "companies"
          } deleted successfully.`
        );
      } else {
        alert(
          `${successful} deleted successfully.\n${failed} could not be deleted.`
        );
      }

      setSelectedCompanies([]);

      await fetchCompanies();
    } catch (err) {
      console.error("Bulk delete failed:", err);

      alert(
        err.response?.data?.message ||
          "Failed to delete selected companies"
      );
    } finally {
      setBulkDeleting(false);
    }
  };

  /* ================= RENDER ================= */

  const isSelected = (company) => selectedCompanies.includes(company._id);

  const deleteButton = (company) => (
    <button
      type="button"
      onClick={() => handleDelete(company._id, company.name)}
      disabled={deletingId === company._id || bulkDeleting}
      className="btn btn-sm border border-rose-200 bg-white text-rose-600 hover:bg-rose-50"
    >
      <Trash2 className="h-3.5 w-3.5" />
      {deletingId === company._id ? "Deleting..." : "Delete"}
    </button>
  );

  const departmentBadges = (company) =>
    (company.departments || []).length > 0 ? (
      <div className="flex flex-wrap gap-1">
        {company.departments.map((dept) => (
          <span key={dept} className="badge badge-violet uppercase">
            {dept}
          </span>
        ))}
      </div>
    ) : (
      <span className="text-slate-400">-</span>
    );

  return (
    <section>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Building className="h-5 w-5 text-violet-600" />
          <h2 className="text-xl font-bold text-slate-800">Company Directory</h2>
          <span className="badge badge-blue">{companies.length} total</span>
        </div>

        {canDelete && filteredCompanies.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <label className="flex cursor-pointer items-center gap-2 text-sm font-semibold text-slate-600">
              <input
                type="checkbox"
                checked={allSelected}
                ref={(el) => el && (el.indeterminate = someSelected)}
                onChange={toggleSelectAll}
                className="h-4 w-4 accent-indigo-600"
              />
              Select all
            </label>
            <button
              type="button"
              onClick={clearSelection}
              disabled={selectedCompanies.length === 0 || bulkDeleting}
              className="btn btn-secondary btn-sm"
            >
              <X className="h-3.5 w-3.5" /> Clear
            </button>
            <button
              type="button"
              onClick={handleBulkDelete}
              disabled={selectedCompanies.length === 0 || bulkDeleting}
              className="btn btn-danger btn-sm"
            >
              <Trash2 className="h-3.5 w-3.5" />
              {bulkDeleting ? "Deleting..." : `Delete selected (${selectedCompanies.length})`}
            </button>
          </div>
        )}
      </div>

      <FilterBar
        resultCount={filteredCompanies.length}
        onReset={() => {
          setSearch("");
          setDepartmentFilter("");
          setSortBy("newest");
        }}
      >
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Company, email or phone"
          className="sm:col-span-2"
        />
        <FilterSelect
          label="Department"
          value={departmentFilter}
          onChange={setDepartmentFilter}
          allLabel="All departments"
          options={DEPARTMENT_OPTIONS}
        />
        <FilterSelect label="Sort by" value={sortBy} onChange={setSortBy} options={SORT_OPTIONS} />
      </FilterBar>

      {loading ? (
        <Spinner label="Loading companies..." />
      ) : filteredCompanies.length === 0 ? (
        <EmptyState icon={Building} title="No companies found" message="Try changing the filters." />
      ) : (
        <>
          {/* Phones: cards */}
          <div className="space-y-3 md:hidden">
            {filteredCompanies.map((company) => (
              <div
                key={company._id}
                className={isSelected(company) ? "card p-4 ring-2 ring-rose-300" : "card p-4"}
              >
                <div className="flex items-start gap-3">
                  {canDelete && (
                    <input
                      type="checkbox"
                      checked={isSelected(company)}
                      onChange={() => toggleCompanySelection(company._id)}
                      className="mt-1 h-4 w-4 accent-indigo-600"
                    />
                  )}
                  <Avatar src={company.logoUrl} name={company.name} size="h-11 w-11" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-bold text-slate-800">{company.name || "-"}</p>
                    <p className="truncate text-xs text-slate-500">{company.email}</p>
                    <p className="text-xs text-slate-500">{company.phoneNumber || "-"}</p>
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between gap-2">
                  {departmentBadges(company)}
                  {canDelete && deleteButton(company)}
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
                  <th>Company</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Departments</th>
                  <th>Added</th>
                  {canDelete && <th className="text-center">Action</th>}
                </tr>
              </thead>
              <tbody>
                {filteredCompanies.map((company, index) => (
                  <tr key={company._id} className={isSelected(company) ? "bg-rose-50/60" : undefined}>
                    {canDelete && (
                      <td>
                        <input
                          type="checkbox"
                          checked={isSelected(company)}
                          onChange={() => toggleCompanySelection(company._id)}
                          className="h-4 w-4 cursor-pointer accent-indigo-600"
                        />
                      </td>
                    )}
                    <td className="text-slate-400">{index + 1}</td>
                    <td>
                      <div className="flex min-w-44 items-center gap-3">
                        <Avatar src={company.logoUrl} name={company.name} size="h-9 w-9" />
                        <span className="font-semibold whitespace-nowrap text-slate-800">
                          {company.name || "-"}
                        </span>
                      </div>
                    </td>
                    <td className="whitespace-nowrap">{company.email || "-"}</td>
                    <td className="whitespace-nowrap">{company.phoneNumber || "-"}</td>
                    <td>{departmentBadges(company)}</td>
                    <td className="whitespace-nowrap text-slate-500">
                      {company.createdAt
                        ? new Date(company.createdAt).toLocaleDateString("en-GB")
                        : "-"}
                    </td>
                    {canDelete && <td className="text-center">{deleteButton(company)}</td>}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </section>
  );
};

export default CompanyList;
