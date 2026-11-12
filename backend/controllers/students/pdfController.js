import mongoose from "mongoose";
import Application from "../../model/Application.js";
import PDFDocument from "pdfkit";
import { canAccessApplication } from "../../middlewares/requireRole.js";

// ✅ Cloudinary image URLs
const LOGO_URLS = [
  "https://res.cloudinary.com/dnreqxbdw/image/upload/w_240,c_limit/v1757932916/logo3_vptob4.jpg",
  "https://res.cloudinary.com/dnreqxbdw/image/upload/w_240,c_limit/v1757932915/logo4_q0ujtn.png",
  "https://res.cloudinary.com/dnreqxbdw/image/upload/w_240,c_limit/v1757932915/logo5_czeuoz.png",
];

// The logos never change, so download them once and reuse them for every letter
let logosPromise = null;

const fetchLogo = async (url) => {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Failed to fetch logo: ${url}`);

  return Buffer.from(await response.arrayBuffer());
};

export const getLogos = () => {
  if (!logosPromise) {
    logosPromise = Promise.all(LOGO_URLS.map(fetchLogo)).catch((err) => {
      logosPromise = null; // retry on the next request
      throw err;
    });
  }

  return logosPromise;
};

export const DEPARTMENT_NAMES = {
  at: "Automobile Engineering",
  ch: "Chemical Engineering",
  ce: "Civil Engineering",
  cs: "Computer Science & Engineering",
  ec: "Electronics & Communication Engineering",
  eee: "Electrical & Electronics Engineering",
  me: "Mechanical Engineering",
  po: "Polymer Technology",
};

// Cloudinary can hand us a small JPEG (PDFs only accept JPEG / PNG)
const photoUrl = (url) =>
  url?.includes("res.cloudinary.com") && url.includes("/upload/")
    ? url.replace("/upload/", "/upload/f_jpg,q_85,w_300,h_360,c_limit/")
    : url;

/** Student photo as an image buffer, or null if it cannot be loaded */
export const fetchPhoto = async (url) => {
  if (!url) return null;
  try {
    const response = await fetch(photoUrl(url));
    if (!response.ok) return null;
    return Buffer.from(await response.arrayBuffer());
  } catch {
    return null;
  }
};

function toTitleCase(str = "") {
  return str
    .toLowerCase()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export const generateInternshipLetter = async (req, res) => {
  try {
    const app = mongoose.isValidObjectId(req.params.id)
      ? await Application.findById(req.params.id)
      : null;

    // Only the student who applied or authorised staff can get the letter
    if (!app || !canAccessApplication(req, app)) {
      return res.status(404).json({ error: "Application not found" });
    }

    // The letter asks a company to accept the student, so projects have none
    if (app.internhsipType === "Project") {
      return res
        .status(400)
        .json({ error: "The internship letter is only for internships" });
    }

    // ✅ Only allow if principal approved
    if (app.principal?.status !== "approved") {
      return res.status(403).json({ error: "Principal approval required" });
    }

    const [[logo3, logo4, logo5], studentPhoto] = await Promise.all([
      getLogos(),
      fetchPhoto(app.image),
    ]);

    // regNumber is typed by the student — keep only safe filename characters
    const safeRegNumber = app.regNumber.replace(/[^a-zA-Z0-9_-]/g, "");

    // Formal letter style: serif font, black text, one dark-blue accent
    const FONT = { regular: "Times-Roman", bold: "Times-Bold", italic: "Times-Italic" };
    const INK = "#111111";
    const NAVY = "#1e3a8a";
    const MUTED = "#4b5563";

    const doc = new PDFDocument({ size: "A4", margins: { top: 40, bottom: 30, left: 56, right: 56 } });
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=Internship_Letter_${safeRegNumber}.pdf`
    );
    doc.pipe(res);

    const pageWidth = doc.page.width;
    const left = 56;
    const width = pageWidth - 112;
    const department = app.department.toUpperCase();
    const formatDate = (value) =>
      value ? new Date(value).toLocaleDateString("en-GB") : "____";

    // ---------- Letterhead ----------
    doc.image(logo3, 40, 30, { fit: [62, 62] });
    doc.image(logo4, pageWidth - 102, 30, { fit: [62, 62] });
    doc.image(logo5, pageWidth / 2 - 10, 18, { width: 20 });

    const head = { align: "center", width: pageWidth - 200 };
    doc
      .fillColor(INK)
      .font(FONT.bold)
      .fontSize(11)
      .text("GOVERNMENT OF KARNATAKA", 100, 42, head)
      .font(FONT.regular)
      .fontSize(9.5)
      .text("DEPARTMENT OF COLLEGIATE AND TECHNICAL EDUCATION", head)
      .moveDown(0.15)
      .font(FONT.bold)
      .fontSize(14)
      .fillColor(NAVY)
      .text("KARNATAKA (GOVT.) POLYTECHNIC, MANGALURU", head)
      .fillColor(INK)
      .font(FONT.italic)
      .fontSize(9.5)
      .text("(First Autonomous Polytechnic in India from AICTE, New Delhi)", head)
      .font(FONT.regular)
      .text("Kadri Hills, Mangaluru – 575004, Dakshina Kannada, Karnataka", head);

    // Double rule under the letterhead
    const ruleY = Math.max(doc.y + 6, 112);
    doc.strokeColor(NAVY).lineWidth(1.4).moveTo(40, ruleY).lineTo(pageWidth - 40, ruleY).stroke();
    doc.lineWidth(0.5).moveTo(40, ruleY + 3).lineTo(pageWidth - 40, ruleY + 3).stroke();

    // ---------- Reference number and date ----------
    const regPart = app.regNumber.slice(3);
    const currentYear = new Date().getFullYear();
    // The letter date is when the application was last updated (approved)
    const letterDate = formatDate(app.updatedAt || new Date());

    doc.font(FONT.regular).fontSize(11.5).fillColor(INK);
    doc.text(`No. KPM/INTSP/${currentYear}-${currentYear + 1}/${regPart}`, left, ruleY + 16);
    doc.text(`Date: ${letterDate}`, left, ruleY + 16, { width, align: "right" });

    // ---------- Recipient ----------
    const addressParts = [
      ...new Set(
        [app.companyVillage, app.companyCity, app.companyTaluk, app.companyDistrict, app.companyState]
          .filter(Boolean)
          .map((v) => toTitleCase(v.trim()))
      ),
    ];

    doc.text("To,", left, ruleY + 44);
    doc.text("The HR Manager,", left + 16);
    doc.font(FONT.bold).text(`${toTitleCase(app.companyName || "")},`);
    doc.font(FONT.regular);
    // Address on as few lines as possible
    doc.text(`${addressParts.join(", ")}.`, { width: width / 1.6 });
    if (app.contactPerson) doc.text(`Ph: ${app.contactPerson}`);

    // ---------- Subject ----------
    doc.moveDown(0.9);
    const subjectY = doc.y;
    doc.font(FONT.bold).text("Sub:", left, subjectY);
    doc.text(
      `Requisition for 16 weeks internship training for a student of Diploma in ${department} department.`,
      left + 32,
      subjectY,
      { width: width - 32, underline: false }
    );

    // ---------- Body ----------
    const paragraph = { width, align: "justify", lineGap: 2.5, indent: 28 };
    doc.moveDown(0.8);
    doc
      .font(FONT.regular)
      .text("Respected Sir/Madam,", left, doc.y)
      .moveDown(0.4)
      .text(
        `With reference to the above subject, we hereby request you to kindly permit our student (listed below), pursuing fifth semester Diploma in ${department} department at Karnataka (Govt.) Polytechnic, Mangaluru and trained in “${app.subName.toUpperCase()}” specialization pathway in boot camp mode, to render on-the-job internship training in your prestigious organization.`,
        left,
        doc.y,
        paragraph
      )
      .moveDown(0.6)
      .text(
        `As per the curriculum of the Diploma in ${department} Program, the students are required to complete six hundred and forty (640) hours of internship starting from ${formatDate(app.startDate)} to ${formatDate(app.endDate)}. Your support in this regard is highly appreciated. We hope that you will oblige us in our effort to achieve excellent academic standards of the students of our Polytechnic.`,
        paragraph
      )
      .moveDown(0.6)
      .text("The details of the student are given below for your kind perusal.", paragraph);

    // ---------- Student details: details on the left, photo on the right ----------
    const panelTop = doc.y + 12;
    const panelHeight = 112;
    const photoBox = { w: 78, h: 94, x: left + width - 78, y: panelTop + 9 };


    const details = [
      ["Name of the Student", toTitleCase(app.name || "")],
      ["Register Number", app.regNumber],
      ["Department", DEPARTMENT_NAMES[app.department] || department],
      ["Mobile Number", app.phoneNumber],
    ];

    const labelX = left + 28;
    const colonX = labelX + 118;
    const valueX = colonX + 12;
    const valueWidth = photoBox.x - valueX - 12;
    let rowY = panelTop + 18;

    for (const [label, value] of details) {
      doc.font(FONT.regular).fontSize(11.5).fillColor(MUTED).text(label, labelX, rowY);
      doc.fillColor(INK).text(":", colonX, rowY);
      doc.font(FONT.bold).text(value || "-", valueX, rowY, { width: valueWidth, lineBreak: false, ellipsis: true });
      rowY += 21;
    }

    // Photo, so the company can be sure who is reporting
    doc.lineWidth(0.8).strokeColor(INK).rect(photoBox.x, photoBox.y, photoBox.w, photoBox.h).stroke();
    let photoPlaced = false;
    if (studentPhoto) {
      try {
        doc.image(studentPhoto, photoBox.x + 2, photoBox.y + 2, {
          fit: [photoBox.w - 4, photoBox.h - 4],
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
        .font(FONT.italic)
        .fontSize(8.5)
        .fillColor(MUTED)
        .text("Affix passport size photograph", photoBox.x + 6, photoBox.y + 36, { width: photoBox.w - 12, align: "center" });
    }

    // ---------- Closing ----------
    const closingY = panelTop + panelHeight + 22;
    doc.font(FONT.regular).fontSize(11.5).fillColor(INK);
    doc.text("Thanking you in anticipation,", left, closingY);
    doc.text("Yours sincerely,", left, closingY, { width, align: "right" });

    // Space above for the Principal's signature and seal
    doc.font(FONT.bold).text("Principal", left, closingY + 54, { width, align: "right" });
    doc.font(FONT.regular).fontSize(10.5).text("Karnataka (Govt.) Polytechnic, Mangaluru", left, doc.y, { width, align: "right" });

    doc.font(FONT.regular).fontSize(10.5).text(`Copy to: HOD / ${department}`, left, closingY + 92);

    // ---------- Footer ----------
    const footerY = doc.page.height - 74;
    doc.page.margins.bottom = 0; // footer sits in the margin, never on a new page
    doc.strokeColor(NAVY).lineWidth(0.8).moveTo(40, footerY).lineTo(pageWidth - 40, footerY).stroke();

    const foot = { width: pageWidth, align: "center", lineBreak: false };
    doc
      .font(FONT.regular)
      .fontSize(9)
      .fillColor(NAVY)
      .text("Email: kptmng@gmail.com  |  kptplacements@gmail.com", 0, footerY + 8, foot)
      .fillColor(MUTED)
      .text("Website: https://gpt.karnataka.gov.in/kptmangalore/public/18/contact/en", 0, footerY + 20, foot)
      .text("Phone: (0824) 3516910, 3542476, 2211636, 3515889", 0, footerY + 32, foot)
      .font(FONT.italic)
      .fontSize(7.5)
      .text("Generated by KPT Mangaluru Internship Portal", 0, footerY + 46, foot);

    doc.end();
  } catch (err) {
    console.error("PDF generation error:", err);
    res.status(500).json({ success: false, message: "Failed to generate PDF" });
  }
};
