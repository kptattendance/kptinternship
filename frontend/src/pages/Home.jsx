// src/pages/Home.jsx
import { useEffect, useState } from "react";
import axios from "axios";
import Navbar from "../components/Navbar";
import StatsCards from "../components/homeDashboard/StatsCards";
import DeptOverview from "../components/homeDashboard/DeptOverview";
import ApplicationsTable from "../components/homeDashboard/ApplicationsTable";
import Footer from "./Footer";
import { Spinner } from "../components/ui";
import InternshipHero from "../components/homeDashboard/InternshipHero";

const DEPARTMENTS = [
  { value: "at", label: "Automobile Engineering", total: 57 },
  { value: "ch", label: "Chemical Engineering", total: 63 },
  { value: "ce", label: "Civil Engineering", total: 42 },
  { value: "cs", label: "Computer Science Engineering", total: 64 },
  { value: "ec", label: "Electronics & Communication Engineering", total: 68 },
  { value: "eee", label: "Electrical & Electronics Engineering", total: 61 },
  { value: "me", label: "Mechanical Engineering", total: 60 },
  { value: "po", label: "Polymer Engineering", total: 31 },
].sort((a, b) => a.label.localeCompare(b.label));

export default function Home() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  const backendUrl = import.meta.env.VITE_BACKEND_URL;

  useEffect(() => {
    const fetchApplications = async () => {
      try {
        const res = await axios.get(
          backendUrl + "/api/students/public/applications"
        );
        setApplications(res.data);
      } catch (err) {
        console.error("Failed to fetch applications:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchApplications();
  }, [backendUrl]);

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
      <Navbar />
      <InternshipHero />
      <div className="bg-gradient-to-br from-indigo-50 via-white to-pink-50">
        <main className="page-container space-y-10 sm:space-y-12">
          {/* Header */}
          <div className="text-center">
            <h1 className="bg-gradient-to-r from-indigo-700 via-violet-700 to-pink-600 bg-clip-text text-3xl font-extrabold text-transparent md:text-4xl">
              Internship Application Dashboard
            </h1>
            <p className="mt-2 text-slate-500">
              Track applications, approvals and department-wise progress at a glance
            </p>
          </div>

          {loading ? (
            <Spinner label="Fetching applications..." />
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
        </main>
      </div>
      <Footer />
    </>
  );
}
