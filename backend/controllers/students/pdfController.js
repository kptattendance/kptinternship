import Application from "../../model/Application.js";
import PDFDocument from "pdfkit";

function toTitleCase(str = "") {
  return str
    .toLowerCase()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export const generateInternshipLetter = async (req, res) => {
  try {
    const app = await Application.findById(req.params.id);
    if (!app) return res.status(404).json({ error: "Application not found" });

    // ✅ Only allow if principal approved
    if (app.principal?.status !== "approved") {
      return res.status(403).json({ error: "Principal approval required" });
    }

    // ✅ Cloudinary image URLs
    const logo3Url =
      "https://res.cloudinary.com/dnreqxbdw/image/upload/v1757932916/logo3_vptob4.jpg";
    const logo4Url =
      "https://res.cloudinary.com/dnreqxbdw/image/upload/v1757932915/logo4_q0ujtn.png";
    const logo5Url =
      "https://res.cloudinary.com/dnreqxbdw/image/upload/v1757932915/logo5_czeuoz.png";

    // ✅ Fetch and convert to Buffer
    const [logo3, logo4, logo5] = await Promise.all([
      fetch(logo3Url)
        .then((r) => r.arrayBuffer())
        .then((buf) => Buffer.from(buf)),
      fetch(logo4Url)
        .then((r) => r.arrayBuffer())
        .then((buf) => Buffer.from(buf)),
      fetch(logo5Url)
        .then((r) => r.arrayBuffer())
        .then((buf) => Buffer.from(buf)),
    ]);

    const doc = new PDFDocument({ margin: 50 });
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=Internship_Letter_${app.regNumber}.pdf`
    );
    doc.pipe(res);

    // ✅ Use Cloudinary images (Buffers)
    doc.image(logo3, 30, 40, { width: 60 });
    doc.image(logo4, 500, 40, { width: 60 });
    doc.image(logo5, 300, 40, { width: 20 });

    // --- Header ---
    doc
      .font("Helvetica-Bold")
      .fontSize(14)
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
      .text("KARNATAKA (GOVT.) POLYTECHNIC, MANGALURU", { align: "center" });
    doc
      .font("Helvetica-Bold")
      .fontSize(10)
      .fillColor("blue")
      .text("First autonomous polytechnic in India from AICTE, New Delhi", {
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

    doc.moveDown(1);
    doc
      .fontSize(11)
      .fillColor("black")
      .text(`No.KPM/INTSP/${currentYear}-${nextYear}/${regPart}`, {
        align: "left",
      })
      .text(`Date: ${today}`, { align: "right" });
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
    const paragraphOptions = { align: "justify", lineGap: 6 };
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
    const tableTop = doc.y;
    doc.font("Helvetica-Bold");
    doc.text("Sl. No.", 50, tableTop);
    doc.text("Name", 100, tableTop);
    doc.text("Register Number", 300, tableTop);
    doc.text("Mobile Number", 470, tableTop);

    const rowY = tableTop + 20;
    doc.font("Helvetica");
    doc.text("1", 50, rowY);
    doc.text(app.name, 100, rowY);
    doc.text(app.regNumber, 300, rowY);
    doc.text(app.phoneNumber, 470, rowY);

    // ✅ Closing
    doc.moveDown(1);
    doc.text("Thanking you in anticipation,", 150);
    doc.moveDown(1);
    doc.text("Yours sincerely,", { align: "right" });

    doc.moveDown(2);
    doc.text("Principal", { align: "right" });

    // doc
    //   .fontSize(10)
    //   .fillColor("black")
    //   .text("This is a digitally signed document by the Principal.", {
    //     align: "right",
    //   });
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
