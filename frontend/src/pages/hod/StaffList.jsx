// src/pages/hod/StaffList.jsx
import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useUser, useAuth } from "@clerk/clerk-react";
import { toast } from "react-toastify";
import { Pencil, Trash2, UsersRound } from "lucide-react";
import ReviewerNavbar from "../../components/ReviewerNavbar";
import Modal from "../../components/Modal";
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
import { ROLE_LABELS } from "../../constants";

export default function StaffList() {
  const { user } = useUser();
  const { getToken } = useAuth();
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editRow, setEditRow] = useState(null);
  const [editData, setEditData] = useState({});
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");

  const hodDepartment = user?.publicMetadata?.department;
  const backendUrl = import.meta.env.VITE_BACKEND_URL;

  useEffect(() => {
    const fetchStaff = async () => {
      try {
        const token = await getToken();
        const res = await axios.get(backendUrl + "/api/users", {
          headers: { Authorization: `Bearer ${token}` },
        });

        const filtered = res.data.users.filter(
          (u) =>
            u.role !== "student" &&
            u.role !== "principal" &&
            u.department === hodDepartment
        );

        setStaff(filtered);
      } catch (err) {
        console.error("Error fetching staff:", err);
        toast.error("Failed to load staff");
      } finally {
        setLoading(false);
      }
    };

    if (hodDepartment) fetchStaff();
  }, [hodDepartment, getToken, backendUrl]);

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this staff member?")) return;

    try {
      const token = await getToken();
      await axios.delete(backendUrl + `/api/users/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setStaff((prev) => prev.filter((u) => u._id !== id));
      toast.success("Staff member deleted");
    } catch (err) {
      console.error("Error deleting staff:", err);
      toast.error(err.response?.data?.message || "Delete failed");
    }
  };

  const handleEdit = (member) => {
    setEditRow(member._id);
    setEditData({ ...member });
  };

  const handleCancel = () => {
    setEditRow(null);
    setEditData({});
  };

  const handleChange = (e) => {
    setEditData({ ...editData, [e.target.name]: e.target.value });
  };

  const handleUpdate = async (id) => {
    try {
      setSaving(true);
      const token = await getToken();
      const res = await axios.put(backendUrl + `/api/users/${id}`, editData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setStaff((prev) => prev.map((u) => (u._id === id ? { ...u, ...res.data.user } : u)));
      toast.success("Staff member updated");
      handleCancel();
    } catch (err) {
      console.error("Error updating staff:", err);
      toast.error(err.response?.data?.message || "Update failed");
    } finally {
      setSaving(false);
    }
  };

  const roleOptions = [...new Set(staff.map((u) => u.role))].map((r) => ({
    value: r,
    label: ROLE_LABELS[r] || r,
  }));

  const filteredStaff = useMemo(() => {
    const q = search.toLowerCase().trim();
    return staff.filter(
      (u) =>
        (!roleFilter || u.role === roleFilter) &&
        (!q || [u.name, u.email, u.phoneNumber].some((f) => (f || "").toLowerCase().includes(q)))
    );
  }, [staff, search, roleFilter]);

  const actions = (u) => (
    <div className="flex justify-end gap-2">
      <button type="button" onClick={() => handleEdit(u)} className="btn btn-secondary btn-sm">
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

  return (
    <>
      <ReviewerNavbar />

      <Page>
        <PageHeader
          icon={UsersRound}
          title={`Staff — ${hodDepartment?.toUpperCase() || "N/A"}`}
          subtitle="Cohort owners and staff of your department"
          actions={<span className="badge badge-violet text-sm">{staff.length} members</span>}
        />

        <FilterBar
          resultCount={filteredStaff.length}
          onReset={() => {
            setSearch("");
            setRoleFilter("");
          }}
        >
          <SearchInput value={search} onChange={setSearch} placeholder="Name, email or phone" />
          <FilterSelect
            label="Role"
            value={roleFilter}
            onChange={setRoleFilter}
            allLabel="All roles"
            options={roleOptions}
          />
        </FilterBar>

        {loading && hodDepartment ? (
          <Spinner label="Fetching staff list..." />
        ) : filteredStaff.length === 0 ? (
          <EmptyState
            icon={UsersRound}
            title="No staff found"
            message={hodDepartment ? "No staff match your filters." : "No department is assigned to your account."}
          />
        ) : (
          <>
            {/* Phones: cards */}
            <div className="space-y-3 md:hidden">
              {filteredStaff.map((u) => (
                <div key={u._id} className="card p-4">
                  <div className="flex items-center gap-3">
                    <Avatar src={u.photoUrl} name={u.name || u.email} size="h-12 w-12" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-bold text-slate-800">{u.name || "N/A"}</p>
                      <p className="truncate text-xs text-slate-500">{u.email}</p>
                      <p className="text-xs text-slate-500">{u.phoneNumber || "N/A"}</p>
                    </div>
                    <span className="badge badge-green">{ROLE_LABELS[u.role] || u.role}</span>
                  </div>
                  <div className="mt-3">{actions(u)}</div>
                </div>
              ))}
            </div>

            {/* Tablets & desktops: table */}
            <div className="table-wrap hidden md:block">
              <table className="table-std">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Phone</th>
                    <th>Role</th>
                    <th>Department</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStaff.map((u) => (
                    <tr key={u._id}>
                      <td>
                        <div className="flex items-center gap-3">
                          <Avatar src={u.photoUrl} name={u.name || u.email} size="h-10 w-10" />
                          <div>
                            <p className="font-semibold text-slate-800">{u.name || "N/A"}</p>
                            <p className="text-xs text-slate-500">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td>{u.phoneNumber || "N/A"}</td>
                      <td>
                        <span className="badge badge-green">{ROLE_LABELS[u.role] || u.role}</span>
                      </td>
                      <td>
                        <span className="badge badge-blue uppercase">{u.department}</span>
                      </td>
                      <td>{actions(u)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </Page>

      {editRow && (
        <Modal
          title="Edit Staff Member"
          maxWidth="max-w-lg"
          onClose={handleCancel}
          footer={
            <div className="flex justify-end gap-2">
              <button type="button" onClick={handleCancel} className="btn btn-secondary">
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleUpdate(editRow)}
                disabled={saving}
                className="btn btn-primary"
              >
                {saving ? "Saving..." : "Update"}
              </button>
            </div>
          }
        >
          <div className="space-y-4">
            <p className="text-sm text-slate-500">{editData.email}</p>
            <label className="block">
              <span className="label">Name</span>
              <input name="name" value={editData.name || ""} onChange={handleChange} className="input" />
            </label>
            <label className="block">
              <span className="label">Phone</span>
              <input
                name="phoneNumber"
                type="tel"
                value={editData.phoneNumber || ""}
                onChange={handleChange}
                className="input"
              />
            </label>
          </div>
        </Modal>
      )}
    </>
  );
}
