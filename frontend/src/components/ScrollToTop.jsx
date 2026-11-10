// src/components/ScrollToTop.jsx
// Every new page opens at the top (the browser keeps the old scroll position
// otherwise, so a page could open half-way down).
import { useLayoutEffect } from "react";
import { useLocation } from "react-router-dom";

export default function ScrollToTop() {
  const { pathname } = useLocation();

  useLayoutEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [pathname]);

  return null;
}
