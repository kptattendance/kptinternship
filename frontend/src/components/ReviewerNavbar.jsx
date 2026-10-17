// src/components/ReviewerNavbar.jsx
import { UserButton, SignedIn, SignedOut, useUser, useClerk } from "@clerk/clerk-react";
import AppNavbar from "./AppNavbar";

// ✅ Role-based tabs
const TABS_BY_ROLE = {
  hod: [
    { name: "Dashboard", path: "/review" },
    { name: "Add Staff", path: "/hod/add-staffs" },
    { name: "Staff List", path: "/hod/list-staff" },
    { name: "Applications", path: "/hod/applications" },
  ],
  placement: [
    { name: "Dashboard", path: "/review" },
    { name: "Add Member", path: "/placement/add-hod" },
    { name: "Companies", path: "/cohortOwner/AddCompany" },
    { name: "Members", path: "/placement/list-hod" },
    { name: "Applications", path: "/placement/applications" },
    { name: "Documents", path: "/placement/parentConsent" },
    { name: "Statistics", path: "/placement/yearStatistics" },
  ],
  cohortOwner: [
    { name: "Dashboard", path: "/review" },
    { name: "Companies", path: "/cohortOwner/AddCompany" },
    { name: "Internal Marks", path: "/cohortOwner/internal-mark" },
    { name: "Consent Letters", path: "/cohortOwner/parentConsent" },
  ],
  principal: [
    { name: "Dashboard", path: "/review" },
    { name: "Members", path: "/placement/list-hod" },
    { name: "Applications", path: "/placement/applications" },
    { name: "Add Member", path: "/placement/add-hod" },
    { name: "Add Company", path: "/placement/add-company" },
  ],
};

const ReviewerNavbar = () => {
  const { openSignIn } = useClerk();
  const { user, isSignedIn } = useUser();

  const role = user?.publicMetadata?.role || "student";
  const tabs = isSignedIn
    ? TABS_BY_ROLE[role] || [{ name: "Home", path: "/" }]
    : [];

  return (
    <AppNavbar
      tabs={tabs}
      actions={
        <>
          <SignedIn>
            <UserButton afterSignOutUrl="/" />
          </SignedIn>
          <SignedOut>
            <button
              type="button"
              onClick={() => openSignIn({ redirectUrl: "/redirect" })}
              className="btn btn-primary btn-sm"
            >
              Sign in
            </button>
          </SignedOut>
        </>
      }
    />
  );
};

export default ReviewerNavbar;
