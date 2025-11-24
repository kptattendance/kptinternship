import React, { useState } from "react";
import axios from "axios";
import { useAuth } from "@clerk/clerk-react";
import ReviewerNavbar from "../../components/ReviewerNavbar";

const PlacementAddCompany = () => {
  const { getToken } = useAuth();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phoneNumber: "",
  });
  const [photo, setPhoto] = useState(null); // optional logo
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
    setLoading(true);
    setMessage("Submitting...");

    try {
      const token = await getToken();

      const data = new FormData();
      data.append("name", formData.name);
      data.append("email", formData.email);
      if (formData.phoneNumber)
        data.append("phoneNumber", formData.phoneNumber);
      data.append("role", "company"); // fixed role
      if (photo) data.append("image", photo);

      const res = await axios.post(`${backendUrl}/api/users/create`, data, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.data.ok) {
        setMessage("✅ Company added successfully!");
        setFormData({ name: "", email: "", phoneNumber: "" });
        setPhoto(null);
        setPreview("");
      } else {
        setMessage(`❌ ${res.data.message || res.data.error}`);
      }
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
      <div className="max-w-md mx-auto bg-white shadow-lg rounded-lg p-6">
        <h2 className="text-xl font-bold mb-4">Add Company</h2>

        <form
          onSubmit={handleSubmit}
          encType="multipart/form-data"
          className="space-y-4"
        >
          <div>
            <label className="block font-medium">Company Name</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full border p-2 rounded"
            />
          </div>

          <div>
            <label className="block font-medium">Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full border p-2 rounded"
            />
          </div>

          <div>
            <label className="block font-medium">Phone Number (optional)</label>
            <input
              type="text"
              name="phoneNumber"
              value={formData.phoneNumber}
              onChange={handleChange}
              className="w-full border p-2 rounded"
            />
          </div>
          <div>
            <label className="block font-medium mb-1">
              Company Logo (optional)
            </label>

            {/* Upload Box */}
            <div
              onClick={() => document.getElementById("logoUpload").click()}
              className="border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 transition"
            >
              {!preview ? (
                <>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-10 w-10 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M3 16l5-5 4 4 6-6 3 3M3 20h18"
                    />
                  </svg>
                  <p className="text-gray-500 mt-2 text-sm">
                    Click to upload logo (PNG/JPG)
                  </p>
                </>
              ) : (
                <>
                  <img
                    src={preview}
                    alt="Preview"
                    className="h-24 w-24 rounded-full object-cover border shadow"
                  />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setPreview("");
                      setPhoto(null);
                    }}
                    className="mt-3 text-red-500 text-sm underline"
                  >
                    Remove Image
                  </button>
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

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Saving..." : "Add Company"}
          </button>
        </form>

        {message && <p className="mt-4 text-center">{message}</p>}
      </div>
    </>
  );
};

export default PlacementAddCompany;
