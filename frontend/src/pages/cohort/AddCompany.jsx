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

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPhoto(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("Submitting...");

    try {
      const token = await getToken();
      const department = user?.publicMetadata?.department;

      if (!department) {
        setMessage("❌ Department not assigned to your account");
        setLoading(false);
        return;
      }

      const data = new FormData();
      data.append("name", formData.name);
      data.append("email", formData.email);
      if (formData.phoneNumber)
        data.append("phoneNumber", formData.phoneNumber);
      data.append("department", department);
      if (photo) data.append("image", photo);

      const res = await axios.post(`${backendUrl}/api/company/add`, data, {
        headers: { Authorization: `Bearer ${token}` },
      });

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
      setFormData({ name: "", email: "", phoneNumber: "" });
      setPhoto(null);
      setPreview("");
    } catch (err) {
      console.error(err);
      setMessage("❌ Failed to add company");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <ReviewerNavbar />

      <div className=" bg-gray-100 p-4 md:p-6">
        <div className="max-w-5xl mx-auto">
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <h2 className="text-2xl font-bold mb-1">Add Company</h2>

            <p className="text-sm text-gray-600 mb-6">
              Company will be linked to{" "}
              <span className="font-semibold uppercase text-blue-600">
                {user?.publicMetadata?.department}
              </span>{" "}
              department
            </p>

            {/* ===== FORM (2 COLUMN) ===== */}
            <form
              onSubmit={handleSubmit}
              encType="multipart/form-data"
              className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 items-start"
            >
              {/* Company Name */}
              <div className="flex flex-col">
                <label className="text-sm font-semibold text-gray-700 mb-1">
                  Company Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="h-11 px-3 rounded-md border border-gray-400 
                 focus:border-blue-600 focus:ring-2 focus:ring-blue-200 
                 outline-none bg-white"
                />
              </div>

              {/* Email */}
              <div className="flex flex-col">
                <label className="text-sm font-semibold text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="h-11 px-3 rounded-md border border-gray-400 
                 focus:border-blue-600 focus:ring-2 focus:ring-blue-200 
                 outline-none bg-white"
                />
              </div>

              {/* Phone Number */}
              <div className="flex flex-col">
                <label className="text-sm font-semibold text-gray-700 mb-1">
                  Phone Number (optional)
                </label>
                <input
                  type="text"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleChange}
                  className="h-11 px-3 rounded-md border border-gray-400 
                 focus:border-blue-600 focus:ring-2 focus:ring-blue-200 
                 outline-none bg-white"
                />
              </div>

              {/* Logo Upload */}
              <div className="flex flex-col">
                <label className="text-sm font-semibold text-gray-700 mb-1">
                  Company Logo (optional)
                </label>

                <div
                  onClick={() => document.getElementById("logoUpload").click()}
                  className="h-11 px-3 flex items-center gap-3 rounded-md 
                 border border-dashed border-gray-400 
                 cursor-pointer hover:bg-blue-50 transition"
                >
                  {!preview ? (
                    <span className="text-sm text-gray-500">
                      Click to upload logo
                    </span>
                  ) : (
                    <>
                      <img
                        src={preview}
                        alt="Preview"
                        className="h-8 w-8 rounded-full object-cover border"
                      />
                      <span className="text-sm text-gray-600">
                        Logo selected
                      </span>
                    </>
                  )}
                </div>

                <input
                  id="logoUpload"
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>

              {/* Submit Button */}
              <div className="md:col-span-2 pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-11 rounded-md text-white font-semibold
                 bg-blue-600 hover:bg-blue-700 
                 disabled:opacity-50 transition shadow"
                >
                  {loading ? "Saving..." : "Add Company"}
                </button>
              </div>
            </form>

            {message && (
              <p className="mt-4 text-center font-medium text-gray-700">
                {message}
              </p>
            )}
          </div>
        </div>
      </div>
      <CompanyList refreshKey={refreshKey} />
    </>
  );
};

export default AddCompany;
