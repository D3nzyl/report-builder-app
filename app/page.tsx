"use client";

import dynamic from "next/dynamic";

const ReportEditor = dynamic(
  () => import("@/components/editor/ReportEditor").then((m) => m.ReportEditor),
  {
    ssr: false,
    loading: () => (
      <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
        Loading editor…
      </div>
    ),
  }
);

export default function Home() {
  return (
    <div className="flex flex-col h-screen bg-gray-50 overflow-hidden">
      {/* Header */}
      <header className="flex items-center gap-4 px-6 py-3 bg-white border-b border-gray-200 flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <rect x="1" y="1" width="5" height="5" rx="1" fill="white" />
              <rect x="8" y="1" width="5" height="5" rx="1" fill="white" opacity="0.7" />
              <rect x="1" y="8" width="5" height="5" rx="1" fill="white" opacity="0.7" />
              <rect x="8" y="8" width="5" height="5" rx="1" fill="white" opacity="0.4" />
            </svg>
          </div>
          <span className="font-semibold text-gray-900 text-sm">Report Builder</span>
        </div>
        <div className="h-4 w-px bg-gray-200" />
        <input
          type="text"
          defaultValue="Inspection Report Template"
          className="w-72 text-sm font-medium text-gray-700 bg-transparent border-none outline-none focus:ring-1 focus:ring-blue-300 rounded px-1 py-0.5 hover:bg-gray-50"
        />
        <div id="header-actions" className="ml-auto flex items-center gap-2" />
      </header>

      {/* Editor fills remaining height */}
      <main className="flex-1 overflow-hidden flex flex-col">
        <ReportEditor />
      </main>
    </div>
  );
}
