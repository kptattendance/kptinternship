// src/components/homeDashboard/StatsCards.jsx
import { CheckCircle2, Clock, Users } from "lucide-react";
import { StatCard } from "../ui";

export default function StatsCards({ totalStudents, totalApplied, totalRemaining }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <StatCard label="Total Students" value={totalStudents} icon={Users} tone="indigo" />
      <StatCard label="Applied" value={totalApplied} icon={CheckCircle2} tone="emerald" />
      <StatCard
        label="Remaining"
        value={Math.max(0, totalRemaining)}
        icon={Clock}
        tone="rose"
      />
    </div>
  );
}
