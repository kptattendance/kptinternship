// src/components/ProtectedRoute.jsx
import { useUser } from "@clerk/clerk-react";
import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ children, allowedRoles }) {
  const { user, isLoaded } = useUser();

  if (!isLoaded) return <p>Loading...</p>;

  // 👇 read role from Clerk metadata
  const role = user?.publicMetadata?.role || "student";

  if (!allowedRoles.includes(role)) {
    return <Navigate to="/" replace />;
  }

  return children;
}
