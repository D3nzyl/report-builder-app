"use client";

import { useMemo, useState } from "react";
import { X, Download, Smartphone, Monitor } from "lucide-react";
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

type ViewMode = "phone" | "laptop";

export function ReportPreview({ editorJson, answers, questions, onClose }: Props) {
  const [mode, setMode] = useState<ViewMode>("phone");

  const html = useMemo(
    () => generateReportHtml(editorJson, answers, questions, { pageless: true }),
    [editorJson, answers, questions],
  );

  function handleDownload() {
    exportPdfFromHtml(generateReportHtml(editorJson, answers, questions));
  }

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4"
      style={{ background: "rgba(0,0,0,0.7)" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* Close */}
      <button
        onClick={onClose}
        className="absolute top-5 right-5 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
      >
        <X size={18} />
      </button>

      {/* Mode toggle */}
      <div className="flex items-center gap-1 bg-white/10 rounded-xl p-1 backdrop-blur-sm">
        <button
          onClick={() => setMode("phone")}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            mode === "phone" ? "bg-white text-gray-900" : "text-white/70 hover:text-white"
          }`}
        >
          <Smartphone size={13} /> Phone
        </button>
        <button
          onClick={() => setMode("laptop")}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            mode === "laptop" ? "bg-white text-gray-900" : "text-white/70 hover:text-white"
          }`}
        >
          <Monitor size={13} /> Laptop
        </button>
      </div>

      {/* Device frame */}
      {mode === "phone" ? (
        <PhoneFrame html={html} onClose={onClose} onDownload={handleDownload} />
      ) : (
        <LaptopFrame html={html} onDownload={handleDownload} />
      )}
    </div>
  );
}

// ─── Phone frame ──────────────────────────────────────────────────────────────

function PhoneFrame({ html, onClose, onDownload }: { html: string; onClose: () => void; onDownload: () => void }) {
  return (
    <div
      className="relative flex flex-col flex-shrink-0"
      style={{
        width: 300,
        aspectRatio: "9 / 19.5",
        maxHeight: "82vh",
        background: "#fff",
        borderRadius: 44,
        boxShadow: "0 0 0 10px #1a1a1a, 0 0 0 11px #3a3a3a, 0 30px 80px rgba(0,0,0,0.5)",
        overflow: "hidden",
      }}
    >
      {/* Status bar */}
      <div className="flex items-center justify-between px-6 flex-shrink-0" style={{ paddingTop: 14, paddingBottom: 6 }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: "#111" }}>9:41</span>
        <div style={{
          position: "absolute", left: "50%", transform: "translateX(-50%)",
          width: 100, height: 30, background: "#1a1a1a",
          borderRadius: "0 0 20px 20px", top: 0,
        }} />
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
      <div className="flex items-center justify-between px-4 flex-shrink-0"
        style={{ paddingTop: 8, paddingBottom: 12, borderBottom: "1px solid #f0f0f0" }}>
        <button className="flex items-center text-blue-500" style={{ fontSize: 16 }} onClick={onClose}>
          <svg width="10" height="17" viewBox="0 0 10 17" fill="none">
            <path d="M9 1L1 8.5L9 16" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <span style={{ fontSize: 17, fontWeight: 600, color: "#111", letterSpacing: -0.3 }}>Report</span>
        <button onClick={onDownload}
          className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-50 text-blue-500 hover:bg-blue-100 transition-colors">
          <Download size={15} />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto" style={{ background: "#fafafa" }}>
        <div style={{
          padding: "20px 18px 40px",
          fontFamily: "-apple-system, 'SF Pro Text', 'Segoe UI', Arial, sans-serif",
          fontSize: 15, lineHeight: 1.6, color: "#1a1a1a",
        }} dangerouslySetInnerHTML={{ __html: html }} />
      </div>

      {/* Home indicator */}
      <div className="flex-shrink-0 flex items-center justify-center py-2" style={{ background: "#fafafa" }}>
        <div style={{ width: 130, height: 5, background: "#1a1a1a", borderRadius: 3, opacity: 0.18 }} />
      </div>
    </div>
  );
}

// ─── Laptop frame ─────────────────────────────────────────────────────────────

function LaptopFrame({ html, onDownload }: { html: string; onDownload: () => void }) {
  return (
    <div className="flex flex-col items-center flex-shrink-0" style={{ width: "min(900px, 90vw)" }}>
      {/* Screen */}
      <div style={{
        width: "100%",
        background: "#1a1a1a",
        borderRadius: "14px 14px 0 0",
        padding: "10px 10px 0",
        boxShadow: "0 -4px 30px rgba(0,0,0,0.4)",
      }}>
        {/* Browser chrome */}
        <div style={{
          background: "#fff",
          borderRadius: "8px 8px 0 0",
          overflow: "hidden",
          height: "68vh",
          maxHeight: 640,
          display: "flex",
          flexDirection: "column",
        }}>
          {/* Browser toolbar */}
          <div className="flex items-center gap-3 px-4 flex-shrink-0"
            style={{ paddingTop: 10, paddingBottom: 10, borderBottom: "1px solid #e5e7eb", background: "#f9fafb" }}>
            {/* Traffic lights */}
            <div className="flex items-center gap-1.5">
              <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#ff5f57" }} />
              <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#ffbd2e" }} />
              <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#28c840" }} />
            </div>
            {/* Address bar */}
            <div className="flex-1 flex items-center gap-2 rounded-md px-3 py-1"
              style={{ background: "#efefef", maxWidth: 400, margin: "0 auto" }}>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <rect x="1" y="3" width="10" height="8" rx="1.5" stroke="#9ca3af" strokeWidth="1"/>
                <path d="M4 3V2.5a2 2 0 0 1 4 0V3" stroke="#9ca3af" strokeWidth="1" strokeLinecap="round"/>
              </svg>
              <span style={{ fontSize: 12, color: "#6b7280", flex: 1, textAlign: "center" }}>app.example.com/report/INS-2026-05</span>
            </div>
            {/* Download button */}
            <button onClick={onDownload}
              className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-blue-500 text-white text-xs font-medium hover:bg-blue-600 transition-colors flex-shrink-0">
              <Download size={12} /> Download PDF
            </button>
          </div>

          {/* Page content */}
          <div className="flex-1 overflow-y-auto" style={{ background: "#fff" }}>
            <div style={{
              maxWidth: 720,
              margin: "0 auto",
              padding: "32px 40px 48px",
              fontFamily: "'Segoe UI', Arial, sans-serif",
              fontSize: 14, lineHeight: 1.7, color: "#1a1a1a",
            }} dangerouslySetInnerHTML={{ __html: html }} />
          </div>
        </div>
      </div>

      {/* Laptop base */}
      <div style={{
        width: "100%",
        height: 18,
        background: "linear-gradient(to bottom, #2a2a2a, #1a1a1a)",
        borderRadius: "0 0 4px 4px",
      }} />
      <div style={{
        width: "110%",
        height: 8,
        background: "#111",
        borderRadius: "0 0 8px 8px",
        boxShadow: "0 6px 20px rgba(0,0,0,0.5)",
      }} />
    </div>
  );
}
