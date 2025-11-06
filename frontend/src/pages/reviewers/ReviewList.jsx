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
      const resp = await axios.get(`${backendUrl}/api/reviewers/list`, {
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
    <div className="min-h-screen bg-gradient-to-br from-[#e0f2ff] via-[#f0e7ff] to-[#ffe7f5]">
      <ReviewerNavbar />
      <div className="p-4 md:p-10 max-w-8xl mx-auto">
        <ToastContainer position="top-right" autoClose={3000} />

        {/* Header */}
        <div className="mb-10 text-center">
          <h2 className="text-4xl md:text-5xl font-extrabold bg-gradient-to-r from-blue-700 via-purple-600 to-pink-500 bg-clip-text text-transparent tracking-tight drop-shadow-md">
            {role === "hod"
              ? `HOD Dashboard — ${department.toUpperCase()}`
              : `${role
                  .replace(/([A-Z])/g, " $1")
                  .trim()
                  .toUpperCase()} Dashboard`}
          </h2>
          <p className="text-gray-600 mt-3 text-sm md:text-base">
            Review and manage internship applications with ease 🌟
          </p>
          <div className="mt-4 w-24 h-1 mx-auto bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full shadow-md"></div>
        </div>

        {/* States */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 space-y-4">
            <div className="w-14 h-14 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-purple-600 font-semibold animate-pulse text-lg">
              Fetching applications...
            </p>
          </div>
        ) : apps.length === 0 ? (
          <div className="text-center py-24">
            <div className="text-6xl mb-4">📭</div>
            <h3 className="text-xl font-semibold text-gray-700">
              No pending applications for review
            </h3>
            <p className="text-sm text-gray-400">
              New applications will appear here automatically.
            </p>
          </div>
        ) : (
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {apps.map((app, idx) => (
              <div
                key={app._id}
                className={`relative overflow-hidden rounded-2xl p-[1px] transition-all duration-300 hover:scale-[1.02] ${
                  idx % 3 === 0
                    ? "bg-gradient-to-br from-pink-400 via-purple-400 to-blue-400"
                    : idx % 3 === 1
                    ? "bg-gradient-to-br from-cyan-400 via-blue-400 to-purple-400"
                    : "bg-gradient-to-br from-amber-400 via-pink-400 to-red-400"
                }`}
              >
                <div className="bg-white/90 backdrop-blur-lg rounded-2xl shadow-lg p-6 flex flex-col h-full transition-all duration-300 hover:shadow-2xl">
                  {/* Top: student info */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {app.image ? (
                        <img
                          src={app.image}
                          alt={app.name}
                          className="w-14 h-14 rounded-full border-2 border-white shadow-md object-cover"
                        />
                      ) : (
                        <div className="w-14 h-14 flex items-center justify-center bg-gradient-to-br from-gray-300 to-gray-400 rounded-full text-gray-700 font-bold shadow-inner">
                          {app.name?.[0]?.toUpperCase() || "?"}
                        </div>
                      )}
                      <div>
                        <h3 className="font-bold text-lg text-gray-800 drop-shadow-sm">
                          {app.name}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {app.department?.toUpperCase()} • {app.regNumber}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          Applied on{" "}
                          <span className="font-medium text-gray-700">
                            {new Date(app.createdAt).toLocaleDateString(
                              "en-GB"
                            )}
                          </span>
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600 flex items-center gap-1">
                        <span className="text-pink-500">📞</span>
                        {app.phoneNumber || "-"}
                      </p>
                    </div>
                  </div>

                  {/* Status Badges */}
                  <div className="mt-5 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-3 grid grid-cols-2 gap-x-6 gap-y-2 text-xs shadow-inner">
                    {["cohortOwner", "hod", "placement", "principal"].map(
                      (roleKey) => (
                        <div
                          key={roleKey}
                          className="flex justify-between items-center w-full"
                        >
                          <span className="capitalize text-gray-600 font-medium">
                            {roleKey.replace(/([A-Z])/g, " $1")}
                          </span>
                          <span
                            className={`ml-3 px-4 py-1 rounded font-semibold text-white shadow-sm ${
                              app[roleKey]?.status === "approved"
                                ? "bg-green-700"
                                : app[roleKey]?.status === "rejected"
                                ? "bg-red-600"
                                : "bg-yellow-600"
                            }`}
                          >
                            {app[roleKey]?.status || "pending"}
                          </span>
                        </div>
                      )
                    )}
                  </div>

                  {/* Buttons */}
                  <div className="mt-6 flex gap-3">
                    {["cohortOwner", "hod", "placement", "principal"].includes(
                      role
                    ) && (
                      <button
                        onClick={() => setSelected(app)}
                        className="flex-1 px-4 py-2.5 text-sm bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 text-white rounded-lg hover:shadow-lg transition font-medium"
                      >
                        Review
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

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
