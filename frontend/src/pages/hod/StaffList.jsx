// src/pages/hod/StaffList.jsx
import { useEffect, useState } from "react";
import axios from "axios";
import { useUser, useAuth } from "@clerk/clerk-react";
import ReviewerNavbar from "../../components/ReviewerNavbar";

export default function StaffList() {
  const { user } = useUser();
  const { getToken } = useAuth();
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editRow, setEditRow] = useState(null);
  const [editData, setEditData] = useState({});

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
          (u) => u.role !== "student" && u.department === hodDepartment
        );

        setStaff(filtered);
      } catch (err) {
        console.error("Error fetching staff:", err);
      } finally {
        setLoading(false);
      }
    };

    if (hodDepartment) fetchStaff();
  }, [hodDepartment, getToken]);

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this staff member?"))
      return;

    try {
      const token = await getToken();
      await axios.delete(backendUrl + `/api/users/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setStaff(staff.filter((u) => u._id !== id));
    } catch (err) {
      console.error("Error deleting staff:", err);
    }
  };

  const handleEdit = (user) => {
    setEditRow(user._id);
    setEditData({ ...user });
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
      const token = await getToken();
      const res = await axios.put(backendUrl + `/api/users/${id}`, editData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setStaff(
        staff.map((u) => (u._id === id ? { ...u, ...res.data.user } : u))
      );

      setEditRow(null);
      setEditData({});
    } catch (err) {
      console.error("Error updating staff:", err);
    }
  };

  return (
    <>
      {/* ✅ Navbar always shows */}
      <ReviewerNavbar />

      <div className="p-4 sm:p-6">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4 sm:mb-6">
          Staff List ({hodDepartment?.toUpperCase() || "N/A"})
        </h2>

        {loading ? (
          // ✅ Centered spinner while fetching
          <div className="flex flex-col items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-600 border-solid"></div>
            <p className="mt-4 text-gray-600">Fetching staff list...</p>
          </div>
        ) : staff.length === 0 ? (
          <p className="text-gray-500">No staff found for your department.</p>
        ) : (
          <div className="overflow-x-auto shadow-lg rounded-2xl border border-gray-200">
            <table className="w-full text-left border-collapse text-sm sm:text-base">
              <thead>
                <tr className="bg-gray-100 text-gray-700 text-xs sm:text-sm uppercase">
                  <th className="px-4 sm:px-6 py-3">Name</th>
                  <th className="px-4 sm:px-6 py-3">Email</th>
                  <th className="px-4 sm:px-6 py-3">Phone</th>
                  <th className="px-4 sm:px-6 py-3">Role</th>
                  <th className="px-4 sm:px-6 py-3">Department</th>
                  <th className="px-4 sm:px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {staff.map((u, idx) => (
                  <tr
                    key={u._id}
                    className={`${
                      idx % 2 === 0 ? "bg-white" : "bg-gray-50"
                    } hover:bg-gray-100 transition`}
                  >
                    <td className="px-4 sm:px-6 py-3 font-medium text-gray-900">
                      {editRow === u._id ? (
                        <input
                          name="name"
                          value={editData.name || ""}
                          onChange={handleChange}
                          className="border p-1 rounded w-full"
                        />
                      ) : (
                        u.name || "N/A"
                      )}
                    </td>
                    <td className="px-4 sm:px-6 py-3 text-gray-600">
                      {u.email}
                    </td>
                    <td className="px-4 sm:px-6 py-3">
                      {editRow === u._id ? (
                        <input
                          name="phoneNumber"
                          value={editData.phoneNumber || ""}
                          onChange={handleChange}
                          className="border p-1 rounded w-full"
                        />
                      ) : (
                        u.phoneNumber || "N/A"
                      )}
                    </td>
                    <td className="px-4 sm:px-6 py-3 capitalize">{u.role}</td>
                    <td className="px-4 sm:px-6 py-3 uppercase">
                      {u.department}
                    </td>
                    <td className="px-4 sm:px-6 py-3 text-right space-x-2">
                      {editRow === u._id ? (
                        <>
                          <button
                            onClick={() => handleUpdate(u._id)}
                            className="px-3 py-1 text-xs sm:text-sm bg-green-500 text-white rounded-lg hover:bg-green-600"
                          >
                            Update
                          </button>
                          <button
                            onClick={handleCancel}
                            className="px-3 py-1 text-xs sm:text-sm bg-gray-400 text-white rounded-lg hover:bg-gray-500"
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => handleEdit(u)}
                            className="px-3 py-1 text-xs sm:text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(u._id)}
                            className="px-3 py-1 text-xs sm:text-sm bg-red-500 text-white rounded-lg hover:bg-red-600"
                          >
                            Delete
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
