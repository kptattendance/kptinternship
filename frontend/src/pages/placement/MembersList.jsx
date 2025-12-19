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
      toast.error("Failed to fetch users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this user permanently?")) return;
    try {
      const token = await getToken();
      await axios.delete(`${backendUrl}/api/users/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("User deleted");
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || "Delete failed");
    }
  };

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
      if (editForm.imageFile) fd.append("image", editForm.imageFile);

      await axios.put(`${backendUrl}/api/users/${id}`, fd, {
        headers: { Authorization: `Bearer ${token}` },
      });

      toast.success("User updated");
      setEditingId(null);
      fetchUsers();
    } catch (err) {
      toast.error("Update failed");
    }
  };

  const filteredUsers = users.filter((u) => {
    const r = roleFilter ? u.role === roleFilter : true;
    const d = deptFilter ? u.department === deptFilter : true;
    return r && d;
  });

  return (
    <>
      <ReviewerNavbar />

      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-100 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
            <h2 className="text-2xl font-bold text-indigo-700">
              👥 Members Directory
            </h2>
            <p className="text-sm text-gray-600">
              Manage users, roles & departments
            </p>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-xl shadow p-4 mb-6 flex flex-wrap gap-4">
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
          </div>

          {/* Table */}
          {loading ? (
            <p className="text-center text-gray-600">Loading members…</p>
          ) : (
            <div className="overflow-x-auto bg-white rounded-2xl shadow-lg">
              <table className="min-w-full text-sm">
                <thead className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white">
                  <tr>
                    <th className="px-4 py-3">#</th>
                    <th className="px-4 py-3">Photo</th>
                    <th className="px-4 py-3">Name</th>
                    <th className="px-4 py-3">Email</th>
                    <th className="px-4 py-3">Phone</th>
                    <th className="px-4 py-3">Role</th>
                    <th className="px-4 py-3">Dept</th>
                    {isAdmin && <th className="px-4 py-3">Actions</th>}
                  </tr>
                </thead>

                <tbody>
                  {filteredUsers.map((u, i) => {
                    const editing = editingId === u._id;
                    return (
                      <tr
                        key={u._id}
                        className={`${
                          i % 2 ? "bg-indigo-50" : "bg-white"
                        } hover:bg-indigo-100`}
                      >
                        <td className="px-4 py-3">{i + 1}</td>

                        <td className="px-4 py-3 text-center">
                          <img
                            src={u.photoUrl || DEFAULT_AVATAR}
                            className="h-12 w-12 rounded-full mx-auto border shadow"
                          />
                          {editing && (
                            <input
                              type="file"
                              onChange={(e) =>
                                setEditForm((p) => ({
                                  ...p,
                                  imageFile: e.target.files[0],
                                }))
                              }
                              className="mt-1 text-xs"
                            />
                          )}
                        </td>

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

                        <td className="px-4 py-3">{u.email}</td>
                        <td className="px-4 py-3">{u.phoneNumber || "-"}</td>

                        <td className="px-4 py-3">
                          <span className="px-2 py-1 rounded-full text-xs bg-indigo-200 text-indigo-800 font-semibold">
                            {u.role}
                          </span>
                        </td>

                        <td className="px-4 py-3">
                          <span className="px-2 py-1 rounded-full text-xs bg-blue-200 text-blue-800 font-semibold uppercase">
                            {u.department || "-"}
                          </span>
                        </td>

                        {isAdmin && (
                          <td className="px-4 py-3 text-center space-x-2">
                            {editing ? (
                              <>
                                <button
                                  onClick={() => handleSave(u._id)}
                                  className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
                                >
                                  Save
                                </button>
                                <button
                                  onClick={() => setEditingId(null)}
                                  className="px-3 py-1 bg-gray-500 text-white rounded"
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
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
