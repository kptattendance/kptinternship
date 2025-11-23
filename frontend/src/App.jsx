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
import ProtectedRoute from "./components/ProtectedRoute";
import PlacementAddUser from "./pages/placement/PlacementAddUser";
import MembersList from "./pages/placement/MembersList";
import PlacementAddCompany from "./pages/placement/PlacementAddCompany";
import CompanyDashboard from "./pages/company/CompanyDashboard";
import InternalMark from "./pages/cohort/InternalMark";
import YearStatistics from "./pages/placement/YearStatistics";
import AllPlaceApplications from "./pages/placement/AllPlaceApplications";

export default function App() {
  return (
    <>
      <ToastContainer autoClose={3000} />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/review" element={<Review />} />
        <Route path="/company" element={<CompanyDashboard />} />
        <Route path="/redirect" element={<RedirectAfterLogin />} />
        <Route
          path="/hod/add-staffs"
          element={
            <ProtectedRoute allowedRoles={["placement", "principal", "hod"]}>
              <AddStaff />
            </ProtectedRoute>
          }
        />
        <Route path="/redirect" element={<RedirectAfterLogin />} />
        <Route
          path="/hod/list-staff"
          element={
            <ProtectedRoute allowedRoles={["placement", "principal", "hod"]}>
              <StaffList />{" "}
            </ProtectedRoute>
          }
        />
        <Route
          path="/hod/applications"
          element={
            <ProtectedRoute allowedRoles={["placement", "principal", "hod"]}>
              <AllApplications />
            </ProtectedRoute>
          }
        />
        <Route
          path="/cohortOwner/internal-mark"
          element={
            <ProtectedRoute allowedRoles={["cohortOwner"]}>
              <InternalMark />
            </ProtectedRoute>
          }
        />
        <Route
          path="/placement/add-hod"
          element={
            <ProtectedRoute allowedRoles={["placement", "principal"]}>
              <PlacementAddUser />{" "}
            </ProtectedRoute>
          }
        />
        <Route
          path="/placement/add-company"
          element={
            <ProtectedRoute
              allowedRoles={["placement", "cohortOwner", "principal"]}
            >
              <PlacementAddCompany />{" "}
            </ProtectedRoute>
          }
        />
        <Route
          path="/placement/list-hod"
          element={
            <ProtectedRoute allowedRoles={["placement", "principal"]}>
              <MembersList />
            </ProtectedRoute>
          }
        />{" "}
          <Route
          path="/placement/applications"
          element={
            <ProtectedRoute allowedRoles={["placement", "principal"]}>
              <AllPlaceApplications />
            </ProtectedRoute>
          }
        />
        <Route
          path="/placement/yearStatistics"
          element={
            <ProtectedRoute allowedRoles={["placement"]}>
              <YearStatistics />
            </ProtectedRoute>
          }
        />
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
