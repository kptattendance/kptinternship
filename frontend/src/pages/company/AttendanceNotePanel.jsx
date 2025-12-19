import { useState } from "react";
import { HiOutlineInformationCircle } from "react-icons/hi";
import { FiChevronDown, FiChevronUp } from "react-icons/fi";

export default function AttendanceNotePanel() {
  const [open, setOpen] = useState(false);

  const startDateLabel = "15 December 2025";
  const endDateLabel = "04 April 2026";
  const hoursPerDay = 8;

  const monthRows = [
    {
      name: "December 2025",
      calendarDays: 31,
      window: "15–31 (17 days)",
      inclSat: 13,
      exclSat: 11,
    },
    {
      name: "January 2026",
      calendarDays: 31,
      window: "Full month",
      inclSat: 27,
      exclSat: 23,
    },
    {
      name: "February 2026",
      calendarDays: 28,
      window: "Full month",
      inclSat: 24,
      exclSat: 20,
    },
    {
      name: "March 2026",
      calendarDays: 31,
      window: "Full month",
      inclSat: 27,
      exclSat: 23,
    },
    {
      name: "April 2026",
      calendarDays: 30,
      window: "1–4 (4 days)",
      inclSat: 4,
      exclSat: 3,
    },
  ];

  const totalInclSat = monthRows.reduce((s, r) => s + r.inclSat, 0);
  const totalExclSat = monthRows.reduce((s, r) => s + r.exclSat, 0);

  const exampleEntry = {
    December: 10,
    January: 22,
    February: 20,
    March: 25,
    April: 3,
  };
  const exampleTotalDays =
    exampleEntry.December +
    exampleEntry.January +
    exampleEntry.February +
    exampleEntry.March +
    exampleEntry.April;
  const exampleTotalHours = exampleTotalDays * hoursPerDay;

  return (
    <div className="mb-6 relative rounded-xl border border-amber-300 bg-gradient-to-br from-amber-50 via-orange-50 to-stone-100 shadow-md">
      <div className="p-5">
        <div className="flex items-start gap-4">
          {/* Icon */}
          <div className="flex-shrink-0 mt-1 rounded-full bg-amber-600 text-white p-2 shadow-md">
            <HiOutlineInformationCircle size={14} />
          </div>

          {/* Content */}
          <div className="flex-1">
            {/* Header Row */}
            <div className="flex items-start justify-between">
              <h3 className="text-base font-semibold text-stone-800 tracking-wide">
                Internship Attendance Entry Guidelines
              </h3>

              <button
                onClick={() => setOpen(!open)}
                className="flex items-center gap-2 text-sm text-amber-800 hover:text-orange-700 px-3 py-1 rounded cursor-pointer hover:bg-amber-100 transition"
              >
                {open ? (
                  <>
                    <FiChevronUp /> Hide
                  </>
                ) : (
                  <>
                    <FiChevronDown /> Show
                  </>
                )}
              </button>
            </div>

            {/* 🔽 COLLAPSIBLE CONTENT */}
            <div
              className={`mt-3 transition-all duration-300 overflow-hidden ${
                open ? "max-h-[1500px] opacity-100" : "max-h-0 opacity-0"
              }`}
            >
              <p className="text-sm text-stone-700 mt-2 leading-relaxed">
                Please enter only the{" "}
                <strong className="text-amber-700">
                  number of days the student attended
                </strong>{" "}
                during each month.
              </p>
              {/* Internship Duration */}
              <p className="text-sm text-stone-700">
                <strong>Internship Duration:</strong>{" "}
                <span className="font-medium">{startDateLabel}</span> →{" "}
                <span className="font-medium">{endDateLabel}</span> •{" "}
                <strong>{hoursPerDay} hours/day</strong>
              </p>

              {/* COLLAPSIBLE CONTENT */}
              <div
                className={`mt-4 transition-all duration-300 overflow-hidden ${
                  open ? "max-h-[1500px] opacity-100" : "max-h-0 opacity-0"
                }`}
              >
                {/* Table */}
                <div className="rounded-lg border border-amber-300 overflow-hidden shadow-sm bg-white">
                  <div className="p-4">
                    <h4 className="text-sm font-semibold text-stone-800 mb-2">
                      Internship Month Breakdown
                    </h4>

                    <table className="w-full text-sm">
                      <thead className="bg-amber-100 text-stone-700">
                        <tr>
                          <th className="px-3 py-2 text-left">Month</th>
                          <th className="px-3 py-2 text-center">
                            Calendar Days
                          </th>
                          <th className="px-3 py-2 text-left">
                            Internship Days
                          </th>
                          <th className="px-3 py-2 text-center">
                            Incl. Saturday
                          </th>
                          <th className="px-3 py-2 text-center">
                            Excl. Saturday
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {monthRows.map((r) => (
                          <tr key={r.name} className="even:bg-stone-50">
                            <td className="px-3 py-2 font-medium">{r.name}</td>
                            <td className="px-3 py-2 text-center">
                              {r.calendarDays}
                            </td>
                            <td className="px-3 py-2">{r.window}</td>
                            <td className="px-3 py-2 text-center text-orange-700 font-semibold">
                              {r.inclSat}
                            </td>
                            <td className="px-3 py-2 text-center text-blue-800 font-semibold">
                              {r.exclSat}
                            </td>
                          </tr>
                        ))}

                        <tr className="bg-amber-100 font-semibold">
                          <td className="px-3 py-2">Total Window</td>
                          <td className="px-3 py-2 text-center">—</td>
                          <td className="px-3 py-2">Entire period</td>
                          <td className="px-3 py-2 text-center">
                            {totalInclSat} days
                          </td>
                          <td className="px-3 py-2 text-center">
                            {totalExclSat} days
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Example */}
                <div className="mt-4 p-4 border border-amber-300 rounded-lg bg-white shadow-sm">
                  <h4 className="text-sm font-semibold text-stone-800 mb-2">
                    Example
                  </h4>

                  <table className="w-full text-sm mb-3">
                    <tbody>
                      {Object.entries(exampleEntry).map(([month, value], i) => (
                        <tr key={month} className={i % 2 ? "bg-stone-50" : ""}>
                          <td className="px-3 py-2">{month}</td>
                          <td className="px-3 py-2 text-center font-medium">
                            {value}
                          </td>
                        </tr>
                      ))}

                      <tr className="bg-amber-100 font-semibold">
                        <td className="px-3 py-2">Total Attendance</td>
                        <td className="px-3 py-2 text-center">
                          {exampleTotalDays} days
                        </td>
                      </tr>
                    </tbody>
                  </table>

                  <p className="text-sm text-stone-700">
                    <strong>Working Hours:</strong> {exampleTotalDays} ×{" "}
                    {hoursPerDay} hrs ={" "}
                    <span className="font-bold text-amber-800">
                      {exampleTotalHours} hrs
                    </span>
                  </p>

                  <p className="mt-2 text-xs text-stone-600 italic">
                    The college verifies holidays and Sundays. Only genuine
                    attendance should be entered.
                  </p>
                </div>

                <p className="mt-4 text-sm text-stone-700">
                  If a student arrives late or misses a day, mark it as absent.
                  Attendance should reflect reality — not expectation.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
