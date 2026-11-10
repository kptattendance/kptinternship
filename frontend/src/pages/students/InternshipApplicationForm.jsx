// src/pages/students/InternshipApplicationForm.jsx

import { useEffect, useState } from "react";
import { useAuth } from "@clerk/clerk-react";
import axios from "axios";
import { toast } from "react-toastify";
import { ClipboardList } from "lucide-react";
import StudentNavbar from "../../components/StudentNavbar";
import { PageHeader } from "../../components/ui";
import { DEPARTMENTS } from "../../constants";
import {
  IMAGE_PRESETS,
  compressImage,
  formatFileSize,
} from "../../utils/compressImage";


// =============================================================
// INITIAL FORM STATE
// =============================================================

const initialFormState = {
  department: "",
  regNumber: "",
  name: "",
  phoneNumber: "",
  image: "",
  subName: "",
  internhsipType: "",
  projectTitle: "",
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

  startDate: "2026-12-19",
  endDate: "2027-04-13",

  workingHours: "",
  duties: "",
  tasks: "",
  expectedSkills: "",
  expectedTools: "",
  expectedChallenges: "",
  learningOutcomes: "",
  jobOpportunity: "",
  stipendAmount: "",
  PlacedCompany: "",
  jobPackage: "",
};


// =============================================================
// DEPARTMENT-WISE SUBJECT LIST
// =============================================================

const SUBJECTS_BY_DEPARTMENT = {
  ce: [
    {
      name: "Structural Engineering",
      code: "20CE51I",
      students: 24,
    },
    {
      name: "Transportation Engineering",
      code: "20CE53I",
      students: 18,
    },
  ],

  po: [
    {
      name: "Polymer Product Manufacturing Technology",
      code: "20PO51I",
      students: 31,
    },
  ],

  at: [
    {
      name: "Hybrid and Electric Vehicle",
      code: "20AT54I",
      students: 57,
    },
  ],

  cs: [
    {
      name: "Full Stack Development",
      code: "20CS52I",
      students: 64,
    },
  ],

  eee: [
    {
      name: "Electrical Utility Engineering",
      code: "20EE541",
      students: 61,
    },
  ],

  ch: [
    {
      name: "Process Plant Technology",
      code: "20CH54I",
      students: 63,
    },
  ],

  ec: [
    {
      name: "Automation and Robotics",
      code: "20EC531",
      students: 68,
    },
  ],

  me: [
    {
      name: "Advanced Manufacturing Technologies",
      code: "20ME53I",
      students: 60,
    },
  ],
};


// =============================================================
// REUSABLE UI COMPONENTS
// =============================================================

const SectionHeader = ({
  icon,
  title,
  description,
  color = "blue",
}) => {
  const colors = {
    blue: {
      wrapper: "bg-blue-50 border-blue-100",
      icon: "bg-white border-blue-100",
      title: "text-blue-950",
      text: "text-blue-700/70",
    },

    violet: {
      wrapper: "bg-violet-50 border-violet-100",
      icon: "bg-white border-violet-100",
      title: "text-violet-950",
      text: "text-violet-700/70",
    },

    emerald: {
      wrapper: "bg-emerald-50 border-emerald-100",
      icon: "bg-white border-emerald-100",
      title: "text-emerald-950",
      text: "text-emerald-700/70",
    },

    amber: {
      wrapper: "bg-amber-50 border-amber-100",
      icon: "bg-white border-amber-100",
      title: "text-amber-950",
      text: "text-amber-700/70",
    },
  };

  const c = colors[color];

  return (
    <div
      className={`rounded-2xl border px-4 py-4 sm:px-5 sm:py-5 mb-5 ${c.wrapper}`}
    >
      <div className="flex items-center gap-3">
        <div
          className={`w-11 h-11 rounded-xl border flex items-center justify-center text-xl shadow-sm ${c.icon}`}
        >
          {icon}
        </div>

        <div className="min-w-0">
          <h2
            className={`text-base sm:text-lg font-bold ${c.title}`}
          >
            {title}
          </h2>

          <p
            className={`text-xs sm:text-sm mt-0.5 ${c.text}`}
          >
            {description}
          </p>
        </div>
      </div>
    </div>
  );
};


