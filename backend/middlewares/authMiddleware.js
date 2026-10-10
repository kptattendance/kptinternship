import { clerkClient, getAuth } from "@clerk/express";

export const requireAuthMiddleware = (req, res, next) => {
  try {
    const { userId } = getAuth(req);
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    req.userId = userId; // attach Clerk userId
    next();
  } catch (err) {
    console.error("❌ Clerk auth error:", err);
    return res.status(401).json({ error: "Unauthorized" });
  }
};

// Role, department and email live in Clerk. Fetching them is a network call,
// so keep each user's profile for a short while instead of asking Clerk on
// every request.
const PROFILE_TTL_MS = 30 * 1000;
const MAX_CACHED_PROFILES = 1000;
const profileCache = new Map();

export const getClerkProfile = async (userId) => {
  const cached = profileCache.get(userId);
  if (cached && cached.expiresAt > Date.now()) return cached.profile;

  const clerkUser = await clerkClient.users.getUser(userId);
  const department = clerkUser.publicMetadata?.department;

  const profile = {
    role: clerkUser.publicMetadata?.role || "student",
    department: department ? String(department).toLowerCase() : null,
    email: clerkUser.emailAddresses?.[0]?.emailAddress || null,
    name: clerkUser.firstName || "",
  };

  if (profileCache.size >= MAX_CACHED_PROFILES) profileCache.clear();
  profileCache.set(userId, {
    profile,
    expiresAt: Date.now() + PROFILE_TTL_MS,
  });

  return profile;
};

// Call after changing a user's role/department so the change applies at once
export const clearClerkProfile = (userId) => {
  if (userId) profileCache.delete(userId);
};
