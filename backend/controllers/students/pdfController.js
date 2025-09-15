import Application from "../../model/Application.js";
import PDFDocument from "pdfkit";
import path from "path";
import { fileURLToPath } from "url";

function toTitleCase(str = "") {
  return str
    .toLowerCase()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export const generateInternshipLetter = async (req, res) => {
  try {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);

    const logo3 = path.join(__dirname, "../../public/assets/logo3.jpg");
    const logo4 = path.join(__dirname, "../../public/assets/logo4.png");
    const logo5 = path.join(__dirname, "../../public/assets/logo5.png");

    const app = await Application.findById(req.params.id);
    if (!app) return res.status(404).json({ error: "Application not found" });

    // ✅ Only allow if principal approved
    if (app.principal?.status !== "approved") {
      return res.status(403).json({ error: "Principal approval required" });
    }

    const doc = new PDFDocument({ margin: 50 });
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=Internship_Letter_${app.regNumber}.pdf`
    );
    doc.pipe(res);

    doc.image(logo3, 30, 40, { width: 60 });

    // Add right logo
    doc.image(logo4, 500, 40, { width: 60 });
    doc.image(logo5, 300, 40, { width: 20 });
    doc.moveDown(0.8);
    // ✅ Header
    doc
      .fontSize(14)
      .text("GOVERNMENT OF KARNATAKA", { align: "center", bold: true });
    doc
      .fontSize(11)
      .fillColor("red")
      .text("DEPARTMENT OF COLLEGIATE AND TECHNICAL EDUCATION", {
        align: "center",
      });
    doc
      .fontSize(13)
      .fillColor("green")
      .text("KARNATAKA (GOVT.) POLYTECHNIC, MANGALURU", { align: "center" });
    doc
      .fillColor("orange")
      .text("Kadri Hills, Mangaluru–575004, Dakshina Kannada, Karnataka", {
        align: "center",
      });

    const today = new Date().toLocaleDateString("en-GB");
    doc
      .moveTo(0, doc.y) // start (x=50, y=current y position)
      .lineTo(750, doc.y) // end (x=550, same y)
      .stroke();

    doc.moveDown(1);
    doc
      .fontSize(11)
      .fillColor("black")
      .text(
        `No.KPM/INTSP/${new Date().getFullYear()}-${
          new Date().getFullYear() + 1
        }`,
        { align: "left" }
      );
    doc.text(`Date: ${today}`, { align: "right" });
    doc.moveDown(0.5);

    // ✅ Recipient
    doc.text("To");
    // doc.text("To", 50, null);
    doc.text("The HR Manager,", 60);
    doc.text(`${toTitleCase(app.companyName || "")},`, 60);
    if (app.companyVillage) doc.text(toTitleCase(app.companyVillage) + ",", 60);
    if (app.companyCity) doc.text(toTitleCase(app.companyCity) + ",", 60);
    if (app.companyTaluk) doc.text(toTitleCase(app.companyTaluk) + ",", 60);
    if (app.companyDistrict)
      doc.text(toTitleCase(app.companyDistrict) + ",", 60);
    if (app.companyState) doc.text(toTitleCase(app.companyState) + ",", 60);
    if (app.contactPerson) doc.text("Ph: " + app.contactPerson + ".", 60, null);

    doc.moveDown(1);

    // ✅ Subject line
    doc.text(
      `Sub: Requisition for 16 weeks internship training for a student of Diploma in ${app.department.toUpperCase()} department.`
    );
    doc.moveDown(1);

    // ✅ Body with extra line gap
    const paragraphOptions = { align: "justify", lineGap: 6 };
    doc.text(
      `With reference to the above subject, we hereby request you to kindly permit our student (Listed below), pursuing fifth semester Diploma in ${app.department.toUpperCase()} department at Karnataka (Govt.) Polytechnic, Mangaluru and trained in “${app.subName.toUpperCase()}” specialization pathway in boot camp mode to render on-the job internship training in your prestigious organization.`,
      50, // 👈 start from same margin as "To"
      doc.y,
      { align: "justify", lineGap: 6 }
    );

    doc.moveDown(1);

    doc.text(
      `As per the curriculum of Diploma in ${app.department.toUpperCase()} Program, the students are required to complete six hundred and forty (640) hours of internship starting from ${
        app.startDate
          ? new Date(app.startDate).toLocaleDateString("en-GB")
          : "____"
      } to ${
        app.endDate ? new Date(app.endDate).toLocaleDateString("en-GB") : "____"
      }. Your support in this regard is highly appreciated. We hope that you will oblige us in our effort to achieve excellent academic standards of the students of our Polytechnic.`,
      50,
      null,
      { align: "justify", lineGap: 6 }
    );

    doc.moveDown(0.5);

    doc.text(
      `Details of the student are enclosed herewith for your kind perusal.`,
      paragraphOptions
    );
    doc.moveDown(0.5);

    // ✅ Student Info Table
    const tableTop = doc.y;
    const colWidths = [50, 200, 150, 120]; // adjust column widths

    // Draw table headers
    doc.font("Helvetica-Bold");
    doc.text("Sl. No.", 50, tableTop);
    doc.text("Name", 100, tableTop);
    doc.text("Register Number", 300, tableTop);
    doc.text("Mobile Number", 470, tableTop);

    doc.moveDown(0.5);

    // Draw student row
    const rowY = tableTop + 20;
    doc.font("Helvetica");
    doc.text("1", 50, rowY);
    doc.text(app.name, 100, rowY);
    doc.text(app.regNumber, 300, rowY);
    doc.text(app.phoneNumber, 470, rowY);

    // Reset cursor to left margin after table
    doc.moveDown(0.5);
    doc.text("Thanking you in anticipation,", 150, doc.y + 10, {
      align: "left",
    });
    doc.moveDown(0.5);
    doc.text("Yours sincerely,", 450, doc.y, { align: "right" });
    doc.text("Principal", 450, doc.y + 15, { align: "right" });

    doc.moveDown(0.2);
    doc
      .fontSize(10)
      .text(
        "This is a digitally signed document by the Principal.",
        320,
        doc.y + 5,
        {
          align: "right",
          italics: true,
        }
      );
    doc.moveDown(0.2);
    doc
      .fontSize(9)
      .text("Copy to: HOD / " + app.department.toUpperCase(), 60, null);

    // ✅ Footer
    doc.moveDown(0.2);
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
