import React, { useState } from "react";
import axios from "axios";
import Modal from "../../components/Modal";
import ApplicationDetails from "../../components/ApplicationDetails";
import EditPermissionButton from "../../components/EditPermissionButton";
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

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this application permanently?\n\nThis removes the application, the student's photo, consent letter and internship photo. The student will be able to apply again.\n\nThis cannot be undone."))
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

  // Every reviewer can delete (the server limits HOD / cohort owner to their
  // own department); only placement / principal can unlock student editing
  const canDelete = ["cohortOwner", "hod", "placement", "principal"].includes(role);
  const canAllowEdit = ["placement", "principal"].includes(role);

  const handleEditPermissionChange = (updated) => {
    setSelected(updated);
    setApps((prev) => prev.map((a) => (a._id === updated._id ? updated : a)));
  };

  return (
    <Modal
      title="Internship Application Review"
      onClose={() => setSelected(null)}
      footer={
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-2">
            {canAllowEdit && (
              <EditPermissionButton
                application={selected}
                onChange={handleEditPermissionChange}
              />
            )}
            {canDelete && (
              <button
                type="button"
                onClick={() => handleDelete(selected._id)}
                className="btn btn-danger"
              >
                Delete
              </button>
            )}
          </div>

          <div className="grid grid-cols-3 gap-2 sm:flex">
            <button
              type="button"
              onClick={() => handleAction("approve")}
              disabled={actionLoading}
              className="btn btn-success"
            >
              {actionLoading ? "Saving..." : "Approve"}
            </button>
            <button
              type="button"
              onClick={() => handleAction("reject")}
              disabled={actionLoading}
              className="btn btn-danger"
            >
              {actionLoading ? "Saving..." : "Reject"}
            </button>
            <button
              type="button"
              onClick={() => setSelected(null)}
              className="btn btn-secondary"
            >
              Close
            </button>
          </div>
        </div>
      }
    >
      <ApplicationDetails app={selected} />

      {/* Comment */}
      <div className="mt-5">
        <label className="label" htmlFor="review-comment">
          Your comment{" "}
          <span className="tracking-normal text-pink-600 normal-case">
            {role === "placement" || role === "principal"
              ? "(required only when rejecting)"
              : "(required to approve or reject)"}
          </span>
        </label>
        <textarea
          id="review-comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          className="textarea resize-none"
          placeholder="Write your comments here..."
          rows={3}
        />
      </div>
    </Modal>
  );
}
