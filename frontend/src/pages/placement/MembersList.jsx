import { useEffect, useState } from "react";
import axios from "axios";
import { useAuth, useUser } from "@clerk/clerk-react";
import ReviewerNavbar from "../../components/ReviewerNavbar";
import { toast } from "react-toastify";

const ROLES = [
  "principal",
  "placement",
  "hod",
  "cohortOwner",
  "company",
  "student",
];

const DEPARTMENTS = ["at", "ch", "ce", "cs", "ec", "eee", "me", "po"];

export default function MembersList() {
  const { getToken } = useAuth();
  const { user } = useUser();

  const isAdmin = user?.publicMetadata?.role === "placement";

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [roleFilter, setRoleFilter] = useState("");
  const [deptFilter, setDeptFilter] = useState("");

  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});

  // Selected users for bulk operations
  const [selectedUsers, setSelectedUsers] = useState([]);

  const backendUrl = import.meta.env.VITE_BACKEND_URL;

  const DEFAULT_AVATAR =
    "https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y";

  // =========================================================
  // FETCH USERS
  // =========================================================

  const fetchUsers = async () => {
    try {
      setLoading(true);

      const token = await getToken();

      const res = await axios.get(`${backendUrl}/api/users`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setUsers(res.data.users || []);
    } catch (err) {
      toast.error("Failed to fetch users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // =========================================================
  // SINGLE DELETE
  // =========================================================

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this user permanently?")) return;

    try {
      const token = await getToken();

      await axios.delete(`${backendUrl}/api/users/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      toast.success("User deleted");

      // Remove from selection if it was selected
      setSelectedUsers((prev) =>
        prev.filter((userId) => userId !== id)
      );

      fetchUsers();
    } catch (err) {
      toast.error(
        err.response?.data?.message || "Delete failed"
      );
    }
  };

  // =========================================================
  // EDIT
  // =========================================================

  const handleEditClick = (u) => {
    setEditingId(u._id);
    setEditForm({ ...u });
  };

  const handleSave = async (id) => {
    try {
      const token = await getToken();

      const fd = new FormData();

      fd.append("name", editForm.name || "");
      fd.append("phoneNumber", editForm.phoneNumber || "");
      fd.append("role", editForm.role || "");
      fd.append("department", editForm.department || "");

      if (editForm.imageFile) {
        fd.append("image", editForm.imageFile);
      }

      await axios.put(`${backendUrl}/api/users/${id}`, fd, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      toast.success("User updated");

      setEditingId(null);
      fetchUsers();
    } catch (err) {
      toast.error(
        err.response?.data?.message || "Update failed"
      );
    }
  };

  // =========================================================
  // FILTER USERS
  // =========================================================

  const filteredUsers = users.filter((u) => {
    const r = roleFilter ? u.role === roleFilter : true;
    const d = deptFilter ? u.department === deptFilter : true;

    return r && d;
  });

  // =========================================================
  // SELECT / DESELECT INDIVIDUAL USER
  // =========================================================

  const toggleUserSelection = (id) => {
    setSelectedUsers((prev) => {
      if (prev.includes(id)) {
        return prev.filter((userId) => userId !== id);
      }

      return [...prev, id];
    });
  };

  // =========================================================
  // SELECT / DESELECT ALL FILTERED USERS
  // =========================================================

  const toggleSelectAll = () => {
    const filteredIds = filteredUsers.map((u) => u._id);

    const allSelected =
      filteredIds.length > 0 &&
      filteredIds.every((id) =>
        selectedUsers.includes(id)
      );

    if (allSelected) {
      // Remove all currently filtered users
      setSelectedUsers((prev) =>
        prev.filter((id) => !filteredIds.includes(id))
      );
    } else {
      // Add all currently filtered users
      setSelectedUsers((prev) => [
        ...new Set([...prev, ...filteredIds]),
      ]);
    }
  };

  // =========================================================
  // BULK DELETE
  // =========================================================

  const handleBulkDelete = async () => {
    if (selectedUsers.length === 0) {
      toast.info("Please select at least one user");
      return;
    }

    const count = selectedUsers.length;

    const confirmed = window.confirm(
      `Are you sure you want to permanently delete ${count} selected user${
        count === 1 ? "" : "s"
      }?\n\nThis action cannot be undone.`
    );

    if (!confirmed) return;

    try {
      setLoading(true);

      const token = await getToken();

      // Delete selected users using existing DELETE endpoint
      await Promise.all(
        selectedUsers.map((id) =>
          axios.delete(`${backendUrl}/api/users/${id}`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          })
        )
      );

      toast.success(
        `${count} user${count === 1 ? "" : "s"} deleted successfully`
      );

      // Clear selection
      setSelectedUsers([]);

      // Refresh user list
      await fetchUsers();
    } catch (err) {
      toast.error(
        err.response?.data?.message ||
          "Some users could not be deleted"
      );

      // Refresh anyway in case some deletions succeeded
      setSelectedUsers([]);
      await fetchUsers();
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // CHECK WHETHER ALL FILTERED USERS ARE SELECTED
  // =========================================================

  const allFilteredSelected =
    filteredUsers.length > 0 &&
    filteredUsers.every((u) =>
      selectedUsers.includes(u._id)
    );

  const someFilteredSelected =
    filteredUsers.some((u) =>
      selectedUsers.includes(u._id)
    );

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <>
      <ReviewerNavbar />

      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-100 p-6">
        <div className="max-w-7xl mx-auto">

          {/* =================================================
              HEADER
          ================================================== */}

          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
            <h2 className="text-2xl font-bold text-indigo-700">
              👥 Members Directory
            </h2>

            <p className="text-sm text-gray-600">
              Manage users, roles & departments
            </p>
          </div>

          {/* =================================================
              FILTERS
          ================================================== */}

          <div className="bg-white rounded-xl shadow p-4 mb-4 flex flex-wrap gap-4 items-center">

            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="border rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-400"
            >
              <option value="">All Roles</option>

              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>

            <select
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              className="border rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-400"
            >
              <option value="">All Departments</option>

              {DEPARTMENTS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>

            {/* Reset Filters */}
            {(roleFilter || deptFilter) && (
              <button
                onClick={() => {
                  setRoleFilter("");
                  setDeptFilter("");
                }}
                className="px-3 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                Clear Filters
              </button>
            )}
          </div>

          {/* =================================================
              BULK SELECTION TOOLBAR
          ================================================== */}

          {isAdmin && (
            <div className="bg-white rounded-xl shadow p-4 mb-6 flex flex-wrap items-center justify-between gap-4">

              <div className="flex items-center gap-3">

                {/* Selected Count */}
                <span
                  className={`px-4 py-2 rounded-full font-semibold ${
                    selectedUsers.length > 0
                      ? "bg-indigo-100 text-indigo-700"
                      : "bg-gray-100 text-gray-500"
                  }`}
                >
                  Selected: {selectedUsers.length}
                </span>

                {/* Clear Selection */}
                <button
                  onClick={() => setSelectedUsers([])}
                  disabled={selectedUsers.length === 0}
                  className={`px-3 py-2 rounded-lg text-sm ${
                    selectedUsers.length > 0
                      ? "bg-gray-200 text-gray-700 hover:bg-gray-300"
                      : "bg-gray-100 text-gray-400 cursor-not-allowed"
                  }`}
                >
                  Clear Selection
                </button>
              </div>

              {/* Bulk Delete */}
              <button
                onClick={handleBulkDelete}
                disabled={selectedUsers.length === 0}
                className={`px-5 py-2 rounded-lg font-semibold ${
                  selectedUsers.length > 0
                    ? "bg-red-600 text-white hover:bg-red-700"
                    : "bg-gray-300 text-gray-500 cursor-not-allowed"
                }`}
              >
                🗑️ Delete Selected
                {selectedUsers.length > 0 &&
                  ` (${selectedUsers.length})`}
              </button>
            </div>
          )}

          {/* =================================================
              TABLE
          ================================================== */}

          {loading ? (
            <p className="text-center text-gray-600">
              Loading members…
            </p>
          ) : (
            <div className="overflow-x-auto bg-white rounded-2xl shadow-lg">

              <table className="min-w-full text-sm">

                {/* =================================================
                    TABLE HEADER
                ================================================== */}

                <thead className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white">
                  <tr>

                    {/* Select All Checkbox */}
                    {isAdmin && (
                      <th className="px-4 py-3 text-center">
                        <input
                          type="checkbox"
                          checked={allFilteredSelected}
                          onChange={toggleSelectAll}
                          disabled={filteredUsers.length === 0}
                          className="h-4 w-4 cursor-pointer accent-white"
                          title={
                            allFilteredSelected
                              ? "Deselect all"
                              : "Select all"
                          }
                        />
                      </th>
                    )}

                    <th className="px-4 py-3">
                      #
                    </th>

                    <th className="px-4 py-3">
                      Photo
                    </th>

                    <th className="px-4 py-3">
                      Name
                    </th>

                    <th className="px-4 py-3">
                      Email
                    </th>

                    <th className="px-4 py-3">
                      Phone
                    </th>

                    <th className="px-4 py-3">
                      Role
                    </th>

                    <th className="px-4 py-3">
                      Dept
                    </th>

                    {isAdmin && (
                      <th className="px-4 py-3">
                        Actions
                      </th>
                    )}

                  </tr>
                </thead>

                {/* =================================================
                    TABLE BODY
                ================================================== */}

                <tbody>

                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td
                        colSpan={isAdmin ? 9 : 8}
                        className="px-4 py-10 text-center text-gray-500"
                      >
                        No users found
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((u, i) => {

                      const editing =
                        editingId === u._id;

                      const isSelected =
                        selectedUsers.includes(u._id);

                      return (
                        <tr
                          key={u._id}
                          className={`${
                            isSelected
                              ? "bg-red-50"
                              : i % 2
                              ? "bg-indigo-50"
                              : "bg-white"
                          } hover:bg-indigo-100 transition`}
                        >

                          {/* =================================================
                              SELECT CHECKBOX
                          ================================================== */}

                          {isAdmin && (
                            <td className="px-4 py-3 text-center">

                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() =>
                                  toggleUserSelection(u._id)
                                }
                                className="h-4 w-4 cursor-pointer"
                              />

                            </td>
                          )}

                          {/* =================================================
                              NUMBER
                          ================================================== */}

                          <td className="px-4 py-3">
                            {i + 1}
                          </td>

                          {/* =================================================
                              PHOTO
                          ================================================== */}

                          <td className="px-4 py-3 text-center">

                            <img
                              src={
                                u.photoUrl ||
                                DEFAULT_AVATAR
                              }
                              className="h-12 w-12 rounded-full mx-auto border shadow"
                              alt={u.name || "User"}
                            />

                            {editing && (
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) =>
                                  setEditForm((p) => ({
                                    ...p,
                                    imageFile:
                                      e.target.files[0],
                                  }))
                                }
                                className="mt-1 text-xs"
                              />
                            )}

                          </td>

                          {/* =================================================
                              NAME
                          ================================================== */}

                          <td className="px-4 py-3 font-semibold">

                            {editing ? (
                              <input
                                value={editForm.name || ""}
                                onChange={(e) =>
                                  setEditForm({
                                    ...editForm,
                                    name: e.target.value,
                                  })
                                }
                                className="border rounded px-2 py-1 w-full"
                              />
                            ) : (
                              u.name || "-"
                            )}

                          </td>

                          {/* =================================================
                              EMAIL
                          ================================================== */}

                          <td className="px-4 py-3">
                            {u.email}
                          </td>

                          {/* =================================================
                              PHONE
                          ================================================== */}

                          <td className="px-4 py-3">
                            {u.phoneNumber || "-"}
                          </td>

                          {/* =================================================
                              ROLE
                          ================================================== */}

                          <td className="px-4 py-3">

                            <span className="px-2 py-1 rounded-full text-xs bg-indigo-200 text-indigo-800 font-semibold">
                              {u.role}
                            </span>

                          </td>

                          {/* =================================================
                              DEPARTMENT
                          ================================================== */}

                          <td className="px-4 py-3">

                            <span className="px-2 py-1 rounded-full text-xs bg-blue-200 text-blue-800 font-semibold uppercase">
                              {u.department || "-"}
                            </span>

                          </td>

                          {/* =================================================
                              ACTIONS
                          ================================================== */}

                          {isAdmin && (
                            <td className="px-4 py-3 text-center">

                              {editing ? (
                                <div className="flex justify-center gap-2">

                                  <button
                                    onClick={() =>
                                      handleSave(u._id)
                                    }
                                    className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
                                  >
                                    Save
                                  </button>

                                  <button
                                    onClick={() =>
                                      setEditingId(null)
                                    }
                                    className="px-3 py-1 bg-gray-500 text-white rounded hover:bg-gray-600"
                                  >
                                    Cancel
                                  </button>

                                </div>
                              ) : (
                                <div className="flex justify-center gap-2">

                                  <button
                                    onClick={() =>
                                      handleEditClick(u)
                                    }
                                    className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                                  >
                                    Edit
                                  </button>

                                  <button
                                    onClick={() =>
                                      handleDelete(u._id)
                                    }
                                    className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
                                  >
                                    Delete
                                  </button>

                                </div>
                              )}

                            </td>
                          )}

                        </tr>
                      );
                    })
                  )}

                </tbody>

              </table>

            </div>
          )}

        </div>
      </div>
    </>
  );
}