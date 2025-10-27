import React from "react";

export default function HodReviewModal({ selected, setSelected }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white max-w-4xl w-full rounded-2xl shadow-2xl overflow-auto max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b flex justify-between items-center bg-gray-50 rounded-t-2xl">
          <h3 className="text-xl font-semibold text-gray-800">
            Internship Application
          </h3>
          <button
            className="text-gray-500 hover:text-gray-700 transition"
            onClick={() => setSelected(null)}
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Student info */}
          <div className="flex flex-col items-center">
            {selected.image && (
              <img
                src={selected.image}
                alt={selected.name}
                className="w-28 h-28 rounded-full border object-cover shadow"
              />
            )}
            <h3 className="mt-3 text-lg font-bold">{selected.name}</h3>
            <p className="text-sm text-gray-600">
              {selected.department.toUpperCase()} • {selected.regNumber}
            </p>
            <p className="text-sm text-gray-600">
              📞 {selected.phoneNumber || "-"}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Applied on {new Date(selected.createdAt).toLocaleDateString()}
            </p>
          </div>

          {/* Company + Internship */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-gray-50 p-4 rounded-lg border">
              <h4 className="font-semibold text-gray-700 mb-2">🏢 Company</h4>
              <p>
                <strong>Name:</strong> {selected.companyName}
              </p>
              <p>
                <strong>Village:</strong> {selected.companyVillage}
              </p>
              <p>
                <strong>City:</strong> {selected.companyCity}
              </p>
              <p>
                <strong>Taluk:</strong> {selected.companyTaluk}
              </p>
              <p>
                <strong>District:</strong> {selected.companyDistrict}
              </p>
              <p>
                <strong>State:</strong> {selected.companyState}
              </p>
              <p>
                <strong>Contact:</strong> {selected.companyContact}
              </p>
              <p>
                <strong>Email:</strong> {selected.companyEmail}
              </p>
              <p className="mt-2">
                <strong>Profile:</strong> {selected.companyProfile}
              </p>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg border">
              <h4 className="font-semibold text-gray-700 mb-2">
                📄 Internship
              </h4>
              <p>
                <strong>Start:</strong>{" "}
                {selected.startDate
                  ? new Date(selected.startDate).toLocaleDateString()
                  : "-"}
              </p>
              <p>
                <strong>End:</strong>{" "}
                {selected.endDate
                  ? new Date(selected.endDate).toLocaleDateString()
                  : "-"}
              </p>
              <p>
                <strong>Working Hours:</strong> {selected.workingHours}
              </p>
              <p>
                <strong>Duties:</strong> {selected.duties}
              </p>
              <p>
                <strong>Tasks:</strong> {selected.tasks}
              </p>
              <p>
                <strong>Skills:</strong> {selected.expectedSkills}
              </p>
              <p>
                <strong>Tools:</strong> {selected.expectedTools}
              </p>
              <p>
                <strong>Challenges:</strong> {selected.expectedChallenges}
              </p>
              <p>
                <strong>Outcomes:</strong> {selected.learningOutcomes}
              </p>
              <p>
                <strong>Job Opportunity:</strong> {selected.jobOpportunity}
              </p>
            </div>
          </div>

          {/* Reviewer statuses */}
          <div className="bg-gray-50 p-4 rounded-lg border">
            <h4 className="font-semibold text-gray-700 mb-2">
              👥 Reviewer Statuses
            </h4>
            <div className="grid grid-cols-2 gap-3 text-sm">
              {["cohortOwner", "hod", "placement", "principal"].map(
                (roleKey) => (
                  <div key={roleKey}>
                    <span className="capitalize font-medium">{roleKey}:</span>{" "}
                    <span
                      className={`px-2 py-0.5 rounded text-white text-xs ${
                        selected[roleKey]?.status === "approved"
                          ? "bg-green-600"
                          : selected[roleKey]?.status === "rejected"
                          ? "bg-red-600"
                          : "bg-yellow-500"
                      }`}
                    >
                      {selected[roleKey]?.status}
                    </span>
                    <p className="text-xs text-gray-500">
                      {selected[roleKey]?.comment || "-"}
                    </p>
                  </div>
                )
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-5 border-t flex justify-between items-center bg-gray-50 rounded-b-2xl">
          <div className="flex gap-3">
            <button
              onClick={() => setSelected(null)}
              className="px-5 py-2 border rounded-md hover:bg-gray-100"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
