// src/components/homeDashboard/StatsCards.jsx
export default function StatsCards({
  totalStudents,
  totalApplied,
  totalRemaining,
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="bg-blue-50 p-6 rounded-2xl shadow text-center">
        <h3 className="text-sm font-medium text-gray-600">Total Students</h3>
        <p className="text-2xl font-bold text-blue-700">{totalStudents}</p>
      </div>

      <div className="bg-green-50 p-6 rounded-2xl shadow text-center">
        <h3 className="text-sm font-medium text-gray-600">Applied</h3>
        <p className="text-2xl font-bold text-green-700">{totalApplied}</p>
      </div>

      <div className="bg-red-50 p-6 rounded-2xl shadow text-center">
        <h3 className="text-sm font-medium text-gray-600">Remaining</h3>
        <p className="text-2xl font-bold text-red-700">{totalRemaining}</p>
      </div>
    </div>
  );
}
