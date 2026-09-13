import React, { useEffect, useState } from "react";
import axios from "axios";
import { useAuth, useUser } from "@clerk/clerk-react";

const CompanyList = ({ refreshKey }) => {
  const { getToken } = useAuth();
  const { user, isLoaded } = useUser();

  const [companies, setCompanies] = useState([]);
  const [search, setSearch] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("all");
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

  const filteredCompanies = companies.filter((company) => {
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
      departmentFilter === "all" ||
      departments.includes(departmentFilter);

    return searchMatch && deptMatch;
  });

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

  return (
    <div className="bg-white rounded-2xl shadow-lg mt-5 overflow-hidden">

      {/* ================= HEADER ================= */}

      <div className="px-4 md:px-5 py-4 border-b bg-gradient-to-r from-indigo-50 to-blue-50">

        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">

          {/* Title + count */}
          <div className="flex items-center gap-3">
            <div>
              <h2 className="text-xl font-bold text-indigo-700">
                🏢 Company Directory
              </h2>

              <p className="text-xs text-gray-500 mt-0.5">
                Showing {filteredCompanies.length} of{" "}
                {companies.length} companies
              </p>
            </div>

            <span className="px-3 py-1 rounded-full bg-white border border-indigo-200 text-sm font-semibold text-indigo-700 shadow-sm">
              Total: {filteredCompanies.length}
            </span>
          </div>

          {/* Selection controls */}
          {canDelete && (
            <div className="flex flex-wrap items-center gap-2">

              <span
                className={`px-3 py-1.5 rounded-lg text-sm font-semibold ${
                  selectedCompanies.length > 0
                    ? "bg-indigo-100 text-indigo-700"
                    : "bg-gray-100 text-gray-500"
                }`}
              >
                Selected: {selectedCompanies.length}
              </span>

              <button
                type="button"
                onClick={clearSelection}
                disabled={
                  selectedCompanies.length === 0 ||
                  bulkDeleting
                }
                className="px-3 py-1.5 rounded-lg text-sm
                font-medium bg-white border border-gray-300
                text-gray-700 hover:bg-gray-100
                disabled:opacity-40
                disabled:cursor-not-allowed transition"
              >
                Clear
              </button>

              <button
                type="button"
                onClick={handleBulkDelete}
                disabled={
                  selectedCompanies.length === 0 ||
                  bulkDeleting
                }
                className="px-3 py-1.5 rounded-lg text-sm
                font-semibold bg-red-600 text-white
                hover:bg-red-700
                disabled:bg-gray-300
                disabled:text-gray-500
                disabled:cursor-not-allowed transition"
              >
                {bulkDeleting
                  ? "Deleting..."
                  : `🗑️ Delete Selected${
                      selectedCompanies.length > 0
                        ? ` (${selectedCompanies.length})`
                        : ""
                    }`}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ================= FILTERS ================= */}

      <div className="px-4 md:px-5 py-3 border-b bg-white">

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">

          {/* Search */}
          <div className="md:col-span-2">
            <input
              type="text"
              placeholder="🔍 Search company, email or phone"
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
              className="w-full h-10 border border-gray-300
              rounded-lg px-3 text-sm
              focus:border-indigo-500
              focus:ring-2 focus:ring-indigo-200
              focus:outline-none transition"
            />
          </div>

          {/* Department */}
          <select
            value={departmentFilter}
            onChange={(e) =>
              setDepartmentFilter(e.target.value)
            }
            className="w-full h-10 border border-gray-300
            rounded-lg px-3 text-sm
            focus:border-indigo-500
            focus:ring-2 focus:ring-indigo-200
            focus:outline-none transition"
          >
            <option value="all">
              All Departments
            </option>

            <option value="cs">CS</option>
            <option value="ec">EC</option>
            <option value="eee">EEE</option>
            <option value="me">ME</option>
            <option value="ce">CE</option>
            <option value="ch">CH</option>
            <option value="at">AT</option>
            <option value="po">PO</option>
          </select>
        </div>
      </div>

      {/* ================= TABLE ================= */}

      {loading ? (
        <div className="py-12 text-center text-gray-500 text-sm">
          Loading companies...
        </div>
      ) : filteredCompanies.length === 0 ? (
        <div className="py-12 text-center text-gray-500 text-sm">
          No companies found.
        </div>
      ) : (
        <div className="overflow-x-auto">

          <table className="w-full min-w-[950px] text-sm">

            <thead className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white">

              <tr>

                {/* Select All */}
                {canDelete && (
                  <th className="px-3 py-2.5 text-center w-12">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      ref={(element) => {
                        if (element) {
                          element.indeterminate =
                            someSelected;
                        }
                      }}
                      onChange={toggleSelectAll}
                      className="h-4 w-4 cursor-pointer accent-indigo-600"
                      title={
                        allSelected
                          ? "Deselect all"
                          : "Select all"
                      }
                    />
                  </th>
                )}

                <th className="px-3 py-2.5 text-left w-12">
                  #
                </th>

                <th className="px-3 py-2.5 text-left">
                  Company
                </th>

                <th className="px-3 py-2.5 text-left">
                  Email
                </th>

                <th className="px-3 py-2.5 text-left">
                  Phone
                </th>

                <th className="px-3 py-2.5 text-left">
                  Departments
                </th>

                <th className="px-3 py-2.5 text-left">
                  Created
                </th>

                {canDelete && (
                  <th className="px-3 py-2.5 text-center">
                    Action
                  </th>
                )}
              </tr>
            </thead>

            <tbody>

              {filteredCompanies.map(
                (company, index) => {
                  const selected =
                    selectedCompanies.includes(
                      company._id
                    );

                  const departments =
                    company.departments || [];

                  return (
                    <tr
                      key={company._id}
                      className={`border-b transition ${
                        selected
                          ? "bg-red-50"
                          : index % 2 === 0
                          ? "bg-white"
                          : "bg-indigo-50"
                      } hover:bg-indigo-100`}
                    >

                      {/* Checkbox */}
                      {canDelete && (
                        <td className="px-3 py-2 text-center">
                          <input
                            type="checkbox"
                            checked={selected}
                            onChange={() =>
                              toggleCompanySelection(
                                company._id
                              )
                            }
                            className="h-4 w-4 cursor-pointer accent-indigo-600"
                          />
                        </td>
                      )}

                      {/* Number */}
                      <td className="px-3 py-2 font-semibold text-gray-600">
                        {index + 1}
                      </td>

                      {/* Company */}
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-2 min-w-[180px]">

                          {company.logoUrl ? (
                            <img
                              src={company.logoUrl}
                              alt="logo"
                              className="h-9 w-9 rounded-full
                              object-cover border
                              shadow-sm shrink-0"
                            />
                          ) : (
                            <div
                              className="h-9 w-9 rounded-full
                              bg-indigo-200 text-indigo-800
                              flex items-center justify-center
                              font-bold shrink-0"
                            >
                              {(company.name || "?")
                                .charAt(0)
                                .toUpperCase()}
                            </div>
                          )}

                          <span className="font-semibold text-gray-800 whitespace-nowrap">
                            {company.name || "-"}
                          </span>
                        </div>
                      </td>

                      {/* Email */}
                      <td className="px-3 py-2 whitespace-nowrap">
                        {company.email || "-"}
                      </td>

                      {/* Phone */}
                      <td className="px-3 py-2 whitespace-nowrap">
                        {company.phoneNumber || "-"}
                      </td>

                      {/* Departments */}
                      <td className="px-3 py-2">
                        <div className="flex flex-wrap gap-1 min-w-[120px]">

                          {departments.length > 0 ? (
                            departments.map((dept) => (
                              <span
                                key={dept}
                                className="px-2 py-0.5 text-[11px]
                                rounded-full bg-indigo-100
                                text-indigo-700
                                font-semibold uppercase"
                              >
                                {dept}
                              </span>
                            ))
                          ) : (
                            <span className="text-gray-400">
                              -
                            </span>
                          )}

                        </div>
                      </td>

                      {/* Created */}
                      <td className="px-3 py-2 text-gray-600 whitespace-nowrap">
                        {company.createdAt
                          ? new Date(
                              company.createdAt
                            ).toLocaleDateString()
                          : "-"}
                      </td>

                      {/* Action */}
                      {canDelete && (
                        <td className="px-3 py-2 text-center">

                          <button
                            type="button"
                            onClick={() =>
                              handleDelete(
                                company._id,
                                company.name
                              )
                            }
                            disabled={
                              deletingId ===
                                company._id ||
                              bulkDeleting
                            }
                            className="px-3 py-1.5 rounded-lg
                            text-xs font-semibold
                            text-red-600
                            border border-red-300
                            hover:bg-red-50
                            hover:text-red-800
                            disabled:opacity-40
                            disabled:cursor-not-allowed
                            transition"
                          >
                            {deletingId ===
                            company._id
                              ? "Deleting..."
                              : "Delete"}
                          </button>

                        </td>
                      )}
                    </tr>
                  );
                }
              )}

            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default CompanyList;