import React, { useState } from "react";
import axios from "axios";
import { useAuth, useUser } from "@clerk/clerk-react";
import ReviewerNavbar from "../../components/ReviewerNavbar";
import CompanyList from "./CompanyList";
import { Building2 } from "lucide-react";
import PhotoPicker from "../../components/PhotoPicker";
import { Page, PageHeader } from "../../components/ui";

const AddCompany = () => {
  const { getToken } = useAuth();
  const { user, isLoaded } = useUser();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phoneNumber: "",
  });

  const [photo, setPhoto] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  const backendUrl = import.meta.env.VITE_BACKEND_URL;

  if (!isLoaded) return null;

  const department = user?.publicMetadata?.department;

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setLoading(true);
    setMessage("Submitting...");

    try {
      const token = await getToken();

      if (!department) {
        setMessage("❌ Department not assigned to your account");
        setLoading(false);
        return;
      }

      const data = new FormData();

      data.append("name", formData.name.trim());
      data.append("email", formData.email.trim());

      if (formData.phoneNumber.trim()) {
        data.append("phoneNumber", formData.phoneNumber.trim());
      }

      data.append("department", department);

      if (photo) {
        data.append("image", photo);
      }

      const res = await axios.post(
        `${backendUrl}/api/company/add`,
        data,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (res.data.alreadyExists) {
        setMessage(
          "ℹ️ Company already exists. Your department has been linked."
        );
      } else if (res.data.ok) {
        setMessage("✅ Company added successfully!");
      } else {
        setMessage(`❌ ${res.data.message}`);
      }

      setRefreshKey((prev) => prev + 1);

      setFormData({
        name: "",
        email: "",
        phoneNumber: "",
      });

      setPhoto(null);
    } catch (err) {
      console.error("Failed to add company:", err);

      setMessage(
        `❌ ${
          err.response?.data?.message ||
          "Failed to add company"
        }`
      );
    } finally {
      setLoading(false);
    }
  };

  const isError = message.startsWith("❌");

  return (
    <>
      <ReviewerNavbar />

      <Page>
        <PageHeader
          icon={Building2}
          title="Companies"
          subtitle="Add a company login and link it to your department"
          actions={
            <span className="badge badge-blue text-sm">
              Department:{" "}
              <span className="font-extrabold uppercase">{department || "Not assigned"}</span>
            </span>
          }
        />

        {/* ================= ADD COMPANY CARD ================= */}
        <div className="card mb-8 p-5 md:p-6">
          <h2 className="mb-4 text-lg font-bold text-slate-800">Add Company</h2>

          <form onSubmit={handleSubmit} encType="multipart/form-data">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
              <label className="block">
                <span className="label">Company Name *</span>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  placeholder="Enter company name"
                  className="input"
                />
              </label>

              <label className="block">
                <span className="label">Email *</span>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  placeholder="company@example.com"
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
                  placeholder="Optional"
                  className="input"
                />
              </label>

              <PhotoPicker label="Company Logo" file={photo} onChange={setPhoto} />
            </div>

            <div className="mt-5 flex flex-col-reverse items-stretch gap-3 sm:flex-row sm:items-center sm:justify-end">
              {message && (
                <p
                  className={`text-sm font-medium ${
                    isError ? "text-rose-600" : "text-emerald-700"
                  }`}
                >
                  {message}
                </p>
              )}
              <button type="submit" disabled={loading} className="btn btn-primary">
                {loading ? "Saving..." : "Add Company"}
              </button>
            </div>
          </form>
        </div>

        {/* ================= COMPANY LIST ================= */}
        <CompanyList refreshKey={refreshKey} />
      </Page>
    </>
  );
};

export default AddCompany;
