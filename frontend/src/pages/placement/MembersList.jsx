import { useEffect, useState } from "react";
import axios from "axios";
import { useAuth, useUser } from "@clerk/clerk-react";
import ReviewerNavbar from "../../components/ReviewerNavbar";
import { toast } from "react-toastify";

const ROLES = ["hod", "cohortOwner", "company", "student"];
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

  const backendUrl = import.meta.env.VITE_BACKEND_URL;

  const DEFAULT_AVATAR =
    "https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y";

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const token = await getToken();
      const res = await axios.get(`${backendUrl}/api/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsers(res.data.users || []);
    } catch (err) {
      console.error("❌ Error fetching users:", err);
      toast.error("Failed to fetch users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;
    try {
      const token = await getToken();
      await axios.delete(`${backendUrl}/api/users/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("User deleted");
      fetchUsers();
    } catch (err) {
      console.error("❌ Delete error:", err);
      toast.error(err.response?.data?.message || "Failed to delete user");
    }
  };

  const handleEditClick = (user) => {
    setEditingId(user._id);
    setEditForm({ ...user });
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditForm({});
  };

  const handleChange = (field, value) => {
    setEditForm((prev) => ({ ...prev, [field]: value }));
  };

  const handlePhotoChange = (file) => {
    setEditForm((prev) => ({ ...prev, imageFile: file }));
  };

  const handleSave = async (id) => {
    try {
      const token = await getToken();
      const formData = new FormData();
      formData.append("name", editForm.name || "");
      formData.append("phoneNumber", editForm.phoneNumber || "");
      formData.append("role", editForm.role || "");
      formData.append("department", editForm.department || "");
      if (editForm.imageFile) formData.append("image", editForm.imageFile);

      await axios.put(`${backendUrl}/api/users/${id}`, formData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setUsers((prev) =>
        prev.map((u) => (u._id === id ? { ...u, ...editForm } : u))
      );
      toast.success("User updated");
      setEditingId(null);
      setEditForm({});
    } catch (err) {
      console.error("❌ Update error:", err);
      toast.error(err.response?.data?.message || "Failed to update user");
    }
  };

  const filteredUsers = users.filter((u) => {
    const roleMatch = roleFilter ? u.role === roleFilter : true;
    const deptMatch = deptFilter ? u.department === deptFilter : true;
    return roleMatch && deptMatch;
  });

  return (
    <>
      <ReviewerNavbar />
      <div className="max-w-6xl mx-auto p-6">
        <h2 className="text-2xl font-bold mb-6">Members List</h2>

        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-6">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="border p-2 rounded"
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
            className="border p-2 rounded"
          >
            <option value="">All Departments</option>
            {DEPARTMENTS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>

        {/* Table */}
        {loading ? (
          <p>Loading members...</p>
        ) : (
          <div className="overflow-x-auto bg-white rounded shadow">
            <table className="min-w-full border table-auto">
              <thead className="bg-gray-100">
                <tr>
                  <th className="p-3 border whitespace-nowrap">Sl. No</th>
                  <th className="p-3 border whitespace-nowrap">Photo</th>
                  <th className="p-3 border whitespace-nowrap">Name</th>
                  <th className="p-3 border whitespace-nowrap">Email</th>
                  <th className="p-3 border whitespace-nowrap">Phone</th>
                  <th className="p-3 border whitespace-nowrap">Role</th>
                  <th className="p-3 border whitespace-nowrap">Department</th>
                  {isAdmin && (
                    <th className="p-3 border whitespace-nowrap">Actions</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length > 0 ? (
                  filteredUsers.map((u, index) => {
                    const isEditing = editingId === u._id;
                    return (
                      <tr key={u._id} className="hover:bg-gray-50 align-top">
                        <td className="p-3 border text-center">{index + 1}</td>
                        <td className="p-3 border text-center">
                          <img
                            src={u.photoUrl || DEFAULT_AVATAR}
                            alt={u.name || "User"}
                            className="h-12 w-12 rounded-full object-cover mx-auto"
                          />
                          {isEditing && (
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) =>
                                handlePhotoChange(e.target.files[0])
                              }
                              className="mt-1 w-full"
                            />
                          )}
                        </td>
                        <td className="p-3 border">
                          {isEditing ? (
                            <input
                              type="text"
                              value={editForm.name || ""}
                              onChange={(e) =>
                                handleChange("name", e.target.value)
                              }
                              className="border rounded p-1 w-full"
                            />
                          ) : (
                            u.name || "-"
                          )}
                        </td>
                        <td className="p-3 border truncate max-w-xs">
                          {u.email}
                        </td>
                        <td className="p-3 border">
                          {isEditing ? (
                            <input
                              type="text"
                              value={editForm.phoneNumber || ""}
                              onChange={(e) =>
                                handleChange("phoneNumber", e.target.value)
                              }
                              className="border rounded p-1 w-full"
                            />
                          ) : (
                            u.phoneNumber || "-"
                          )}
                        </td>
                        <td className="p-3 border">
                          {isEditing ? (
                            <select
                              value={editForm.role || ""}
                              onChange={(e) =>
                                handleChange("role", e.target.value)
                              }
                              className="border rounded p-1 w-full"
                            >
                              {ROLES.map((r) => (
                                <option key={r} value={r}>
                                  {r}
                                </option>
                              ))}
                            </select>
                          ) : (
                            u.role
                          )}
                        </td>
                        <td className="p-3 border">
                          {isEditing ? (
                            <select
                              value={editForm.department || ""}
                              onChange={(e) =>
                                handleChange("department", e.target.value)
                              }
                              className="border rounded p-1 w-full"
                            >
                              {DEPARTMENTS.map((d) => (
                                <option key={d} value={d}>
                                  {d}
                                </option>
                              ))}
                            </select>
                          ) : (
                            u.department || "-"
                          )}
                        </td>
                        {isAdmin && (
                          <td className="p-3 border text-center space-x-2 whitespace-nowrap">
                            {isEditing ? (
                              <>
                                <button
                                  onClick={() => handleSave(u._id)}
                                  className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
                                >
                                  Save
                                </button>
                                <button
                                  onClick={handleCancel}
                                  className="px-3 py-1 bg-gray-500 text-white rounded hover:bg-gray-600"
                                >
                                  Cancel
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  onClick={() => handleEditClick(u)}
                                  className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => handleDelete(u._id)}
                                  className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
                                >
                                  Delete
                                </button>
                              </>
                            )}
                          </td>
                        )}
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td
                      colSpan={isAdmin ? 8 : 7}
                      className="p-3 text-center text-gray-500"
                    >
                      No users found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
