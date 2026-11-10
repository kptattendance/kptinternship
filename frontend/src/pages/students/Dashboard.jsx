// src/pages/students/Dashboard.jsx
import { useUser, useAuth } from "@clerk/clerk-react";
import { useEffect, useState } from "react";
import axios from "axios";
import StudentNavbar from "../../components/StudentNavbar";
import { useNavigate } from "react-router-dom";
import {
  BookOpen,
  Building2,
  CalendarDays,
  ClipboardList,
  FileCheck2,
  IdCard,
  Mail,
  Phone,
} from "lucide-react";
import { Avatar, EmptyState, Page, Spinner, StatusBadge } from "../../components/ui";
import { departmentLabel, overallStatus } from "../../constants";

export default function Dashboard() {
  const { user, isLoaded } = useUser();
  const { getToken } = useAuth();
  const navigate = useNavigate();

  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);

  const backendUrl = import.meta.env.VITE_BACKEND_URL;

  useEffect(() => {
    if (!isLoaded) return;

    const fetchStudent = async () => {
      try {
        const token = await getToken();
        const res = await axios.get(
          backendUrl + "/api/students/myApplications",
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (res.data.success && res.data.data.length > 0) {
          setStudent(res.data.data[0]);
        }
      } catch (err) {
        console.error("Error fetching student application:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchStudent();
  }, [isLoaded, getToken]);

  const email = user?.primaryEmailAddress?.emailAddress || "-";

  const details = student
    ? [
        { icon: BookOpen, label: "Department", value: departmentLabel(student.department) },
        { icon: IdCard, label: "Register No.", value: student.regNumber },
        { icon: Phone, label: "Phone", value: student.phoneNumber },
        { icon: Mail, label: "Email", value: email },
        {
          icon: Building2,
          label: student.internhsipType === "Project" ? "Project" : "Company",
          value: student.internhsipType === "Project" ? student.projectTitle : student.companyName,
        },
        { icon: CalendarDays, label: "Applied on", value: new Date(student.createdAt).toLocaleDateString("en-GB") },
      ]
    : [];

  return (
    <>
      <StudentNavbar />

      <Page className="max-w-4xl">
        {!isLoaded || loading ? (
          <Spinner label="Loading profile..." />
        ) : student ? (
          <div className="card overflow-hidden">
            {/* Colourful banner */}
            <div className="h-28 bg-gradient-to-r from-indigo-500 via-violet-500 to-pink-500 sm:h-32" />

            <div className="px-5 pb-6 sm:px-8">
              <div className="-mt-14 flex flex-col items-center gap-4 sm:flex-row sm:items-end">
                <Avatar
                  src={student.image}
                  name={student.name}
                  size="h-28 w-28 border-4"
                />
                <div className="text-center sm:pb-2 sm:text-left">
                  <h1 className="text-2xl font-extrabold text-slate-800">{student.name}</h1>
                  <p className="text-sm text-slate-500">
                    Member since {new Date(user.createdAt).toLocaleDateString("en-GB")}
                  </p>
                </div>
                <div className="sm:ml-auto sm:pb-2">
                  <StatusBadge status={overallStatus(student)} />
                </div>
              </div>

              <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
                {details.map(({ icon: Icon, label, value }) => (
                  <div
                    key={label}
                    className="flex items-center gap-3 rounded-xl bg-slate-50 p-3"
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] font-semibold tracking-wide text-slate-400 uppercase">
                        {label}
                      </p>
                      <p className="truncate text-sm font-semibold text-slate-700">
                        {value || "-"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 flex justify-center sm:justify-end">
                <button
                  type="button"
                  onClick={() => navigate("/internship-application-status")}
                  className="btn btn-primary w-full sm:w-auto"
                >
                  <FileCheck2 className="h-4 w-4" /> View Application Status
                </button>
              </div>
            </div>
          </div>
        ) : (
          <EmptyState
            icon={ClipboardList}
            title="No application yet"
            message="Submit your internship application to start the approval process."
            action={
              <button
                type="button"
                onClick={() => navigate("/internship-application-submit")}
                className="btn btn-primary"
              >
                Apply for Internship
              </button>
            }
          />
        )}
      </Page>
    </>
  );
}
