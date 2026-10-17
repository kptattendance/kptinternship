// src/components/PhotoPicker.jsx
// Image chooser with preview. The image is compressed in the browser before
// it is handed to the form, so every upload is small.
import { useEffect, useId, useRef, useState } from "react";
import { ImagePlus, Loader2, X } from "lucide-react";
import { IMAGE_PRESETS, compressImage, formatFileSize } from "../utils/compressImage";

export default function PhotoPicker({
  label = "Photo",
  file,
  onChange,
  preset = IMAGE_PRESETS.profile,
  hint = "JPG or PNG — compressed automatically",
  required = false,
}) {
  const inputId = useId();
  const inputRef = useRef(null);
  const [preview, setPreview] = useState("");
  const [busy, setBusy] = useState(false);
  const [info, setInfo] = useState("");

  // Show a preview of the chosen file, and clear it when the form resets
  useEffect(() => {
    if (!file) {
      setPreview("");
      setInfo("");
      if (inputRef.current) inputRef.current.value = "";
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const handleSelect = async (e) => {
    const original = e.target.files?.[0];
    if (!original) return;

    setBusy(true);
    const compressed = await compressImage(original, preset);
    setBusy(false);

    setInfo(
      compressed.size < original.size
        ? `${formatFileSize(original.size)} → ${formatFileSize(compressed.size)}`
        : formatFileSize(original.size)
    );
    onChange(compressed);
  };

  return (
    <div>
      <span className="label">
        {label}
        {required && <span className="ml-0.5 text-rose-500">*</span>}
      </span>
      <div className="flex items-center gap-3 rounded-xl border border-dashed border-indigo-200 bg-indigo-50/40 p-2.5">
        <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-white bg-white shadow-sm">
          {preview ? (
            <img src={preview} alt="Preview" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-indigo-300">
              <ImagePlus className="h-6 w-6" />
            </div>
          )}
          {busy && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/70">
              <Loader2 className="h-5 w-5 animate-spin text-indigo-600" />
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <label htmlFor={inputId} className="btn btn-secondary btn-sm">
            <ImagePlus className="h-3.5 w-3.5" /> {file ? "Change" : "Choose image"}
          </label>
          <p className="mt-1 truncate text-[11px] text-slate-500">
            {busy ? "Compressing..." : info ? `✓ ${info}` : hint}
          </p>
        </div>

        {file && !busy && (
          <button
            type="button"
            onClick={() => onChange(null)}
            aria-label="Remove image"
            className="rounded-full p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
          >
            <X className="h-4 w-4" />
          </button>
        )}

        <input
          ref={inputRef}
          id={inputId}
          type="file"
          accept="image/*"
          required={required && !file}
          onChange={handleSelect}
          className="sr-only"
        />
      </div>
    </div>
  );
}
