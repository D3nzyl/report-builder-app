"use client";

import { NodeViewWrapper } from "@tiptap/react";
import type { NodeViewProps } from "@tiptap/react";
import { useState, useRef, useEffect } from "react";
import { Trash2, Code2, Check, X, AlertCircle, ChevronDown, ChevronUp } from "lucide-react";
import { useQuestions } from "@/lib/questionContext";
import { executeQuery } from "@/lib/collectionData";
import type { CollectionCellValue } from "@/lib/types";

function formatCell(val: CollectionCellValue): string {
  if (typeof val === "boolean") return val ? "Yes" : "No";
  if (val === "" || val === null || val === undefined) return "—";
  return String(val);
}

function cellColorClass(val: CollectionCellValue): string {
  if (typeof val === "boolean") return val ? "text-green-600 font-medium" : "text-red-500 font-medium";
  return "text-gray-700";
}

export function RowRepeatBlockView({ node, deleteNode, updateAttributes }: NodeViewProps) {
  const { collectionKey, label, sqlQuery } = node.attrs as {
    collectionId: string;
    collectionKey: string;
    label: string;
    sqlQuery: string;
  };

  const { collections } = useQuestions();

  const [sqlOpen, setSqlOpen] = useState(false);
  const [sqlDraft, setSqlDraft] = useState(sqlQuery);
  const [menuOpen, setMenuOpen] = useState(false);
  const [hovered, setHovered] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => { setSqlDraft(sqlQuery); }, [sqlQuery]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  useEffect(() => {
    if (sqlOpen) textareaRef.current?.focus();
  }, [sqlOpen]);

  const result = executeQuery(sqlQuery, collections);
  const showControls = hovered || menuOpen || sqlOpen;

  function commitSql() {
    const trimmed = sqlDraft.trim();
    if (trimmed) updateAttributes({ sqlQuery: trimmed });
    setSqlOpen(false);
  }

  function cancelSql() {
    setSqlDraft(sqlQuery);
    setSqlOpen(false);
  }

  return (
    <NodeViewWrapper as="div" contentEditable={false}>
      <div
        className="my-2"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => { if (!menuOpen) setHovered(false); }}
      >
        <div className={`rounded-lg border bg-white transition-colors ${sqlOpen ? "border-blue-300 shadow-sm" : "border-gray-200 hover:border-gray-300"}`}>

          {/* ── Header ── */}
          <div className="flex items-center gap-2 px-4 py-2.5 border-b border-gray-100">
            <div className="flex items-center gap-1.5 flex-1 min-w-0">
              {/* Per-row icon */}
              <div className="flex items-center justify-center w-5 h-5 rounded bg-indigo-100 flex-shrink-0">
                <svg width="11" height="11" viewBox="0 0 11 11" fill="none" className="text-indigo-600">
                  <rect x="0.5" y="0.5" width="10" height="2.5" rx="1" stroke="currentColor" strokeWidth="0.9" fill="currentColor" fillOpacity="0.15"/>
                  <rect x="0.5" y="4.25" width="10" height="2.5" rx="1" stroke="currentColor" strokeWidth="0.9" fill="currentColor" fillOpacity="0.15"/>
                  <rect x="0.5" y="8" width="10" height="2.5" rx="1" stroke="currentColor" strokeWidth="0.9" fill="currentColor" fillOpacity="0.15"/>
                </svg>
              </div>
              <span className="text-sm font-semibold text-gray-800 truncate">{label}</span>
              <span className="text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-indigo-50 text-indigo-500 border border-indigo-100 flex-shrink-0">
                Per Row
              </span>
              {!result.error && (
                <span className="text-[10px] text-gray-400 flex-shrink-0">
                  {result.rows.length} block{result.rows.length !== 1 ? "s" : ""}
                </span>
              )}
            </div>

            <div className={`flex items-center gap-1 transition-opacity ${showControls ? "opacity-100" : "opacity-0"}`}>
              <button
                onMouseDown={e => { e.preventDefault(); setSqlOpen(o => !o); }}
                title={sqlOpen ? "Close SQL editor" : "Edit SQL query"}
                className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors ${
                  sqlOpen ? "bg-blue-50 text-blue-600 border border-blue-200" : "text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                }`}
              >
                <Code2 size={11} />
                <span className="font-mono text-[10px]">SQL</span>
                {sqlOpen ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
              </button>

              <div className="relative" ref={menuRef}>
                <button
                  onMouseDown={e => { e.preventDefault(); setMenuOpen(o => !o); }}
                  className="flex items-center justify-center w-6 h-6 rounded text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                >
                  <Trash2 size={12} />
                </button>
                {menuOpen && (
                  <div className="absolute right-0 top-7 z-50 bg-white border border-gray-200 rounded-lg shadow-lg py-0.5 w-32 text-xs">
                    <button
                      className="flex items-center gap-2 px-2.5 py-1.5 hover:bg-red-50 text-red-600 w-full text-left"
                      onMouseDown={e => { e.preventDefault(); deleteNode(); }}
                    >
                      <Trash2 size={11} /> Remove block
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ── SQL editor ── */}
          {sqlOpen && (
            <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
              <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">SQL Query</div>
              <textarea
                ref={textareaRef}
                value={sqlDraft}
                onChange={e => setSqlDraft(e.target.value)}
                onKeyDown={e => {
                  if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) { e.preventDefault(); commitSql(); }
                  if (e.key === "Escape") cancelSql();
                }}
                rows={3}
                spellCheck={false}
                className="w-full font-mono text-xs bg-white border border-gray-200 rounded-md px-3 py-2 resize-none focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-blue-300 text-gray-800 placeholder-gray-300"
                placeholder={`SELECT * FROM ${collectionKey}`}
              />
              <div className="flex items-center gap-1.5 mt-1.5">
                <button onMouseDown={e => { e.preventDefault(); commitSql(); }}
                  className="flex items-center gap-1 px-2.5 py-1 rounded bg-gray-900 text-white text-xs hover:bg-gray-700 transition-colors">
                  <Check size={10} /> Run
                </button>
                <button onMouseDown={e => { e.preventDefault(); cancelSql(); }}
                  className="flex items-center gap-1 px-2.5 py-1 rounded border border-gray-200 text-gray-500 text-xs hover:bg-gray-50 transition-colors">
                  <X size={10} /> Cancel
                </button>
                <span className="text-[10px] text-gray-400 ml-1">⌘↵ to run</span>
              </div>
            </div>
          )}

          {/* ── Error ── */}
          {result.error && (
            <div className="px-4 py-2.5 flex items-center gap-2 text-xs text-red-600 bg-red-50">
              <AlertCircle size={12} className="flex-shrink-0" />
              <span className="font-mono">{result.error}</span>
            </div>
          )}

          {/* ── Cards — one per row ── */}
          {!result.error && (
            <div className="p-3 space-y-2">
              {result.rows.length === 0 ? (
                <div className="py-6 text-xs text-gray-400 text-center">No rows returned</div>
              ) : (
                result.rows.map((row, ri) => {
                  const titleCol = result.columns[0];
                  const restCols = result.columns.slice(1);
                  const titleVal = titleCol ? formatCell(row[titleCol.key]) : `Block ${ri + 1}`;

                  return (
                    <div key={ri} className="rounded-lg border border-gray-150 bg-gray-50 px-3.5 py-3 relative">
                      {/* Row number badge */}
                      <div className="absolute top-2.5 right-3 text-[9px] text-gray-300 font-mono select-none">
                        #{ri + 1}
                      </div>

                      {/* Card title */}
                      <div className="text-sm font-semibold text-gray-800 mb-2 pr-8 leading-snug">
                        {titleVal}
                      </div>

                      {/* Field grid */}
                      {restCols.length > 0 && (
                        <div className={`grid gap-x-6 gap-y-1.5 ${restCols.length === 1 ? "grid-cols-1" : "grid-cols-2"}`}>
                          {restCols.map(col => (
                            <div key={col.key} className="flex items-baseline gap-1.5 min-w-0">
                              <span className="text-[10px] text-gray-400 flex-shrink-0 w-fit">
                                {col.label}
                              </span>
                              <span className={`text-xs truncate ${cellColorClass(row[col.key])}`}>
                                {formatCell(row[col.key])}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* ── Footer ── */}
          {!result.error && result.rows.length > 0 && (
            <div className="px-4 py-1.5 border-t border-gray-100 flex items-center justify-between">
              <span className="text-[10px] text-gray-400 font-mono">
                {result.rows.length} block{result.rows.length !== 1 ? "s" : ""} · one per row
              </span>
              <span className="text-[10px] text-gray-300 font-mono truncate max-w-[55%] text-right" title={sqlQuery}>
                {sqlQuery}
              </span>
            </div>
          )}
        </div>
      </div>
    </NodeViewWrapper>
  );
}
