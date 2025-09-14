// src/App.jsx (example)
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Dashboard from "./pages/students/Dashboard";
import RedirectAfterLogin from "./pages/RedirectAfterLogin";
import InternshipApplicationForm from "./pages/students/InternshipApplicationForm";
import { ToastContainer } from "react-toastify";
import InternshipApplicationStatus from "./pages/students/InternshipApplicationStatus";
import Review from "./pages/reviewers/Review";
import AddStaff from "./pages/hod/AddStaff";
import StaffList from "./pages/hod/StaffList";
import AllApplications from "./pages/hod/AllApplications";

export default function App() {
  return (
    <>
      <ToastContainer autoClose={3000} />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/review" element={<Review />} />
        <Route path="/redirect" element={<RedirectAfterLogin />} />
        <Route path="/hod/add-staffs" element={<AddStaff />} />
        <Route path="/hod/list-staff" element={<StaffList />} />
        <Route path="/hod/applications" element={<AllApplications />} />
        <Route
          path="/internship-application-submit"
          element={<InternshipApplicationForm />}
        />
        <Route
          path="/internship-application-status"
          element={<InternshipApplicationStatus />}
        />
      </Routes>
    </>
  );
}
