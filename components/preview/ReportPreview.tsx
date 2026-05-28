"use client";

import { useMemo } from "react";
import { X, ArrowLeft, Download } from "lucide-react";
import type { JSONContent } from "@tiptap/core";
import type { FormAnswers, FormQuestion } from "@/lib/types";
import { generateReportHtml } from "@/lib/reportHtmlGenerator";
import { exportPdfFromHtml } from "@/lib/exportUtils";

interface Props {
  editorJson: JSONContent;
  answers: FormAnswers;
  questions: FormQuestion[];
  onClose: () => void;
}

export function ReportPreview({ editorJson, answers, questions, onClose }: Props) {
  const html = useMemo(
    () => generateReportHtml(editorJson, answers, questions, { pageless: true }),
    [editorJson, answers, questions],
  );

  function handleDownload() {
    const pdfHtml = generateReportHtml(editorJson, answers, questions);
    exportPdfFromHtml(pdfHtml);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: "rgba(0,0,0,0.65)" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* Close button outside the phone */}
      <button
        onClick={onClose}
        className="absolute top-6 right-6 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
      >
        <X size={18} />
      </button>

      {/* Phone frame */}
      <div
        className="relative flex flex-col"
        style={{
          width: 390,
          height: "85vh",
          maxHeight: 820,
          background: "#fff",
          borderRadius: 44,
          boxShadow: "0 0 0 10px #1a1a1a, 0 30px 80px rgba(0,0,0,0.6)",
          overflow: "hidden",
        }}
      >
        {/* Status bar */}
        <div
          className="flex items-center justify-between px-6 flex-shrink-0"
          style={{ paddingTop: 14, paddingBottom: 6, background: "#fff" }}
        >
          <span style={{ fontSize: 12, fontWeight: 600, color: "#111" }}>9:41</span>
          <div
            style={{
              position: "absolute", left: "50%", transform: "translateX(-50%)",
              width: 120, height: 34, background: "#1a1a1a",
              borderRadius: "0 0 20px 20px", top: 0,
            }}
          />
          <div className="flex items-center gap-1">
            <svg width="16" height="12" viewBox="0 0 16 12" fill="none">
              <rect x="0" y="4" width="3" height="8" rx="0.5" fill="#111" />
              <rect x="4.5" y="2.5" width="3" height="9.5" rx="0.5" fill="#111" />
              <rect x="9" y="0.5" width="3" height="11.5" rx="0.5" fill="#111" />
              <rect x="13.5" y="0" width="2.5" height="12" rx="0.5" fill="#111" opacity="0.3" />
            </svg>
            <svg width="15" height="12" viewBox="0 0 15 12" fill="none">
              <rect x="0.5" y="0.5" width="12" height="11" rx="2" stroke="#111" strokeWidth="1" />
              <rect x="2" y="2" width="7.5" height="8" rx="1" fill="#111" />
              <path d="M13.5 4v4a2 2 0 0 0 0-4Z" fill="#111" />
            </svg>
          </div>
        </div>

        {/* App nav bar */}
        <div
          className="flex items-center justify-between px-4 flex-shrink-0"
          style={{ paddingTop: 8, paddingBottom: 12, background: "#fff", borderBottom: "1px solid #f0f0f0" }}
        >
          <button
            className="flex items-center gap-1 text-blue-500"
            style={{ fontSize: 16 }}
            onClick={onClose}
          >
            <ArrowLeft size={20} strokeWidth={2} />
          </button>
          <span style={{ fontSize: 17, fontWeight: 600, color: "#111", letterSpacing: -0.3 }}>
            Report
          </span>
          <button
            onClick={handleDownload}
            className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-50 text-blue-500 hover:bg-blue-100 transition-colors"
          >
            <Download size={16} />
          </button>
        </div>

        {/* Scrollable report content */}
        <div className="flex-1 overflow-y-auto" style={{ background: "#fafafa" }}>
          <div
            style={{
              padding: "20px 18px 40px",
              fontFamily: "-apple-system, 'SF Pro Text', 'Segoe UI', Arial, sans-serif",
              fontSize: 15,
              lineHeight: 1.6,
              color: "#1a1a1a",
            }}
            dangerouslySetInnerHTML={{ __html: html }}
          />
        </div>

        {/* Home indicator */}
        <div
          className="flex-shrink-0 flex items-center justify-center"
          style={{ paddingBottom: 8, paddingTop: 6, background: "#fafafa" }}
        >
          <div style={{ width: 130, height: 5, background: "#1a1a1a", borderRadius: 3, opacity: 0.18 }} />
        </div>
      </div>
    </div>
  );
}
