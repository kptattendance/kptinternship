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
        backendUrl + `/api/reviewers/${selected._id}/review`,
        { action: actionType, comment },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (resp.data?.success) {
        toast.success(resp.data.message || "Review updated");

        // ✅ remove the reviewed application from the list
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
    console.log("Update application:", app);
    toast.info("Update feature coming soon!");
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this application?"))
      return;
    try {
      const token = await getToken();
      await axios.delete(backendUrl + `/api/students/deleteApplication/${id}`, {
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white max-w-5xl w-full rounded-2xl shadow-2xl overflow-auto max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b flex justify-between items-center bg-gray-50 rounded-t-2xl">
          <h3 className="text-xl font-semibold text-gray-800">
            Internship Application Review
          </h3>
          <button
            className="text-gray-500 hover:text-gray-700 transition"
            onClick={() => setSelected(null)}
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Student Info */}
          <div className="flex flex-col items-center">
            {selected.image && (
              <img
                src={selected.image}
                alt={selected.name}
                className="w-28 h-28 rounded-full border object-cover shadow"
              />
            )}
            <h3 className="mt-3 text-lg font-bold">{selected.name}</h3>
            <p className="text-sm text-gray-600">
              {selected.department.toUpperCase()} • {selected.regNumber}
            </p>
            <p className="text-sm text-gray-600">
              📞 {selected.phoneNumber || "-"}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Applied on {new Date(selected.createdAt).toLocaleDateString()}
            </p>
          </div>

          {/* Company Info + Internship Info */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-gray-50 p-4 rounded-lg border">
              <h4 className="font-semibold text-gray-700 mb-2">🏢 Company</h4>
              <ul className="text-sm space-y-1">
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

            <div className="bg-gray-50 p-4 rounded-lg border">
              <h4 className="font-semibold text-gray-700 mb-2">
                📄 Internship
              </h4>
              <ul className="text-sm space-y-1">
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
              </ul>
            </div>
          </div>

          {/* Reviewer Statuses */}
          <div className="bg-gray-50 p-4 rounded-lg border">
            <h4 className="font-semibold text-gray-700 mb-2">
              👥 Reviewer Pipeline
            </h4>
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              {["cohortOwner", "hod", "placement", "principal"].map(
                (roleKey) => (
                  <div key={roleKey} className="p-2 border rounded">
                    <span className="capitalize font-medium">{roleKey}:</span>{" "}
                    <span
                      className={`px-2 py-0.5 rounded text-white text-xs ${
                        selected[roleKey]?.status === "approved"
                          ? "bg-green-600"
                          : selected[roleKey]?.status === "rejected"
                          ? "bg-red-600"
                          : "bg-yellow-500"
                      }`}
                    >
                      {selected[roleKey]?.status}
                    </span>
                    <p className="text-xs text-gray-500 mt-1">
                      {selected[roleKey]?.comment || "No comments yet"}
                    </p>
                  </div>
                )
              )}
            </div>
          </div>

          {/* Reviewer Comment Input */}
          <div>
            <label className="block font-medium text-gray-700 mb-1">
              Your Comment{" "}
              <span className="text-red-500">
                {role === "placement" || role === "principal"
                  ? "(Required only when Rejecting)"
                  : "(Required for Approve/Reject)"}
              </span>
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="w-full border rounded-lg p-3 text-sm"
              placeholder="Write your comments here..."
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-5 border-t flex justify-between items-center bg-gray-50 rounded-b-2xl">
          {role === "cohortOwner" &&
            (selected.cohortOwner?.status === "pending" ||
              selected.hod?.status === "rejected" ||
              selected.placement?.status === "rejected" ||
              selected.principal?.status === "rejected") && (
              <div className="flex gap-2">
                <button
                  onClick={() => handleUpdate(selected)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Update
                </button>
                <button
                  onClick={() => handleDelete(selected._id)}
                  className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
                >
                  Delete
                </button>
              </div>
            )}

          <div className="flex gap-3">
            <button
              onClick={() => handleAction("approve")}
              disabled={actionLoading}
              className="px-5 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
            >
              {actionLoading ? "Processing..." : "Approve"}
            </button>
            <button
              onClick={() => handleAction("reject")}
              disabled={actionLoading}
              className="px-5 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
            >
              {actionLoading ? "Processing..." : "Reject"}
            </button>
            <button
              onClick={() => setSelected(null)}
              className="px-5 py-2 border rounded-md hover:bg-gray-100"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
