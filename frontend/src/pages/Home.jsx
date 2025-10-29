// src/pages/Home.jsx
import { useEffect, useState } from "react";
import axios from "axios";
import Navbar from "../components/Navbar";
import StatsCards from "../components/homeDashboard/StatsCards";
import DeptOverview from "../components/homeDashboard/DeptOverview";
import ApplicationsTable from "../components/homeDashboard/ApplicationsTable";
import Footer from "./Footer";
import YearStatisticsView from "../components/homeDashboard/YearStatisticsView";

const DEPARTMENTS = [
  { value: "at", label: "Automobile Engineering", total: 57 },
  { value: "ch", label: "Chemical Engineering", total: 60 },
  { value: "civil", label: "Civil Engineering", total: 48 },
  { value: "cs", label: "Computer Science Engineering", total: 63 },
  { value: "ec", label: "Electronics & Communication Engineering", total: 55 },
  { value: "eee", label: "Electrical & Electronics Engineering", total: 55 },
  { value: "me", label: "Mechanical Engineering", total: 62 },
  { value: "po", label: "Polymer Engineering", total: 36 },
].sort((a, b) => a.label.localeCompare(b.label));

export default function Home() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  const backendUrl = import.meta.env.VITE_BACKEND_URL;

  useEffect(() => {
    const fetchApplications = async () => {
      try {
        const res = await axios.get(
          backendUrl + "/api/students/getAllApplications"
        );
        console.log(res.data);
        setApplications(res.data);
      } catch (err) {
        console.error("Failed to fetch applications:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchApplications();
  }, []);

  // Stats
  const statsByDept = DEPARTMENTS.map((dept) => {
    const applied = applications.filter(
      (a) => a.department === dept.value
    ).length;
    return {
      ...dept,
      applied,
      remaining: dept.total - applied,
    };
  });

  const totalStudents = DEPARTMENTS.reduce((sum, d) => sum + d.total, 0);
  const totalApplied = applications.length;
  const totalRemaining = totalStudents - totalApplied;

  return (
    <>
      <Navbar /> <YearStatisticsView />
      <div className="p-6 space-y-10">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl md:text-4xl font-bold text-blue-700">
            Internship Application Dashboard
          </h1>
          <p className="text-gray-600">
            Track applications, approvals, and department-wise stats at a glance
          </p>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-600 border-solid"></div>
            <p className="mt-4 text-gray-600">Fetching applications...</p>
          </div>
        ) : (
          <>
            <StatsCards
              totalStudents={totalStudents}
              totalApplied={totalApplied}
              totalRemaining={totalRemaining}
            />
            <DeptOverview statsByDept={statsByDept} />
            <ApplicationsTable
              applications={applications}
              departments={DEPARTMENTS}
            />
          </>
        )}
      </div>
      <Footer />
    </>
  );
}
