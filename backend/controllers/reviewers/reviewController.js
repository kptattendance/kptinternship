// backend/controllers/applicationController.js
import mongoose from "mongoose";
import Application from "../../model/Application.js";

/**
 * Return applications the current reviewer is allowed to see
 * GET /api/applications/review
 */
export const getPendingForReviewer = async (req, res) => {
  try {
    const role = req.userRole;
    const department = req.userDepartment;

    let filter = {};

    switch (role) {
      case "cohortOwner":
        if (!department)
          return res
            .status(400)
            .json({ success: false, message: "No department assigned" });

        // Show cohortOwner pending OR rejected later by others
        filter = {
          department,
          $or: [
            { "cohortOwner.status": "pending" },
            { "hod.status": "rejected" },
            { "placement.status": "rejected" },
            { "principal.status": "rejected" },
          ],
        };
        break;

      case "hod":
        if (!department)
          return res
            .status(400)
            .json({ success: false, message: "No department assigned" });
        filter = {
          department,
          "cohortOwner.status": "approved",
          "hod.status": "pending",
        };
        break;

      case "placement":
        filter = { "hod.status": "approved", "placement.status": "pending" };
        break;

      case "principal":
        filter = {
          "placement.status": "approved",
          "principal.status": "pending",
        };
        break;

      default:
        return res
          .status(403)
          .json({ success: false, message: "Not authorized" });
    }

    const apps = await Application.find(filter).sort({ createdAt: -1 }).lean();
    return res.json({ success: true, data: apps });
  } catch (err) {
    console.error("Error in getPendingForReviewer:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Review (approve/reject) an application
 * PUT /api/applications/:id/review
 * body: { action: "approve" | "reject", comment: "..." }
 */
export const reviewApplication = async (req, res) => {
  try {
    const role = req.userRole;
    const department = req.userDepartment;

    const { action, comment } = req.body;
    if (!["approve", "reject"].includes(action))
      return res
        .status(400)
        .json({ success: false, message: "Invalid action" });

    if (comment !== undefined && typeof comment !== "string")
      return res
        .status(400)
        .json({ success: false, message: "Invalid comment" });

    const app = await Application.findById(req.params.id);
    if (!app)
      return res
        .status(404)
        .json({ success: false, message: "Application not found" });

    // Helper to set status/comment safely
    const setStatusAndComment = (field) => {
      app[field].status = action === "approve" ? "approved" : "rejected";
      app[field].comment = comment || "";
    };

    // Role-specific checks & transitions
    if (role === "cohortOwner") {
      if (!department || app.department !== department)
        return res.status(403).json({
          success: false,
          message: "Not authorized for this department",
        });

      if (app.cohortOwner.status !== "pending")
        return res.status(400).json({
          success: false,
          message: "Already reviewed by cohort owner",
        });

      setStatusAndComment("cohortOwner");
    } else if (role === "hod") {
      if (!department || app.department !== department)
        return res.status(403).json({
          success: false,
          message: "Not authorized for this department",
        });

      if (app.cohortOwner.status !== "approved")
        return res.status(400).json({
          success: false,
          message: "Cohort owner approval required first",
        });

      if (app.hod.status !== "pending")
        return res
          .status(400)
          .json({ success: false, message: "Already reviewed by HOD" });

      setStatusAndComment("hod");
    } else if (role === "placement") {
      if (app.hod.status !== "approved")
        return res
          .status(400)
          .json({ success: false, message: "HOD approval required first" });

      if (app.placement.status !== "pending")
        return res
          .status(400)
          .json({ success: false, message: "Already reviewed by placement" });

      setStatusAndComment("placement");
    } else if (role === "principal") {
      if (app.placement.status !== "approved")
        return res.status(400).json({
          success: false,
          message: "Placement approval required first",
        });

      if (app.principal.status !== "pending")
        return res
          .status(400)
          .json({ success: false, message: "Already reviewed by principal" });

      setStatusAndComment("principal");
    } else {
      return res
        .status(403)
        .json({ success: false, message: "Not authorized" });
    }

    await app.save();
    return res.json({
      success: true,
      message: `Application ${action}d`,
      data: app,
    });
  } catch (err) {
    console.error("Error in reviewApplication:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// Which applications each role may approve in bulk: the previous stage must be
// approved and the role's own stage still pending (same rules as one by one)
const BULK_APPROVE_RULES = {
  hod: (department) => ({
    department,
    "cohortOwner.status": "approved",
    "hod.status": "pending",
  }),
  placement: () => ({
    "hod.status": "approved",
    "placement.status": "pending",
  }),
  principal: () => ({
    "placement.status": "approved",
    "principal.status": "pending",
  }),
};

const MAX_BULK_APPROVE = 500;

/**
 * Approve many applications at once (HOD, placement, principal)
 * PUT /api/reviewers/bulk-approve
 * body: { applicationIds: [...], comment: "..." }
 */
export const bulkApproveApplications = async (req, res) => {
  try {
    const role = req.userRole;
    const { applicationIds, comment } = req.body || {};
    const rule = BULK_APPROVE_RULES[role];

    if (!rule) {
      return res.status(403).json({ success: false, message: "Not authorized" });
    }

    if (role === "hod" && !req.userDepartment) {
      return res
        .status(400)
        .json({ success: false, message: "No department assigned" });
    }

    if (!Array.isArray(applicationIds) || applicationIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Please select at least one application.",
      });
    }

    if (applicationIds.length > MAX_BULK_APPROVE) {
      return res.status(400).json({
        success: false,
        message: `You can approve at most ${MAX_BULK_APPROVE} applications at once.`,
      });
    }

    if (comment !== undefined && typeof comment !== "string") {
      return res.status(400).json({ success: false, message: "Invalid comment" });
    }

    const ids = applicationIds.filter((id) => mongoose.isValidObjectId(id));

    // Only the applications that are really waiting for this reviewer
    const ready = await Application.find(
      { _id: { $in: ids }, ...rule(req.userDepartment) },
      "_id"
    ).lean();
    const approvedIds = ready.map((app) => app._id);

    if (approvedIds.length > 0) {
      await Application.updateMany(
        { _id: { $in: approvedIds }, ...rule(req.userDepartment) },
        {
          $set: {
            [`${role}.status`]: "approved",
            [`${role}.comment`]: comment?.trim() || "Approved",
          },
        }
      );
    }

    return res.json({
      success: true,
      message: `${approvedIds.length} application(s) approved.`,
      approvedIds,
      skippedCount: applicationIds.length - approvedIds.length,
    });
  } catch (err) {
    console.error("Error in bulkApproveApplications:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};
