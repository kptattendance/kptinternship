// backend/controllers/applicationController.js
import Application from "../../model/Application.js";
import { clerkClient } from "@clerk/express";

/**
 * Return applications the current reviewer is allowed to see
 * GET /api/applications/review
 */
export const getPendingForReviewer = async (req, res) => {
  try {
    const userId = req.auth.userId;
    const clerkUser = await clerkClient.users.getUser(userId);
    const role = clerkUser.publicMetadata?.role || "student";
    const department = clerkUser.publicMetadata?.department || null;

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
    const userId = req.auth.userId;
    const clerkUser = await clerkClient.users.getUser(userId);
    const role = clerkUser.publicMetadata?.role || "student";
    const department = clerkUser.publicMetadata?.department || null;

    const { action, comment } = req.body;
    if (!["approve", "reject"].includes(action))
      return res
        .status(400)
        .json({ success: false, message: "Invalid action" });

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
