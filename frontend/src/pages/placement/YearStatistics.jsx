"use client";
import { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "@clerk/clerk-react";
import ReviewerNavbar from "../../components/ReviewerNavbar";

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

export default function YearStatistics() {
  const [stats, setStats] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({});
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

  const handleEdit = (stat) => {
    setEditingId(stat._id || stat.program);
    setFormData({ ...stat });
  };

  const handleChange = (e, section, field) => {
    setFormData({
      ...formData,
      [section]: {
        ...formData[section],
        [field]: Number(e.target.value),
      },
    });
  };

  const handleSave = async () => {
    const token = await getToken();
    const data = { ...formData, passingYear };

    if (formData._id) {
      await axios.put(
        `${backendUrl}/api/yearStatistics/${formData._id}`,
        data,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
    } else {
      await axios.post(`${backendUrl}/api/yearStatistics`, data, {
        headers: { Authorization: `Bearer ${token}` },
      });
    }

    setEditingId(null);
    fetchStats();
  };

  const handleDelete = async (stat) => {
    if (!stat._id) return alert("No data found to delete!");
    const token = await getToken();
    if (confirm(`Delete record for ${stat.program.toUpperCase()}?`)) {
      await axios.delete(`${backendUrl}/api/yearStatistics/${stat._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchStats();
    }
  };

  return (
    <>
      <ReviewerNavbar />
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-100 to-purple-200 p-6">
        <div className="max-w-6xl mx-auto bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Final Year Statistics
            </h2>

            {/* 🔹 Editable Passing Year Input */}
            <div className="flex items-center gap-3">
              <label className="text-gray-700 font-medium">Passing Year:</label>
              <input
                type="number"
                value={passingYear}
                onChange={(e) => setPassingYear(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-1 w-28 text-center focus:ring-2 focus:ring-indigo-400 focus:outline-none"
              />
            </div>
          </div>

          {loading ? (
            <p className="text-center text-gray-500 py-10">Loading...</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm border border-gray-300 rounded-lg overflow-hidden">
                <thead className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white">
                  <tr>
                    <th className="border p-2">Sl. No</th>
                    <th className="border p-2">Program</th>
                    <th className="border p-2" colSpan="3">
                      Total Students
                    </th>
                    <th className="border p-2" colSpan="3">
                      Placed
                    </th>
                    <th className="border p-2" colSpan="3">
                      Higher Studies
                    </th>
                    <th className="border p-2">Actions</th>
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
                    <th></th>
                  </tr>
                </thead>

                <tbody>
                  {stats.map((stat, index) => (
                    <tr
                      key={stat._id || stat.program}
                      className="hover:bg-indigo-50 transition-all duration-200"
                    >
                      <td className="border p-2 text-center font-medium">
                        {index + 1}
                      </td>
                      <td className="border p-2 text-left font-semibold text-gray-800">
                        {DEPARTMENTS.find((d) => d.value === stat.program)
                          ?.label || stat.program}
                      </td>

                      {["totalStudents", "placed", "higherStudies"].map(
                        (section) =>
                          ["male", "female", "total"].map((field) => (
                            <td
                              key={section + field}
                              className="border p-2 text-center"
                            >
                              {editingId === (stat._id || stat.program) ? (
                                <input
                                  type="number"
                                  value={formData?.[section]?.[field] ?? 0}
                                  onChange={(e) =>
                                    handleChange(e, section, field)
                                  }
                                  className="w-16 border border-gray-300 rounded px-1 py-0.5 text-center focus:ring-2 focus:ring-indigo-400"
                                />
                              ) : (
                                stat[section]?.[field] ?? 0
                              )}
                            </td>
                          ))
                      )}

                      <td className="border p-2 text-center space-x-2">
                        {editingId === (stat._id || stat.program) ? (
                          <button
                            onClick={handleSave}
                            className="bg-green-500 hover:bg-green-600 text-white px-2 py-1 rounded-lg"
                          >
                            Save
                          </button>
                        ) : stat._id ? (
                          <>
                            <button
                              onClick={() => handleEdit(stat)}
                              className="bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded-lg"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(stat)}
                              className="bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded-lg"
                            >
                              Delete
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => handleEdit(stat)}
                            className="bg-teal-500 hover:bg-teal-600 text-white px-2 py-1 rounded-lg"
                          >
                            Add
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
