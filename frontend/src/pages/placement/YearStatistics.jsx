import { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "@clerk/clerk-react";
import { BarChart3 } from "lucide-react";
import ReviewerNavbar from "../../components/ReviewerNavbar";
import { FilterSelect, Page, PageHeader, Spinner } from "../../components/ui";

// Passing years offered in the dropdown
const THIS_YEAR = new Date().getFullYear();
const YEAR_OPTIONS = Array.from({ length: 8 }, (_, i) => THIS_YEAR + 2 - i).map((y) => ({
  value: String(y),
  label: String(y),
}));

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

  const isEditing = (stat) => editingId === (stat._id || stat.program);

  return (
    <>
      <ReviewerNavbar />
      <Page>
        <PageHeader
          icon={BarChart3}
          title="Final Year Statistics"
          subtitle="Placed and higher-studies numbers for each program"
          actions={
            <FilterSelect
              label="Passing year"
              value={String(passingYear)}
              onChange={(value) => {
                setEditingId(null);
                setPassingYear(Number(value));
              }}
              options={YEAR_OPTIONS}
              className="w-40"
            />
          }
        />

        {loading ? (
          <Spinner label="Loading statistics..." />
        ) : (
          <div className="table-wrap">
            <table className="table-std">
              <thead>
                <tr>
                  <th rowSpan="2">#</th>
                  <th rowSpan="2">Program</th>
                  <th colSpan="3" className="text-center">Total Students</th>
                  <th colSpan="3" className="text-center">Placed</th>
                  <th colSpan="3" className="text-center">Higher Studies</th>
                  <th rowSpan="2" className="text-center">Actions</th>
                </tr>
                <tr>
                  {["Male", "Female", "Total", "Male", "Female", "Total", "Male", "Female", "Total"].map(
                    (label, i) => (
                      <th key={i} className="text-center">{label}</th>
                    )
                  )}
                </tr>
              </thead>

              <tbody>
                {stats.map((stat, index) => (
                  <tr key={stat._id || stat.program} className={isEditing(stat) ? "bg-indigo-50" : undefined}>
                    <td className="text-slate-400">{index + 1}</td>
                    <td className="min-w-48 font-semibold text-slate-800">
                      {DEPARTMENTS.find((d) => d.value === stat.program)?.label || stat.program}
                    </td>

                    {["totalStudents", "placed", "higherStudies"].map((section) =>
                      ["male", "female", "total"].map((field) => (
                        <td key={section + field} className="text-center">
                          {isEditing(stat) ? (
                            <input
                              type="number"
                              min="0"
                              value={formData?.[section]?.[field] ?? 0}
                              onChange={(e) => handleChange(e, section, field)}
                              className="w-16 rounded-lg border border-indigo-200 px-1 py-1 text-center font-semibold focus:ring-4 focus:ring-indigo-100 focus:outline-none"
                            />
                          ) : (
                            <span className={field === "total" ? "font-bold text-indigo-700" : ""}>
                              {stat[section]?.[field] ?? 0}
                            </span>
                          )}
                        </td>
                      ))
                    )}

                    <td>
                      <div className="flex justify-center gap-2">
                        {isEditing(stat) ? (
                          <>
                            <button type="button" onClick={handleSave} className="btn btn-success btn-sm">
                              Save
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingId(null)}
                              className="btn btn-secondary btn-sm"
                            >
                              Cancel
                            </button>
                          </>
                        ) : stat._id ? (
                          <>
                            <button type="button" onClick={() => handleEdit(stat)} className="btn btn-secondary btn-sm">
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(stat)}
                              className="btn btn-sm border border-rose-200 bg-white text-rose-600 hover:bg-rose-50"
                            >
                              Delete
                            </button>
                          </>
                        ) : (
                          <button type="button" onClick={() => handleEdit(stat)} className="btn btn-primary btn-sm">
                            Add
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Page>
    </>
  );
}
