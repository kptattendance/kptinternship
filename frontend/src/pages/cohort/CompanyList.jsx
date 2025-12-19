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

  const canDelete = ["placement", "principal", "admin"].includes(
    user?.publicMetadata?.role
  );

  const fetchCompanies = async () => {
    try {
      const token = await getToken();
      const res = await axios.get(`${backendUrl}/api/company`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data.ok) setCompanies(res.data.companies);
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
    <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-2xl shadow-xl p-5 md:p-6 mt-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-5">
        <h2 className="text-2xl font-bold text-indigo-700">
          🏢 Company Directory
        </h2>
        <span className="text-sm text-gray-600 bg-white px-3 py-1 rounded-full shadow">
          Total: {filteredCompanies.length}
        </span>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-4 shadow mb-5 flex flex-col md:flex-row gap-4">
        <input
          type="text"
          placeholder="🔍 Search by name, email or phone"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full md:w-1/2 border border-gray-300 rounded-lg px-4 py-2
                     focus:ring-2 focus:ring-indigo-400 focus:outline-none"
        />

        <select
          value={departmentFilter}
          onChange={(e) => setDepartmentFilter(e.target.value)}
          className="w-full md:w-1/4 border border-gray-300 rounded-lg px-4 py-2
                     focus:ring-2 focus:ring-indigo-400 focus:outline-none"
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
        <p className="text-center py-10 text-gray-600">Loading companies...</p>
      ) : filteredCompanies.length === 0 ? (
        <p className="text-center py-10 text-gray-600">No companies found</p>
      ) : (
        <div className="overflow-x-auto bg-white rounded-xl shadow-lg">
          <table className="min-w-full text-sm">
            <thead className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white sticky top-0">
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
                  className={`${
                    index % 2 === 0 ? "bg-white" : "bg-indigo-50"
                  } hover:bg-indigo-100 transition`}
                >
                  <td className="px-4 py-3 font-semibold">{index + 1}</td>

                  <td className="px-4 py-3 flex items-center gap-2">
                    {company.logoUrl ? (
                      <img
                        src={company.logoUrl}
                        alt="logo"
                        className="h-9 w-9 rounded-full object-cover shadow"
                      />
                    ) : (
                      <div className="h-9 w-9 rounded-full bg-indigo-200 text-indigo-800 flex items-center justify-center font-bold">
                        {company.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <span className="font-semibold text-gray-800">
                      {company.name}
                    </span>
                  </td>

                  <td className="px-4 py-3">{company.email}</td>
                  <td className="px-4 py-3">{company.phoneNumber || "-"}</td>

                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {company.departments.map((dept) => (
                        <span
                          key={dept}
                          className="px-2 py-1 text-xs rounded-full
                                     bg-indigo-200 text-indigo-800 font-semibold uppercase"
                        >
                          {dept}
                        </span>
                      ))}
                    </div>
                  </td>

                  <td className="px-4 py-3 text-gray-600">
                    {new Date(company.createdAt).toLocaleDateString()}
                  </td>

                  {canDelete && (
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => handleDelete(company._id)}
                        disabled={deletingId === company._id}
                        className="px-3 py-1 rounded-lg text-sm font-semibold
                                   text-red-600 border border-red-300
                                   hover:bg-red-50 hover:text-red-800
                                   disabled:opacity-50 transition"
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
