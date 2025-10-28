// src/pages/students/InternshipApplicationForm.jsx
import { useState } from "react";
import { useAuth } from "@clerk/clerk-react";
import axios from "axios";
import { toast } from "react-toastify";
import StudentNavbar from "../../components/StudentNavbar";

const initialFormState = {
  department: "",
  regNumber: "",
  name: "",
  phoneNumber: "",
  image: "",
  subName: "",
  internhsipType: "",
  companyName: "",
  companyVillage: "",
  companyCity: "",
  companyTaluk: "",
  companyDistrict: "",
  companyState: "",
  companyContact: "",
  companyEmail: "",
  contactPerson: "",
  companyProfile: "",
  startDate: "",
  endDate: "",
  workingHours: "",
  duties: "",
  tasks: "",
  expectedSkills: "",
  expectedTools: "",
  expectedChallenges: "",
  learningOutcomes: "",
  jobOpportunity: "",
  stipendAmount: "", // 🆕 optional field
  PlacedCompany: "", // 🆕 optional field
  jobPackage: "", // 🆕 optional field
};

export default function InternshipApplicationForm() {
  const { getToken } = useAuth();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState(initialFormState);

  const backendUrl = import.meta.env.VITE_BACKEND_URL;
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Required fields check
    const requiredFields = {
      department: "Department",
      regNumber: "Register Number",
      name: "Name",
      phoneNumber: "Phone Number",
      image: "Student Image URL",
      subName: "Subject Name",
      companyName: "Company Name",
      companyVillage: "Company Village",
      companyCity: "Company City",
      companyTaluk: "Company Taluk",
      companyDistrict: "Company District",
      companyState: "Company State",
      companyContact: "Company Contact Number",
      companyEmail: "Company Email",
      contactPerson: "Contact Person",
      companyProfile: "Company Profile",
      startDate: "Start Date",
      endDate: "End Date",
    };

    for (const [key, label] of Object.entries(requiredFields)) {
      if (
        !form[key] ||
        (typeof form[key] === "string" && form[key].trim() === "")
      ) {
        alert(`❌ ${label} is required`);
        return;
      }
    }

    const formData = new FormData();
    Object.keys(form).forEach((key) => {
      formData.append(key, form[key]);
    });

    try {
      setLoading(true);
      const token = await getToken();

      const res = await axios.post(
        backendUrl + "/api/students/create",
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      toast.success(res.data.message || "Application submitted successfully!", {
        position: "top-center",
      });
      setForm(initialFormState);
    } catch (err) {
      console.error(
        "Error submitting application:",
        err.response?.data || err.message
      );
      toast.error(
        err.response?.data?.message || "Error submitting application.",
        {
          position: "top-center",
        }
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <StudentNavbar />
      <div className="max-w-4xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-6">Internship Application</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Personal Info */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block font-medium">Department *</label>
              <select
                name="department"
                value={form.department}
                onChange={handleChange}
                className="w-full border p-2 rounded"
                required
              >
                <option value="">Select Department</option>
                <option value="at">Automobile Engineering</option>
                <option value="ch">Chemical Engineering</option>
                <option value="ce">Civil Engineering</option>
                <option value="cs">Computer Science Engineering</option>
                <option value="ec">
                  Electronics & Communication Engineering
                </option>
                <option value="eee">
                  Electrical & Electronics Engineering
                </option>
                <option value="me">Mechanical Engineering</option>
                <option value="po">Polymer Engineering</option>
              </select>
            </div>

            <div>
              <label className="block font-medium">Register Number *</label>
              <input
                type="text"
                name="regNumber"
                value={form.regNumber}
                onChange={handleChange}
                className="w-full border p-2 rounded"
                required
              />
            </div>

            <div>
              <label className="block font-medium">Name *</label>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                className="w-full border p-2 rounded"
                required
              />
            </div>

            <div>
              <label className="block font-medium">Phone Number *</label>
              <input
                type="tel"
                name="phoneNumber"
                value={form.phoneNumber}
                onChange={handleChange}
                className="w-full border p-2 rounded"
                pattern="[0-9]{10}"
                placeholder="10-digit phone number / donot give space"
                required
              />
            </div>
            <div>
              <label className="block font-medium">Student Image *</label>
              <input
                type="file"
                name="image"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files[0];
                  if (file) {
                    setForm({ ...form, image: file }); // store file object
                  }
                }}
                className="w-full border p-2 rounded"
                required
              />
              {form.image && (
                <img
                  src={URL.createObjectURL(form.image)}
                  alt="Preview"
                  className="mt-2 w-24 h-24 object-cover rounded border"
                />
              )}
            </div>

            <div>
              <label className="block font-medium">Subject Name *</label>
              <input
                type="text"
                name="subName"
                value={form.subName}
                onChange={handleChange}
                className="w-full border p-2 rounded"
                required
              />
            </div>
          </div>

          {/* Company Info */}
          <h2 className="text-lg font-semibold mt-4">Company Information</h2>

          <div className="grid md:grid-cols-2 gap-4">
            <select
              name="internhsipType"
              value={form.internhsipType}
              onChange={handleChange}
              className="w-full border p-2 rounded"
              required
            >
              <option value="">Select Type</option>
              <option value="Internship">Internship</option>
              <option value="Project">Project</option>
            </select>
            <input
              type="text"
              name="companyName"
              placeholder="Company Name *"
              value={form.companyName}
              onChange={handleChange}
              className="w-full border p-2 rounded"
              required
            />
            <input
              type="text"
              name="companyVillage"
              placeholder="Village/Area/Block *"
              value={form.companyVillage}
              onChange={handleChange}
              className="w-full border p-2 rounded"
              required
            />
            <input
              type="text"
              name="companyCity"
              placeholder="City (Company Location) *"
              value={form.companyCity}
              onChange={handleChange}
              className="w-full border p-2 rounded"
              required
            />
            <input
              type="text"
              name="companyTaluk"
              placeholder="Taluk (Company Location) *"
              value={form.companyTaluk}
              onChange={handleChange}
              className="w-full border p-2 rounded"
              required
            />
            <input
              type="text"
              name="companyDistrict"
              placeholder="District (Company Location) *"
              value={form.companyDistrict}
              onChange={handleChange}
              className="w-full border p-2 rounded"
              required
            />
            <input
              type="text"
              name="companyState"
              placeholder="State  (Company Location) *"
              value={form.companyState}
              onChange={handleChange}
              className="w-full border p-2 rounded"
              required
            />
            <input
              type="tel"
              name="companyContact"
              placeholder="Company Contact Number * "
              value={form.companyContact}
              onChange={handleChange}
              className="w-full border p-2 rounded"
              required
            />
            <input
              type="email"
              name="companyEmail"
              placeholder="Company Email Id *"
              value={form.companyEmail}
              onChange={handleChange}
              className="w-full border p-2 rounded"
              required
            />
            <input
              type="text"
              name="contactPerson"
              placeholder="Contact Person (HR/Team Lead) *"
              value={form.contactPerson}
              onChange={handleChange}
              className="w-full border p-2 rounded"
              required
            />
          </div>

          <textarea
            name="companyProfile"
            placeholder="Company Profile (Established date, products/services, turnover, website) *"
            value={form.companyProfile}
            onChange={handleChange}
            className="w-full border p-2 rounded h-24"
            required
          ></textarea>

          {/* Internship Info */}
          <h2 className="text-lg font-semibold mt-4">Internship Details</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block font-medium">
                Internship Start Date *
              </label>
              <input
                type="date"
                name="startDate"
                value={form.startDate}
                onChange={handleChange}
                className="w-full border p-2 rounded"
                required
              />
            </div>
            <div>
              <label className="block font-medium">Internship End Date *</label>
              <input
                type="date"
                name="endDate"
                value={form.endDate}
                onChange={handleChange}
                className="w-full border p-2 rounded"
                required
              />
            </div>
            <input
              type="text"
              name="workingHours"
              placeholder="Working Hours *"
              value={form.workingHours}
              onChange={handleChange}
              className="w-full border p-2 rounded"
              required
            />
          </div>

          <textarea
            name="duties"
            placeholder="Nature of Job / Duties *"
            value={form.duties}
            onChange={handleChange}
            className="w-full border p-2 rounded h-20"
            required
          ></textarea>

          <textarea
            name="tasks"
            placeholder="Details of Tasks/Projects *"
            value={form.tasks}
            onChange={handleChange}
            className="w-full border p-2 rounded h-20"
            required
          ></textarea>

          <textarea
            name="expectedSkills"
            placeholder="Expected Skills to Acquire *"
            value={form.expectedSkills}
            onChange={handleChange}
            className="w-full border p-2 rounded h-20"
            required
          ></textarea>

          <textarea
            name="expectedTools"
            placeholder="Expected Tools/Software/Machine *"
            value={form.expectedTools}
            onChange={handleChange}
            className="w-full border p-2 rounded h-20"
            required
          ></textarea>

          <textarea
            name="expectedChallenges"
            placeholder="Expected Challenges *"
            value={form.expectedChallenges}
            onChange={handleChange}
            className="w-full border p-2 rounded h-20"
            required
          ></textarea>

          <textarea
            name="learningOutcomes"
            placeholder="Expected Learning Outcomes *"
            value={form.learningOutcomes}
            onChange={handleChange}
            className="w-full border p-2 rounded h-20"
            required
          ></textarea>

          <textarea
            name="jobOpportunity"
            placeholder="Expected Job Opportunity (same company / others) *"
            value={form.jobOpportunity}
            onChange={handleChange}
            className="w-full border p-2 rounded h-20"
            required
          ></textarea>

          {/* Optional Fields */}
          <h2 className="text-lg font-semibold mt-4">
            Additional Details (Optional)
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block font-medium">
                Stipend Amount (if any)
              </label>
              <input
                type="number"
                onWheel={(e) => e.target.blur()}
                name="stipendAmount"
                value={form.stipendAmount}
                onChange={handleChange}
                className="w-full border p-2 rounded"
                placeholder="Enter zero if you are not getting any stipend/salary during internship "
                min="0"
              />
            </div>

            <div>
              <label className="block font-medium">
                Placed Company (if placed after internship)
              </label>
              <input
                type="text"
                name="PlacedCompany"
                value={form.PlacedCompany}
                onChange={handleChange}
                className="w-full border p-2 rounded"
                placeholder="Company Name you placed through placement drive."
              />
            </div>

            <div>
              <label className="block font-medium">
                Job Package Details (if placed)
              </label>
              <input
                type="text"
                name="jobPackage"
                value={form.jobPackage}
                onChange={handleChange}
                className="w-full border p-2 rounded"
                placeholder="e.g., ₹4.5 LPA/ Job Salary/ do not enter intenship salary "
              />
            </div>
          </div>

          {/* Submit */}
          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Submitting..." : "Submit Application"}
          </button>

          {/* Transparent Loading Overlay */}
          {loading && (
            <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 backdrop-blur-sm z-50">
              <div className="flex flex-col items-center space-y-4">
                <div className="w-14 h-14 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
                <p className="text-white text-lg font-semibold animate-pulse">
                  Submitting...
                </p>
              </div>
            </div>
          )}
        </form>
      </div>
    </>
  );
}
