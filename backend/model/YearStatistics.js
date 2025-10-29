import mongoose from "mongoose";

const programSchema = new mongoose.Schema({
  program: { type: String, required: true }, // e.g. CS, ME, etc.
  passingYear: { type: Number, required: true },

  totalStudents: {
    male: { type: Number, default: 0 },
    female: { type: Number, default: 0 },
    total: { type: Number, default: 0 },
  },
  placed: {
    male: { type: Number, default: 0 },
    female: { type: Number, default: 0 },
    total: { type: Number, default: 0 },
  },
  higherStudies: {
    male: { type: Number, default: 0 },
    female: { type: Number, default: 0 },
    total: { type: Number, default: 0 },
  },
});

export default mongoose.models.YearStatistics ||
  mongoose.model("YearStatistics", programSchema);
