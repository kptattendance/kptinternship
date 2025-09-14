// backend/controllers/webhooks.js
import User from "../model/User.js";

export const handleClerkWebhook = async (req, res) => {
  try {
    const event = req.body;

    if (event.type === "invitation.accepted") {
      const { email_address, public_metadata } = event.data;

      await User.findOneAndUpdate(
        { email: email_address },
        {
          role: public_metadata?.role || "student",
          department: public_metadata?.department || null,
        },
        { new: true }
      );
    }

    res.json({ received: true });
  } catch (err) {
    console.error("❌ Webhook error:", err);
    res.status(500).json({ error: err.message });
  }
};
