import React, { useState } from "react";
import axios from "axios";
import { useAuth } from "@clerk/clerk-react";
import ReviewerNavbar from "../../components/ReviewerNavbar";
import { FiUpload } from "react-icons/fi"; // ✅ Upload icon

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
      setMessage("❌ Please select a photo");
      return;
    }

    setLoading(true);
    setMessage("Submitting...");

    try {
      const token = await getToken();

      const data = new FormData();
      data.append("name", formData.name);
      data.append("email", formData.email);
      data.append("phoneNumber", formData.phoneNumber);
      data.append("role", formData.role);
      data.append("department", formData.department);
      data.append("image", photo);

      const res = await axios.post(`${backendUrl}/api/users/create`, data, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.data.ok) {
        setMessage("✅ User added successfully!");
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
      <div className="max-w-md mx-auto bg-white shadow-lg rounded-lg p-6">
        <h2 className="text-xl font-bold mb-4">
          Add HOD / Cohort Owner / Principal
        </h2>

        <form
          onSubmit={handleSubmit}
          encType="multipart/form-data"
          className="space-y-4"
        >
          {/* Name */}
          <div>
            <label className="block font-medium">Name</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full border p-2 rounded"
            />
          </div>

          {/* Email */}
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

          {/* Phone */}
          <div>
            <label className="block font-medium">Phone Number</label>
            <input
              type="text"
              name="phoneNumber"
              value={formData.phoneNumber}
              onChange={handleChange}
              className="w-full border p-2 rounded"
            />
          </div>

          {/* Role */}
          <div>
            <label className="block font-medium">Role</label>
            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
              className="w-full border p-2 rounded"
            >
              <option value="hod">HOD</option>
              <option value="cohortOwner">Cohort Owner</option>
              <option value="principal">Principal</option> {/* ✅ Added */}
            </select>
          </div>

          {/* Department */}
          <div>
            <label className="block font-medium">Department</label>
            <select
              name="department"
              value={formData.department}
              onChange={handleChange}
              className="w-full border p-2 rounded"
            >
              <option value="cs">Computer Science</option>
              <option value="ce">Civil</option>
              <option value="eee">EEE</option>
              <option value="me">Mechanical</option>
              <option value="po">PO</option>
              <option value="ch">Chemical</option>
              <option value="at">AT</option>
              <option value="ec">ECE</option>
            </select>
          </div>

          {/* Photo with Upload Icon */}
          <div>
            <label className="block font-medium mb-1">Photo</label>
            <label className="flex items-center gap-2 cursor-pointer border p-2 rounded hover:bg-gray-100">
              <FiUpload size={20} />
              <span>{photo ? photo.name : "Choose an image"}</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
                name="image" // ✅ Important
              />
            </label>
            {preview && (
              <img
                src={preview}
                alt="Preview"
                className="h-20 w-20 mt-2 rounded-full border object-cover"
              />
            )}
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Saving..." : "Add User"}
          </button>
        </form>

        {message && <p className="mt-4 text-center">{message}</p>}
      </div>
    </>
  );
};

export default PlacementAddUser;
