// src/components/dashboard/DeptOverview.jsx
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

export default function DeptOverview({ statsByDept }) {
  return (
    <div className="space-y-10">
      <h2 className="text-xl font-semibold text-gray-800">
        📊 Department Overview
      </h2>

      {/* Cards with shiny pie charts */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
        {/* <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6"> */}
        {statsByDept.map((dept) => {
          const pieData = [
            { name: "Applied", value: dept.applied },
            { name: "Remaining", value: dept.remaining },
          ];

          const appliedPercent = dept.total
            ? Math.round((dept.applied / dept.total) * 100)
            : 0;

          return (
            <div
              key={dept.value}
              className="bg-white/70 backdrop-blur-lg rounded-2xl shadow-lg p-5 hover:shadow-2xl transition border border-gray-100"
            >
              <h3 className="text-lg font-semibold text-blue-700 mb-3 text-center">
                {dept.label}
              </h3>

              <div className="flex items-center justify-between gap-4">
                {/* Text details */}
                <div className="text-sm space-y-1 text-gray-700">
                  <p>
                    <span className="font-medium">Total:</span> {dept.total}
                  </p>
                  <p className="text-emerald-600 font-medium">
                    Applied: {dept.applied}
                  </p>
                  <p className="text-rose-600 font-medium">
                    Remaining: {dept.remaining}
                  </p>
                </div>

                {/* Shiny Pie Chart */}
                <div className="w-28 h-28 relative">
                  <ResponsiveContainer>
                    <PieChart>
                      <defs>
                        <linearGradient
                          id="appliedGradient"
                          x1="0"
                          y1="0"
                          x2="1"
                          y2="1"
                        >
                          <stop
                            offset="0%"
                            stopColor="#34d399"
                            stopOpacity={0.9}
                          />
                          <stop
                            offset="100%"
                            stopColor="#059669"
                            stopOpacity={1}
                          />
                        </linearGradient>
                        <linearGradient
                          id="remainingGradient"
                          x1="0"
                          y1="0"
                          x2="1"
                          y2="1"
                        >
                          <stop
                            offset="0%"
                            stopColor="#f87171"
                            stopOpacity={0.9}
                          />
                          <stop
                            offset="100%"
                            stopColor="#dc2626"
                            stopOpacity={1}
                          />
                        </linearGradient>
                        <filter
                          id="shadow"
                          x="-20%"
                          y="-20%"
                          width="150%"
                          height="150%"
                        >
                          <feDropShadow
                            dx="0"
                            dy="0"
                            stdDeviation="3"
                            floodColor="#000"
                            floodOpacity="0.2"
                          />
                        </filter>
                      </defs>

                      <Pie
                        data={pieData}
                        dataKey="value"
                        nameKey="name"
                        outerRadius={50}
                        innerRadius={30}
                        labelLine={false}
                        filter="url(#shadow)"
                      >
                        <Cell fill="url(#appliedGradient)" />
                        <Cell fill="url(#remainingGradient)" />
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>

                  {/* Center percentage label */}
                  <div className="absolute inset-0 flex items-center justify-center font-semibold text-gray-800 text-sm">
                    {appliedPercent}%
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
