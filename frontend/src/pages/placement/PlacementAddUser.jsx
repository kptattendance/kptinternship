import { useState } from "react";
import axios from "axios";
import { useAuth } from "@clerk/clerk-react";
import { UserPlus } from "lucide-react";
import ReviewerNavbar from "../../components/ReviewerNavbar";
import PhotoPicker from "../../components/PhotoPicker";
import { FilterSelect, Page, PageHeader } from "../../components/ui";
import { DEPARTMENT_OPTIONS } from "../../constants";

const ROLE_OPTIONS = [
  { value: "hod", label: "HOD" },
  { value: "cohortOwner", label: "Cohort Owner" },
  { value: "principal", label: "Principal" },
];

const EMPTY_FORM = {
  name: "",
  email: "",
  phoneNumber: "",
  role: "hod",
  department: "cs",
};

const PlacementAddUser = () => {
  const { getToken } = useAuth();

  const [formData, setFormData] = useState(EMPTY_FORM);
  const [photo, setPhoto] = useState(null); // already compressed by PhotoPicker
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const backendUrl = import.meta.env.VITE_BACKEND_URL;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!photo) {
      setMessage("❌ Please upload a profile photo");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const token = await getToken();
      const data = new FormData();

      Object.entries(formData).forEach(([k, v]) => data.append(k, v));
      data.append("image", photo);

      const res = await axios.post(`${backendUrl}/api/users/create`, data, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.data.ok) {
        setMessage("✅ User added successfully");
        setFormData(EMPTY_FORM);
        setPhoto(null);
      } else {
        setMessage(`❌ ${res.data.message || res.data.error}`);
      }
    } catch (err) {
      console.error(err);
      setMessage(`❌ ${err.response?.data?.message || "Failed to add user"}`);
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
          title="Add Staff / Authority"
          subtitle="Create an HOD, cohort owner or principal account"
        />

        <form onSubmit={handleSubmit} encType="multipart/form-data" className="card p-5 sm:p-7">
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <label className="block">
              <span className="label">Full Name *</span>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="input"
              />
            </label>

            <label className="block">
              <span className="label">Email Address *</span>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="input"
              />
            </label>

            <label className="block">
              <span className="label">Phone Number</span>
              <input
                type="tel"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleChange}
                className="input"
              />
            </label>

            <FilterSelect
              label="Role"
              name="role"
              value={formData.role}
              onChange={(value) => setFormData({ ...formData, role: value })}
              options={ROLE_OPTIONS}
            />

            <FilterSelect
              label="Department"
              name="department"
              value={formData.department}
              onChange={(value) => setFormData({ ...formData, department: value })}
              options={DEPARTMENT_OPTIONS}
            />

            <PhotoPicker label="Profile Photo" file={photo} onChange={setPhoto} required />
          </div>

          <button type="submit" disabled={loading} className="btn btn-primary mt-6 w-full py-3">
            {loading ? "Saving..." : "Add User"}
          </button>

          {message && (
            <p
              className={`mt-4 text-center text-sm font-medium ${
                message.startsWith("❌") ? "text-rose-600" : "text-emerald-700"
              }`}
            >
              {message}
            </p>
          )}
        </form>
      </Page>
    </>
  );
};

export default PlacementAddUser;