const Field = ({
  form,
  handleChange,
  label,
  name,
  type = "text",
  placeholder,
  required = false,
  help,
  children,
}) => {
  return (
    <div className="space-y-1.5">
      <label
        htmlFor={name}
        className="block text-sm font-semibold text-slate-700"
      >
        {label}

        {required && (
          <span className="text-rose-500 ml-1">*</span>
        )}
      </label>

      {children ? (
        children
      ) : (
        <input
          id={name}
          type={type}
          name={name}
          value={form[name]}
          onChange={handleChange}
          placeholder={placeholder}
          required={required}
          min={type === "number" ? "0" : undefined}
          onWheel={
            type === "number"
              ? (e) => e.target.blur()
              : undefined
          }
          className="w-full h-11 px-3.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-800 placeholder:text-slate-400 outline-none transition-all focus:border-blue-400 focus:ring-4 focus:ring-blue-50 hover:border-slate-300"
        />
      )}

      {help && (
        <p className="text-[11px] leading-4 text-slate-400">
          {help}
        </p>
      )}
    </div>
  );
};


const TextAreaField = ({
  form,
  handleChange,
  label,
  name,
  placeholder,
  required = false,
  help,
  rows = 4,
}) => {
  return (
    <div className="space-y-1.5">
      <label
        htmlFor={name}
        className="block text-sm font-semibold text-slate-700"
      >
        {label}

        {required && (
          <span className="text-rose-500 ml-1">*</span>
        )}
      </label>

      <textarea
        id={name}
        name={name}
        value={form[name]}
        onChange={handleChange}
        placeholder={placeholder}
        required={required}
        rows={rows}
        className="w-full px-3.5 py-3 rounded-xl border border-slate-200 bg-white text-sm text-slate-800 placeholder:text-slate-400 outline-none resize-y transition-all focus:border-blue-400 focus:ring-4 focus:ring-blue-50 hover:border-slate-300"
      />

      {help && (
        <p className="text-[11px] leading-4 text-slate-400">
          {help}
        </p>
      )}
    </div>
  );
};


// =============================================================
// MAIN COMPONENT
// =============================================================

