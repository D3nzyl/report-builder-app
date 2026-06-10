"use client";

import { NodeViewWrapper } from "@tiptap/react";
import type { NodeViewProps } from "@tiptap/react";
import { useState } from "react";
import { Trash2 } from "lucide-react";

interface Field { label: string; value: string }

function parseFields(raw: string): Field[] {
  try { return JSON.parse(raw); } catch { return []; }
}

function isBoolLike(val: string) { return val === "true" || val === "false" || val === "Yes" || val === "No"; }
function valueColor(val: string) {
  if (val === "true" || val === "Yes") return "text-green-600 font-medium";
  if (val === "false" || val === "No") return "text-red-500 font-medium";
  return "text-gray-700";
}

export function DataRowBlockView({ node, deleteNode }: NodeViewProps) {
  const { collectionLabel, primaryLabel, fields: fieldsRaw } = node.attrs as {
    collectionLabel: string;
    primaryLabel: string;
    fields: string;
  };

  const fields = parseFields(fieldsRaw);
  const bodyFields = fields.slice(1); // first field shown as title

  const [hovered, setHovered] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  return (
    <NodeViewWrapper as="div" contentEditable={false}>
      <div
        className="my-1.5 rounded-lg border border-gray-200 bg-white hover:border-gray-300 transition-colors relative"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => { setHovered(false); setDeleteConfirm(false); }}
      >
        {/* Source label + delete */}
        <div className="flex items-center justify-between px-4 pt-2.5 pb-0">
          <span className="text-[9px] font-semibold uppercase tracking-wider text-gray-400">
            {collectionLabel}
          </span>
          {hovered && (
            deleteConfirm ? (
              <div className="flex items-center gap-1">
                <span className="text-[10px] text-gray-500">Remove?</span>
                <button
                  onMouseDown={e => { e.preventDefault(); deleteNode(); }}
                  className="text-[10px] px-1.5 py-0.5 rounded bg-red-500 text-white hover:bg-red-600"
                >Yes</button>
                <button
                  onMouseDown={e => { e.preventDefault(); setDeleteConfirm(false); }}
                  className="text-[10px] px-1.5 py-0.5 rounded border border-gray-200 text-gray-500 hover:bg-gray-50"
                >No</button>
              </div>
            ) : (
              <button
                onMouseDown={e => { e.preventDefault(); setDeleteConfirm(true); }}
                className="text-gray-300 hover:text-red-400 transition-colors"
              >
                <Trash2 size={11} />
              </button>
            )
          )}
        </div>

        {/* Primary label (title) */}
        <div className="px-4 pt-1 pb-2">
          <div className="text-base font-semibold text-gray-900 leading-snug">
            {primaryLabel || "—"}
          </div>
        </div>

        {/* Fields grid */}
        {bodyFields.length > 0 && (
          <div className="px-4 pb-3 border-t border-gray-100 pt-2">
            <div className="grid grid-cols-2 gap-x-6 gap-y-1.5">
              {bodyFields.map((f, i) => (
                <div key={i} className="flex items-baseline gap-1.5 min-w-0">
                  <span className="text-[10px] text-gray-400 flex-shrink-0 min-w-[72px]">{f.label}</span>
                  <span className={`text-xs truncate ${valueColor(f.value)}`}>
                    {f.value || "—"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </NodeViewWrapper>
  );
}
