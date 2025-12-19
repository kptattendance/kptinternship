import mongoose from "mongoose";

const companySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true, // 🔑 company identity
      lowercase: true,
      trim: true,
    },

    phoneNumber: {
      type: String,
      trim: true,
    },

    departments: {
      type: [String],
      enum: ["cs", "eee", "me", "po", "ch", "ce", "at", "ec"],
      default: [],
    },

    logoUrl: { type: String },
    logoPublicId: { type: String },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

export default mongoose.model("Company", companySchema);
