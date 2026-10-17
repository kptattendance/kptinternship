// Shared lists used by filters and forms across the portal

export const DEPARTMENTS = [
  { value: "at", label: "Automobile Engineering" },
  { value: "ch", label: "Chemical Engineering" },
  { value: "ce", label: "Civil Engineering" },
  { value: "cs", label: "Computer Science Engineering" },
  { value: "ec", label: "Electronics & Communication Engineering" },
  { value: "eee", label: "Electrical & Electronics Engineering" },
  { value: "me", label: "Mechanical Engineering" },
  { value: "po", label: "Polymer Engineering" },
];

// Short "CS — Computer Science Engineering" labels for dropdowns
export const DEPARTMENT_OPTIONS = DEPARTMENTS.map((d) => ({
  value: d.value,
  label: `${d.value.toUpperCase()} — ${d.label}`,
}));

export const departmentLabel = (value) =>
  DEPARTMENTS.find((d) => d.value === value?.toLowerCase())?.label ||
  value?.toUpperCase() ||
  "-";

export const REVIEW_STATUS_OPTIONS = [
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
];

export const INTERNSHIP_TYPE_OPTIONS = [
  { value: "Internship", label: "Internship" },
  { value: "Project", label: "Project" },
];

// Review stages in the order an application moves through them
export const REVIEW_STAGES = [
  { key: "cohortOwner", label: "Cohort Owner" },
  { key: "hod", label: "HOD" },
  { key: "placement", label: "Placement" },
  { key: "principal", label: "Principal" },
];

export const ROLE_LABELS = {
  student: "Student",
  cohortOwner: "Cohort Owner",
  hod: "HOD",
  placement: "Placement Officer",
  principal: "Principal",
  admin: "Admin",
  company: "Company",
};

export const ROLE_OPTIONS = Object.entries(ROLE_LABELS).map(
  ([value, label]) => ({ value, label })
);

/**
 * Overall status of an application across all review stages:
 * "rejected" if any stage rejected, "approved" once the principal approved,
 * otherwise "pending".
 */
export const overallStatus = (app) => {
  if (REVIEW_STAGES.some((s) => app?.[s.key]?.status === "rejected")) {
    return "rejected";
  }
  if (app?.principal?.status === "approved") return "approved";
  return "pending";
};

/**
 * Smaller, auto-format version of a Cloudinary image for display.
 * Non-Cloudinary URLs are returned unchanged.
 */
export const cloudinaryThumb = (url, width = 400) => {
  if (!url || !url.includes("res.cloudinary.com") || !url.includes("/upload/")) {
    return url;
  }
  return url.replace("/upload/", `/upload/f_auto,q_auto,c_limit,w_${width}/`);
};
