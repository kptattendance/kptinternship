// src/pages/hod/AddStaff.jsx
import { useState } from "react";
import axios from "axios";
import { useAuth, useUser } from "@clerk/clerk-react";
import { toast } from "react-toastify";
import { UserPlus } from "lucide-react";
import ReviewerNavbar from "../../components/ReviewerNavbar";
import { FilterSelect, Page, PageHeader } from "../../components/ui";
import { DEPARTMENT_OPTIONS } from "../../constants";

const ROLES = [{ value: "cohortOwner", label: "Cohort Owner" }];

export default function AddStaff() {
  const { getToken } = useAuth();
  const { user } = useUser();

  // An HOD can only add staff to their own department
  const ownDepartment = user?.publicMetadata?.department || "";
  const isHod = user?.publicMetadata?.role === "hod";

  const emptyForm = {
    email: "",
    name: "",
    phoneNumber: "",
    role: "cohortOwner",
    department: isHod ? ownDepartment : "",
  };

  const [form, setForm] = useState(emptyForm);
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
        backendUrl + "/api/users/create",
        { ...form, department: isHod ? ownDepartment : form.department },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success(res.data.message || "Staff added successfully!");
      setForm(emptyForm);
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
      <Page className="max-w-3xl">
        <PageHeader
          icon={UserPlus}
          title="Add Staff"
          subtitle="Create a cohort owner login for your department"
        />

        <form onSubmit={handleSubmit} className="card space-y-5 p-5 sm:p-7">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <label className="block sm:col-span-2">
              <span className="label">Name *</span>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                className="input"
                placeholder="Full name"
                required
              />
            </label>

            <label className="block">
              <span className="label">Email *</span>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                className="input"
                placeholder="name@example.com"
                required
              />
            </label>

            <label className="block">
              <span className="label">Phone Number *</span>
              <input
                type="tel"
                name="phoneNumber"
                value={form.phoneNumber}
                onChange={handleChange}
                className="input"
                pattern="[0-9]{10}"
                placeholder="10-digit number"
                required
              />
            </label>

            <FilterSelect
              label="Role *"
              name="role"
              value={form.role}
              onChange={(value) => setForm({ ...form, role: value })}
              options={ROLES}
              required
            />

            <FilterSelect
              label="Department *"
              name="department"
              value={isHod ? ownDepartment : form.department}
              onChange={(value) => setForm({ ...form, department: value })}
              allLabel="Select department"
              options={DEPARTMENT_OPTIONS}
              disabled={isHod}
              required
            />
          </div>

          <button type="submit" disabled={loading} className="btn btn-primary w-full py-3">
            {loading ? "Saving..." : "Save Staff"}
          </button>
        </form>
      </Page>
    </>
  );
}
