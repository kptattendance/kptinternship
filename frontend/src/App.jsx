// src/App.jsx
import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import RedirectAfterLogin from "./pages/RedirectAfterLogin";
import { ToastContainer } from "react-toastify";
import ProtectedRoute from "./components/ProtectedRoute";
import ScrollToTop from "./components/ScrollToTop";
import Loader from "./pages/Loader";

// Pages other than the home page are downloaded only when they are opened.
// After a new deployment the old page files no longer exist, so if one fails
// to download, reload once to get the new version instead of a blank page.
const lazyPage = (importer) =>
  lazy(() =>
    importer()
      .then((module) => {
        sessionStorage.removeItem("pageReloaded");
        return module;
      })
      .catch((err) => {
        if (!sessionStorage.getItem("pageReloaded")) {
          sessionStorage.setItem("pageReloaded", "1");
          window.location.reload();
          return new Promise(() => {});
        }
        throw err;
      })
  );

const Dashboard = lazyPage(() => import("./pages/students/Dashboard"));
const InternshipApplicationForm = lazyPage(() => import("./pages/students/InternshipApplicationForm"));
const InternshipApplicationStatus = lazyPage(() => import("./pages/students/InternshipApplicationStatus"));
const Review = lazyPage(() => import("./pages/reviewers/Review"));
const AddStaff = lazyPage(() => import("./pages/hod/AddStaff"));
const StaffList = lazyPage(() => import("./pages/hod/StaffList"));
const AllApplications = lazyPage(() => import("./pages/hod/AllApplications"));
const PlacementAddUser = lazyPage(() => import("./pages/placement/PlacementAddUser"));
const MembersList = lazyPage(() => import("./pages/placement/MembersList"));
const PlacementAddCompany = lazyPage(() => import("./pages/placement/PlacementAddCompany"));
const CompanyDashboard = lazyPage(() => import("./pages/company/CompanyDashboard"));
const InternalMark = lazyPage(() => import("./pages/cohort/InternalMark"));
const YearStatistics = lazyPage(() => import("./pages/placement/YearStatistics"));
const AllPlaceApplications = lazyPage(() => import("./pages/placement/AllPlaceApplications"));
const AddCompany = lazyPage(() => import("./pages/cohort/AddCompany"));
const ParentConsent = lazyPage(() => import("./pages/cohort/ParentConsent"));
const PlacementParentConsent = lazyPage(() => import("./pages/placement/PlacementParentConsent"));

export default function App() {
  return (
    <>
      <ToastContainer autoClose={3000} />
      <ScrollToTop />
      <Suspense
        fallback={
          <div className="page-bg flex items-center justify-center">
            <Loader message="Loading page..." />
          </div>
        }
      >
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
