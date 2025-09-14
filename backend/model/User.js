import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    clerkUserId: { type: String, unique: true, sparse: true }, // 👈 remove `required`
    email: { type: String, required: true, unique: true }, // 👈 email should be unique key
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
      ],
      default: "student",
      required: true,
    },
    department: {
      type: String,
      enum: ["cs", "civil", "eee", "me", "po", "ch", "ce", "at"],
    },
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);
