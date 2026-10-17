// src/components/AppNavbar.jsx
// One navbar design shared by the public, student and staff pages.
import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Menu, X } from "lucide-react";

export default function AppNavbar({ tabs = [], actions, mobileActions }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const isActive = (path) => location.pathname === path;

  // Many tabs need more width before they fit in one row
  const wide = tabs.length > 5;
  const desktopOnly = wide ? "xl:flex" : "lg:flex";
  const mobileOnly = wide ? "xl:hidden" : "lg:hidden";

  return (
    <nav className="sticky top-0 z-50 border-b border-white/60 bg-white/85 shadow-sm backdrop-blur-lg">
      {/* Colour strip */}
      <div className="h-1 bg-gradient-to-r from-indigo-500 via-violet-500 to-pink-500" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-3">
          {/* Brand */}
          <button
            type="button"
            onClick={() => navigate("/")}
            className="flex min-w-0 cursor-pointer items-center gap-2.5"
          >
            <img
              src="/logo.jpg"
              alt="KPT Mangaluru logo"
              width="40"
              height="47"
              className="h-11 w-auto shrink-0"
            />
            <span className="flex min-w-0 flex-col text-left leading-tight">
              <span className="truncate bg-gradient-to-r from-indigo-700 to-pink-600 bg-clip-text text-base font-extrabold text-transparent sm:text-lg">
                KPT Internship Portal
              </span>
              <span className="hidden text-[11px] font-medium text-slate-500 sm:block">
                Training & Placement Cell, Mangaluru
              </span>
            </span>
          </button>

          {/* Desktop tabs */}
          {tabs.length > 0 && (
            <div className={`hidden items-center gap-1 ${desktopOnly}`}>
              {tabs.map((tab) => (
                <Link
                  key={tab.path}
                  to={tab.path}
                  className={`rounded-xl px-3 py-2 text-sm font-semibold whitespace-nowrap transition ${
                    isActive(tab.path)
                      ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow"
                      : "text-slate-600 hover:bg-indigo-50 hover:text-indigo-700"
                  }`}
                >
                  {tab.name}
                </Link>
              ))}
            </div>
          )}

          {/* Right side */}
          <div className="flex shrink-0 items-center gap-2">
            {actions}
            {(tabs.length > 0 || mobileActions) && (
              <button
                type="button"
                aria-label={menuOpen ? "Close menu" : "Open menu"}
                onClick={() => setMenuOpen((open) => !open)}
                className={`rounded-xl p-2 text-slate-600 hover:bg-indigo-50 ${mobileOnly}`}
              >
                {menuOpen ? <X size={22} /> : <Menu size={22} />}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className={`border-t border-slate-100 bg-white/95 px-4 py-3 shadow-inner ${mobileOnly}`}>
          <div className="flex flex-col gap-1">
            {tabs.map((tab) => (
              <Link
                key={tab.path}
                to={tab.path}
                onClick={() => setMenuOpen(false)}
                className={`rounded-xl px-4 py-2.5 text-sm font-semibold ${
                  isActive(tab.path)
                    ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white"
                    : "text-slate-700 hover:bg-indigo-50"
                }`}
              >
                {tab.name}
              </Link>
            ))}
            {mobileActions && (
              <div onClick={() => setMenuOpen(false)}>{mobileActions}</div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
