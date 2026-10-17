// src/components/Modal.jsx
import { useEffect } from "react";
import { X } from "lucide-react";

/** Standard pop-up: coloured header, scrolling body, sticky footer */
export default function Modal({ title, onClose, children, footer, maxWidth = "max-w-5xl" }) {
  // Close with the Escape key and stop the page behind from scrolling
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-slate-950/60 p-0 backdrop-blur-sm sm:items-center sm:p-6"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
        className={`flex max-h-[92vh] w-full ${maxWidth} flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl`}
      >
        <div className="flex items-center justify-between gap-4 bg-gradient-to-r from-indigo-600 via-violet-600 to-pink-500 px-5 py-4 text-white sm:px-7">
          <h3 className="text-lg font-bold sm:text-xl">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-xl p-1.5 text-white/90 hover:bg-white/20 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6">{children}</div>

        {footer && (
          <div className="border-t border-slate-100 bg-slate-50 px-4 py-4 sm:px-6">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
