import React, { useState } from "react";
import axios from "axios";
import { useAuth } from "@clerk/clerk-react";
import ReviewerNavbar from "../../components/ReviewerNavbar";
import { FiUpload, FiUserPlus } from "react-icons/fi";

const PlacementAddUser = () => {
  const { getToken } = useAuth();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phoneNumber: "",
    role: "hod",
    department: "cs",
  });

  const [photo, setPhoto] = useState(null);
  const [preview, setPreview] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const backendUrl = import.meta.env.VITE_BACKEND_URL;

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
        setFormData({
          name: "",
          email: "",
          phoneNumber: "",
          role: "hod",
          department: "cs",
        });
        setPhoto(null);
        setPreview("");
      } else {
        setMessage(`❌ ${res.data.message || res.data.error}`);
      }
    } catch (err) {
      console.error(err);
      setMessage("❌ Failed to add user");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <ReviewerNavbar />

      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
        <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white">
            <div className="flex items-center gap-3">
              <FiUserPlus size={28} />
              <h2 className="text-2xl font-bold">Add Staff / Authority</h2>
            </div>
            <p className="text-sm text-blue-100 mt-1">
              Create HOD, Cohort Owner or Principal account
            </p>
          </div>

          {/* Form */}
          <form
            onSubmit={handleSubmit}
            encType="multipart/form-data"
            className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6"
          >
            {/* Name */}
            <div>
              <label className="text-sm font-semibold text-gray-700">
                Full Name
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="mt-1 w-full h-11 px-3 rounded-lg border border-gray-300
                focus:ring-2 focus:ring-blue-400 focus:border-blue-500 outline-none"
              />
            </div>

            {/* Email */}
            <div>
              <label className="text-sm font-semibold text-gray-700">
                Email Address
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="mt-1 w-full h-11 px-3 rounded-lg border border-gray-300
                focus:ring-2 focus:ring-blue-400 focus:border-blue-500 outline-none"
              />
            </div>

            {/* Phone */}
            <div>
              <label className="text-sm font-semibold text-gray-700">
                Phone Number
              </label>
              <input
                type="text"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleChange}
                className="mt-1 w-full h-11 px-3 rounded-lg border border-gray-300
                focus:ring-2 focus:ring-blue-400 focus:border-blue-500 outline-none"
              />
            </div>

            {/* Role */}
            <div>
              <label className="text-sm font-semibold text-gray-700">
                Role
              </label>
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="mt-1 w-full h-11 px-3 rounded-lg border border-gray-300
                focus:ring-2 focus:ring-indigo-400 focus:border-indigo-500 outline-none"
              >
                <option value="hod">HOD</option>
                <option value="cohortOwner">Cohort Owner</option>
                <option value="principal">Principal</option>
              </select>
            </div>

            {/* Department */}
            <div>
              <label className="text-sm font-semibold text-gray-700">
                Department
              </label>
              <select
                name="department"
                value={formData.department}
                onChange={handleChange}
                className="mt-1 w-full h-11 px-3 rounded-lg border border-gray-300
                focus:ring-2 focus:ring-purple-400 focus:border-purple-500 outline-none"
              >
                <option value="at">Automation Engineering</option>
                <option value="ce">Civil Engineering</option>
                <option value="ch">Chemical Engineering</option>
                <option value="cs">Computer Science Engineering</option>
                <option value="ec">
                  Electronics & Communication Engineering
                </option>
                <option value="eee">
                  Electrical & Electronics Engineering
                </option>
                <option value="me">Mechanical Engineering</option>
                <option value="po">Polymer Technology</option>
              </select>
            </div>

            {/* Photo Upload */}
            <div className="md:col-span-2">
              <label className="text-sm font-semibold text-gray-700">
                Profile Photo
              </label>

              <label
                className="mt-2 flex items-center justify-between px-4 h-14
                border-2 border-dashed rounded-xl cursor-pointer
                hover:bg-blue-50 transition"
              >
                <div className="flex items-center gap-3 text-gray-600">
                  <FiUpload size={20} />
                  <span className="text-sm">
                    {photo ? photo.name : "Click to upload image"}
                  </span>
                </div>
                {preview && (
                  <img
                    src={preview}
                    alt="Preview"
                    className="h-10 w-10 rounded-full object-cover border"
                  />
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
            </div>

            {/* Submit */}
            <div className="md:col-span-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full h-12 rounded-xl font-semibold text-white
                bg-gradient-to-r from-blue-600 to-indigo-600
                hover:from-blue-700 hover:to-indigo-700
                disabled:opacity-60 shadow-lg transition"
              >
                {loading ? "Saving..." : "Add User"}
              </button>
            </div>
          </form>

          {/* Message */}
          {message && (
            <div className="px-6 pb-6 text-center font-medium text-gray-700">
              {message}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default PlacementAddUser;
