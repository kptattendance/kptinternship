// src/components/homeDashboard/DeptOverview.jsx
import { Building2 } from "lucide-react";

// One colour per department card
const ACCENTS = [
  { ring: "#6366f1", soft: "from-indigo-50 to-violet-50", text: "text-indigo-700" },
  { ring: "#ec4899", soft: "from-pink-50 to-rose-50", text: "text-pink-700" },
  { ring: "#10b981", soft: "from-emerald-50 to-teal-50", text: "text-emerald-700" },
  { ring: "#f59e0b", soft: "from-amber-50 to-orange-50", text: "text-amber-700" },
  { ring: "#0ea5e9", soft: "from-sky-50 to-cyan-50", text: "text-sky-700" },
  { ring: "#8b5cf6", soft: "from-violet-50 to-fuchsia-50", text: "text-violet-700" },
  { ring: "#ef4444", soft: "from-red-50 to-rose-50", text: "text-red-700" },
  { ring: "#14b8a6", soft: "from-teal-50 to-emerald-50", text: "text-teal-700" },
];

// Light-weight donut drawn with CSS (no chart library needed)
function Donut({ percent, color }) {
  return (
    <div
      className="relative h-20 w-20 shrink-0 rounded-full sm:h-24 sm:w-24"
      style={{
        background: `conic-gradient(${color} ${percent * 3.6}deg, #e2e8f0 0deg)`,
      }}
      role="img"
      aria-label={`${percent}% applied`}
    >
      <div className="absolute inset-2.5 flex items-center justify-center rounded-full bg-white text-base font-extrabold text-slate-800 shadow-inner sm:inset-3 sm:text-lg">
        {percent}%
      </div>
    </div>
  );
}

export default function DeptOverview({ statsByDept }) {
  return (
    <section>
      <div className="mb-4 flex items-center gap-2">
        <Building2 className="h-5 w-5 text-violet-600" />
        <h2 className="text-xl font-bold text-slate-800 sm:text-2xl">
          Department Overview
        </h2>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statsByDept.map((dept, i) => {
          const accent = ACCENTS[i % ACCENTS.length];
          const appliedPercent = dept.total
            ? Math.min(100, Math.round((dept.applied / dept.total) * 100))
            : 0;

          return (
            <div
              key={dept.value}
              className={`rounded-2xl border border-white bg-gradient-to-br ${accent.soft} p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md sm:p-5`}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <span
                    className="badge text-white uppercase"
                    style={{ backgroundColor: accent.ring }}
                  >
                    {dept.value}
                  </span>
                  <h3 className={`mt-2 text-sm leading-snug font-bold ${accent.text}`}>
                    {dept.label}
                  </h3>
                  <dl className="mt-2 space-y-0.5 text-xs text-slate-600">
                    <div className="flex gap-1">
                      <dt>Total:</dt>
                      <dd className="font-bold text-slate-800">{dept.total}</dd>
                    </div>
                    <div className="flex gap-1">
                      <dt>Applied:</dt>
                      <dd className="font-bold text-emerald-700">{dept.applied}</dd>
                    </div>
                    <div className="flex gap-1">
                      <dt>Remaining:</dt>
                      <dd className="font-bold text-rose-600">
                        {Math.max(0, dept.remaining)}
                      </dd>
                    </div>
                  </dl>
                </div>
                <Donut percent={appliedPercent} color={accent.ring} />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
