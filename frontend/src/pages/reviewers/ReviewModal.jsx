import React, { useState } from "react";
import axios from "axios";
import Modal from "../../components/Modal";
import ApplicationDetails from "../../components/ApplicationDetails";
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

  const canEditOrDelete =
    role === "cohortOwner" &&
    (selected.cohortOwner?.status === "pending" ||
      selected.hod?.status === "rejected" ||
      selected.placement?.status === "rejected" ||
      selected.principal?.status === "rejected");

  return (
    <Modal
      title="Internship Application Review"
      onClose={() => setSelected(null)}
      footer={
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-2">
            {canEditOrDelete && (
              <>
                <button
                  type="button"
                  onClick={() => handleUpdate(selected)}
                  className="btn btn-secondary flex-1 sm:flex-none"
                >
                  Update
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(selected._id)}
                  className="btn btn-danger flex-1 sm:flex-none"
                >
                  Delete
                </button>
              </>
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
