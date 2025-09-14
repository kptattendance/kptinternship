// src/pages/hod/AddStaff.jsx
import { useState } from "react";
import axios from "axios";
import { useAuth } from "@clerk/clerk-react";
import ReviewerNavbar from "../../components/ReviewerNavbar"; // HOD navbar
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const DEPARTMENTS = [
  { value: "at", label: "Automobile Engineering" },
  { value: "ch", label: "Chemical Engineering" },
  { value: "ce", label: "Civil Engineering" },
  { value: "cs", label: "Computer Science Engineering" },
  { value: "ec", label: "Electronics & Communication Engineering" },
  { value: "eee", label: "Electrical & Electronics Engineering" },
  { value: "me", label: "Mechanical Engineering" },
  { value: "po", label: "Polymer Engineering" },
];

const ROLES = [{ value: "cohortOwner", label: "Cohort Owner" }];

export default function AddStaff() {
  const { getToken } = useAuth();

  const [form, setForm] = useState({
    email: "",
    name: "",
    phoneNumber: "",
    role: "",
    department: "",
  });
  const [loading, setLoading] = useState(false);

  const backendUrl = import.meta.env.VITE_BACKEND_URL;
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);
      const token = await getToken();

      const res = await axios.post(
        backendUrl + "/api/users/add-staff", // 👈 backend route
        form,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success(res.data.message || "Staff added successfully!");
      setForm({
        email: "",
        name: "",
        phoneNumber: "",
        role: "",
        department: "",
      });
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Error adding staff");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <ReviewerNavbar />
      <div className="max-w-2xl mx-auto p-6">
        <h2 className="text-2xl font-bold mb-6">Add Staff</h2>

        <form
          onSubmit={handleSubmit}
          className="bg-white p-6 rounded-lg shadow-md space-y-4"
        >
          {/* Name */}
          <div>
            <label className="block font-medium">Name *</label>
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              className="w-full border p-2 rounded mt-1"
              required
            />
          </div>

          {/* Email */}
          <div>
            <label className="block font-medium">Email *</label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              className="w-full border p-2 rounded mt-1"
              required
            />
          </div>

          {/* Phone */}
          <div>
            <label className="block font-medium">Phone Number *</label>
            <input
              type="tel"
              name="phoneNumber"
              value={form.phoneNumber}
              onChange={handleChange}
              className="w-full border p-2 rounded mt-1"
              pattern="[0-9]{10}"
              placeholder="10-digit number"
              required
            />
          </div>

          {/* Role */}
          <div>
            <label className="block font-medium">Role *</label>
            <select
              name="role"
              value={form.role}
              onChange={handleChange}
              className="w-full border p-2 rounded mt-1"
              required
            >
              <option value="">Select Role</option>
              {ROLES.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>

          {/* Department */}
          <div>
            <label className="block font-medium">Department *</label>
            <select
              name="department"
              value={form.department}
              onChange={handleChange}
              className="w-full border p-2 rounded mt-1"
              required
            >
              <option value="">Select Department</option>
              {DEPARTMENTS.map((d) => (
                <option key={d.value} value={d.value}>
                  {d.label}
                </option>
              ))}
            </select>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Saving..." : "Save Staff"}
          </button>
        </form>
      </div>
    </>
  );
}
