import { useEffect } from "react";
import { useAuth } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

export default function RedirectAfterLogin() {
  const { getToken } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      try {
        const token = await getToken();
        const backendUrl = import.meta.env.VITE_BACKEND_URL;
        const res = await axios.get(`${backendUrl}/api/users/sync`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const role = res.data.user.role || "student";

        // Redirect based on role
        if (role === "student") {
          navigate("/dashboard", { replace: true });
        } else if (role === "company") {
          navigate("/company", { replace: true });
        } else {
          navigate("/review", { replace: true }); // admin, hod, placement, etc.
        }
      } catch (err) {
        console.error(
          "❌ Sync user failed:",
          err.response?.data || err.message
        );
        navigate("/", { replace: true });
      }
    })();
  }, [getToken, navigate]);

  return (
    <div className="flex flex-col items-center justify-center h-screen text-center px-4">
      <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-600 mb-6"></div>
      <h2 className="text-xl font-semibold text-gray-800 mb-2">
        Signing you in…
      </h2>
      <p className="text-gray-500 text-sm max-w-xs">
        Please wait while we prepare your dashboard.
      </p>
    </div>
  );
}
