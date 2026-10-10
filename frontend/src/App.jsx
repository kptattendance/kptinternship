// src/App.jsx (example)
import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import RedirectAfterLogin from "./pages/RedirectAfterLogin";
import { ToastContainer } from "react-toastify";
import ProtectedRoute from "./components/ProtectedRoute";
import Loader from "./pages/Loader";

// Pages other than the home page are downloaded only when they are opened
const Dashboard = lazy(() => import("./pages/students/Dashboard"));
const InternshipApplicationForm = lazy(() => import("./pages/students/InternshipApplicationForm"));
const InternshipApplicationStatus = lazy(() => import("./pages/students/InternshipApplicationStatus"));
const Review = lazy(() => import("./pages/reviewers/Review"));
const AddStaff = lazy(() => import("./pages/hod/AddStaff"));
const StaffList = lazy(() => import("./pages/hod/StaffList"));
const AllApplications = lazy(() => import("./pages/hod/AllApplications"));
const PlacementAddUser = lazy(() => import("./pages/placement/PlacementAddUser"));
const MembersList = lazy(() => import("./pages/placement/MembersList"));
const PlacementAddCompany = lazy(() => import("./pages/placement/PlacementAddCompany"));
const CompanyDashboard = lazy(() => import("./pages/company/CompanyDashboard"));
const InternalMark = lazy(() => import("./pages/cohort/InternalMark"));
const YearStatistics = lazy(() => import("./pages/placement/YearStatistics"));
const AllPlaceApplications = lazy(() => import("./pages/placement/AllPlaceApplications"));
const AddCompany = lazy(() => import("./pages/cohort/AddCompany"));
const ParentConsent = lazy(() => import("./pages/cohort/ParentConsent"));
const PlacementParentConsent = lazy(() => import("./pages/placement/PlacementParentConsent"));

export default function App() {
  return (
    <>
      <ToastContainer autoClose={3000} />
      <Suspense fallback={<Loader />}>
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
        />{" "}
           <Route
          path="/cohortOwner/parentConsent"
          element={
            <ProtectedRoute allowedRoles={["cohortOwner", "placement"]}>
              <ParentConsent />
            </ProtectedRoute>
          }
        />
        <Route
          path="/cohortOwner/AddCompany"
          element={
            <ProtectedRoute allowedRoles={["cohortOwner", "placement"]}>
              <AddCompany />
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
          path="/placement/parentConsent"
          element={
            <ProtectedRoute
              allowedRoles={["placement", "cohortOwner", "principal"]}
            >
              <PlacementParentConsent />{" "}
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
      </Suspense>
    </>
  );
}
