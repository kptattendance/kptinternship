// backend/controllers/students/undertakingController.js
// Pre-filled, printable "Undertaking" (parent consent) form for a student.
// The student downloads it, gets it signed and uploads the scan.
import mongoose from "mongoose";
import PDFDocument from "pdfkit";
import Application from "../../model/Application.js";
import { canAccessApplication } from "../../middlewares/requireRole.js";
import { DEPARTMENT_NAMES, fetchPhoto, getLogos } from "./pdfController.js";

// Plain, formal look: black text, one dark blue for the college name
const COLORS = {
  text: "#111111",
  muted: "#555555",
  navy: "#1e3a8a",
  line: "#777777",
};

// Serif fonts, like a typed official letter
const FONT = {
  regular: "Times-Roman",
  bold: "Times-Bold",
  italic: "Times-Italic",
};

// Academic year runs June → May, e.g. an internship starting Dec 2025 → 2025-26
const academicYear = (date) => {
  const d = date ? new Date(date) : new Date();
  const start = d.getMonth() >= 5 ? d.getFullYear() : d.getFullYear() - 1;
  return `${start}-${String(start + 1).slice(-2)}`;
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

    // ---------- Frame (double border, like the printed form) ----------
    doc.lineWidth(2).strokeColor(COLORS.text).rect(18, 18, pageWidth - 36, doc.page.height - 36).stroke();
    doc.lineWidth(0.6).rect(23, 23, pageWidth - 46, doc.page.height - 46).stroke();

    // ---------- Letterhead ----------
    if (logoLeft) doc.image(logoLeft, 36, 32, { fit: [62, 62] });
    if (logoRight) doc.image(logoRight, pageWidth - 98, 32, { fit: [62, 62] });

    const center = { align: "center", width: pageWidth - 220 };
    doc
      .fillColor(COLORS.text)
      .font(FONT.bold)
      .fontSize(10.5)
      .text("GOVERNMENT OF KARNATAKA", 110, 34, center)
      .font(FONT.regular)
      .fontSize(9.5)
      .text("DEPARTMENT OF COLLEGIATE AND TECHNICAL EDUCATION", center)
      .moveDown(0.15)
      .font(FONT.bold)
      .fontSize(14)
      .fillColor(COLORS.navy)
      .text("KARNATAKA (GOVT.) POLYTECHNIC, MANGALURU", center)
      .fillColor(COLORS.text)
      .font(FONT.italic)
      .fontSize(9)
      .text("(First Autonomous Polytechnic in India from AICTE, New Delhi)", center)
      .font(FONT.regular)
      .text("Kadri Hills, Mangaluru – 575004, Dakshina Kannada, Karnataka", center);

    // Double rule under the letterhead
    doc.lineWidth(1.2).moveTo(36, 104).lineTo(pageWidth - 36, 104).stroke();
    doc.lineWidth(0.5).moveTo(36, 107).lineTo(pageWidth - 36, 107).stroke();

    // ---------- Title ----------
    doc
      .font(FONT.bold)
      .fontSize(18)
      .fillColor(COLORS.text)
      .text("UNDERTAKING", 0, 116, { align: "center", width: pageWidth, characterSpacing: 2 })
      .fontSize(11.5)
      .text(`For the Academic Year ${academicYear(app.startDate)}`, { align: "center", width: pageWidth });

    // ---------- Photo ----------
    const photoBox = { x: pageWidth - 148, y: 114, w: 90, h: 108 };
    doc.lineWidth(0.8).strokeColor(COLORS.text).rect(photoBox.x, photoBox.y, photoBox.w, photoBox.h).stroke();
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
        .font(FONT.italic)
        .fontSize(9)
        .text("Affix passport size photograph", photoBox.x + 8, photoBox.y + 46, { width: photoBox.w - 16, align: "center" });
    }

    // ---------- To ----------
    doc
      .fillColor(COLORS.text)
      .font(FONT.bold)
      .fontSize(11.5)
      .text("To,", left, 154)
      .font(FONT.regular)
      .text("The Principal,", left + 14)
      .text("Karnataka (Govt.) Polytechnic,")
      .text("Kadri Hills,")
      .text("Mangaluru – 575004.");

    doc
      .font(FONT.bold)
      .fontSize(12)
      .text(`Subject: Undertaking for ${workTitle}`, left, 234, { align: "center", width, underline: true });

    // ---------- Opening paragraph (filled in) ----------
    const para = { width, align: "left", lineGap: 1.5 };
    const filled = (text) =>
      doc.font(FONT.bold).fillColor(COLORS.text).text(text, { ...para, continued: true });
    const plain = (text, last = false) =>
      doc.font(FONT.regular).fillColor(COLORS.text).text(text, { ...para, continued: !last });

    doc.fontSize(11).text("", left, 256);
    plain("        I, ");
    filled(name);
    plain(", a student of Diploma in ");
    filled(department);
    plain(", enrolled with Register Number ");
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
      doc.font(FONT.bold).fontSize(11).fillColor(COLORS.text).text(heading, left, doc.y, { width });
      doc.font(FONT.regular).fontSize(10.5).text(body, { width, align: "justify", lineGap: 0.5 });
      doc.moveDown(0.25);
    }

    // ---------- Two-column rows ----------
    const col2 = left + width / 2 + 20;
    const row = (leftLabel, leftValue, rightLabel, rightValue) => {
      const y = doc.y + 4;
      const field = (x, label, value, fullWidth = false) => {
        doc.font(FONT.bold).fontSize(10.5).fillColor(COLORS.text).text(label, x, y, { continued: true });
        if (value) {
          doc.font(FONT.regular).text(` ${value}`);
        } else {
          // Dotted writing line that fills the rest of the column
          const columnEnd = x === left && !fullWidth ? col2 - 15 : left + width;
          const room = columnEnd - x - doc.font(FONT.bold).widthOfString(label) - 6;
          const dots = Math.max(8, Math.floor(room / doc.font(FONT.regular).widthOfString(".")));
          doc.font(FONT.regular).fillColor(COLORS.line).text(" " + ".".repeat(dots), { lineBreak: false });
        }
      };
      if (leftLabel) field(left, leftLabel, leftValue, !rightLabel);
      if (rightLabel) field(col2, rightLabel, rightValue);
      doc.y = y + 15.5;
    };

    doc.moveDown(0.2);
    row("Date:", "", "Signature of the Student:", "");
    row("Contact Number:", app.phoneNumber, "Name:", name);

    // ---------- Parent / guardian ----------
    doc.moveDown(0.5);
    doc
      .font(FONT.regular)
      .fontSize(10.5)
      .fillColor(COLORS.text)
      .text(
        `        As a parent/guardian, I also confirm that this undertaking has been executed voluntarily by my ward, and I am fully aware of the contents of the document. The content of this undertaking has been read out to me in a language that I understand, and I acknowledge it as true and correct. I give my consent for my ward to undergo ${work} for his/her better future and academic career.`,
        left,
        doc.y,
        { width, align: "justify", lineGap: 1 }
      );

    doc.moveDown(0.3);
    row("Name of the Parent/Guardian:", "", null);
    row("Address:", "", null);
    row("Date:", "", "Signature of Parent/Guardian:", "");
    row("Contact Number:", "", null);

    doc.moveDown(0.3);
    doc.font(FONT.italic).fontSize(11).fillColor(COLORS.text).text("Signed by the applicant in my presence.", left, doc.y);

    // ---------- Witnesses ----------
    doc.moveDown(0.3);
    const wy = doc.y;
    doc.font(FONT.bold).fontSize(11.5).fillColor(COLORS.text);
    doc.text("Witness No. 1:", left, wy);
    doc.text("Witness No. 2:", col2, wy);
    doc.y = wy + 14;
    for (const label of ["Signature", "Name", "Address"]) {
      row(`${label}:`, "", `${label}:`, "");
    }

    // ---------- Footer (inside the bottom margin, so no new page) ----------
    doc.page.margins.bottom = 0;
    doc
      .font(FONT.italic)
      .fontSize(8)
      .fillColor(COLORS.muted)
      .text(
        "Generated by KPT Internship Portal. After signing, upload a clear photo or scan of this page in your login under \"Parent Consent / Undertaking\".",
        30,
        doc.page.height - 38,
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
