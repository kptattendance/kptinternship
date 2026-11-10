// src/components/ApplicationDetails.jsx
// Full view of one internship application, used in the review pop-ups.
import { Briefcase, Building2, Users } from "lucide-react";
import { Avatar, StatusBadge } from "./ui";
import { REVIEW_STAGES, isProject } from "../constants";

const formatDate = (value) =>
  value ? new Date(value).toLocaleDateString("en-GB") : "-";

function DetailCard({ icon: Icon, title, tone, rows }) {
  return (
    <div className={`rounded-2xl border p-4 sm:p-5 ${tone}`}>
      <h4 className="mb-3 flex items-center gap-2 font-bold">
        <Icon className="h-5 w-5" /> {title}
      </h4>
      <dl className="space-y-2 text-sm">
        {rows.map(([label, value]) => (
          <div key={label} className="grid grid-cols-[8.5rem_1fr] gap-2">
            <dt className="font-semibold text-slate-500">{label}</dt>
            <dd className="break-words whitespace-pre-line text-slate-800">
              {value === undefined || value === null || value === "" ? "-" : value}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

export default function ApplicationDetails({ app }) {
  return (
    <div className="space-y-5">
      {/* Student */}
      <div className="flex flex-col items-center gap-4 rounded-2xl bg-gradient-to-r from-indigo-50 via-violet-50 to-pink-50 p-5 text-center sm:flex-row sm:text-left">
        <Avatar src={app.image} name={app.name} size="h-24 w-24 border-4" />
        <div>
          <h3 className="text-xl font-extrabold text-slate-800">{app.name}</h3>
          <p className="text-sm text-slate-600">
            <span className="font-semibold uppercase">{app.department}</span> •{" "}
            {app.regNumber}
          </p>
          <p className="text-sm text-slate-600">📞 {app.phoneNumber || "-"}</p>
          <p className="mt-1 text-xs text-slate-400">
            Applied on {formatDate(app.createdAt)} • {app.internhsipType || "-"}
            {app.subName && ` • ${app.subName}`}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {isProject(app) ? (
          <DetailCard
            icon={Building2}
            title="Project at College"
            tone="border-violet-100 bg-violet-50/50 text-violet-800"
            rows={[
              ["Project Title", app.projectTitle],
              ["Guide", app.contactPerson],
              ["Guide Email", app.companyEmail],
              ["Guide Phone", app.companyContact],
              ["Description", app.companyProfile],
            ]}
          />
        ) : (
        <DetailCard
          icon={Building2}
          title="Company Details"
          tone="border-violet-100 bg-violet-50/50 text-violet-800"
          rows={[
            ["Name", app.companyName],
            ["Village / Area", app.companyVillage],
            ["City", app.companyCity],
            ["Taluk", app.companyTaluk],
            ["District", app.companyDistrict],
            ["State", app.companyState],
            ["Contact", app.companyContact],
            ["Email", app.companyEmail],
            ["Contact Person", app.contactPerson],
            ["Profile", app.companyProfile],
          ]}
        />
        )}
        <DetailCard
          icon={Briefcase}
          title={isProject(app) ? "Project Details" : "Internship Details"}
          tone="border-indigo-100 bg-indigo-50/50 text-indigo-800"
          rows={[
            ["Start", formatDate(app.startDate)],
            ["End", formatDate(app.endDate)],
            ["Working Hours", app.workingHours],
            ["Duties", app.duties],
            ["Tasks", app.tasks],
            ["Skills", app.expectedSkills],
            ["Tools", app.expectedTools],
            ["Challenges", app.expectedChallenges],
            ["Outcomes", app.learningOutcomes],
            ["Job Opportunity", app.jobOpportunity],
            ["Stipend", app.stipendAmount ? `₹${app.stipendAmount}` : "-"],
            ["Placed Company", app.PlacedCompany],
            ["Job Package", app.jobPackage],
          ]}
        />
      </div>

      {/* Review pipeline */}
      <div className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-4 sm:p-5">
        <h4 className="mb-3 flex items-center gap-2 font-bold text-emerald-800">
          <Users className="h-5 w-5" /> Review Progress
        </h4>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {REVIEW_STAGES.map((stage) => (
            <div key={stage.key} className="rounded-xl border border-white bg-white p-3 shadow-sm">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-semibold text-slate-700">{stage.label}</span>
                <StatusBadge status={app[stage.key]?.status} />
              </div>
              <p className="mt-1.5 text-xs text-slate-500 italic">
                {app[stage.key]?.comment || "No comments yet"}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
