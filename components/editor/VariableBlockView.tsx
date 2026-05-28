"use client";

import { createPortal } from "react-dom";
import { NodeViewWrapper } from "@tiptap/react";
import type { NodeViewProps } from "@tiptap/react";
import { useState, useRef, useEffect, useLayoutEffect } from "react";
import {
  MoreHorizontal, Trash2, Type, AlignJustify, ImageIcon, Star, MapPin,
  Pencil, Upload, FileSignature,
} from "lucide-react";
import type { QuestionType, SubField, FormQuestion, ApprovalAnswer } from "@/lib/types";
import { useQuestions } from "@/lib/questionContext";

// ─── Placeholder renderers ────────────────────────────────────────────────────

function TextPlaceholder({ lines = 1 }: { lines?: number }) {
  return (
    <div className="flex flex-col gap-1.5 mt-1">
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className="h-2 rounded-full bg-gray-200"
          style={{ width: i === lines - 1 && lines > 1 ? "60%" : "100%" }} />
      ))}
    </div>
  );
}
function NumberPlaceholder() {
  return <div className="mt-1 text-2xl font-light text-gray-300 leading-none">0</div>;
}
function DatePlaceholder() {
  return (
    <div className="mt-1 flex items-center gap-0.5">
      {["DD", "MM", "YYYY"].map((part, i) => (
        <span key={part} className="flex items-center gap-0.5">
          <span className="text-sm text-gray-300 font-mono tracking-wide">{part}</span>
          {i < 2 && <span className="text-gray-200 text-sm">/</span>}
        </span>
      ))}
    </div>
  );
}
function DateTimePlaceholder() {
  return (
    <div className="mt-1 flex items-center gap-3 flex-wrap">
      <div className="flex gap-0.5">
        {["DD", "MM", "YYYY"].map((part, i) => (
          <span key={part} className="flex items-center gap-0.5">
            <span className="text-sm text-gray-300 font-mono tracking-wide">{part}</span>
            {i < 2 && <span className="text-gray-200 text-sm">/</span>}
          </span>
        ))}
      </div>
      <span className="text-gray-200">·</span>
      <div className="flex gap-0.5">
        {["HH", "MM"].map((part, i) => (
          <span key={part} className="flex items-center gap-0.5">
            <span className="text-sm text-gray-300 font-mono tracking-wide">{part}</span>
            {i < 1 && <span className="text-gray-200 text-sm">:</span>}
          </span>
        ))}
      </div>
    </div>
  );
}
function SelectPlaceholder({ multi }: { multi: boolean }) {
  const chips = multi ? ["Option 1", "Option 2", "Option 3"] : ["Selected option"];
  return (
    <div className="mt-1.5 flex flex-wrap gap-1">
      {chips.map((c) => (
        <span key={c} className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-400 border border-gray-200">{c}</span>
      ))}
    </div>
  );
}
function RadioPlaceholder() {
  return (
    <div className="mt-1.5 flex flex-col gap-1.5">
      {["Option A", "Option B", "Option C"].map((opt, i) => (
        <div key={opt} className="flex items-center gap-2">
          <div className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${i === 0 ? "border-gray-300" : "border-gray-200"}`}>
            {i === 0 && <div className="w-1.5 h-1.5 rounded-full bg-gray-300" />}
          </div>
          <span className="text-xs text-gray-300">{opt}</span>
        </div>
      ))}
    </div>
  );
}
function RatingPlaceholder() {
  return (
    <div className="mt-1.5 flex items-center gap-1">
      {Array.from({ length: 5 }).map((_, i) => <Star key={i} size={18} className="text-gray-200" />)}
      <span className="text-xs text-gray-300 ml-1">0 / 5</span>
    </div>
  );
}
function TogglePlaceholder() {
  return (
    <div className="mt-1.5 flex items-center gap-2">
      <div className="w-9 h-5 rounded-full bg-gray-200 flex items-center px-0.5">
        <div className="w-4 h-4 rounded-full bg-white shadow-sm" />
      </div>
      <span className="text-xs text-gray-300">No</span>
    </div>
  );
}
function SliderPlaceholder() {
  return (
    <div className="mt-2 px-1">
      <div className="relative h-1.5 bg-gray-200 rounded-full">
        <div className="absolute left-0 top-0 h-full w-1/3 bg-gray-300 rounded-full" />
        <div className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-white border-2 border-gray-300 shadow-sm"
          style={{ left: "calc(33% - 8px)" }} />
      </div>
      <div className="flex justify-between mt-1.5">
        <span className="text-xs text-gray-300">0</span>
        <span className="text-xs text-gray-300">100</span>
      </div>
    </div>
  );
}
function ImagePlaceholder() {
  return (
    <div className="mt-1.5 rounded-lg border-2 border-dashed border-gray-200 bg-gray-50 flex flex-col items-center justify-center gap-1.5 py-6">
      <ImageIcon size={22} className="text-gray-300" />
      <span className="text-xs text-gray-300">Image will appear here</span>
    </div>
  );
}
function FileUploadPlaceholder() {
  return (
    <div className="mt-1.5 rounded-lg border-2 border-dashed border-gray-200 bg-gray-50 flex flex-col items-center justify-center gap-1.5 py-5">
      <Upload size={20} className="text-gray-300" />
      <span className="text-xs text-gray-300">File will appear here</span>
    </div>
  );
}
function SignaturePlaceholder() {
  return (
    <div className="mt-1.5 rounded-lg border border-gray-200 bg-gray-50 overflow-hidden" style={{ height: 80 }}>
      <svg width="100%" height="100%" viewBox="0 0 300 80" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M 40 52 C 55 36, 62 28, 72 38 C 82 48, 78 58, 90 44 C 102 30, 108 26, 118 38 C 126 48, 122 56, 134 42 C 144 30, 152 26, 162 36 C 170 44, 168 54, 178 44"
          fill="none" stroke="#d1d5db" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
        />
        <line x1="24" y1="64" x2="276" y2="64" stroke="#e5e7eb" strokeWidth="1" />
        <text x="150" y="76" textAnchor="middle" fill="#d1d5db" fontSize="9" fontFamily="sans-serif">Signature</text>
      </svg>
    </div>
  );
}
function SketchPlaceholder() {
  return (
    <div className="mt-1.5 rounded-lg border-2 border-dashed border-gray-200 bg-gray-50 flex flex-col items-center justify-center gap-1.5 py-6 relative overflow-hidden">
      <svg className="absolute inset-0 w-full h-full opacity-30" xmlns="http://www.w3.org/2000/svg">
        <defs><pattern id="sketch-dots" x="0" y="0" width="16" height="16" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r="0.8" fill="#d1d5db" /></pattern></defs>
        <rect width="100%" height="100%" fill="url(#sketch-dots)" />
      </svg>
      <Pencil size={20} className="text-gray-300 relative z-10" />
      <span className="text-xs text-gray-300 relative z-10">Sketch will appear here</span>
    </div>
  );
}
function LocationPlaceholder() {
  return (
    <div className="mt-1.5 rounded-lg border border-gray-200 overflow-hidden relative" style={{ height: 120 }}>
      <svg width="100%" height="100%" viewBox="0 0 300 120" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice">
        <rect width="300" height="120" fill="#e8edf2" />
        <rect x="0" y="48" width="300" height="10" fill="#f5f6f7" />
        <rect x="110" y="0" width="10" height="120" fill="#f5f6f7" />
        <rect x="200" y="0" width="8" height="120" fill="#f5f6f7" />
        <rect x="15" y="10" width="85" height="32" rx="3" fill="#dce2e9" />
        <rect x="125" y="10" width="65" height="32" rx="3" fill="#dce2e9" />
        <rect x="15" y="62" width="85" height="22" rx="3" fill="#dce2e9" />
        <rect x="125" y="62" width="65" height="22" rx="3" fill="#dce2e9" />
        <rect x="215" y="10" width="75" height="32" rx="3" fill="#dce2e9" />
        <ellipse cx="152" cy="58" rx="5" ry="2.5" fill="rgba(0,0,0,0.12)" />
        <path d="M152 20 C144 20 138 26 138 33 C138 43 152 58 152 58 C152 58 166 43 166 33 C166 26 160 20 152 20 Z" fill="#ef4444" />
        <circle cx="152" cy="33" r="5" fill="white" opacity="0.9" />
      </svg>
      <div className="absolute bottom-2 right-2 bg-white/80 rounded px-1.5 py-0.5 flex items-center gap-1">
        <MapPin size={10} className="text-gray-400" />
        <span className="text-xs text-gray-400">Location</span>
      </div>
    </div>
  );
}

// ─── Approval block preview ───────────────────────────────────────────────────

const APPROVAL_ROW_H = 72;

function ApprovalBlockPreview({ data }: { data: ApprovalAnswer | null }) {
  const decision = data?.decision ?? "approved";
  const personLabel = decision === "approved" ? "Approved by" : "Rejected by";

  return (
    <div className="mt-2 space-y-2">
      {/* Fixed-height 3-column row: approved → name / date / signature  |  rejected → name / date / remarks */}
      <div className="flex gap-2 w-full" style={{ height: APPROVAL_ROW_H }}>
        <div className="flex-1 border border-gray-100 rounded-md px-3 py-2 bg-gray-50/70 min-w-0 flex flex-col">
          <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">{personLabel}</div>
          {data?.person
            ? <div className="text-xs text-gray-700 font-medium truncate">{data.person}</div>
            : <div className="h-2 rounded-full bg-gray-200 mt-1 w-3/4" />}
        </div>
        <div className="flex-1 border border-gray-100 rounded-md px-3 py-2 bg-gray-50/70 min-w-0 flex flex-col">
          <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">Date</div>
          {data?.date
            ? <div className="text-xs text-gray-700 truncate">{data.date}</div>
            : <div className="h-2 rounded-full bg-gray-200 mt-1 w-2/3" />}
        </div>
        {decision === "approved" ? (
          <div className="flex-1 border border-gray-100 rounded-md px-3 py-2 bg-gray-50/70 min-w-0 flex flex-col">
            <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">Signature</div>
            <div className="flex-1 rounded-lg border border-gray-200 bg-gray-50 overflow-hidden">
              <svg width="100%" height="100%" viewBox="0 0 300 80" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg">
                <path d="M 40 52 C 55 36, 62 28, 72 38 C 82 48, 78 58, 90 44 C 102 30, 108 26, 118 38 C 126 48, 122 56, 134 42 C 144 30, 152 26, 162 36 C 170 44, 168 54, 178 44"
                  fill="none" stroke="#d1d5db" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                <line x1="24" y1="64" x2="276" y2="64" stroke="#e5e7eb" strokeWidth="1" />
                <text x="150" y="76" textAnchor="middle" fill="#d1d5db" fontSize="9" fontFamily="sans-serif">Signature</text>
              </svg>
            </div>
          </div>
        ) : (
          <div className="flex-1 border border-gray-100 rounded-md px-3 py-2 bg-gray-50/70 min-w-0 flex flex-col overflow-hidden">
            <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">Remarks</div>
            {data?.remarks
              ? <div className="text-xs text-gray-600 leading-relaxed line-clamp-3">{data.remarks}</div>
              : <TextPlaceholder lines={2} />}
          </div>
        )}
      </div>

      {/* Images — rejected only, below the fixed row */}
      {decision === "rejected" && (
        <div className="border border-gray-100 rounded-md px-3 py-2 bg-gray-50/70 w-full">
          <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">
            Images <span className="font-normal normal-case">(optional)</span>
          </div>
          <ImagePlaceholder />
        </div>
      )}
    </div>
  );
}

function BlockPlaceholder({ type }: { type: QuestionType }) {
  switch (type) {
    case "short_text":    return <TextPlaceholder lines={1} />;
    case "long_text":     return <TextPlaceholder lines={3} />;
    case "number":        return <NumberPlaceholder />;
    case "radio":         return <RadioPlaceholder />;
    case "rating":        return <RatingPlaceholder />;
    case "toggle":        return <TogglePlaceholder />;
    case "single_select": return <SelectPlaceholder multi={false} />;
    case "multi_select":  return <SelectPlaceholder multi={true} />;
    case "slider":        return <SliderPlaceholder />;
    case "date":          return <DatePlaceholder />;
    case "datetime":      return <DateTimePlaceholder />;
    case "file_upload":   return <FileUploadPlaceholder />;
    case "signature":     return <SignaturePlaceholder />;
    case "sketch":        return <SketchPlaceholder />;
    case "location":      return <LocationPlaceholder />;
    case "image_upload":  return <ImagePlaceholder />;
    default:              return <TextPlaceholder lines={1} />;
  }
}

// ─── Compact placeholder for table cells ─────────────────────────────────────

function SmallPlaceholder({ type }: { type: QuestionType }) {
  switch (type) {
    case "number":
      return <span className="text-xs text-gray-300 font-mono">0</span>;
    case "date":
      return <span className="text-[10px] text-gray-300 font-mono">DD/MM/YY</span>;
    case "datetime":
      return <span className="text-[10px] text-gray-300 font-mono">DD/MM HH:MM</span>;
    case "toggle":
      return (
        <div className="flex items-center gap-1">
          <div className="w-6 h-3 rounded-full bg-gray-200 flex items-center px-0.5">
            <div className="w-2.5 h-2.5 rounded-full bg-white shadow-sm" />
          </div>
          <span className="text-[9px] text-gray-300">No</span>
        </div>
      );
    case "radio":
    case "single_select":
      return <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] bg-gray-100 text-gray-400 border border-gray-200">Select</span>;
    case "multi_select":
      return (
        <div className="flex gap-0.5">
          <span className="px-1 py-0.5 rounded-full text-[9px] bg-gray-100 text-gray-400 border border-gray-200">A</span>
          <span className="px-1 py-0.5 rounded-full text-[9px] bg-gray-100 text-gray-400 border border-gray-200">B</span>
        </div>
      );
    case "rating":
      return <span className="text-xs text-gray-200 tracking-tight">★★★☆☆</span>;
    case "slider":
      return (
        <div className="h-1.5 bg-gray-200 rounded-full relative w-full min-w-[48px]">
          <div className="absolute h-full w-1/3 bg-gray-300 rounded-full" />
        </div>
      );
    case "signature":
      return (
        <div className="rounded border border-gray-200 bg-gray-50 overflow-hidden" style={{ width: "100%", height: 28 }}>
          <svg width="100%" height="100%" viewBox="0 0 120 28" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg">
            <path d="M 12 18 C 18 12, 22 9, 26 14 C 30 18, 28 22, 34 16 C 40 10, 44 8, 48 14 C 52 18, 50 22, 56 16 C 62 10, 66 8, 70 14" fill="none" stroke="#d1d5db" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
            <line x1="8" y1="22" x2="112" y2="22" stroke="#e5e7eb" strokeWidth="0.8" />
          </svg>
        </div>
      );
    case "image_upload": case "file_upload": case "sketch":
      return <ImageIcon size={12} className="text-gray-300" />;
    case "location":
      return <MapPin size={12} className="text-gray-300" />;
    case "long_text":
      return (
        <div className="flex flex-col gap-1 w-full">
          <div className="h-1.5 rounded-full bg-gray-200 w-full" />
          <div className="h-1.5 rounded-full bg-gray-200 w-3/4" />
        </div>
      );
    default:
      return <div className="h-1.5 rounded-full bg-gray-200 w-full min-w-[48px]" />;
  }
}

// ─── Multi Response preview ───────────────────────────────────────────────────

function MultiResponsePreview({ type }: { type: QuestionType }) {
  return (
    <div className="mt-2 space-y-1.5">
      {[0, 1].map(i => (
        <div key={i} className="border border-gray-100 rounded-md px-3 py-2 bg-gray-50"
          style={{ opacity: i === 0 ? 1 : 0.4 }}>
          <BlockPlaceholder type={type} />
        </div>
      ))}
    </div>
  );
}

// ─── Multi Field preview (no multi response) ──────────────────────────────────

function MultiFieldPreview({ subFields }: { subFields: SubField[] }) {
  if (!subFields.length) {
    return (
      <div className="mt-2 border border-dashed border-gray-200 rounded-md p-3 text-xs text-gray-400 text-center">
        No sub-fields — add sub-fields in the variable tray
      </div>
    );
  }
  return (
    <div className="mt-2 space-y-1.5">
      {subFields.map(sf => (
        <div key={sf.id} className="border border-gray-100 rounded-md px-3 py-2 bg-gray-50/70">
          <div className="text-xs font-medium text-gray-500 mb-1">{sf.label}</div>
          {sf.multiResponse ? <MultiResponsePreview type={sf.type} /> : <BlockPlaceholder type={sf.type} />}
        </div>
      ))}
    </div>
  );
}

// ─── Multi Field + Multi Response = Table with column manager ─────────────────

const DEFAULT_COL_W = 100;

function MultiFieldTablePreview({
  question, updateQuestion,
}: {
  question: FormQuestion;
  updateQuestion: (id: string, updates: Partial<FormQuestion>) => void;
}) {
  const allSubFields = question.subFields ?? [];
  const columnHeaders = question.columnHeaders ?? {};
  const columnOrder = question.columnOrder;
  const columnWidths = question.columnWidths ?? {};

  // Compute visible columns in order
  const visibleKeys: string[] = columnOrder ?? allSubFields.map(sf => sf.variableKey);
  const orderedVisible = visibleKeys
    .map(key => allSubFields.find(sf => sf.variableKey === key))
    .filter((sf): sf is SubField => !!sf);

  const [editingCol, setEditingCol] = useState<string | null>(null);
  const [colDraft, setColDraft] = useState("");
  const [localWidths, setLocalWidths] = useState<Record<string, number>>({});
  const colInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { if (editingCol) colInputRef.current?.focus(); }, [editingCol]);

  const effectiveWidths = { ...columnWidths, ...localWidths };

  function startEditCol(sfKey: string) {
    const sf = allSubFields.find(s => s.variableKey === sfKey);
    setColDraft(columnHeaders[sfKey] ?? sf?.label ?? sfKey);
    setEditingCol(sfKey);
  }
  function commitCol() {
    if (!editingCol) return;
    const sf = allSubFields.find(s => s.variableKey === editingCol);
    updateQuestion(question.id, {
      columnHeaders: { ...columnHeaders, [editingCol]: colDraft.trim() || sf?.label || editingCol },
    });
    setEditingCol(null);
  }

  function startResize(sfIdx: number, e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    const sf = orderedVisible[sfIdx];
    const nextSf = orderedVisible[sfIdx + 1];
    if (!sf || !nextSf) return;
    const startX = e.clientX;
    const startWA = effectiveWidths[sf.variableKey] ?? DEFAULT_COL_W;
    const startWB = effectiveWidths[nextSf.variableKey] ?? DEFAULT_COL_W;
    const MIN_W = 48;
    function clampedDelta(raw: number) {
      return Math.min(startWB - MIN_W, Math.max(-(startWA - MIN_W), raw));
    }
    function onMove(ev: MouseEvent) {
      const d = clampedDelta(ev.clientX - startX);
      setLocalWidths({
        [sf.variableKey]: Math.round(startWA + d),
        [nextSf.variableKey]: Math.round(startWB - d),
      });
    }
    function onUp(ev: MouseEvent) {
      const d = clampedDelta(ev.clientX - startX);
      updateQuestion(question.id, {
        columnWidths: {
          ...(question.columnWidths ?? {}),
          [sf.variableKey]: Math.round(startWA + d),
          [nextSf.variableKey]: Math.round(startWB - d),
        },
      });
      setLocalWidths({});
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
    }
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  }

  if (!allSubFields.length) {
    return (
      <div className="mt-2 border border-dashed border-gray-200 rounded-md p-3 text-xs text-gray-400 text-center">
        No sub-fields — add sub-fields in the variable tray
      </div>
    );
  }

  return (
    <div className="mt-2">
      {/* Table */}
      {orderedVisible.length === 0 ? (
        <div className="border border-dashed border-gray-200 rounded-md p-2 text-[10px] text-gray-400 text-center">
          All columns hidden
        </div>
      ) : (
        <div className="rounded border border-gray-200">
          {(() => {
            const rawWidths = orderedVisible.map(sf => effectiveWidths[sf.variableKey] ?? DEFAULT_COL_W);
            const totalW = rawWidths.reduce((s, w) => s + w, 0);
            return (
          <table className="border-collapse text-xs" style={{ tableLayout: "fixed", width: "100%" }}>
            <colgroup>
              {orderedVisible.map((sf, i) => (
                <col key={sf.id} style={{ width: `${((rawWidths[i] / totalW) * 100).toFixed(2)}%` }} />
              ))}
            </colgroup>
            <thead>
              <tr className="bg-gray-50">
                {orderedVisible.map((sf, sfIdx) => {
                  const header = columnHeaders[sf.variableKey] ?? sf.label;
                  const isEditing = editingCol === sf.variableKey;
                  const isLast = sfIdx === orderedVisible.length - 1;
                  return (
                    <th
                      key={sf.id}
                      className="border-b border-r last:border-r-0 border-gray-200 px-2.5 py-1.5 text-left font-semibold text-gray-600 relative overflow-hidden"
                    >
                      {isEditing ? (
                        <input
                          ref={colInputRef}
                          type="text"
                          value={colDraft}
                          onChange={e => setColDraft(e.target.value)}
                          onKeyDown={e => {
                            if (e.key === "Enter") { e.preventDefault(); commitCol(); }
                            if (e.key === "Escape") setEditingCol(null);
                          }}
                          onBlur={commitCol}
                          className="w-full bg-white border border-gray-300 rounded px-1 py-0.5 text-xs focus:outline-none"
                          style={{ minWidth: 40 }}
                        />
                      ) : (
                        <button
                          onMouseDown={e => { e.preventDefault(); startEditCol(sf.variableKey); }}
                          className="flex items-center gap-1 group w-full text-left pr-2"
                          title="Click to rename column"
                          tabIndex={-1}
                        >
                          <span className="truncate">{header}</span>
                          <Pencil size={8} className="text-gray-300 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </button>
                      )}
                      {/* Resize handle — hidden on last column (table is full-width) */}
                      {!isLast && (
                        <div
                          onMouseDown={e => startResize(sfIdx, e)}
                          className="absolute right-0 top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-gray-300 transition-colors"
                        />
                      )}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {[0, 1].map(rowIdx => (
                <tr key={rowIdx} className={rowIdx === 1 ? "opacity-40" : ""}>
                  {orderedVisible.map(sf => (
                    <td key={sf.id} className="border-b last:border-b-0 border-r last:border-r-0 border-gray-100 px-2.5 py-2 align-top overflow-hidden">
                      {sf.multiResponse ? (
                        <div className="flex flex-col gap-0.5">
                          <div className="flex items-center gap-1">
                            <span className="text-gray-300 text-[10px]">·</span>
                            <div className="h-1.5 rounded-full bg-gray-200 flex-1 min-w-[24px]" />
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="text-gray-300 text-[10px]">·</span>
                            <div className="h-1.5 rounded-full bg-gray-200" style={{ width: "60%" }} />
                          </div>
                        </div>
                      ) : (
                        <SmallPlaceholder type={sf.type} />
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
            );
          })()}
        </div>
      )}
    </div>
  );
}

// ─── Column guide overlay ─────────────────────────────────────────────────────

interface GuideState { contentLeft: number; contentWidth: number; container: Element }

function ColumnGuides({ state, cols, activeCol }: { state: GuideState; cols: number; activeCol: number }) {
  const { contentLeft, contentWidth, container } = state;
  return createPortal(
    <div style={{ position: "absolute", inset: 0, zIndex: 0, pointerEvents: "none", overflow: "hidden" }} aria-hidden="true">
      {Array.from({ length: cols + 1 }, (_, i) => {
        const x = Math.round(contentLeft + (i / cols) * contentWidth);
        const isActive = i === activeCol;
        const isBound = i === 0 || i === cols;
        return (
          <div key={i} style={{
            position: "absolute", left: x, top: 0, bottom: 0, width: isActive ? 2 : 1,
            background: isActive ? "#6366f1" : "transparent",
            borderLeft: isActive ? "none" : isBound ? "1px dashed rgba(99,102,241,0.22)" : "1px dashed rgba(99,102,241,0.13)",
          }} />
        );
      })}
    </div>,
    container,
  );
}

function GripDots({ active }: { active: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center gap-[3px]">
      {[0, 1, 2, 3, 4].map((i) => (
        <div key={i} className={`w-[3px] h-[3px] rounded-full transition-colors ${active ? "bg-blue-400" : "bg-gray-400"}`} />
      ))}
    </div>
  );
}

// ─── Block node view ──────────────────────────────────────────────────────────

const COLS = 12;
const MIN_COLS = 4;

export function VariableBlockView({ node, editor, getPos, deleteNode, updateAttributes }: NodeViewProps) {
  const { label, variableKey, questionType, questionId, colSpan = COLS } = node.attrs as {
    label: string; variableKey: string; questionType: QuestionType; questionId: string; colSpan: number;
  };

  const { questions, answers, updateQuestion } = useQuestions();
  const question = questions.find(q => q.id === questionId);

  const [menuOpen, setMenuOpen] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [guideState, setGuideState] = useState<GuideState | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const blockRef = useRef<HTMLDivElement>(null);

  const isDragging = guideState !== null;
  const widthPct = `${Math.round((colSpan / COLS) * 100)}%`;

  const isApproval = questionType === "approval";
  const isMultiField = question?.multiField === true;
  const isMultiResponse = question?.multiResponse === true;
  const allowRemarks = question?.allowRemarks === true && !isApproval;
  const isFullWidth = isApproval || isMultiResponse;
  const subFields = question?.subFields ?? [];

  const approvalData: ApprovalAnswer | null = isApproval
    ? (() => { try { return JSON.parse(answers[variableKey] as string); } catch { return null; } })()
    : null;

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useLayoutEffect(() => {
    const inner = blockRef.current;
    if (!inner) return;
    const rendererEl = inner.parentElement?.parentElement as HTMLElement | null;
    if (!rendererEl) return;
    rendererEl.setAttribute("data-question-block", "true");
    rendererEl.style.width = isFullWidth ? "100%" : widthPct;
    rendererEl.style.marginTop = "6px";
    rendererEl.style.marginBottom = "2px";
    rendererEl.style.paddingLeft = "3px";
    rendererEl.style.paddingRight = "3px";
  }, [widthPct, isFullWidth]);

  function switchToInline() {
    if (isMultiField || isApproval) return;
    const pos = getPos();
    if (pos === undefined || !editor) return;
    setMenuOpen(false);
    editor.chain().focus().command(({ tr, state }) => {
      const inlineNode = state.schema.nodes.questionVariableInline?.create({
        questionId, variableKey, label, questionType, displayType: "inline_value",
      });
      if (!inlineNode) return false;
      const para = state.schema.nodes.paragraph?.create(null, inlineNode);
      if (!para) return false;
      tr.replaceWith(pos, pos + node.nodeSize, para);
      return true;
    }).run();
  }

  function onResizeMouseDown(e: React.MouseEvent) {
    if (isFullWidth) return;
    e.preventDefault();
    e.stopPropagation();
    const blockEl = blockRef.current;
    if (!blockEl) return;
    const editorEl = blockEl.closest(".notion-editor") as HTMLElement | null;
    const pageEl = editorEl?.parentElement;
    if (editorEl && pageEl) {
      const cs = window.getComputedStyle(editorEl);
      const pl = parseFloat(cs.paddingLeft) || 0;
      const pr = parseFloat(cs.paddingRight) || 0;
      setGuideState({ contentLeft: editorEl.offsetLeft + pl, contentWidth: editorEl.offsetWidth - pl - pr, container: pageEl });
    }
    const blockLeft = blockEl.getBoundingClientRect().left;
    const totalWidth = blockEl.offsetWidth * (COLS / Math.max(1, colSpan));
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
    function onMouseMove(ev: MouseEvent) {
      const next = Math.min(COLS, Math.max(MIN_COLS, Math.round(((ev.clientX - blockLeft) / totalWidth) * COLS)));
      updateAttributes({ colSpan: next });
    }
    function onMouseUp() {
      setGuideState(null);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    }
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  }

  const showHandle = (hovered || isDragging) && !isFullWidth;

  let bodyContent: React.ReactNode;
  if (isApproval) {
    bodyContent = <ApprovalBlockPreview data={approvalData} />;
  } else if (isMultiField && isMultiResponse) {
    bodyContent = <MultiFieldTablePreview question={question!} updateQuestion={updateQuestion} />;
  } else if (isMultiField) {
    bodyContent = <MultiFieldPreview subFields={subFields} />;
  } else if (isMultiResponse) {
    bodyContent = <MultiResponsePreview type={questionType} />;
  } else {
    bodyContent = <BlockPlaceholder type={questionType} />;
  }

  const modeBadge = (isMultiField || isMultiResponse) ? (
    <span className="ml-1.5 text-[9px] px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500 border border-gray-200 font-medium flex-shrink-0">
      {isMultiField ? "multi-field" : "multi-response"}
    </span>
  ) : null;

  return (
    <NodeViewWrapper as="div" data-question-block="true" contentEditable={false}>
      {isDragging && guideState && <ColumnGuides state={guideState} cols={COLS} activeCol={colSpan} />}

      <div ref={blockRef} className="relative"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => { if (!isDragging) setHovered(false); }}>

        <div className={`rounded-lg border bg-white px-4 py-3 transition-colors ${isDragging ? "border-blue-400 shadow-sm" : "border-gray-200 hover:border-gray-300"}`}>
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center min-w-0 flex-1">
              <span className="text-sm font-semibold text-gray-800 leading-snug truncate" title={label}>{label}</span>
              {modeBadge}
            </div>

            <div className="relative flex-shrink-0" ref={menuRef}>
              <button
                className={`flex items-center justify-center w-6 h-6 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-all ${showHandle ? "opacity-100" : "opacity-0"}`}
                onMouseDown={e => { e.preventDefault(); setMenuOpen(o => !o); }}
              >
                <MoreHorizontal size={14} />
              </button>

              {menuOpen && (
                <div className="absolute right-0 top-7 z-50 bg-white border border-gray-200 rounded-lg shadow-lg py-0.5 w-36 text-sm">
                  <div className="px-2.5 py-1 text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Display as</div>
                  <button className="flex items-center gap-2 px-2.5 py-1.5 hover:bg-gray-50 w-full text-left text-xs text-gray-700"
                    onMouseDown={e => { e.preventDefault(); setMenuOpen(false); }}>
                    <AlignJustify size={11} className="text-gray-400 flex-shrink-0" />Block
                    <span className="ml-auto text-gray-400 text-[10px]">✓</span>
                  </button>
                  {!isMultiField && !isApproval && (
                    <button className="flex items-center gap-2 px-2.5 py-1.5 hover:bg-gray-50 w-full text-left text-xs text-gray-700"
                      onMouseDown={e => { e.preventDefault(); switchToInline(); }}>
                      <Type size={11} className="text-gray-400 flex-shrink-0" />Inline
                    </button>
                  )}
                  <div className="border-t border-gray-100 my-0.5" />
                  <button className="flex items-center gap-2 px-2.5 py-1.5 hover:bg-red-50 text-red-600 w-full text-left text-xs"
                    onMouseDown={e => { e.preventDefault(); deleteNode(); }}>
                    <Trash2 size={11} />Delete
                  </button>
                </div>
              )}
            </div>
          </div>

          {bodyContent}

          {allowRemarks && (
            <div className="mt-3 pt-3 border-t border-gray-100 space-y-2.5">
              <div>
                <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Remarks</div>
                <TextPlaceholder lines={2} />
              </div>
              <div>
                <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1.5">
                  Image <span className="font-normal normal-case">(optional)</span>
                </div>
                <ImagePlaceholder />
              </div>
            </div>
          )}
        </div>

        <div onMouseDown={onResizeMouseDown}
          className="absolute top-0 bottom-0 flex items-center justify-center cursor-col-resize z-20 transition-opacity duration-100"
          style={{ right: -10, width: 20, opacity: showHandle ? 1 : 0, pointerEvents: showHandle ? "auto" : "none" }}>
          <div className={`w-1.5 h-10 rounded-full flex items-center justify-center transition-colors ${isDragging ? "bg-blue-100" : "bg-gray-200 hover:bg-gray-300"}`}>
            <GripDots active={isDragging} />
          </div>
        </div>
      </div>
    </NodeViewWrapper>
  );
}
