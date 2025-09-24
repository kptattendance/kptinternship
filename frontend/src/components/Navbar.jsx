// src/components/Navbar.jsx
import {
  UserButton,
  SignedIn,
  SignedOut,
  useUser,
  useClerk,
  useAuth,
} from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import axios from "axios";
import logo from "../assets/logo.jpg";

export default function Navbar() {
  const { openSignIn } = useClerk();
  const { user, isSignedIn } = useUser();
  const { getToken } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const backendUrl = import.meta.env.VITE_BACKEND_URL;

  const handleSignIn = () => {
    openSignIn({ redirectUrl: "/redirect" });
  };

  const handleMyPage = async () => {
    if (!isSignedIn) {
      openSignIn({ redirectUrl: "/redirect" });
      return;
    }

    try {
      const token = await getToken();
      const res = await axios.get(`${backendUrl}/api/users/sync`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const role = res.data.user.role;

      if (role === "student") {
        navigate("/dashboard");
      } else if (role === "company") {
        navigate("/company");
      } else {
        navigate("/review");
      }
    } catch (err) {
      console.error("❌ Error fetching role from backend:", err);
      navigate("/dashboard");
    } finally {
      setMenuOpen(false);
    }
  };

  return (
    <nav className="bg-white shadow sticky top-0 z-50">
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

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-4">
            <SignedIn>
              <button
                onClick={handleMyPage}
                className="px-3 py-1 border cursor-pointer rounded hover:bg-gray-100"
              >
                My Dashboard
              </button>
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
          </div>

          {/* Mobile Hamburger */}
          <div className="md:hidden flex items-center gap-3">
            <SignedIn>
              <UserButton afterSignOutUrl="/" />
            </SignedIn>

            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-2 rounded-md hover:bg-gray-100 focus:outline-none"
            >
              {menuOpen ? "✖" : "☰"}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Dropdown */}
      {menuOpen && (
        <div className="md:hidden bg-white border-t shadow-inner">
          <div className="flex flex-col items-start p-4 space-y-3">
            <SignedIn>
              <button
                onClick={handleMyPage}
                className="w-full text-left px-3 py-2 rounded hover:bg-gray-100"
              >
                My Page
              </button>
            </SignedIn>

            <SignedOut>
              <button
                onClick={handleSignIn}
                className="w-full text-left px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Sign in
              </button>
            </SignedOut>
          </div>
        </div>
      )}
    </nav>
  );
}
