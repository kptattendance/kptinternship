import express from "express";
import YearStatistics from "../model/YearStatistics.js";

const router = express.Router();

// GET all records
router.get("/", async (req, res) => {
  try {
    const data = await YearStatistics.find();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ADD new record
router.post("/", async (req, res) => {
  try {
    const record = new YearStatistics(req.body);
    await record.save();
    res.json(record);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// UPDATE record
router.put("/:id", async (req, res) => {
  try {
    const updated = await YearStatistics.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE record
router.delete("/:id", async (req, res) => {
  try {
    await YearStatistics.findByIdAndDelete(req.params.id);
    res.json({ message: "Deleted successfully" });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

export default router;
