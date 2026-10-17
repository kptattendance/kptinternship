// src/pages/Loader.jsx
export default function Loader({ message = "Loading..." }) {
  return (
    <div className="flex min-h-[200px] flex-col items-center justify-center">
      <div className="h-12 w-12 animate-spin rounded-full border-4 border-indigo-200 border-t-violet-600" />
      <p className="mt-3 text-sm font-medium text-indigo-700">{message}</p>
    </div>
  );
}
