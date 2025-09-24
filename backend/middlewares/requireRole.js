// middleware/requireRole.js
import { clerkClient } from "@clerk/express";
import { getAuth } from "@clerk/express";

export const requireRole = (allowedRoles) => {
  return async (req, res, next) => {
    try {
      const { userId } = getAuth(req);
      if (!userId) return res.status(401).json({ error: "Unauthorized" });

      const clerkUser = await clerkClient.users.getUser(userId);
      const role = clerkUser.publicMetadata?.role || "student";

      if (!allowedRoles.includes(role)) {
        return res.status(403).json({ error: "Forbidden: insufficient role" });
      }

      req.userId = userId;
      req.userRole = role;
      next();
    } catch (err) {
      console.error("❌ Role check error:", err);
      return res.status(401).json({ error: "Unauthorized" });
    }
  };
};
