import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    clerkUserId: { type: String, unique: true, sparse: true },
    email: { type: String, required: true, unique: true },
    name: { type: String },
    phoneNumber: { type: String },
    role: {
      type: String,
      enum: [
        "student",
        "cohortOwner",
        "hod",
        "placement",
        "principal",
        "admin",
        "company",
      ],
      default: "student",
      required: true,
    },
    department: {
      type: String,
      enum: ["cs", "eee", "me", "po", "ch", "ce", "at", "ec"],
    },
    photoUrl: { type: String }, // ✅ Add this
    photoPublicId: { type: String }, // ✅ Add this
  },
  { timestamps: true }
);
userSchema.index({ clerkUserId: 1, email: 1 }, { unique: true });

export default mongoose.model("User", userSchema);
