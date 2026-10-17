// src/utils/exportExcel.js
// Excel report of internship applications. The Excel library is large, so it
// is downloaded only when someone actually clicks "Export".

const HEADINGS = [
  ["GOVERNMENT OF KARNATAKA"],
  ["DEPARTMENT OF COLLEGIATE AND TECHNICAL EDUCATION"],
  ["KARNATAKA (GOVT.) POLYTECHNIC, MANGALURU"],
  ["(First Autonomous Polytechnic in India from AICTE, New Delhi)"],
  ["Kadri Hills, Mangaluru – 575004, Dakshina Kannada, Karnataka"],
];

const formatDate = (value) =>
  value ? new Date(value).toLocaleDateString("en-GB") : "-";

const toRow = (app) => ({
  "Reg Number": app.regNumber,
  Name: app.name,
  Phone: app.phoneNumber,
  Department: app.department?.toUpperCase(),
  Type: app.internhsipType || "-",
  Company: app.companyName,
  "Company Contact": app.companyContact,
  "Company Email": app.companyEmail,
  "Start Date": formatDate(app.startDate),
  "End Date": formatDate(app.endDate),
  "Working Hours": app.workingHours ?? "-",

  "Month 1": app.attendance?.month1 ?? 0,
  "Month 2": app.attendance?.month2 ?? 0,
  "Month 3": app.attendance?.month3 ?? 0,
  "Month 4": app.attendance?.month4 ?? 0,
  "Month 5": app.attendance?.month5 ?? 0,

  "CIE-I Report (50)": app.marks?.cie1?.report ?? 0,
  "CIE-I Presentation (30)": app.marks?.cie1?.presentation ?? 0,
  "CIE-I Total (80)": app.marks?.cie1?.total ?? 0,

  "CIE-II Report (50)": app.marks?.cie2?.report ?? 0,
  "CIE-II Use Case (30)": app.marks?.cie2?.useCase ?? 0,
  "CIE-II Total (80)": app.marks?.cie2?.total ?? 0,

  "CIE-III Report (50)": app.marks?.cie3?.report ?? 0,
  "CIE-III Use Case (30)": app.marks?.cie3?.useCase ?? 0,
  "CIE-III Total (80)": app.marks?.cie3?.total ?? 0,

  "Cohort Owner": app.cohortOwner?.status || "pending",
  HOD: app.hod?.status || "pending",
  Placement: app.placement?.status || "pending",
  Principal: app.principal?.status || "pending",
});

/** Downloads the given applications as "<fileName>.xlsx", sorted by Reg No */
export async function exportApplicationsExcel(apps, fileName = "Internship_Report") {
  const XLSX = await import("xlsx");

  const rows = [...apps]
    .sort((a, b) =>
      (a.regNumber || "").localeCompare(b.regNumber || "", undefined, {
        numeric: true,
      })
    )
    .map(toRow);

  // Table starts below the college heading
  const worksheet = XLSX.utils.json_to_sheet(rows, { origin: "A7" });
  XLSX.utils.sheet_add_aoa(worksheet, HEADINGS, { origin: "A1" });

  const totalColumns = Object.keys(rows[0] || toRow({})).length;
  worksheet["!merges"] = HEADINGS.map((_, i) => ({
    s: { r: i, c: 0 },
    e: { r: i, c: totalColumns - 1 },
  }));
  worksheet["!cols"] = Array(totalColumns).fill({ wch: 18 });

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Internship Report");
  XLSX.writeFile(workbook, `${fileName}.xlsx`);
}
