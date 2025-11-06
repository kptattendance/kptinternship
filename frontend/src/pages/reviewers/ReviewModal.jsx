import React, { useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";

export default function ReviewModal({
  selected,
  setSelected,
  role,
  setApps,
  getToken,
}) {
  const [comment, setComment] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const backendUrl = import.meta.env.VITE_BACKEND_URL;

  const handleAction = async (actionType) => {
    if (!selected) return;

    const isPlacementOrPrincipal = role === "placement" || role === "principal";
    if (actionType === "reject" && comment.trim() === "") {
      toast.error("Please add a comment when rejecting");
      return;
    }
    if (
      actionType === "approve" &&
      !isPlacementOrPrincipal &&
      comment.trim() === ""
    ) {
      toast.error("Please add a comment before approving");
      return;
    }

    try {
      setActionLoading(true);
      const token = await getToken();
      const resp = await axios.put(
        `${backendUrl}/api/reviewers/${selected._id}/review`,
        { action: actionType, comment },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (resp.data?.success) {
        toast.success(resp.data.message || "Review updated");
        setApps((prev) => prev.filter((a) => a._id !== selected._id));
        setSelected(null);
      } else {
        toast.error(resp.data?.message || "Could not update");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Action failed");
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdate = (app) => {
    toast.info("Update feature coming soon!");
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this application?"))
      return;
    try {
      const token = await getToken();
      await axios.delete(`${backendUrl}/api/students/deleteApplication/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Application deleted");
      setApps((prev) => prev.filter((a) => a._id !== id));
      setSelected(null);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-black/70 via-gray-900/80 to-gray-950/90 backdrop-blur-md p-3 sm:p-6">
      <div className="bg-white/95 border border-white/20 shadow-2xl rounded-3xl w-full max-w-5xl max-h-[90vh] flex flex-col animate-fadeIn overflow-hidden">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 text-white px-5 sm:px-8 py-4 flex justify-between items-center rounded-t-3xl shadow-md">
          <h3 className="text-lg sm:text-xl font-semibold tracking-wide">
            Internship Application Review
          </h3>
          <button
            className="text-white/90 hover:text-white text-xl sm:text-2xl"
            onClick={() => setSelected(null)}
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 text-gray-900 scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-transparent">
          {/* Student Info */}
          <div className="flex flex-col items-center text-center">
            {selected.image && (
              <img
                src={selected.image}
                alt={selected.name}
                className="w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 rounded-full shadow-lg ring-4 ring-pink-300 object-cover"
              />
            )}
            <h3 className="mt-3 text-lg sm:text-xl font-bold text-gray-800">
              {selected.name}
            </h3>
            <p className="text-sm sm:text-base text-gray-600">
              {selected.department.toUpperCase()} • {selected.regNumber}
            </p>
            <p className="text-sm text-gray-600">
              📞 {selected.phoneNumber || "-"}
            </p>
            <p className="text-xs text-gray-500 mt-1 italic">
              Applied on {new Date(selected.createdAt).toLocaleDateString()}
            </p>
          </div>

          {/* Company + Internship */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
            {/* Company Details */}
            <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-100 shadow-lg">
              <h4 className="font-semibold text-purple-800 mb-3 flex items-center gap-2 text-base sm:text-lg">
                🏢 Company Details
              </h4>
              <ul className="text-sm sm:text-base space-y-1 text-gray-700">
                <li>
                  <strong>Name:</strong> {selected.companyName}
                </li>
                <li>
                  <strong>Village:</strong> {selected.companyVillage}
                </li>
                <li>
                  <strong>City:</strong> {selected.companyCity}
                </li>
                <li>
                  <strong>Taluk:</strong> {selected.companyTaluk}
                </li>
                <li>
                  <strong>District:</strong> {selected.companyDistrict}
                </li>
                <li>
                  <strong>State:</strong> {selected.companyState}
                </li>
                <li>
                  <strong>Contact:</strong> {selected.companyContact}
                </li>
                <li>
                  <strong>Email:</strong> {selected.companyEmail}
                </li>
                <li>
                  <strong>Profile:</strong> {selected.companyProfile}
                </li>
              </ul>
            </div>

            {/* Internship Details */}
            <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-100 shadow-lg">
              <h4 className="font-semibold text-indigo-800 mb-3 flex items-center gap-2 text-base sm:text-lg">
                📄 Internship Details
              </h4>
              <ul className="text-sm sm:text-base space-y-1 text-gray-700">
                <li>
                  <strong>Start:</strong>{" "}
                  {selected.startDate
                    ? new Date(selected.startDate).toLocaleDateString()
                    : "-"}
                </li>
                <li>
                  <strong>End:</strong>{" "}
                  {selected.endDate
                    ? new Date(selected.endDate).toLocaleDateString()
                    : "-"}
                </li>
                <li>
                  <strong>Working Hours:</strong> {selected.workingHours}
                </li>
                <li>
                  <strong>Duties:</strong> {selected.duties}
                </li>
                <li>
                  <strong>Tasks:</strong> {selected.tasks}
                </li>
                <li>
                  <strong>Skills:</strong> {selected.expectedSkills}
                </li>
                <li>
                  <strong>Tools:</strong> {selected.expectedTools}
                </li>
                <li>
                  <strong>Challenges:</strong> {selected.expectedChallenges}
                </li>
                <li>
                  <strong>Outcomes:</strong> {selected.learningOutcomes}
                </li>
                <li>
                  <strong>Job Opportunity:</strong> {selected.jobOpportunity}
                </li>
                <li>
                  <strong>Stipend:</strong> ₹{selected.stipendAmount}
                </li>
                <li>
                  <strong>Placed Company:</strong> {selected.PlacedCompany}
                </li>
                <li>
                  <strong>Job Package:</strong> {selected.jobPackage}
                </li>
              </ul>
            </div>
          </div>

          {/* Reviewer Pipeline */}
          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-teal-50 to-emerald-50 border border-teal-100 shadow-lg">
            <h4 className="font-semibold text-teal-800 mb-3 text-base sm:text-lg">
              👥 Reviewer Pipeline
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-sm sm:text-base">
              {["cohortOwner", "hod", "placement", "principal"].map(
                (roleKey) => (
                  <div
                    key={roleKey}
                    className="p-3 bg-white/70 backdrop-blur-sm rounded-xl border border-gray-200 shadow-sm"
                  >
                    <span className="capitalize font-semibold text-gray-800">
                      {roleKey}:
                    </span>{" "}
                    <span
                      className={`px-2 py-1 rounded-md text-xs font-semibold text-white ${
                        selected[roleKey]?.status === "approved"
                          ? "bg-green-600"
                          : selected[roleKey]?.status === "rejected"
                          ? "bg-red-600"
                          : "bg-yellow-500"
                      }`}
                    >
                      {selected[roleKey]?.status}
                    </span>
                    <p className="text-xs sm:text-sm text-gray-600 mt-1">
                      {selected[roleKey]?.comment || "No comments yet"}
                    </p>
                  </div>
                )
              )}
            </div>
          </div>

          {/* Comment Section */}
          <div>
            <label className="block font-medium text-gray-800 mb-2 text-sm sm:text-base">
              Your Comment{" "}
              <span className="text-pink-600 text-xs sm:text-sm">
                {role === "placement" || role === "principal"
                  ? "(Required only when Rejecting)"
                  : "(Required for Approve/Reject)"}
              </span>
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-400 text-sm shadow-inner bg-white/80 resize-none"
              placeholder="Write your comments here..."
              rows={3}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 z-10 bg-gradient-to-r from-gray-50 via-white to-gray-50 border-t p-4 sm:p-5 flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-0 rounded-b-3xl shadow-inner">
          {role === "cohortOwner" &&
            (selected.cohortOwner?.status === "pending" ||
              selected.hod?.status === "rejected" ||
              selected.placement?.status === "rejected" ||
              selected.principal?.status === "rejected") && (
              <div className="flex gap-2 sm:gap-3 w-full sm:w-auto justify-center">
                <button
                  onClick={() => handleUpdate(selected)}
                  className="w-full sm:w-auto px-4 sm:px-5 py-2 rounded-lg bg-gradient-to-r from-sky-500 to-indigo-600 text-white font-medium shadow-md hover:shadow-lg transition"
                >
                  Update
                </button>
                <button
                  onClick={() => handleDelete(selected._id)}
                  className="w-full sm:w-auto px-4 sm:px-5 py-2 rounded-lg bg-gradient-to-r from-rose-500 to-red-600 text-white font-medium shadow-md hover:shadow-lg transition"
                >
                  Delete
                </button>
              </div>
            )}

          <div className="flex flex-wrap justify-center sm:justify-end gap-2 sm:gap-3 w-full sm:w-auto">
            <button
              onClick={() => handleAction("approve")}
              disabled={actionLoading}
              className="px-4 sm:px-5 py-2 rounded-lg bg-gradient-to-r from-green-500 to-emerald-600 text-white font-medium shadow-md hover:shadow-lg transition disabled:opacity-50"
            >
              {actionLoading ? "Processing..." : "Approve"}
            </button>
            <button
              onClick={() => handleAction("reject")}
              disabled={actionLoading}
              className="px-4 sm:px-5 py-2 rounded-lg bg-gradient-to-r from-red-500 to-rose-600 text-white font-medium shadow-md hover:shadow-lg transition disabled:opacity-50"
            >
              {actionLoading ? "Processing..." : "Reject"}
            </button>
            <button
              onClick={() => setSelected(null)}
              className="px-4 sm:px-5 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 text-gray-700 font-medium transition"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
