import React, { useEffect, useState } from "react";
import axios from "axios";
import { useAuth, useUser } from "@clerk/clerk-react";

const CompanyList = ({ refreshKey }) => {
  const { getToken } = useAuth();
  const { user, isLoaded } = useUser();

  const [companies, setCompanies] = useState([]);
  const [search, setSearch] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);

  const backendUrl = import.meta.env.VITE_BACKEND_URL;

  // 🔐 Allowed delete roles
  const canDelete = ["placement", "principal", "admin"].includes(
    user?.publicMetadata?.role
  );

  const fetchCompanies = async () => {
    try {
      const token = await getToken();
      const res = await axios.get(`${backendUrl}/api/company`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data.ok) {
        setCompanies(res.data.companies);
      }
    } catch (err) {
      console.error("Failed to load companies", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanies();
  }, [refreshKey]);

  if (!isLoaded) return null;

  // 🔍 Search + Filter
  const filteredCompanies = companies.filter((company) => {
    const searchMatch =
      company.name.toLowerCase().includes(search.toLowerCase()) ||
      company.email.toLowerCase().includes(search.toLowerCase()) ||
      (company.phoneNumber || "").includes(search);

    const deptMatch =
      departmentFilter === "all" ||
      company.departments.includes(departmentFilter);

    return searchMatch && deptMatch;
  });

  // ❌ Delete company
  const handleDelete = async (companyId) => {
    const confirm = window.confirm(
      "Are you sure you want to delete this company?\nThis action cannot be undone."
    );
    if (!confirm) return;

    try {
      setDeletingId(companyId);
      const token = await getToken();
      await axios.delete(`${backendUrl}/api/company/${companyId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      await fetchCompanies();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete company");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 gap-3">
        <h2 className="text-xl font-bold text-gray-800">Company Directory</h2>
        <span className="text-sm text-gray-500">
          Total: {filteredCompanies.length}
        </span>
      </div>

      {/* Filters */}
      <div className="bg-gray-50 rounded-lg p-3 mb-4 flex flex-col md:flex-row gap-3">
        <input
          type="text"
          placeholder="Search by name, email or phone"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full md:w-1/2 border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
        />

        <select
          value={departmentFilter}
          onChange={(e) => setDepartmentFilter(e.target.value)}
          className="w-full md:w-1/4 border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Departments</option>
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

      {/* Table */}
      {loading ? (
        <p className="text-center py-8 text-gray-500">Loading companies...</p>
      ) : filteredCompanies.length === 0 ? (
        <p className="text-center py-8 text-gray-500">No companies found</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-100 text-gray-700">
              <tr>
                <th className="px-4 py-3">#</th>
                <th className="px-4 py-3">Company</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Phone</th>
                <th className="px-4 py-3">Departments</th>
                <th className="px-4 py-3">Created</th>
                {canDelete && <th className="px-4 py-3 text-center">Action</th>}
              </tr>
            </thead>

            <tbody>
              {filteredCompanies.map((company, index) => (
                <tr
                  key={company._id}
                  className="border-t hover:bg-blue-50 transition"
                >
                  <td className="px-4 py-3 font-medium">{index + 1}</td>

                  <td className="px-4 py-3 flex items-center gap-2">
                    {company.logoUrl ? (
                      <img
                        src={company.logoUrl}
                        alt="logo"
                        className="h-9 w-9 rounded-full object-cover shadow"
                      />
                    ) : (
                      <div className="h-9 w-9 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                        {company.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <span className="font-medium">{company.name}</span>
                  </td>

                  <td className="px-4 py-3">{company.email}</td>

                  <td className="px-4 py-3">{company.phoneNumber || "-"}</td>

                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {company.departments.map((dept) => (
                        <span
                          key={dept}
                          className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-700 uppercase font-semibold"
                        >
                          {dept}
                        </span>
                      ))}
                    </div>
                  </td>

                  <td className="px-4 py-3 text-gray-500">
                    {new Date(company.createdAt).toLocaleDateString()}
                  </td>

                  {canDelete && (
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => handleDelete(company._id)}
                        disabled={deletingId === company._id}
                        className="text-red-600 hover:text-red-800 font-semibold text-sm disabled:opacity-50"
                      >
                        {deletingId === company._id ? "Deleting..." : "Delete"}
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default CompanyList;
