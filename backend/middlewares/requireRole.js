// middleware/requireRole.js
import { getAuth } from "@clerk/express";
import { getClerkProfile } from "./authMiddleware.js";

// Roles that can see applications of every department
export const ALL_DEPARTMENT_ROLES = ["placement", "principal", "admin"];

// Roles that can only see applications of their own department
export const DEPARTMENT_ROLES = ["cohortOwner", "hod"];

/**
 * Attaches the logged-in user's role details to the request:
 * req.userId, req.userRole, req.userDepartment, req.userEmail, req.userName
 */
export const attachUserRole = async (req, res, next) => {
  try {
    const { userId } = getAuth(req);
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const profile = await getClerkProfile(userId);

    req.userId = userId;
    req.userRole = profile.role;
    req.userDepartment = profile.department;
    req.userEmail = profile.email;
    req.userName = profile.name;
    next();
  } catch (err) {
    console.error("❌ Role check error:", err);
    return res.status(401).json({ error: "Unauthorized" });
  }
};

export const requireRole = (allowedRoles) => {
  return (req, res, next) =>
    attachUserRole(req, res, () => {
      if (!allowedRoles.includes(req.userRole)) {
        return res.status(403).json({
          error: "Forbidden: insufficient role",
          message: "You are not authorized to perform this action.",
        });
      }
      next();
    });
};

/**
 * Mongo filter limiting a staff member to the applications they may access.
 * Returns null when the user has no access at all.
 */
export const applicationScope = (req) => {
  if (ALL_DEPARTMENT_ROLES.includes(req.userRole)) return {};

  if (DEPARTMENT_ROLES.includes(req.userRole) && req.userDepartment) {
    return { department: req.userDepartment };
  }

  return null;
};

/**
 * True when the user owns the application or is staff allowed to access it.
 */
export const canAccessApplication = (req, application) => {
  if (application.studentId === req.userId) return true;

  const scope = applicationScope(req);
  if (!scope) return false;

  return !scope.department || scope.department === application.department;
};
