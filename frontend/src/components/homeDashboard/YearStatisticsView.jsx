"use client";
import { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "@clerk/clerk-react";

const DEPARTMENTS = [
  { value: "at", label: "Automobile Engineering" },
  { value: "ch", label: "Chemical Engineering" },
  { value: "civil", label: "Civil Engineering" },
  { value: "cs", label: "Computer Science Engineering" },
  { value: "ec", label: "Electronics & Communication Engineering" },
  { value: "eee", label: "Electrical & Electronics Engineering" },
  { value: "me", label: "Mechanical Engineering" },
  { value: "po", label: "Polymer Engineering" },
];

export default function YearStatisticsView() {
  const [stats, setStats] = useState([]);
  const [passingYear, setPassingYear] = useState(2026);
  const [loading, setLoading] = useState(false);
  const backendUrl = import.meta.env.VITE_BACKEND_URL;
  const { getToken } = useAuth();

  useEffect(() => {
    fetchStats();
  }, [passingYear]);

  const fetchStats = async () => {
    setLoading(true);
    const token = await getToken();
    const res = await axios.get(
      `${backendUrl}/api/yearStatistics?year=${passingYear}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    const existing = res.data;
    const merged = DEPARTMENTS.map((dep) => {
      const found = existing.find((s) => s.program === dep.value);
      return (
        found || {
          program: dep.value,
          passingYear,
          totalStudents: { male: 0, female: 0, total: 0 },
          placed: { male: 0, female: 0, total: 0 },
          higherStudies: { male: 0, female: 0, total: 0 },
        }
      );
    });

    setStats(merged);
    setLoading(false);
  };

  return (
    <div
      className="relative bg-cover bg-center sm:p-6 p-3"
      style={{ backgroundImage: "url('/clgimg1.jpg')" }}
    >
      <div className="relative max-w-6xl mx-auto mt-14 bg-white/80 rounded-2xl shadow-lg p-3 sm:p-6 border border-gray-100">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-6 gap-3 sm:gap-4">
          <h2 className="text-xl sm:text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent text-center sm:text-left leading-tight">
            Final Year Placed Students Statistics
          </h2>

          <div className="flex items-center justify-center sm:justify-end gap-2 sm:gap-3">
            <label className="text-gray-700 font-medium text-sm sm:text-base">
              Passing Year:{" "}
              <span className="text-red-500 font-bold text-sm sm:text-base">
                {passingYear}
              </span>
            </label>
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <p className="text-center text-gray-500 py-10 text-base sm:text-lg">
            Loading...
          </p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-gray-200">
            <table className="min-w-[700px] sm:min-w-full text-[10px] sm:text-sm border-collapse w-full">
              <thead className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white">
                <tr>
                  <th className="border p-1 sm:p-2">Sl. No</th>
                  <th className="border p-1 sm:p-2">Program</th>
                  <th className="border p-1 sm:p-2" colSpan="3">
                    Total Students
                  </th>
                  <th className="border p-1 sm:p-2" colSpan="3">
                    Placed
                  </th>
                  <th className="border p-1 sm:p-2" colSpan="3">
                    Higher Studies
                  </th>
                </tr>
                <tr className="bg-indigo-100 text-indigo-800">
                  <th></th>
                  <th></th>
                  <th>Male</th>
                  <th>Female</th>
                  <th>Total</th>
                  <th>Male</th>
                  <th>Female</th>
                  <th>Total</th>
                  <th>Male</th>
                  <th>Female</th>
                  <th>Total</th>
                </tr>
              </thead>

              <tbody>
                {stats.map((stat, index) => (
                  <tr
                    key={stat._id || stat.program}
                    className="hover:bg-indigo-50 transition-all duration-200"
                  >
                    <td className="border p-1 sm:p-2 text-center font-medium">
                      {index + 1}
                    </td>
                    <td className="border p-1 sm:p-2 text-left font-semibold text-gray-800">
                      {DEPARTMENTS.find((d) => d.value === stat.program)
                        ?.label || stat.program}
                    </td>

                    {["totalStudents", "placed", "higherStudies"].map(
                      (section) =>
                        ["male", "female", "total"].map((field) => (
                          <td
                            key={section + field}
                            className="border p-1 sm:p-2 text-center text-gray-700"
                          >
                            {stat[section]?.[field] ?? 0}
                          </td>
                        ))
                    )}
                  </tr>
                ))}

                {/* Total Row */}
                <tr className="bg-indigo-100 font-semibold">
                  <td className="border p-1 sm:p-2 text-center" colSpan="2">
                    Total
                  </td>
                  {["totalStudents", "placed", "higherStudies"].map((section) =>
                    ["male", "female", "total"].map((field) => (
                      <td
                        key={section + field}
                        className="border p-1 sm:p-2 text-center"
                      >
                        {stats.reduce(
                          (sum, s) => sum + (s[section]?.[field] || 0),
                          0
                        )}
                      </td>
                    ))
                  )}
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
