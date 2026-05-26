"use client";

import { useMemo } from "react";
import { X } from "lucide-react";
import type { JSONContent } from "@tiptap/core";
import type { FormAnswers, FormQuestion } from "@/lib/types";
import { generateReportHtml } from "@/lib/reportHtmlGenerator";

interface Props {
  editorJson: JSONContent;
  answers: FormAnswers;
  questions: FormQuestion[];
  onClose: () => void;
}

export function ReportPreview({ editorJson, answers, questions, onClose }: Props) {
  const html = useMemo(
    () => generateReportHtml(editorJson, answers, questions),
    [editorJson, answers, questions],
  );

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-6">
      <div className="bg-gray-100 rounded-xl shadow-2xl flex flex-col overflow-hidden" style={{ width: 780, maxHeight: "92vh" }}>
        <div className="flex items-center justify-between px-5 py-3 bg-white border-b border-gray-200 flex-shrink-0">
          <h2 className="text-sm font-semibold text-gray-700">
            Report Preview <span className="text-gray-400 font-normal">(A4)</span>
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-6 px-4 flex flex-col items-center gap-6">
          <div
            className="bg-white shadow-md"
            style={{
              width: 740,
              minHeight: 1047,
              padding: "56px 64px",
              fontFamily: "'Segoe UI', Arial, sans-serif",
              fontSize: 13,
              lineHeight: 1.65,
              color: "#1a1a1a",
              boxSizing: "border-box",
            }}
          >
            <div dangerouslySetInnerHTML={{ __html: html }} />
          </div>
        </div>

        <div className="px-5 py-2 border-t border-gray-200 bg-white flex-shrink-0 text-xs text-gray-400 text-center">
          Variables replaced with sample answers · A4 (210 × 297 mm)
        </div>
      </div>
    </div>
  );
}
