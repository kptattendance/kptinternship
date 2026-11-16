// src/components/EditPermissionButton.jsx
// Placement officer lets a student correct their application (or stops it).
import { useState } from "react";
import { useAuth } from "@clerk/clerk-react";
import axios from "axios";
import { toast } from "react-toastify";
import { Lock, PencilLine } from "lucide-react";

export default function EditPermissionButton({ application, onChange }) {
  const { getToken } = useAuth();
  const [saving, setSaving] = useState(false);
  const allowed = Boolean(application.editAllowed);

  const toggle = async () => {
    try {
      setSaving(true);
      const token = await getToken();
      const res = await axios.put(
        `${import.meta.env.VITE_BACKEND_URL}/api/students/applications/${application._id}/edit-permission`,
        { allowed: !allowed },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(res.data.message);
      onChange?.({ ...application, editAllowed: !allowed });
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not change edit permission");
    } finally {
      setSaving(false);
    }
  };

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={saving}
      className={allowed ? "btn btn-secondary" : "btn bg-amber-500 text-white hover:bg-amber-600"}
      title={
        allowed
          ? "The student can currently edit this application"
          : "Let the student correct this application once"
      }
    >
      {allowed ? <Lock className="h-4 w-4" /> : <PencilLine className="h-4 w-4" />}
      {saving ? "Saving..." : allowed ? "Stop student editing" : "Allow student to edit"}
    </button>
  );
}
