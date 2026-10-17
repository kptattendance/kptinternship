// src/components/Navbar.jsx
import { UserButton, SignedIn, SignedOut, useUser, useClerk, useAuth } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { LayoutDashboard, LogIn } from "lucide-react";
import AppNavbar from "./AppNavbar";

export default function Navbar() {
  const { openSignIn } = useClerk();
  const { isSignedIn } = useUser();
  const { getToken } = useAuth();
  const navigate = useNavigate();
  const backendUrl = import.meta.env.VITE_BACKEND_URL;

  const handleSignIn = () => {
    openSignIn({ redirectUrl: "/redirect" });
  };

  const handleMyPage = async () => {
    if (!isSignedIn) {
      handleSignIn();
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
    }
  };

  return (
    <AppNavbar
      actions={
        <>
          <SignedIn>
            <button
              type="button"
              onClick={handleMyPage}
              className="btn btn-secondary btn-sm"
            >
              <LayoutDashboard className="h-4 w-4" />
              <span className="hidden sm:inline">My Dashboard</span>
            </button>
            <UserButton afterSignOutUrl="/" />
          </SignedIn>

          <SignedOut>
            <button
              type="button"
              onClick={handleSignIn}
              className="btn btn-primary btn-sm"
            >
              <LogIn className="h-4 w-4" />
              Sign in
            </button>
          </SignedOut>
        </>
      }
    />
  );
}
