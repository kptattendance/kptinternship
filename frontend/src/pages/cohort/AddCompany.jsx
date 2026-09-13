import React, { useState } from "react";
import axios from "axios";
import { useAuth, useUser } from "@clerk/clerk-react";
import ReviewerNavbar from "../../components/ReviewerNavbar";
import CompanyList from "./CompanyList";

const AddCompany = () => {
  const { getToken } = useAuth();
  const { user, isLoaded } = useUser();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phoneNumber: "",
  });

  const [photo, setPhoto] = useState(null);
  const [preview, setPreview] = useState("");
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

  const handleFileChange = (e) => {
    const file = e.target.files[0];

    if (file) {
      setPhoto(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const removePhoto = () => {
    setPhoto(null);
    setPreview("");

    const input = document.getElementById("logoUpload");

    if (input) {
      input.value = "";
    }
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
      setPreview("");

      const input = document.getElementById("logoUpload");

      if (input) {
        input.value = "";
      }
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

  return (
    <>
      <ReviewerNavbar />

      <div className="min-h-screen bg-gradient-to-br from-[#e0f2ff] via-[#f0e7ff] to-[#ffe7f5] p-4 md:p-5">
        <div className="max-w-7xl mx-auto">

          {/* ================= ADD COMPANY CARD ================= */}
          <div className="bg-white rounded-2xl shadow-lg p-5 md:p-6">

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-5">
              <div>
                <h2 className="text-xl md:text-2xl font-bold text-gray-800">
                  Add Company
                </h2>

                <p className="text-sm text-gray-500 mt-1">
                  Add a company and link it to your department.
                </p>
              </div>

              <div className="inline-flex items-center self-start md:self-auto gap-2 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-200">
                <span className="text-xs text-gray-500">
                  Department
                </span>

                <span className="text-sm font-bold uppercase text-blue-600">
                  {department || "Not Assigned"}
                </span>
              </div>
            </div>

            {/* ================= FORM ================= */}
            <form
              onSubmit={handleSubmit}
              encType="multipart/form-data"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">

                {/* Company Name */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Company Name
                  </label>

                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    placeholder="Enter company name"
                    className="w-full h-10 px-3 rounded-lg border border-gray-300
                    focus:border-blue-500 focus:ring-2 focus:ring-blue-200
                    outline-none transition"
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Email
                  </label>

                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    placeholder="company@example.com"
                    className="w-full h-10 px-3 rounded-lg border border-gray-300
                    focus:border-blue-500 focus:ring-2 focus:ring-blue-200
                    outline-none transition"
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Phone Number
                  </label>

                  <input
                    type="text"
                    name="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={handleChange}
                    placeholder="Optional"
                    className="w-full h-10 px-3 rounded-lg border border-gray-300
                    focus:border-blue-500 focus:ring-2 focus:ring-blue-200
                    outline-none transition"
                  />
                </div>

                {/* Logo */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Company Logo
                  </label>

                  <div className="flex items-center gap-2">

                    <label
                      htmlFor="logoUpload"
                      className="flex-1 h-10 px-3 flex items-center
                      border border-dashed border-gray-300 rounded-lg
                      cursor-pointer hover:bg-blue-50 transition
                      text-sm text-gray-500 truncate"
                    >
                      {photo
                        ? photo.name
                        : "Choose logo (optional)"}
                    </label>

                    {preview && (
                      <div className="relative shrink-0">
                        <img
                          src={preview}
                          alt="Company logo preview"
                          className="h-10 w-10 rounded-lg object-cover border"
                        />

                        <button
                          type="button"
                          onClick={removePhoto}
                          className="absolute -top-2 -right-2
                          h-5 w-5 rounded-full bg-red-600
                          text-white text-xs flex items-center
                          justify-center hover:bg-red-700"
                        >
                          ×
                        </button>
                      </div>
                    )}

                    <input
                      id="logoUpload"
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </div>
                </div>
              </div>

              {/* Submit */}
              <div className="mt-5 flex justify-end">
                <button
                  type="submit"
                  disabled={loading}
                  className="h-10 px-7 rounded-lg bg-blue-600
                  hover:bg-blue-700 text-white font-semibold
                  shadow-sm transition disabled:opacity-50
                  disabled:cursor-not-allowed"
                >
                  {loading ? "Saving..." : "Add Company"}
                </button>
              </div>
            </form>

            {/* Message */}
            {message && (
              <div className="mt-4 text-center text-sm font-medium text-gray-700">
                {message}
              </div>
            )}
          </div>

          {/* ================= COMPANY LIST ================= */}
          <CompanyList refreshKey={refreshKey} />

        </div>
      </div>
    </>
  );
};

export default AddCompany;