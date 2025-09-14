import React, { useEffect, useState } from "react";
import { useUser, useAuth } from "@clerk/clerk-react";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import ReviewerNavbar from "../../components/ReviewerNavbar";
import ReviewModal from "./ReviewModal";

export default function ReviewList() {
  const { user, isLoaded } = useUser();
  const { getToken } = useAuth();
  const role = user?.publicMetadata?.role || "student";
  const department = user?.publicMetadata?.department || "";

  const [loading, setLoading] = useState(false);
  const [apps, setApps] = useState([]);
  const [selected, setSelected] = useState(null);

  const backendUrl = import.meta.env.VITE_BACKEND_URL;
  useEffect(() => {
    if (!isLoaded) return;
    fetchPending();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded, role]);

  const fetchPending = async () => {
    try {
      setLoading(true);
      const token = await getToken();
      const resp = await axios.get(backendUrl + "/api/reviewers/list", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (resp.data?.success) setApps(resp.data.data);
      else setApps([]);
    } catch (err) {
      console.error(
        "Failed to fetch pending:",
        err.response?.data || err.message
      );
      toast.error("Failed to load applications");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <ReviewerNavbar />
      <div className="p-4 md:p-8">
        <ToastContainer position="top-right" autoClose={3000} />

        <h2 className="text-3xl font-extrabold mb-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          {role === "hod"
            ? `HOD Dashboard — ${department.toUpperCase()}`
            : `${role
                .replace(/([A-Z])/g, " $1")
                .trim()
                .toUpperCase()} Dashboard`}
        </h2>
        <p className="text-sm text-gray-500 mb-6">
          📋 Review pending internship applications assigned to you.
        </p>
        <hr className="mb-6 border-gray-200" />

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <div className="w-14 h-14 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-blue-600 font-medium animate-pulse">
              Fetching applications...
            </p>
          </div>
        ) : apps.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">📭</div>
            <p className="text-gray-600 font-medium">
              No pending applications for review.
            </p>
            <p className="text-sm text-gray-400">
              Sit tight! New applications will appear here.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {apps.map((app) => (
              <div
                key={app._id}
                className="bg-white rounded-xl shadow-md border hover:shadow-lg transition-all duration-200 p-5 flex flex-col"
              >
                {/* Top: student info */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {app.image ? (
                      <img
                        src={app.image}
                        alt={app.name}
                        className="w-14 h-14 rounded-full border object-cover shadow-sm"
                      />
                    ) : (
                      <div className="w-14 h-14 flex items-center justify-center bg-gray-200 rounded-full text-gray-600 font-bold">
                        {app.name?.[0]?.toUpperCase() || "?"}
                      </div>
                    )}
                    <div>
                      <h3 className="font-semibold text-lg">{app.name}</h3>
                      <p className="text-sm text-gray-600">
                        {app.department.toUpperCase()} • {app.regNumber}
                      </p>
                      <p className="text-xs text-gray-400">
                        Applied {new Date(app.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-sm text-gray-600 flex items-center gap-1">
                      <span className="text-pink-600">📞</span>{" "}
                      {app.phoneNumber || "-"}
                    </p>
                  </div>
                </div>

                {/* Statuses */}
                <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                  {["cohortOwner", "hod", "placement", "principal"].map(
                    (roleKey) => (
                      <span key={roleKey}>
                        {roleKey}:{" "}
                        <span
                          className={`px-2 py-0.5 rounded text-white text-xs ${
                            app[roleKey]?.status === "approved"
                              ? "bg-green-600"
                              : app[roleKey]?.status === "rejected"
                              ? "bg-red-600"
                              : "bg-yellow-500"
                          }`}
                        >
                          {app[roleKey]?.status}
                        </span>
                      </span>
                    )
                  )}
                </div>

                {/* Buttons */}
                <div className="mt-5 flex gap-3">
                  <button
                    onClick={() => setSelected(app)}
                    className="flex-1 px-3 py-2 text-sm border rounded-md hover:bg-gray-50 transition"
                  >
                    View
                  </button>

                  {["cohortOwner", "hod", "placement", "principal"].includes(
                    role
                  ) && (
                    <button
                      onClick={() => setSelected(app)}
                      className="flex-1 px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
                    >
                      Review
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal */}
        {selected && (
          <ReviewModal
            selected={selected}
            setSelected={setSelected}
            role={role}
            setApps={setApps}
            getToken={getToken}
          />
        )}
      </div>
    </div>
  );
}