export default function InternshipApplicationForm() {
  const { getToken } = useAuth();

  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState(initialFormState);

  const [imagePreview, setImagePreview] = useState("");
  const [imageInfo, setImageInfo] = useState("");
  const [compressing, setCompressing] = useState(false);

  // Shrink the photo before upload (faster upload, less storage)
  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setCompressing(true);
    const compressed = await compressImage(file, IMAGE_PRESETS.profile);
    setCompressing(false);

    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImagePreview(URL.createObjectURL(compressed));
    setImageInfo(
      compressed.size < file.size
        ? `Compressed ${formatFileSize(file.size)} → ${formatFileSize(compressed.size)}`
        : formatFileSize(file.size)
    );

    setForm((prev) => ({ ...prev, image: compressed }));
  };

  const backendUrl = import.meta.env.VITE_BACKEND_URL;


  const isProject = form.internhsipType === "Project";
  const typeChosen = Boolean(form.internhsipType);
  const workLabel = isProject ? "Project" : "Internship";

  // ---------- Project guide: staff of the student's department ----------
  const [guides, setGuides] = useState([]);
  const [guidesLoading, setGuidesLoading] = useState(false);
  const [manualGuide, setManualGuide] = useState(false);

  useEffect(() => {
    if (!isProject || !form.department) {
      setGuides([]);
      return;
    }

    let cancelled = false;

    const fetchGuides = async () => {
      try {
        setGuidesLoading(true);
        const token = await getToken();
        const res = await axios.get(`${backendUrl}/api/users/guides`, {
          params: { department: form.department },
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!cancelled) setGuides(res.data.guides || []);
      } catch (err) {
        console.error("Failed to load guides:", err);
        if (!cancelled) setGuides([]);
      } finally {
        if (!cancelled) setGuidesLoading(false);
      }
    };

    fetchGuides();
    return () => {
      cancelled = true;
    };
  }, [isProject, form.department, getToken, backendUrl]);

  const handleGuideSelect = (e) => {
    const email = e.target.value;

    if (email === "__other__") {
      setManualGuide(true);
      setForm((prev) => ({ ...prev, contactPerson: "", companyEmail: "" }));
      return;
    }

    const guide = guides.find((g) => g.email === email);
    setManualGuide(false);
    setForm((prev) => ({
      ...prev,
      contactPerson: guide?.name || "",
      companyEmail: guide?.email || "",
    }));
  };

  // =============================================================
  // HANDLE FORM CHANGE
  // =============================================================

  const handleChange = (e) => {
    const { name, value } = e.target;

    // When department changes, clear previously selected subject
    if (name === "department") {
      setForm({
        ...form,
        department: value,
        subName: "",
      });

      return;
    }

    setForm({
      ...form,
      [name]: value,
    });
  };


  // =============================================================
  // SUBMIT FORM
  // =============================================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Required fields check — a college project needs no company address
    const requiredFields = {
      department: "Department",
      regNumber: "Register Number",
      name: "Name",
      phoneNumber: "Phone Number",
      image: "Student Image URL",
      subName: "Subject Name",
      internhsipType: "Internship / Project",
      ...(isProject
        ? {
            projectTitle: "Project Title",
            contactPerson: "Project Guide Name",
            companyEmail: "Guide / Supervisor Email",
            companyProfile: "Project Description",
          }
        : {
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
          }),
      startDate: "Start Date",
      endDate: "End Date",
    };

    for (const [key, label] of Object.entries(requiredFields)) {
      if (
        !form[key] ||
        (typeof form[key] === "string" &&
          form[key].trim() === "")
      ) {
        alert(`❌ ${label} is required`);
        return;
      }
    }


    // ===========================================================
    // CREATE FORM DATA
    // ===========================================================

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

      toast.success(
        res.data.message ||
          "Application submitted successfully!",
        {
          position: "top-center",
        }
      );

      setForm(initialFormState);
      if (imagePreview) URL.revokeObjectURL(imagePreview);
      setImagePreview("");
      setImageInfo("");

    } catch (err) {
      console.error(
        "Error submitting application:",
        err.response?.data || err.message
      );

      toast.error(
        err.response?.data?.message ||
          "Error submitting application.",
        {
          position: "top-center",
        }
      );

    } finally {
      setLoading(false);
    }
  };


  // =============================================================
  // JSX
  // =============================================================

  return (
    <>
      <StudentNavbar />

      <main className="page-bg">

        <div className="max-w-5xl mx-auto px-3 py-5 sm:px-5 sm:py-8 lg:px-8">

          <PageHeader
            icon={ClipboardList}
            title="Internship Application"
            subtitle="Fill in your details carefully — your application goes to the cohort owner, HOD, placement officer and principal for approval."
          />

          <form
            onSubmit={handleSubmit}
            className="space-y-6"
          >

            {/* =================================================
                1. STUDENT INFORMATION
            ================================================== */}

            <section className="bg-white rounded-3xl border border-blue-100 shadow-sm overflow-hidden">

              <SectionHeader
                icon="🎓"
                title="Student Information"
                description="Enter your personal and academic details."
                color="blue"
              />

              <div className="px-4 pb-5 sm:px-6 sm:pb-7">

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">


                  {/* DEPARTMENT */}

                  <Field
                    form={form}
                    handleChange={handleChange}
                    label="Department"
                    name="department"
                    required
                  >
                    <select
                      id="department"
                      name="department"
                      value={form.department}
                      onChange={handleChange}
                      required
                      className="w-full h-11 px-3.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-700 outline-none transition-all focus:border-blue-400 focus:ring-4 focus:ring-blue-50 hover:border-slate-300"
                    >
                      <option value="">
                        Select Department
                      </option>

                      {DEPARTMENTS.map((d) => (
                        <option key={d.value} value={d.value}>
                          {d.label}
                        </option>
                      ))}

                    </select>
                  </Field>


                  {/* REGISTER NUMBER */}

                  <Field
                    form={form}
                    handleChange={handleChange}
                    label="Register Number"
                    name="regNumber"
                    placeholder="Enter your register number"
                    required
                  />


                  {/* STUDENT NAME */}

                  <Field
                    form={form}
                    handleChange={handleChange}
                    label="Student Name"
                    name="name"
                    placeholder="Enter your full name"
                    required
                  />


                  {/* PHONE NUMBER */}

                  <Field
                    form={form}
                    handleChange={handleChange}
                    label="Phone Number"
                    name="phoneNumber"
                    type="tel"
                    placeholder="10-digit phone number"
                    required
                    help="Enter exactly 10 digits without spaces."
                  >
                    <input
                      id="phoneNumber"
                      type="tel"
                      name="phoneNumber"
                      value={form.phoneNumber}
                      onChange={handleChange}
                      pattern="[0-9]{10}"
                      placeholder="10-digit phone number"
                      required
                      className="w-full h-11 px-3.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-800 placeholder:text-slate-400 outline-none transition-all focus:border-blue-400 focus:ring-4 focus:ring-blue-50 hover:border-slate-300"
                    />
                  </Field>


                  {/* STUDENT IMAGE */}

                  <div className="space-y-1.5">

                    <label
                      htmlFor="image"
                      className="block text-sm font-semibold text-slate-700"
                    >
                      Student Photograph
                      <span className="text-rose-500 ml-1">
                        *
                      </span>
                    </label>

                    <div className="rounded-2xl border border-dashed border-blue-200 bg-blue-50/40 p-4">

                      <div className="flex flex-col sm:flex-row items-center gap-4">

                        <div className="w-24 h-24 rounded-2xl bg-white border border-blue-100 overflow-hidden flex items-center justify-center shrink-0 shadow-sm">

                          {imagePreview ? (
                            <img
                              src={imagePreview}
                              alt="Student Preview"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="text-center">
                              <div className="text-2xl">
                                📷
                              </div>

                              <span className="text-[10px] text-slate-400">
                                Preview
                              </span>
                            </div>
                          )}

                        </div>


                        <div className="w-full">

                          <input
                            id="image"
                            type="file"
                            name="image"
                            accept="image/*"
                            onChange={handleImageChange}
                            required
                            className="block w-full text-sm text-slate-500
                            file:mr-3 file:py-2.5 file:px-4
                            file:rounded-xl file:border-0
                            file:text-sm file:font-semibold
                            file:bg-blue-100 file:text-blue-700
                            hover:file:bg-blue-200
                            cursor-pointer"
                          />

                          <p className="mt-2 text-[11px] text-slate-400">
                            Upload a clear recent photograph. It is
                            compressed automatically before upload.
                          </p>

                          {(compressing || imageInfo) && (
                            <p className="mt-1 text-[11px] font-semibold text-emerald-600">
                              {compressing ? "Compressing photo..." : `✓ ${imageInfo}`}
                            </p>
                          )}

                        </div>

                      </div>

                    </div>

                  </div>


                  {/* SUBJECT */}

                  <Field
                    form={form}
                    handleChange={handleChange}
                    label="Subject"
                    name="subName"
                    required
                    help="Select the subject applicable to the selected department."
                  >

                    <select
                      id="subName"
                      name="subName"
                      value={form.subName}
                      onChange={handleChange}
                      required
                      disabled={!form.department}
                      className="w-full h-11 px-3.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-700 outline-none transition-all focus:border-blue-400 focus:ring-4 focus:ring-blue-50 hover:border-slate-300 disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed"
                    >

                      <option value="">
                        {form.department
                          ? "Select Subject"
                          : "Select Department First"}
                      </option>

                      {(
                        SUBJECTS_BY_DEPARTMENT[
                          form.department
                        ] || []
                      ).map((subject) => (

                        <option
                          key={subject.code}
                          value={`${subject.name} (${subject.code})`}
                        >
                          {subject.name} — {subject.code}
                        </option>

                      ))}

                    </select>

                  </Field>

                </div>

              </div>

            </section>


            {/* =================================================
                2. INTERNSHIP OR PROJECT
            ================================================== */}

            <section className="bg-white rounded-3xl border border-violet-100 shadow-sm overflow-hidden">

              <SectionHeader
                icon="🧭"
                title="Internship or Project?"
                description="Choose an internship at a company, or a project done at the college."
                color="violet"
              />

              <div className="px-4 pb-5 sm:px-6 sm:pb-7">

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4" role="radiogroup" aria-label="Internship or project">
                  {[
                    {
                      value: "Internship",
                      icon: "🏢",
                      title: "Internship at a company",
                      text: "You will work at an outside company or organisation.",
                    },
                    {
                      value: "Project",
                      icon: "🎓",
                      title: "Project at the college",
                      text: "You will do a project in the college under a guide.",
                    },
                  ].map((option) => {
                    const selected = form.internhsipType === option.value;
                    return (
                      <button
                        key={option.value}
                        type="button"
                        role="radio"
                        aria-checked={selected}
                        onClick={() =>
                          setForm({ ...form, internhsipType: option.value })
                        }
                        className={`text-left rounded-2xl border-2 p-4 sm:p-5 transition ${
                          selected
                            ? "border-violet-500 bg-violet-50 shadow-md ring-4 ring-violet-100"
                            : "border-slate-200 bg-white hover:border-violet-300 hover:bg-violet-50/40"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <span className="text-3xl">{option.icon}</span>
                          <div className="min-w-0">
                            <p className="font-bold text-slate-800">{option.title}</p>
                            <p className="mt-0.5 text-xs text-slate-500">{option.text}</p>
                          </div>
                          <span
                            className={`ml-auto mt-1 h-5 w-5 shrink-0 rounded-full border-2 ${
                              selected
                                ? "border-violet-600 bg-violet-600 shadow-[inset_0_0_0_3px_white]"
                                : "border-slate-300"
                            }`}
                          />
                        </div>
                      </button>
                    );
                  })}
                </div>

                {!typeChosen && (
                  <p className="mt-4 text-center text-sm text-slate-500">
                    Select one option to continue.
                  </p>
                )}

                {/* ---------- PROJECT AT COLLEGE ---------- */}
                {isProject && (
                  <div className="mt-6 space-y-5">

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

                      <div className="md:col-span-2">
                        <Field
                          form={form}
                          handleChange={handleChange}
                          label="Project Title"
                          name="projectTitle"
                          placeholder="e.g. Smart Attendance System using IoT"
                          required
                        />
                      </div>

                      <div className="md:col-span-2">
                        <Field
                          form={form}
                          handleChange={handleChange}
                          label="Project Guide"
                          name="guideSelect"
                          required
                          help={
                            form.department
                              ? "Your guide enters your attendance and internal marks (CIE-II, CIE-III) from their own login."
                              : "Select your department above to see the guides."
                          }
                        >
                          <select
                            id="guideSelect"
                            value={manualGuide ? "__other__" : form.companyEmail}
                            onChange={handleGuideSelect}
                            disabled={!form.department || guidesLoading}
                            required
                            className="w-full h-11 px-3.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-700 outline-none transition-all focus:border-violet-400 focus:ring-4 focus:ring-violet-50 hover:border-slate-300 disabled:bg-slate-100 disabled:text-slate-400"
                          >
                            <option value="">
                              {guidesLoading
                                ? "Loading guides..."
                                : form.department
                                ? "Select your guide"
                                : "Select department first"}
                            </option>
                            {guides.map((g) => (
                              <option key={g.email} value={g.email}>
                                {g.name || g.email} {g.role === "hod" ? "(HOD)" : "(Cohort Owner)"}
                              </option>
                            ))}
                            <option value="__other__">My guide is not in this list</option>
                          </select>
                        </Field>
                      </div>

                      {manualGuide && (
                        <>
                          <Field
                            form={form}
                            handleChange={handleChange}
                            label="Guide Name"
                            name="contactPerson"
                            placeholder="Name of your guide"
                            required
                          />

                          <Field
                            form={form}
                            handleChange={handleChange}
                            label="Guide Email"
                            name="companyEmail"
                            type="email"
                            placeholder="guide@example.com"
                            required
                            help="Ask your guide for the email they use to log in to this portal."
                          />
                        </>
                      )}

                      <Field
                        form={form}
                        handleChange={handleChange}
                        label="Guide Phone Number"
                        name="companyContact"
                        type="tel"
                        placeholder="Optional"
                      />

                    </div>

                    <TextAreaField
                      form={form}
                      handleChange={handleChange}
                      label="Project Description"
                      name="companyProfile"
                      placeholder="Briefly describe the project — the problem, what you will build and the technology used."
                      required
                      rows={5}
                    />

                  </div>
                )}

                {/* ---------- INTERNSHIP AT A COMPANY ---------- */}
                {typeChosen && !isProject && (
                  <div className="mt-6">

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

                      <Field
                        form={form}
                        handleChange={handleChange}
                        label="Company Name"
                        name="companyName"
                        placeholder="Enter company name"
                        required
                      />

                      <Field
                        form={form}
                        handleChange={handleChange}
                        label="Village / Area / Block"
                        name="companyVillage"
                        placeholder="Enter village, area or block"
                        required
                      />

                      <Field
                        form={form}
                        handleChange={handleChange}
                        label="City"
                        name="companyCity"
                        placeholder="Enter company city"
                        required
                      />

                      <Field
                        form={form}
                        handleChange={handleChange}
                        label="Taluk"
                        name="companyTaluk"
                        placeholder="Enter company taluk"
                        required
                      />

                      <Field
                        form={form}
                        handleChange={handleChange}
                        label="District"
                        name="companyDistrict"
                        placeholder="Enter company district"
                        required
                      />

                      <Field
                        form={form}
                        handleChange={handleChange}
                        label="State"
                        name="companyState"
                        placeholder="Enter company state"
                        required
                      />

                      <Field
                        form={form}
                        handleChange={handleChange}
                        label="Company Contact Number"
                        name="companyContact"
                        type="tel"
                        placeholder="Enter company contact number"
                        required
                      />

                      <Field
                        form={form}
                        handleChange={handleChange}
                        label="Company Email"
                        name="companyEmail"
                        type="email"
                        placeholder="company@example.com"
                        required
                        help="Attendance and internal marks (CIE-II, CIE-III) are entered from this email's login."
                      />

                      <Field
                        form={form}
                        handleChange={handleChange}
                        label="Contact Person"
                        name="contactPerson"
                        placeholder="HR / Team Lead / Supervisor"
                        required
                      />

                    </div>

                    <div className="mt-5">
                      <TextAreaField
                        form={form}
                        handleChange={handleChange}
                        label="Company Profile"
                        name="companyProfile"
                        placeholder="Briefly describe the company, products/services, established year, turnover, website, etc."
                        required
                        rows={5}
                        help="Provide enough information for the institution to understand the organization."
                      />
                    </div>

                  </div>
                )}

              </div>

            </section>


            {/* =================================================
                3. INTERNSHIP DETAILS
            ================================================== */}

            <section className="bg-white rounded-3xl border border-emerald-100 shadow-sm overflow-hidden">

              <SectionHeader
                icon="💼"
                title={`${workLabel} Details`}
                description={`Describe your ${workLabel.toLowerCase()} schedule, work and expected learning.`}
                color="emerald"
              />

              <div className="px-4 pb-5 sm:px-6 sm:pb-7">

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

                  <Field
                    form={form}
                    handleChange={handleChange}
                    label={`${workLabel} Start Date`}
                    name="startDate"
                    type="date"
                    required
                    help="You can change the default date if required."
                  />


                  <Field
                    form={form}
                    handleChange={handleChange}
                    label={`${workLabel} End Date`}
                    name="endDate"
                    type="date"
                    required
                  />


                  <Field
                    form={form}
                    handleChange={handleChange}
                    label="Working Hours"
                    name="workingHours"
                    placeholder="e.g. 9:00 AM - 5:00 PM"
                    required={!isProject}
                  />

                </div>


                <div className="mt-6 space-y-5">

                  <TextAreaField
                    form={form}
                    handleChange={handleChange}
                    label="Nature of Job / Duties"
                    name="duties"
                    placeholder="Describe the nature of work and responsibilities assigned to you."
                    required
                    rows={4}
                  />


                  <TextAreaField
                    form={form}
                    handleChange={handleChange}
                    label="Details of Tasks / Projects"
                    name="tasks"
                    placeholder="Describe the major tasks, projects or activities you expect to perform."
                    required
                    rows={4}
                  />


                  <TextAreaField
                    form={form}
                    handleChange={handleChange}
                    label="Expected Skills to Acquire"
                    name="expectedSkills"
                    placeholder="List the technical and professional skills you expect to develop."
                    required
                    rows={4}
                  />


                  <TextAreaField
                    form={form}
                    handleChange={handleChange}
                    label="Expected Tools / Software / Machines"
                    name="expectedTools"
                    placeholder="Mention the software, programming languages, tools, machines or technologies you expect to use."
                    required
                    rows={4}
                  />


                  <TextAreaField
                    form={form}
                    handleChange={handleChange}
                    label="Expected Challenges"
                    name="expectedChallenges"
                    placeholder="Describe the challenges you expect during the internship."
                    required
                    rows={4}
                  />


                  <TextAreaField
                    form={form}
                    handleChange={handleChange}
                    label="Expected Learning Outcomes"
                    name="learningOutcomes"
                    placeholder="Describe what you expect to learn or achieve by the end of the internship."
                    required
                    rows={4}
                  />


                  {!isProject && (
                    <TextAreaField
                      form={form}
                      handleChange={handleChange}
                      label="Expected Job Opportunity"
                      name="jobOpportunity"
                      placeholder="Mention possible job opportunities in the same company or other companies after the internship."
                      required
                      rows={4}
                    />
                  )}

                </div>

              </div>

            </section>


            {/* =================================================
                4. ADDITIONAL DETAILS
            ================================================== */}

            <section className="bg-white rounded-3xl border border-amber-100 shadow-sm overflow-hidden">

              <SectionHeader
                icon="📈"
                title="Additional Details"
                description="These fields are optional. Fill them only if applicable to you."
                color="amber"
              />

              <div className="px-4 pb-5 sm:px-6 sm:pb-7">

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

                  {!isProject && (
                    <Field
                      form={form}
                      handleChange={handleChange}
                      label="Stipend Amount"
                      name="stipendAmount"
                      type="number"
                      placeholder="Enter stipend amount"
                      help="Enter 0 if you are not receiving any stipend/salary during the internship."
                    />
                  )}


                  <Field
                    form={form}
                    handleChange={handleChange}
                    label="Placement Company"
                    name="PlacedCompany"
                    placeholder="Company where you were placed"
                    help="Enter the company name if you received a placement offer."
                  />


                  <div className="md:col-span-2">

                    <Field
                      form={form}
                      handleChange={handleChange}
                      label="Job Package Details"
                      name="jobPackage"
                      placeholder="e.g. ₹4.5 LPA"
                      help="Enter the job salary/package. Do not enter your internship stipend here."
                    />

                  </div>

                </div>

              </div>

            </section>


            {/* =================================================
                SUBMIT AREA
            ================================================== */}

            <section className="bg-white rounded-3xl border border-slate-200 shadow-sm p-4 sm:p-6">

              <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4 sm:p-5 mb-5">

                <div className="flex items-start gap-3">

                  <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0">
                    📋
                  </div>

                  <div>

                    <h3 className="text-sm font-bold text-slate-800">
                      Before submitting
                    </h3>

                    <p className="text-xs sm:text-sm text-slate-500 mt-1 leading-5">
                      Please verify your register number, company details,
                      internship dates and other information carefully.
                      Once submitted, your application will go through the
                      institutional review process.
                    </p>

                  </div>

                </div>

              </div>


              <button
                type="submit"
                disabled={loading || compressing}
                className="btn btn-primary w-full min-h-12 sm:min-h-14 rounded-2xl text-sm sm:text-base"
              >

                {loading ? (
                  <>
                    <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>

                    Submitting Application...
                  </>
                ) : (
                  <>
                    <span>✓</span>

                    Submit {workLabel} Application
                  </>
                )}

              </button>


              <p className="text-center text-[10px] sm:text-xs text-slate-400 mt-3">
                Fields marked with{" "}
                <span className="text-rose-500">*</span>{" "}
                are required.
              </p>

            </section>

          </form>

        </div>

      </main>


      {/* =====================================================
          LOADING OVERLAY
      ====================================================== */}

      {loading && (

        <div className="fixed inset-0 flex items-center justify-center bg-slate-950/40 backdrop-blur-sm z-50 px-4">

          <div className="w-full max-w-sm bg-white rounded-3xl shadow-2xl p-7 text-center">

            <div className="w-16 h-16 mx-auto rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center">

              <div className="w-9 h-9 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>

            </div>


            <h3 className="mt-5 text-lg font-bold text-slate-800">
              Submitting Application
            </h3>


            <p className="mt-1 text-sm text-slate-500">
              Please wait while your application is being submitted.
            </p>


            <div className="mt-5 h-1.5 bg-slate-100 rounded-full overflow-hidden">

              <div className="h-full w-1/2 bg-blue-600 rounded-full animate-pulse"></div>

            </div>


            <p className="mt-3 text-xs text-slate-400">
              Do not close or refresh this page.
            </p>

          </div>

        </div>

      )}

    </>
  );
}