// src/components/Loader.jsx
import React from "react";

export default function Loader({ message = "Loading..." }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[200px] bg-transparent">
      <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      <p className="mt-3 text-blue-600 text-sm font-medium">{message}</p>
    </div>
  );
}
