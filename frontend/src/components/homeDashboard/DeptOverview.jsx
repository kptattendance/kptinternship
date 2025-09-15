// src/components/dashboard/DeptOverview.jsx
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

const COLORS = ["#22c55e", "#ef4444"]; // Green = Applied, Red = Remaining

export default function DeptOverview({ statsByDept }) {
  return (
    <div className="space-y-10">
      <h2 className="text-xl font-semibold">Department Overview</h2>

      {/* Cards with mini pie charts */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {statsByDept.map((dept) => {
          const pieData = [
            { name: "Applied", value: dept.applied },
            { name: "Remaining", value: dept.remaining },
          ];

          return (
            <div
              key={dept.value}
              className="bg-white rounded-xl shadow p-5 hover:shadow-md transition flex flex-col justify-between"
            >
              <h3 className="text-lg font-semibold text-blue-700 mb-3">
                {dept.label}
              </h3>

              <div className="flex items-center justify-between gap-4">
                {/* Text details */}
                <div className="text-sm space-y-1">
                  <p>
                    <span className="font-medium">Total:</span> {dept.total}
                  </p>
                  <p className="text-green-600">
                    <span className="font-medium">Applied:</span> {dept.applied}
                  </p>
                  <p className="text-red-600">
                    <span className="font-medium">Remaining:</span>{" "}
                    {dept.remaining}
                  </p>
                </div>

                {/* Mini Pie Chart */}
                <div className="w-24 h-24">
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie
                        data={pieData}
                        dataKey="value"
                        nameKey="name"
                        outerRadius={40}
                        innerRadius={20}
                        labelLine={false}
                      >
                        {pieData.map((_, index) => (
                          <Cell
                            key={index}
                            fill={COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
