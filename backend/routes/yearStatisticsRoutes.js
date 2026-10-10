import express from "express";
import mongoose from "mongoose";
import YearStatistics from "../model/YearStatistics.js";
import { requireRole } from "../middlewares/requireRole.js";

const router = express.Router();

// Only the placement cell can change the statistics
const requireEditor = requireRole(["placement", "admin"]);

const EDITABLE_FIELDS = [
  "program",
  "passingYear",
  "totalStudents",
  "placed",
  "higherStudies",
];

const pickEditableFields = (body = {}) => {
  const picked = {};

  for (const field of EDITABLE_FIELDS) {
    if (body[field] !== undefined) picked[field] = body[field];
  }

  return picked;
};

// GET records (public) — ?year=2026 returns only that passing year
router.get("/", async (req, res) => {
  try {
    const year = Number(req.query.year);
    const filter = Number.isInteger(year) ? { passingYear: year } : {};

    const data = await YearStatistics.find(filter).lean();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ADD new record
router.post("/", requireEditor, async (req, res) => {
  try {
    const record = new YearStatistics(pickEditableFields(req.body));
    await record.save();
    res.json(record);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// UPDATE record
router.put("/:id", requireEditor, async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(404).json({ error: "Record not found" });
    }

    const updated = await YearStatistics.findByIdAndUpdate(
      req.params.id,
      { $set: pickEditableFields(req.body) },
      { new: true, runValidators: true }
    );
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE record
router.delete("/:id", requireEditor, async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(404).json({ error: "Record not found" });
    }

    await YearStatistics.findByIdAndDelete(req.params.id);
    res.json({ message: "Deleted successfully" });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

export default router;
