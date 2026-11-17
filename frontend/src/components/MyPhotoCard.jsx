// src/components/MyPhotoCard.jsx
// Student's photo with a "Change photo" button, and — when the placement
// office has allowed it — a link to edit the whole application.
import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@clerk/clerk-react";
import axios from "axios";
import { toast } from "react-toastify";
import { Camera, Eye, Loader2, PencilLine } from "lucide-react";
import { Avatar } from "./ui";
import { IMAGE_PRESETS, compressImage } from "../utils/compressImage";

export default function MyPhotoCard({ application, onUpdated, onView }) {
  const { getToken } = useAuth();
  const navigate = useNavigate();
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);

  const backendUrl = import.meta.env.VITE_BACKEND_URL;

  const handlePhotoSelect = async (e) => {
    const original = e.target.files?.[0];
    e.target.value = "";
    if (!original) return;

    try {
      setUploading(true);
      const photo = await compressImage(original, IMAGE_PRESETS.profile);

      const data = new FormData();
      data.append("image", photo);

      const token = await getToken();
      const res = await axios.put(`${backendUrl}/api/students/myApplications/photo`, data, {
        headers: { Authorization: `Bearer ${token}` },
      });

      toast.success("Photo updated");
      onUpdated?.(res.data.data);
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not update the photo. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="card mb-6 p-4 sm:p-5">
      <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
        <div className="relative">
          <Avatar src={application.image} name={application.name} size="h-20 w-20 border-4" />
          {uploading && (
            <div className="absolute inset-0 flex items-center justify-center rounded-full bg-white/70">
              <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <p className="font-bold text-slate-800">{application.name}</p>
          <p className="text-sm text-slate-500">
            {application.regNumber} • <span className="uppercase">{application.department}</span>
          </p>
          <p className="mt-1 text-xs text-slate-400">
            You can change your photo at any time. Other details are locked after submission.
          </p>
        </div>

        <div className="flex w-full flex-col gap-2 sm:w-auto">
          {onView && (
            <button type="button" onClick={onView} className="btn btn-primary w-full sm:w-auto">
              <Eye className="h-4 w-4" /> View my application
            </button>
          )}
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="btn btn-secondary w-full sm:w-auto"
          >
            <Camera className="h-4 w-4" />
            {uploading ? "Uploading..." : "Change photo"}
          </button>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          onChange={handlePhotoSelect}
          className="sr-only"
        />
      </div>

      {application.editAllowed && (
        <div className="mt-4 flex flex-col gap-3 rounded-xl bg-amber-50 p-4 sm:flex-row sm:items-center">
          <p className="flex-1 text-sm font-medium text-amber-800">
            ✏️ The placement office has allowed you to correct your application. You can edit it
            once — it will be locked again after you save.
          </p>
          <button
            type="button"
            onClick={() => navigate("/internship-application-submit")}
            className="btn btn-primary w-full sm:w-auto"
          >
            <PencilLine className="h-4 w-4" /> Edit my application
          </button>
        </div>
      )}
    </div>
  );
}
