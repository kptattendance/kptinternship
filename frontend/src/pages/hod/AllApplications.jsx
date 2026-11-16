// src/pages/hod/AllApplications.jsx
import ApplicationsManager from "../../components/ApplicationsManager";

// HOD view: own department; HOD can delete applications of their department
export default function AllApplications() {
  return <ApplicationsManager canDelete />;
}
