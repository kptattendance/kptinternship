// backend/controllers/students/undertakingController.js
// Pre-filled, printable "Undertaking" (parent consent) form for a student.
// The student downloads it, gets it signed and uploads the scan.
import mongoose from "mongoose";
import PDFDocument from "pdfkit";
import Application from "../../model/Application.js";
import { canAccessApplication } from "../../middlewares/requireRole.js";
import { getLogos } from "./pdfController.js";

const DEPARTMENT_NAMES = {
  at: "Automobile Engineering",
  ch: "Chemical Engineering",
  ce: "Civil Engineering",
  cs: "Computer Science & Engineering",
  ec: "Electronics & Communication Engineering",
  eee: "Electrical & Electronics Engineering",
  me: "Mechanical Engineering",
  po: "Polymer Technology",
};

const COLORS = {
  text: "#1e293b",
  muted: "#64748b",
  indigo: "#4338ca",
  violet: "#7c3aed",
  pink: "#db2777",
  orange: "#f97316",
  line: "#94a3b8",
};

// Academic year runs June → May, e.g. an internship starting Dec 2025 → 2025-26
const academicYear = (date) => {
  const d = date ? new Date(date) : new Date();
  const start = d.getMonth() >= 5 ? d.getFullYear() : d.getFullYear() - 1;
  return `${start}-${String(start + 1).slice(-2)}`;
};

// Cloudinary can hand us a small JPEG (PDFs only accept JPEG / PNG)
const photoUrl = (url) =>
  url?.includes("res.cloudinary.com") && url.includes("/upload/")
    ? url.replace("/upload/", "/upload/f_jpg,q_85,w_300,h_360,c_limit/")
    : url;

const fetchPhoto = async (url) => {
  if (!url) return null;
  try {
    const response = await fetch(photoUrl(url));
    if (!response.ok) return null;
    return Buffer.from(await response.arrayBuffer());
  } catch {
    return null;
  }
};

const toTitleCase = (str = "") =>
  str
    .toLowerCase()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

