// src/components/StudentNavbar.jsx
import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { UserButton } from "@clerk/clerk-react";
import { Menu, X } from "lucide-react"; // icons for mobile toggle
import logo from "../assets/logo.jpg";

export default function StudentNavbar() {
  const navigate = useNavigate();

  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const tabs = [
    { name: "Home", path: "/" },
    { name: "My Profile", path: "/dashboard" },
    { name: "Internship Application", path: "/internship-application-submit" },
    { name: "Application Status", path: "/internship-application-status" },
  ];

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
          </div>

          {/* User + Mobile Toggle */}
          <div className="flex items-center gap-3">
            <UserButton afterSignOutUrl="/" />
            <button
              className="md:hidden p-2 rounded-md hover:bg-gray-100"
              onClick={() => setMenuOpen(!menuOpen)}
            >
              {menuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
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
}
