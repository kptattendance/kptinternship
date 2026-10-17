import { useEffect, useState } from "react";
import axios from "axios";
import { useAuth, useUser } from "@clerk/clerk-react";
import ReviewerNavbar from "../../components/ReviewerNavbar";
import { toast } from "react-toastify";
import { Pencil, Trash2, UsersRound, X } from "lucide-react";
import Modal from "../../components/Modal";
import PhotoPicker from "../../components/PhotoPicker";
import {
  Avatar,
  EmptyState,
  FilterBar,
  FilterSelect,
  Page,
  PageHeader,
  SearchInput,
  Spinner,
} from "../../components/ui";
import { DEPARTMENT_OPTIONS, ROLE_LABELS } from "../../constants";

const ROLES = [
  "principal",
  "placement",
  "hod",
  "cohortOwner",
  "company",
  "student",
];

const ROLE_OPTIONS = ROLES.map((r) => ({ value: r, label: ROLE_LABELS[r] || r }));

const ROLE_BADGES = {
  principal: "badge-red",
  placement: "badge-violet",
  hod: "badge-blue",
  cohortOwner: "badge-green",
  company: "badge-amber",
  student: "badge-slate",
};

export default function MembersList() {
  const { getToken } = useAuth();
  const { user } = useUser();

  const isAdmin = user?.publicMetadata?.role === "placement";

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [roleFilter, setRoleFilter] = useState("");
  const [deptFilter, setDeptFilter] = useState("");
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);

  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});

  // Selected users for bulk operations
  const [selectedUsers, setSelectedUsers] = useState([]);

  const backendUrl = import.meta.env.VITE_BACKEND_URL;


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
      setSaving(true);
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
    } finally {
      setSaving(false);
    }
  };

  // =========================================================
  // FILTER USERS
  // =========================================================

  const filteredUsers = users.filter((u) => {
    const r = roleFilter ? u.role === roleFilter : true;
    const d = deptFilter ? u.department === deptFilter : true;
    const q = search.toLowerCase().trim();
    const s =
      !q ||
      [u.name, u.email, u.phoneNumber].some((f) => (f || "").toLowerCase().includes(q));

    return r && d && s;
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

  const actions = (u) =>
    isAdmin && (
      <div className="flex justify-end gap-2">
        <button type="button" onClick={() => handleEditClick(u)} className="btn btn-secondary btn-sm">
          <Pencil className="h-3.5 w-3.5" /> Edit
        </button>
        <button
          type="button"
          onClick={() => handleDelete(u._id)}
          className="btn btn-sm border border-rose-200 bg-white text-rose-600 hover:bg-rose-50"
          aria-label={`Delete ${u.name || u.email}`}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    );

  const roleBadge = (u) => (
    <span className={`badge ${ROLE_BADGES[u.role] || "badge-slate"}`}>
      {ROLE_LABELS[u.role] || u.role}
    </span>
  );

  return (
    <>
      <ReviewerNavbar />

      <Page>
        <PageHeader
          icon={UsersRound}
          title="Members Directory"
          subtitle="Manage users, roles and departments"
          actions={<span className="badge badge-violet text-sm">{users.length} members</span>}
        />

        <FilterBar
          resultCount={filteredUsers.length}
          onReset={() => {
            setRoleFilter("");
            setDeptFilter("");
            setSearch("");
          }}
        >
          <SearchInput value={search} onChange={setSearch} placeholder="Name, email or phone" />
          <FilterSelect
            label="Role"
            value={roleFilter}
            onChange={setRoleFilter}
            allLabel="All roles"
            options={ROLE_OPTIONS}
          />
          <FilterSelect
            label="Department"
            value={deptFilter}
            onChange={setDeptFilter}
            allLabel="All departments"
            options={DEPARTMENT_OPTIONS}
          />
        </FilterBar>

        {/* Bulk selection */}
        {isAdmin && filteredUsers.length > 0 && (
          <div className="card mb-4 flex flex-wrap items-center gap-2 px-4 py-3">
            <label className="flex cursor-pointer items-center gap-2 text-sm font-semibold text-slate-700">
              <input
                type="checkbox"
                checked={allFilteredSelected}
                ref={(el) => el && (el.indeterminate = someFilteredSelected && !allFilteredSelected)}
                onChange={toggleSelectAll}
                className="h-4 w-4 accent-indigo-600"
              />
              Select all {filteredUsers.length}
            </label>
            <span className={`badge ${selectedUsers.length ? "badge-violet" : "badge-slate"}`}>
              {selectedUsers.length} selected
            </span>
            <div className="ml-auto flex gap-2">
              <button
                type="button"
                onClick={() => setSelectedUsers([])}
                disabled={selectedUsers.length === 0}
                className="btn btn-secondary btn-sm"
              >
                <X className="h-3.5 w-3.5" /> Clear
              </button>
              <button
                type="button"
                onClick={handleBulkDelete}
                disabled={selectedUsers.length === 0}
                className="btn btn-danger btn-sm"
              >
                <Trash2 className="h-3.5 w-3.5" /> Delete selected ({selectedUsers.length})
              </button>
            </div>
          </div>
        )}

        {loading ? (
          <Spinner label="Loading members..." />
        ) : filteredUsers.length === 0 ? (
          <EmptyState icon={UsersRound} title="No users found" message="Try changing the filters." />
        ) : (
          <>
            {/* Phones: cards */}
            <div className="space-y-3 md:hidden">
              {filteredUsers.map((u) => (
                <div
                  key={u._id}
                  className={selectedUsers.includes(u._id) ? "card p-4 ring-2 ring-rose-300" : "card p-4"}
                >
                  <div className="flex items-start gap-3">
                    {isAdmin && (
                      <input
                        type="checkbox"
                        checked={selectedUsers.includes(u._id)}
                        onChange={() => toggleUserSelection(u._id)}
                        className="mt-1 h-4 w-4 accent-indigo-600"
                      />
                    )}
                    <Avatar src={u.photoUrl} name={u.name || u.email} size="h-12 w-12" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-bold text-slate-800">{u.name || "-"}</p>
                      <p className="truncate text-xs text-slate-500">{u.email}</p>
                      <p className="text-xs text-slate-500">{u.phoneNumber || "-"}</p>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {roleBadge(u)}
                        {u.department && <span className="badge badge-blue uppercase">{u.department}</span>}
                      </div>
                    </div>
                  </div>
                  {isAdmin && <div className="mt-3">{actions(u)}</div>}
                </div>
              ))}
            </div>

            {/* Tablets & desktops: table */}
            <div className="table-wrap hidden md:block">
              <table className="table-std">
                <thead>
                  <tr>
                    {isAdmin && <th className="w-10" />}
                    <th>#</th>
                    <th>Member</th>
                    <th>Phone</th>
                    <th>Role</th>
                    <th>Dept</th>
                    {isAdmin && <th className="text-right">Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((u, i) => (
                    <tr key={u._id} className={selectedUsers.includes(u._id) ? "bg-rose-50/60" : undefined}>
                      {isAdmin && (
                        <td>
                          <input
                            type="checkbox"
                            checked={selectedUsers.includes(u._id)}
                            onChange={() => toggleUserSelection(u._id)}
                            className="h-4 w-4 cursor-pointer accent-indigo-600"
                          />
                        </td>
                      )}
                      <td className="text-slate-400">{i + 1}</td>
                      <td>
                        <div className="flex items-center gap-3">
                          <Avatar src={u.photoUrl} name={u.name || u.email} size="h-10 w-10" />
                          <div className="min-w-0">
                            <p className="font-semibold text-slate-800">{u.name || "-"}</p>
                            <p className="text-xs text-slate-500">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="whitespace-nowrap">{u.phoneNumber || "-"}</td>
                      <td>{roleBadge(u)}</td>
                      <td>
                        {u.department ? (
                          <span className="badge badge-blue uppercase">{u.department}</span>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                      {isAdmin && <td>{actions(u)}</td>}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </Page>

      {/* Edit member */}
      {editingId && (
        <Modal
          title="Edit Member"
          maxWidth="max-w-lg"
          onClose={() => setEditingId(null)}
          footer={
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setEditingId(null)} className="btn btn-secondary">
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleSave(editingId)}
                disabled={saving}
                className="btn btn-primary"
              >
                {saving ? "Saving..." : "Save changes"}
              </button>
            </div>
          }
        >
          <div className="space-y-4">
            <p className="text-sm text-slate-500">{editForm.email}</p>
            <label className="block">
              <span className="label">Name</span>
              <input
                value={editForm.name || ""}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                className="input"
              />
            </label>
            <label className="block">
              <span className="label">Phone</span>
              <input
                type="tel"
                value={editForm.phoneNumber || ""}
                onChange={(e) => setEditForm({ ...editForm, phoneNumber: e.target.value })}
                className="input"
              />
            </label>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FilterSelect
                label="Role"
                value={editForm.role || ""}
                onChange={(v) => setEditForm({ ...editForm, role: v })}
                options={ROLE_OPTIONS}
              />
              <FilterSelect
                label="Department"
                value={editForm.department || ""}
                onChange={(v) => setEditForm({ ...editForm, department: v })}
                allLabel="None"
                options={DEPARTMENT_OPTIONS}
              />
            </div>
            <PhotoPicker
              label="New photo (optional)"
              file={editForm.imageFile || null}
              onChange={(file) => setEditForm((p) => ({ ...p, imageFile: file }))}
            />
          </div>
        </Modal>
      )}
    </>
  );
}
