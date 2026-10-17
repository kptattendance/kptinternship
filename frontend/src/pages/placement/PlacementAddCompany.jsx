import { useState } from "react";
import axios from "axios";
import { useAuth } from "@clerk/clerk-react";
import { Building2 } from "lucide-react";
import ReviewerNavbar from "../../components/ReviewerNavbar";
import PhotoPicker from "../../components/PhotoPicker";
import { Page, PageHeader } from "../../components/ui";

const EMPTY_FORM = { name: "", email: "", phoneNumber: "" };

const PlacementAddCompany = () => {
  const { getToken } = useAuth();
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [photo, setPhoto] = useState(null); // optional logo (already compressed)
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const backendUrl = import.meta.env.VITE_BACKEND_URL;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const token = await getToken();

      const data = new FormData();
      data.append("name", formData.name);
      data.append("email", formData.email);
      if (formData.phoneNumber) data.append("phoneNumber", formData.phoneNumber);
      data.append("role", "company"); // fixed role
      if (photo) data.append("image", photo);

      const res = await axios.post(`${backendUrl}/api/users/create`, data, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.data.ok) {
        setMessage("✅ Company added successfully!");
        setFormData(EMPTY_FORM);
        setPhoto(null);
      } else {
        setMessage(`❌ ${res.data.message || res.data.error}`);
      }
    } catch (err) {
      console.error(err);
      setMessage(`❌ ${err.response?.data?.message || "Failed to add company"}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <ReviewerNavbar />
      <Page className="max-w-2xl">
        <PageHeader
          icon={Building2}
          title="Add Company"
          subtitle="Create a company login so they can enter marks and attendance"
        />

        <form onSubmit={handleSubmit} encType="multipart/form-data" className="card space-y-5 p-5 sm:p-7">
          <label className="block">
            <span className="label">Company Name *</span>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="input"
              placeholder="Company name"
            />
          </label>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <label className="block">
              <span className="label">Email *</span>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="input"
                placeholder="hr@company.com"
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
                placeholder="Optional"
              />
            </label>
          </div>

          <PhotoPicker label="Company Logo (optional)" file={photo} onChange={setPhoto} />

          <button type="submit" disabled={loading} className="btn btn-primary w-full py-3">
            {loading ? "Submitting..." : "Add Company"}
          </button>

          {message && (
            <p
              className={`text-center text-sm font-medium ${
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

export default PlacementAddCompany;
