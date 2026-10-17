// src/components/ui.jsx
// Small shared building blocks so every page looks the same.
import { ChevronDown, Inbox, Search, X } from "lucide-react";
import { cloudinaryThumb } from "../constants";

/** Colourful page background + centred content */
export function Page({ children, className = "" }) {
  return (
    <div className="page-bg">
      <main className={`page-container ${className}`}>{children}</main>
    </div>
  );
}

/** Page title block with optional icon and action buttons on the right */
export function PageHeader({ title, subtitle, icon: Icon, actions, children }) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
      <div className="flex items-start gap-3 sm:gap-4">
        {Icon && (
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 via-violet-500 to-pink-500 text-white shadow-lg shadow-violet-200 sm:h-14 sm:w-14">
            <Icon className="h-5 w-5 sm:h-7 sm:w-7" />
          </div>
        )}
        <div className="min-w-0">
          <h1 className="bg-gradient-to-r from-indigo-700 via-violet-700 to-pink-600 bg-clip-text text-2xl leading-tight font-extrabold text-transparent sm:text-3xl">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-1 text-sm text-slate-500 sm:text-base">
              {subtitle}
            </p>
          )}
          {children}
        </div>
      </div>
      {actions && (
        <div className="flex flex-wrap items-center gap-2">{actions}</div>
      )}
    </div>
  );
}

/** White card holding the filters of a list page */
export function FilterBar({ children, onReset, resultCount }) {
  return (
    <div className="card mb-6 p-4 sm:p-5">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {children}
      </div>
      {(onReset || resultCount !== undefined) && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3 text-sm">
          {resultCount !== undefined ? (
            <span className="text-slate-500">
              Showing{" "}
              <span className="font-bold text-indigo-700">{resultCount}</span>{" "}
              {resultCount === 1 ? "record" : "records"}
            </span>
          ) : (
            <span />
          )}
          {onReset && (
            <button type="button" onClick={onReset} className="btn btn-ghost btn-sm">
              <X className="h-3.5 w-3.5" /> Clear filters
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Labelled dropdown.
 * options: [{ value, label }]  — allLabel adds an "All …" first option ("")
 */
export function FilterSelect({
  label,
  value,
  onChange,
  options,
  allLabel,
  className = "",
  name,
  required,
  disabled,
}) {
  return (
    <label className={`block ${className}`}>
      {label && <span className="label">{label}</span>}
      <span className="relative block">
        <select
          name={name}
          value={value}
          required={required}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value, e)}
          className="select"
        >
          {allLabel !== undefined && <option value="">{allLabel}</option>}
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
      </span>
    </label>
  );
}

/** Search box with icon and clear button */
export function SearchInput({ label = "Search", value, onChange, placeholder, className = "" }) {
  return (
    <label className={`block ${className}`}>
      {label && <span className="label">{label}</span>}
      <span className="relative block">
        <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type="search"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="input pr-9 pl-9"
        />
        {value && (
          <button
            type="button"
            onClick={() => onChange("")}
            aria-label="Clear search"
            className="absolute top-1/2 right-2 -translate-y-1/2 rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </span>
    </label>
  );
}

export function Spinner({ label = "Loading..." }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 sm:py-24">
      <div className="h-12 w-12 animate-spin rounded-full border-4 border-indigo-200 border-t-violet-600" />
      {label && (
        <p className="mt-4 text-sm font-medium text-indigo-700 animate-pulse">
          {label}
        </p>
      )}
    </div>
  );
}

export function EmptyState({ icon: Icon = Inbox, title, message, action }) {
  return (
    <div className="card flex flex-col items-center px-6 py-14 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-100 to-pink-100 text-indigo-600">
        <Icon className="h-8 w-8" />
      </div>
      <h3 className="mt-4 text-lg font-bold text-slate-800">{title}</h3>
      {message && <p className="mt-1 max-w-md text-sm text-slate-500">{message}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

const STATUS_STYLES = {
  approved: "badge-green",
  rejected: "badge-red",
  pending: "badge-amber",
};

export function StatusBadge({ status }) {
  const value = status || "pending";
  return (
    <span className={`badge ${STATUS_STYLES[value] || "badge-slate"}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {value}
    </span>
  );
}

const TONES = {
  indigo: "from-indigo-500 to-violet-600 shadow-indigo-200",
  emerald: "from-emerald-500 to-teal-600 shadow-emerald-200",
  rose: "from-rose-500 to-pink-600 shadow-rose-200",
  amber: "from-amber-400 to-orange-500 shadow-amber-200",
  sky: "from-sky-500 to-cyan-600 shadow-sky-200",
};

/** Coloured number tile */
export function StatCard({ label, value, icon: Icon, tone = "indigo", hint }) {
  return (
    <div
      className={`relative overflow-hidden rounded-2xl bg-gradient-to-br p-5 text-white shadow-lg ${TONES[tone]}`}
    >
      <div className="absolute -top-6 -right-6 h-24 w-24 rounded-full bg-white/15" />
      <div className="relative flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold tracking-wide text-white/80 uppercase">
            {label}
          </p>
          <p className="mt-1 text-3xl font-extrabold">{value}</p>
          {hint && <p className="mt-0.5 text-xs text-white/80">{hint}</p>}
        </div>
        {Icon && (
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20">
            <Icon className="h-6 w-6" />
          </div>
        )}
      </div>
    </div>
  );
}

/** Round avatar with first-letter fallback */
export function Avatar({ src, name, size = "h-10 w-10" }) {
  if (src) {
    return (
      <img
        src={cloudinaryThumb(src, 160)}
        alt={name || ""}
        loading="lazy"
        decoding="async"
        className={`${size} shrink-0 rounded-full border-2 border-white object-cover shadow`}
      />
    );
  }
  return (
    <div
      className={`${size} flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-400 to-pink-400 font-bold text-white shadow`}
    >
      {name?.[0]?.toUpperCase() || "?"}
    </div>
  );
}
