// backend/models/Application.js
import mongoose from "mongoose";

const applicationSchema = new mongoose.Schema(
  {
    studentId: {
      type: String, // Clerk userId
      required: [true, "Student ID is required"],
      trim: true,
    },
    name: { type: String, required: [true, "Name is required"], trim: true },
    regNumber: {
      type: String,
      required: [true, "Registration number is required"],
      trim: true,
    },

    phoneNumber: {
      type: String,
      required: [true, "Phone number is required"],
      validate: {
        validator: function (v) {
          return /^[0-9]{10}$/.test(v); // only 10 digit phone numbers
        },
        message: (props) =>
          `${props.value} is not a valid 10-digit phone number!`,
      },
    },

    department: {
      type: String,
      enum: ["cs", "ec", "eee", "me", "po", "ch", "ce", "at"],
      required: [true, "Department is required"],
    },

    image: {
      type: String,
      required: [true, "Image URL is required"],
      trim: true,
    },

    subName: {
      type: String,
      required: [true, "Subject name is required"],
      trim: true,
    },

    // Company Info
    companyName: {
      type: String,
      required: [true, "Company name is required"],
      trim: true,
    },
    companyVillage: {
      type: String,
      required: [true, "Company village is required"],
      trim: true,
    },
    companyCity: {
      type: String,
      required: [true, "Company city is required"],
      trim: true,
    },
    companyTaluk: {
      type: String,
      required: [true, "Company taluk is required"],
      trim: true,
    },
    companyDistrict: {
      type: String,
      required: [true, "Company district is required"],
      trim: true,
    },
    companyState: {
      type: String,
      required: [true, "Company state is required"],
      trim: true,
    },

    companyContact: {
      type: String,
      required: [true, "Company contact number is required"],
      validate: {
        validator: function (v) {
          return /^[0-9]{10}$/.test(v);
        },
        message: (props) =>
          `${props.value} is not a valid 10-digit contact number!`,
      },
    },

    companyEmail: {
      type: String,
      required: [true, "Company email is required"],
      lowercase: true,
      validate: {
        validator: function (v) {
          return /^\S+@\S+\.\S+$/.test(v);
        },
        message: (props) => `${props.value} is not a valid email!`,
      },
    },

    contactPerson: {
      type: String,
      required: [true, "Contact person is required"],
      trim: true,
    },
    companyProfile: {
      type: String,
      required: [true, "Company profile is required"],
      trim: true,
    },

    // Internship Info
    startDate: { type: Date, required: [true, "Start date is required"] },
    endDate: {
      type: Date,
      required: [true, "End date is required"],
      validate: {
        validator: function (v) {
          return v >= this.startDate;
        },
        message: () => `End date must be after start date`,
      },
    },
    workingHours: {
      type: String,
      required: [true, "Working hours are required"],
    },
    duties: { type: String, required: [true, "Duties are required"] },
    tasks: { type: String, required: [true, "Tasks are required"] },
    expectedSkills: {
      type: String,
      required: [true, "Expected skills are required"],
    },
    expectedTools: {
      type: String,
      required: [true, "Expected tools are required"],
    },
    expectedChallenges: {
      type: String,
      required: [true, "Expected challenges are required"],
    },
    learningOutcomes: {
      type: String,
      required: [true, "Learning outcomes are required"],
    },
    jobOpportunity: {
      type: String,
      required: [true, "Job opportunity info is required"],
    },

    dateOfApplication: { type: Date, default: Date.now, required: true },

    // Review pipeline
    cohortOwner: {
      status: {
        type: String,
        enum: ["pending", "approved", "rejected"],
        default: "pending",
      },
      comment: { type: String, default: "" },
    },
    hod: {
      status: {
        type: String,
        enum: ["pending", "approved", "rejected"],
        default: "pending",
      },
      comment: { type: String, default: "" },
    },
    placement: {
      status: {
        type: String,
        enum: ["pending", "approved", "rejected"],
        default: "pending",
      },
      comment: { type: String, default: "" },
    },
    principal: {
      status: {
        type: String,
        enum: ["pending", "approved", "rejected"],
        default: "pending",
      },
      comment: { type: String, default: "" },
    },
  },
  { timestamps: true }
);

const Application = mongoose.model("Application", applicationSchema);
export default Application;