export const generateUndertaking = async (req, res) => {
  try {
    const app = mongoose.isValidObjectId(req.params.id)
      ? await Application.findById(req.params.id)
      : null;

    // Only the student who applied or authorised staff can get the form
    if (!app || !canAccessApplication(req, app)) {
      return res.status(404).json({ error: "Application not found" });
    }

    const isProject = app.internhsipType === "Project";
    const work = isProject ? "project work" : "internship";
    const workTitle = isProject ? "Project Work" : "Internship";
    const place = isProject ? "the institution" : "the industry";

    const [[logoLeft, logoRight], photo] = await Promise.all([
      getLogos().catch(() => []),
      fetchPhoto(app.image),
    ]);

    const name = toTitleCase(app.name || "");
    const department = DEPARTMENT_NAMES[app.department] || app.department?.toUpperCase() || "";
    const safeRegNumber = (app.regNumber || "").replace(/[^a-zA-Z0-9_-]/g, "");

    const doc = new PDFDocument({
      size: "A4",
      margins: { top: 30, bottom: 20, left: 50, right: 50 },
    });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=Undertaking_${safeRegNumber}.pdf`
    );
    doc.pipe(res);

    const pageWidth = doc.page.width;
    const left = 50;
    const width = pageWidth - 100;

    // ---------- Frame ----------
    doc.lineWidth(2.5).strokeColor(COLORS.indigo).rect(16, 16, pageWidth - 32, doc.page.height - 32).stroke();
    doc.lineWidth(0.8).strokeColor(COLORS.violet).rect(21, 21, pageWidth - 42, doc.page.height - 42).stroke();

    // ---------- Colourful header band ----------
    const band = doc.linearGradient(21, 21, pageWidth - 21, 21);
    band.stop(0, COLORS.indigo).stop(0.55, COLORS.violet).stop(1, COLORS.pink);
    doc.rect(21, 21, pageWidth - 42, 74).fill(band);

    if (logoLeft) doc.image(logoLeft, 32, 29, { fit: [58, 58] });
    if (logoRight) doc.image(logoRight, pageWidth - 90, 29, { fit: [58, 58] });

    doc
      .fillColor("white")
      .font("Helvetica-Bold")
      .fontSize(14)
      .text("KARNATAKA (GOVT.) POLYTECHNIC, MANGALURU", 0, 38, { align: "center", width: pageWidth })
      .font("Helvetica")
      .fontSize(8.5)
      .text("(First Autonomous Polytechnic in India from AICTE, New Delhi)", { align: "center", width: pageWidth })
      .text("Kadri Hills, Mangaluru – 575004, Dakshina Kannada, Karnataka", { align: "center", width: pageWidth });

    // ---------- Title ----------
    doc
      .fillColor(COLORS.indigo)
      .font("Helvetica-Bold")
      .fontSize(20)
      .text("UNDERTAKING", 0, 106, { align: "center", width: pageWidth })
      .fillColor(COLORS.pink)
      .fontSize(11)
      .text(`For the Academic Year ${academicYear(app.startDate)}`, { align: "center", width: pageWidth });

    // ---------- Photo ----------
    const photoBox = { x: pageWidth - 150, y: 108, w: 92, h: 112 };
    doc.lineWidth(1.5).strokeColor(COLORS.orange).rect(photoBox.x, photoBox.y, photoBox.w, photoBox.h).stroke();
    let photoPlaced = false;
    if (photo) {
      try {
        doc.image(photo, photoBox.x + 3, photoBox.y + 3, {
          fit: [photoBox.w - 6, photoBox.h - 6],
          align: "center",
          valign: "center",
        });
        photoPlaced = true;
      } catch {
        photoPlaced = false;
      }
    }
    if (!photoPlaced) {
      doc
        .fillColor(COLORS.muted)
        .font("Helvetica")
        .fontSize(8)
        .text("Affix passport size photo", photoBox.x + 8, photoBox.y + 48, { width: photoBox.w - 16, align: "center" });
    }

    // ---------- To ----------
    doc
      .fillColor(COLORS.text)
      .font("Helvetica-Bold")
      .fontSize(10.5)
      .text("To", left, 150)
      .font("Helvetica")
      .text("The Principal")
      .text("Karnataka (Govt.) Polytechnic")
      .text("Kadri Hills")
      .text("Mangaluru-575004");

    doc
      .font("Helvetica-Bold")
      .fontSize(11)
      .fillColor(COLORS.violet)
      .text(`Subject: Undertaking for ${workTitle}`, left, 232, { align: "center", width });

    // ---------- Opening paragraph (filled in) ----------
    const para = { width, align: "left", lineGap: 2.5 };
    const filled = (text) =>
      doc.font("Helvetica-Bold").fillColor(COLORS.indigo).text(text, { ...para, continued: true, underline: true });
    const plain = (text, last = false) =>
      doc.font("Helvetica").fillColor(COLORS.text).text(text, { ...para, continued: !last, underline: false });

    doc.fontSize(10).text("", left, 254);
    plain("        I, ");
    filled(name);
    plain(", a student of Diploma in ");
    filled(department);
    plain(", enrolled with Register Number: ");
    filled(app.regNumber || "");
    plain(
      `, hereby submit this undertaking in connection with the ${work}, which is a part of the Diploma Curriculum, and my participation in various activities aimed at enhancing my technical and communication skills for better career opportunities, as well as traveling within or outside Mangaluru.`,
      true
    );

    // ---------- Clauses ----------
    const clauses = [
      [
        "1.  No Claim against the Authorities",
        `I understand and agree that neither I, nor any nominee or legal representative, will make any claim against the Government of India, the Government of Karnataka, the Principal, Program Coordinator, or any staff member of Karnataka (Govt.) Polytechnic, in respect of any loss or injury to my property or person (including injury resulting in death) that may occur during the course of the ${work} or related activities.`,
      ],
      [
        "2.  No Compensation",
        "I acknowledge that no compensation will be provided by the Government of India, the Government of Karnataka, or any officer for such loss, injury, or damage.",
      ],
      [
        "3.  Responsibility for Negligence or Misbehavior",
        `In the event of any damage to property or injury to any person in ${place} due to my negligence or misbehavior, I accept full responsibility and agree to bear the consequences.`,
      ],
      [
        "4.  Voluntary Execution of the Undertaking",
        "This undertaking is executed voluntarily, without any pressure, undue influence, or threat, and I affirm that I fully understand the contents of this document.",
      ],
    ];

    doc.moveDown(0.5);
    for (const [heading, body] of clauses) {
      doc.font("Helvetica-Bold").fontSize(10).fillColor(COLORS.violet).text(heading, left, doc.y, { width });
      doc.font("Helvetica").fontSize(9.5).fillColor(COLORS.text).text(body, { width, align: "justify", lineGap: 1.5 });
      doc.moveDown(0.35);
    }

    // ---------- Two-column rows ----------
    const col2 = left + width / 2 + 20;
    const row = (leftLabel, leftValue, rightLabel, rightValue) => {
      const y = doc.y + 4;
      const field = (x, label, value, fullWidth = false) => {
        doc.font("Helvetica-Bold").fontSize(10).fillColor(COLORS.text).text(label, x, y, { continued: true });
        if (value) {
          doc.font("Helvetica-Bold").fillColor(COLORS.indigo).text(` ${value}`);
        } else {
          // Dotted writing line that fills the rest of the column
          const columnEnd = x === left && !fullWidth ? col2 - 15 : left + width;
          const room = columnEnd - x - doc.font("Helvetica-Bold").widthOfString(label) - 6;
          const dots = Math.max(8, Math.floor(room / doc.font("Helvetica").widthOfString(".")));
          doc.font("Helvetica").fillColor(COLORS.line).text(" " + ".".repeat(dots), { lineBreak: false });
        }
      };
      if (leftLabel) field(left, leftLabel, leftValue, !rightLabel);
      if (rightLabel) field(col2, rightLabel, rightValue);
      doc.y = y + 17;
    };

    doc.moveDown(0.2);
    row("Date:", "", "Sign. of the Student:", "");
    row("Contact Number:", app.phoneNumber, "Name:", name);

    // ---------- Parent / guardian ----------
    doc.moveDown(0.5);
    doc
      .font("Helvetica")
      .fontSize(9.5)
      .fillColor(COLORS.text)
      .text(
        `        As a parent/guardian, I also confirm that this undertaking has been executed voluntarily by my ward, and I am fully aware of the contents of the document. The content of this undertaking has been read out to me in a language that I understand, and I acknowledge it as true and correct. I give my consent for my ward to undergo ${work} for his/her better future and academic career.`,
        left,
        doc.y,
        { width, align: "justify", lineGap: 1.5 }
      );

    doc.moveDown(0.3);
    row("Name of the Parent/Guardian:", "", null);
    row("Address:", "", null);
    row("Date:", "", "Signature of the Parent/Guardian:", "");
    row("Contact Number:", "", null);

    doc.moveDown(0.4);
    doc.font("Helvetica-Oblique").fontSize(9.5).fillColor(COLORS.muted).text("Signed by the applicant in my presence.", left, doc.y);

    // ---------- Witnesses ----------
    doc.moveDown(0.4);
    const wy = doc.y;
    doc.font("Helvetica-Bold").fontSize(10).fillColor(COLORS.violet);
    doc.text("Witness No. 1:", left, wy);
    doc.text("Witness No. 2:", col2, wy);
    doc.y = wy + 14;
    for (const label of ["Signature", "Name", "Address"]) {
      row(`${label}:`, "", `${label}:`, "");
    }

    // ---------- Footer ----------
    doc
      .font("Helvetica")
      .fontSize(7.5)
      .fillColor(COLORS.muted)
      .text(
        "Generated by KPT Internship Portal • After signing, scan or photograph this page and upload it from your login under \"Parent Consent / Undertaking\".",
        30,
        doc.page.height - 40,
        { width: pageWidth - 60, align: "center", lineBreak: false }
      );

    doc.end();
  } catch (err) {
    console.error("Undertaking PDF error:", err);
    if (!res.headersSent) {
      res.status(500).json({ success: false, message: "Failed to generate undertaking" });
    }
  }
};
