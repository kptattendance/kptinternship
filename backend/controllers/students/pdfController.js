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

    const doc = new PDFDocument({ margin: 50 });
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=Internship_Letter_${safeRegNumber}.pdf`
    );
    doc.pipe(res);

// Header logos
doc.image(logo3, 30, 32, { width: 60 });
doc.image(logo4, 500, 32, { width: 60 });

// Small Karnataka emblem
doc.image(logo5, 296, 22, { width: 20 });
    // --- Header ---
   doc
  .font("Helvetica-Bold")
  .fontSize(14)
  .fillColor("black")
  .text("GOVERNMENT OF KARNATAKA", { align: "center" });

doc
  .font("Helvetica")
  .fontSize(11)
  .fillColor("red")
  .text("DEPARTMENT OF COLLEGIATE AND TECHNICAL EDUCATION", {
    align: "center",
  });

doc
  .font("Helvetica-Bold")
  .fontSize(13)
  .fillColor("green")
  .text("KARNATAKA (GOVT.) POLYTECHNIC, MANGALURU", {
    align: "center",
  });

doc
  .font("Helvetica-Bold")
  .fontSize(10)
  .fillColor("blue")
  .text("(First Autonomous Polytechnic in India from AICTE, New Delhi)", {
    align: "center",
  });

doc
  .font("Helvetica")
  .fillColor("orange")
  .text("Kadri Hills, Mangaluru–575004, Dakshina Kannada, Karnataka", {
    align: "center",
  });

    const today = new Date().toLocaleDateString("en-GB");
    doc.moveTo(0, doc.y).lineTo(750, doc.y).stroke();
    const regPart = app.regNumber.slice(3);
    const currentYear = new Date().getFullYear();
    const nextYear = currentYear + 1;
    // ✅ Use last updated date instead of today's date
    const updatedDate = app.updatedAt
      ? new Date(app.updatedAt).toLocaleDateString("en-GB")
      : new Date().toLocaleDateString("en-GB");

    doc.moveDown(1);
    doc
      .fontSize(11)
      .fillColor("black")
      .text(`No.KPM/INTSP/${currentYear}-${nextYear}/${regPart}`, {
        align: "left",
      })
      .text(`Date: ${updatedDate}`, { align: "right" });

    doc.moveDown(0.5);

    // ✅ Recipient
    doc.text("To");
    doc.text("The HR Manager,", 60);
    doc.text(`${toTitleCase(app.companyName || "")},`, 60);
    // if (app.companyVillage) doc.text(toTitleCase(app.companyVillage) + ",", 60);
    // if (app.companyCity) doc.text(toTitleCase(app.companyCity) + ",", 60);
    // if (app.companyTaluk) doc.text(toTitleCase(app.companyTaluk) + ",", 60);
    // if (app.companyDistrict)
    //   doc.text(toTitleCase(app.companyDistrict) + ",", 60);
    // if (app.companyState) doc.text(toTitleCase(app.companyState) + ",", 60);
    // Collect all address fields and remove empty ones
    let addressParts = [
      app.companyVillage,
      app.companyCity,
      app.companyTaluk,
      app.companyDistrict,
      app.companyState,
    ].filter(Boolean);

    // Normalize (Title Case) and remove duplicates
    addressParts = [...new Set(addressParts.map((v) => toTitleCase(v.trim())))];

    // Print each unique value once
    addressParts.forEach((part) => {
      doc.text(part + ",", 60);
    });

    if (app.contactPerson) doc.text("Ph: " + app.contactPerson + ".", 60);

    doc.moveDown(1);

    // ✅ Subject line
    doc
      .font("Helvetica-Bold")
      .text(
        `Sub: Requisition for 16 weeks internship training for a student of Diploma in ${app.department.toUpperCase()} department.`
      )
      .moveDown(1);

    // ✅ Body
    const paragraphOptions = { align: "justify", lineGap: 3.5 };
    doc
      .font("Helvetica")
      .text(
        `With reference to the above subject, we hereby request you to kindly permit our student (Listed below), pursuing fifth semester Diploma in ${app.department.toUpperCase()} department at Karnataka (Govt.) Polytechnic, Mangaluru and trained in “${app.subName.toUpperCase()}” specialization pathway in boot camp mode to render on-the job internship training in your prestigious organization.`,
        50,
        doc.y,
        paragraphOptions
      )
      .moveDown(1)
      .text(
        `As per the curriculum of Diploma in ${app.department.toUpperCase()} Program, the students are required to complete six hundred and forty (640) hours of internship starting from ${
          app.startDate
            ? new Date(app.startDate).toLocaleDateString("en-GB")
            : "____"
        } to ${
          app.endDate
            ? new Date(app.endDate).toLocaleDateString("en-GB")
            : "____"
        }. Your support in this regard is highly appreciated. We hope that you will oblige us in our effort to achieve excellent academic standards of the students of our Polytechnic.`,
        50,
        doc.y,
        paragraphOptions
      )
      .moveDown(0.5)
      .text(
        `Details of the student are enclosed herewith for your kind perusal.`,
        paragraphOptions
      )
      .moveDown(0.5);

    // ✅ Student Info Table
    // const tableTop = doc.y;
    // doc.font("Helvetica-Bold");
    // doc.text("Sl. No.", 50, tableTop);
    // doc.text("Name", 100, tableTop);
    // doc.text("Register Number", 300, tableTop);
    // doc.text("Mobile Number", 470, tableTop);

    // const rowY = tableTop + 20;
    // doc.font("Helvetica");
    // doc.text("1", 50, rowY);
    // doc.text(app.name, 100, rowY);
    // doc.text(app.regNumber, 300, rowY);
    // doc.text(app.phoneNumber, 470, rowY);
    // --------------------------------------------
    // STUDENT INFO TABLE WITH BORDER
    // --------------------------------------------

    const tableTop = doc.y + 10;
    const startX = 40;
    const headerHeight = 25;
    const rowHeight = 76; // tall enough for the student's photo

    // Column widths: Sl No | Photo | Name | Register Number | Mobile Number
    const columns = [
      { title: "Sl. No.", width: 50 },
      { title: "Photo", width: 76 },
      { title: "Name", width: 170 },
      { title: "Register Number", width: 122 },
      { title: "Mobile Number", width: 114 },
    ];
    const tableWidth = columns.reduce((sum, c) => sum + c.width, 0);
    const tableHeight = headerHeight + rowHeight;
    const columnX = columns.map((_, i) =>
      columns.slice(0, i).reduce((x, c) => x + c.width, startX)
    );

    // Light shading on the header row
    doc.rect(startX, tableTop, tableWidth, headerHeight).fill("#f1f5f9");
    doc.fillColor("black").lineWidth(0.8).strokeColor("black");

    // Outer border, header line and column lines
    doc.rect(startX, tableTop, tableWidth, tableHeight).stroke();
    doc
      .moveTo(startX, tableTop + headerHeight)
      .lineTo(startX + tableWidth, tableTop + headerHeight)
      .stroke();
    columnX.slice(1).forEach((x) =>
      doc.moveTo(x, tableTop).lineTo(x, tableTop + tableHeight).stroke()
    );

    // Header text
    doc.font("Helvetica-Bold").fontSize(10);
    columns.forEach((c, i) =>
      doc.text(c.title, columnX[i] + 6, tableTop + 8, {
        width: c.width - 12,
        align: i <= 1 ? "center" : "left",
      })
    );

    // Student photo, so the company can match the student who reports
    const photo = { x: columnX[1] + 6, y: tableTop + headerHeight + 6, w: columns[1].width - 12, h: rowHeight - 12 };
    let photoPlaced = false;
    if (studentPhoto) {
      try {
        doc.image(studentPhoto, photo.x, photo.y, {
          fit: [photo.w, photo.h],
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
        .font("Helvetica")
        .fontSize(7.5)
        .fillColor("gray")
        .text("Affix photo", photo.x, photo.y + photo.h / 2 - 5, { width: photo.w, align: "center" })
        .fillColor("black");
    }

    // Row text, vertically centred in the tall row
    const textY = tableTop + headerHeight + rowHeight / 2 - 6;
    doc.font("Helvetica").fontSize(11);
    doc.text("1", columnX[0] + 6, textY, { width: columns[0].width - 12, align: "center" });
    doc.text(app.name, columnX[2] + 6, textY, { width: columns[2].width - 12 });
    doc.text(app.regNumber, columnX[3] + 6, textY, { width: columns[3].width - 12 });
    doc.text(app.phoneNumber, columnX[4] + 6, textY, { width: columns[4].width - 12 });

    // Move cursor below table
    doc.y = tableTop + tableHeight + 12;

    // ✅ Closing — "Thanking you" and "Yours sincerely" share a line,
    // leaving space above "Principal" for the signature
    const closingY = doc.y + 6;
    doc.text("Thanking you in anticipation,", 60, closingY);
    doc.text("Yours sincerely,", 60, closingY, { align: "right", width: doc.page.width - 110 });

    doc.text("Principal", 60, closingY + 48, { align: "right", width: doc.page.width - 110 });

    doc.moveDown(0.5);
    doc.fontSize(9).text("Copy to: HOD / " + app.department.toUpperCase(), 60);

    // ✅ Footer
    doc
      .moveTo(0, doc.page.height - 100)
      .lineTo(650, doc.page.height - 100)
      .stroke();
    doc
      .fontSize(9)
      .fillColor("blue")
      .text(
        "Email: kptmng@gmail.com, kptplacements@gmail.com",
        0,
        doc.page.height - 90,
        { align: "center" }
      )
      .fillColor("black")
      .text(
        "Website: https://gpt.karnataka.gov.in/kptmangalore/public/18/contact/en",
        0,
        doc.page.height - 80,
        { align: "center" }
      )
      .fontSize(8)
      .text(
        "Contact: (0824) - 3516910, (0824) - 3542476, (0824) - 2211636, (0824) - 3515889",
        0,
        doc.page.height - 70,
        { align: "center" }
      )
      .fillColor("gray")
      .fontSize(6)
      .text(
        "Generated by KPT Mangaluru Internship Portal",
        0,
        doc.page.height - 60,
        { align: "center" }
      );

    doc.end();
  } catch (err) {
    console.error("PDF generation error:", err);
    res.status(500).json({ success: false, message: "Failed to generate PDF" });
  }
};
