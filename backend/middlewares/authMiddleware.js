import { getAuth } from "@clerk/express";

export const requireAuthMiddleware = (req, res, next) => {
  console.log("near auth function");

  try {
    const { userId } = getAuth(req);

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    req.userId = userId; // attach Clerk userId
    next();
  } catch (err) {
    console.error("❌ Clerk auth error:", err);
    return res.status(401).json({ error: "Unauthorized" });
  }
};
