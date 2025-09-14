import { useUser, useAuth } from "@clerk/clerk-react";
import { useEffect, useState } from "react";
import axios from "axios";
import StudentNavbar from "../../components/StudentNavbar";
import { useNavigate } from "react-router-dom";

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
          {
            headers: { Authorization: `Bearer ${token}` },
          }
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

  if (!isLoaded || loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen space-y-4">
        <div className="w-14 h-14 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-blue-600 font-medium animate-pulse">
          Loading profile...
        </p>
      </div>
    );
  }

  const email = user?.primaryEmailAddress?.emailAddress || "-";

  return (
    <>
      <StudentNavbar />
      <div className="max-w-3xl mx-auto p-4 sm:p-6">
        {student ? (
          <div className="bg-white shadow-xl rounded-2xl p-6 border border-gray-100">
            {/* Profile Section */}
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
              {/* Profile Image */}
              <div className="flex-shrink-0">
                <img
                  src={student.image}
                  alt={student.name}
                  className="w-24 h-24 sm:w-28 sm:h-28 rounded-full object-cover border-4 border-blue-200 shadow-md"
                />
              </div>

              {/* Info */}
              <div className="flex-1 text-center sm:text-left">
                <h1 className="text-xl sm:text-2xl font-bold text-gray-800">
                  {student.name}
                </h1>
                <p className="text-gray-600 capitalize">{student.department}</p>
                <p className="text-sm text-gray-500">
                  Member since {new Date(user.createdAt).toLocaleDateString()}
                </p>

                {/* Details Grid */}
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                  <p>
                    <span className="font-semibold text-gray-700">
                      📘 Department:
                    </span>{" "}
                    {student.department.toUpperCase()}
                  </p>
                  <p>
                    <span className="font-semibold text-gray-700">
                      🆔 Reg. No:
                    </span>{" "}
                    {student.regNumber}
                  </p>
                  <p>
                    <span className="font-semibold text-gray-700">
                      📞 Phone:
                    </span>{" "}
                    {student.phoneNumber}
                  </p>
                  <p>
                    <span className="font-semibold text-gray-700">
                      📧 Email:
                    </span>{" "}
                    {email}
                  </p>
                </div>
              </div>
            </div>

            {/* Button */}
            <div className="mt-6 flex justify-center sm:justify-end">
              <button
                onClick={() => navigate("/internship-application-status")}
                className="px-5 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition cursor-pointer w-full sm:w-auto"
              >
                ✏️ Application Status
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center text-gray-600">
            No application found. Please submit your internship application.
          </div>
        )}
      </div>
    </>
  );
}
