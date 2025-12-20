// src/components/ReviewerNavbar.jsx
import { useState } from "react";
import {
  UserButton,
  SignedIn,
  SignedOut,
  useUser,
  useClerk,
} from "@clerk/clerk-react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { Menu, X } from "lucide-react";

import logo from "../assets/logo.jpg";
const ReviewerNavbar = () => {
  const { openSignIn } = useClerk();
  const { user, isSignedIn } = useUser();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const role = user?.publicMetadata?.role || "student";

  const handleSignIn = () => {
    openSignIn({ redirectUrl: "/redirect" });
  };
  // ✅ Role-based tabs
  let tabs = [];
  if (role === "hod") {
    tabs = [
      { name: "Dashboard", path: "/review" },
      { name: "Add Staff", path: "/hod/add-staffs" },
      { name: "Staff List", path: "/hod/list-staff" },
      // { name: "Add Student", path: "/hod/add-student" },
      // { name: "Student List", path: "/hod/list-student" },
      { name: "Applications", path: "/hod/applications" },
    ];
  } else if (role === "placement") {
    tabs = [
      { name: "Dashboard", path: "/review" },
      { name: "Add a Member", path: "/placement/add-hod" },
      { name: "Company List", path: "/cohortOwner/AddCompany" },
      { name: "Members List", path: "/placement/list-hod" },
      { name: "Applications", path: "/placement/applications" },
      { name: "Statistics", path: "/placement/yearStatistics" },
    ];
  } else if (role === "cohortOwner") {
    tabs = [
      { name: "Dashboard", path: "/review" },
      { name: "Add a Company", path: "/cohortOwner/AddCompany" },
      { name: "Internal Mark", path: "/cohortOwner/internal-mark" },
    ];
  } else if (role === "principal") {
    tabs = [
      { name: "Dashboard", path: "/review" },
      { name: "Members List", path: "/placement/list-hod" },
      { name: "Applications", path: "/placement/applications" },
      { name: "Add a Member", path: "/placement/add-hod" },
      { name: "Add a Company", path: "/placement/add-company" },
    ];
  } else {
    // default (student or unknown role)
    tabs = [{ name: "Home", path: "/" }];
  }

  return (
    <nav className="bg-white shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Brand */}
          <div
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => navigate("/")}
          >
            <img
              src={logo}
              alt="Internship Portal Logo"
              className="h-15 w-auto"
            />
            <span className="text-xl font-bold text-blue-600 hidden sm:block">
              Internship Portal
            </span>
          </div>

          {/* Desktop Tabs */}
          <div className="hidden md:flex space-x-6">
            <SignedIn>
              {tabs.map((tab) => (
                <Link
                  key={tab.path}
                  to={tab.path}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition ${
                    location.pathname === tab.path
                      ? "bg-blue-600 text-white"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  {tab.name}
                </Link>
              ))}
            </SignedIn>
          </div>

          {/* User + Mobile Toggle */}
          <div className="flex items-center gap-3">
            <SignedIn>
              <UserButton afterSignOutUrl="/" />
            </SignedIn>
            <SignedOut>
              <button
                onClick={handleSignIn}
                className="px-3 py-1 bg-blue-600 text-white rounded"
              >
                Sign in
              </button>
            </SignedOut>

            {/* Hamburger Menu */}
            {isSignedIn && (
              <button
                className="md:hidden p-2 rounded-md hover:bg-gray-100"
                onClick={() => setMenuOpen(!menuOpen)}
              >
                {menuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {menuOpen && isSignedIn && (
        <div className="md:hidden bg-white border-t shadow-sm">
          {tabs.map((tab) => (
            <Link
              key={tab.path}
              to={tab.path}
              className={`block px-4 py-2 text-sm font-medium ${
                location.pathname === tab.path
                  ? "bg-blue-600 text-white"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
              onClick={() => setMenuOpen(false)}
            >
              {tab.name}
            </Link>
          ))}
        </div>
      )}
    </nav>
  );
};

export default ReviewerNavbar;
