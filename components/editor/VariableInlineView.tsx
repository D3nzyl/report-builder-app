"use client";

import { NodeViewWrapper } from "@tiptap/react";
import type { NodeViewProps } from "@tiptap/react";
import { useState, useRef, useEffect } from "react";
import { MoreHorizontal, Trash2, AlignJustify, Type, MessageSquare, ImageIcon } from "lucide-react";
import { useQuestions } from "@/lib/questionContext";
import { createPortal } from "react-dom";

const COLS = 12;
const MIN_COLS = 4;

function GripDots({ active }: { active: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center gap-[3px]">
      {[0, 1, 2, 3, 4].map((i) => (
        <div key={i} className={`w-[3px] h-[3px] rounded-full transition-colors ${active ? "bg-blue-400" : "bg-gray-400"}`} />
      ))}
    </div>
  );
}

export function VariableInlineView({ node, editor, getPos, deleteNode, updateAttributes }: NodeViewProps) {
  const { label, variableKey, questionType, questionId, displayType, colSpan: rawColSpan } = node.attrs as {
    label: string;
    variableKey: string;
    questionType: string;
    questionId: string;
    displayType: string;
    colSpan: number;
  };

  const colSpan = rawColSpan ?? 4;

  const { questions } = useQuestions();
  const question = questions.find(q => q.id === questionId);
  const allowRemarks = question?.allowRemarks === true;

  const [menuOpen, setMenuOpen] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [isInSelection, setIsInSelection] = useState(false);
  const [chipRect, setChipRect] = useState<DOMRect | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const menuRef = useRef<HTMLSpanElement>(null);
  const chipRef = useRef<HTMLSpanElement>(null);

  // Detect when this node falls inside the editor's text selection
  useEffect(() => {
    if (!editor) return;
    const update = () => {
      const pos = getPos();
      if (pos === undefined) return;
      const { from, to, empty } = editor.state.selection;
      setIsInSelection(!empty && pos >= from && pos + node.nodeSize <= to);
    };
    editor.on("selectionUpdate", update);
    editor.on("update", update);
    return () => {
      editor.off("selectionUpdate", update);
      editor.off("update", update);
    };
  }, [editor, getPos, node.nodeSize]);

  // Close dropdown on outside click
  useEffect(() => {
    if (!menuOpen) return;
    function handleDown(e: MouseEvent) {
      if (
        menuRef.current && !menuRef.current.contains(e.target as Node) &&
        chipRef.current && !chipRef.current.contains(e.target as Node)
      ) {
        setMenuOpen(false);
        setHovered(false);
      }
    }
    document.addEventListener("mousedown", handleDown);
    return () => document.removeEventListener("mousedown", handleDown);
  }, [menuOpen]);

  function switchDisplayType(type: string) {
    updateAttributes({ displayType: type });
    setMenuOpen(false);
  }

  function switchToBlock() {
    const pos = getPos();
    if (pos === undefined || !editor) return;
    setMenuOpen(false);
    editor.chain().focus().command(({ tr, state }) => {
      const $pos = state.doc.resolve(pos);
      const parentEnd = $pos.after($pos.depth);
      const blockNode = state.schema.nodes.questionVariableBlock?.create({
        questionId, variableKey, label, questionType, displayType: "question_answer_block",
      });
      if (!blockNode) return false;
      tr.delete(pos, pos + node.nodeSize);
      tr.insert(tr.mapping.map(parentEnd), blockNode);
      return true;
    }).run();
  }

  function onResizeMouseDown(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    const blockEl = chipRef.current;
    if (!blockEl) return;
    const blockLeft = blockEl.getBoundingClientRect().left;
    const totalWidth = blockEl.offsetWidth * (COLS / Math.max(1, colSpan));
    setIsDragging(true);
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
    function onMouseMove(ev: MouseEvent) {
      const next = Math.min(COLS, Math.max(MIN_COLS, Math.round(((ev.clientX - blockLeft) / totalWidth) * COLS)));
      updateAttributes({ colSpan: next });
    }
    function onMouseUp() {
      setIsDragging(false);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    }
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  }

  const showDot = hovered || menuOpen;
  const chipBg = isInSelection ? "#eff6ff" : "#f3f4f6";
  const chipBorder = isInSelection ? "#93c5fd" : "#e5e7eb";
  const chipColor = isInSelection ? "#1d4ed8" : "#374151";
  const dotBg = isInSelection ? "#dbeafe" : "#e5e7eb";

  const chipSuffix = displayType === "inline_remarks"
    ? " · remarks"
    : displayType === "inline_remarks_image"
      ? " · image"
      : "";

  if (displayType === "inline_remarks_image") {
    const widthPct = `${Math.round((colSpan / COLS) * 100)}%`;
    const showHandle = hovered || isDragging;
    return (
      <NodeViewWrapper
        as="span"
        contentEditable={false}
        style={{ display: "inline-block", width: widthPct, verticalAlign: "top", position: "relative", padding: "0 3px", boxSizing: "border-box" }}
      >
        <span
          ref={chipRef}
          className="block rounded-lg bg-white"
          style={{ border: `1px solid ${isDragging ? "#93c5fd" : hovered ? "#d1d5db" : "#e5e7eb"}`, transition: "border-color 0.1s" }}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => { if (!isDragging) setHovered(false); }}
        >
          <span className="flex items-center justify-between gap-2 px-3 pt-2 pb-1">
            <span className="text-xs font-semibold text-gray-700 truncate min-w-0">{label}</span>
            <span ref={menuRef} className="relative flex-shrink-0">
              <button
                className="flex items-center justify-center w-5 h-5 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-all"
                style={{ opacity: showHandle ? 1 : 0, pointerEvents: showHandle ? "auto" : "none" }}
                onMouseDown={(e) => { e.preventDefault(); setMenuOpen(o => !o); }}
                tabIndex={-1}
              >
                <MoreHorizontal size={11} />
              </button>
              {menuOpen && (
                <span className="absolute right-0 top-[calc(100%+4px)] z-50 bg-white border border-gray-200 rounded-lg shadow-lg py-0.5 w-40 flex flex-col">
                  <span className="px-2.5 py-1 text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Show</span>
                  <button className="flex items-center gap-2 px-2.5 py-1.5 hover:bg-gray-50 text-gray-700 text-left text-xs"
                    onMouseDown={(e) => { e.preventDefault(); switchDisplayType("inline_value"); }}>
                    <Type size={11} className="text-gray-400 flex-shrink-0" />Answer
                  </button>
                  {allowRemarks && (
                    <button className="flex items-center gap-2 px-2.5 py-1.5 hover:bg-gray-50 text-gray-700 text-left text-xs"
                      onMouseDown={(e) => { e.preventDefault(); switchDisplayType("inline_remarks"); }}>
                      <MessageSquare size={11} className="text-gray-400 flex-shrink-0" />Remarks
                    </button>
                  )}
                  {allowRemarks && (
                    <button className="flex items-center gap-2 px-2.5 py-1.5 hover:bg-gray-50 text-gray-700 text-left text-xs"
                      onMouseDown={(e) => { e.preventDefault(); switchDisplayType("inline_remarks_image"); }}>
                      <ImageIcon size={11} className="text-gray-400 flex-shrink-0" />Remarks Image
                      <span className="ml-auto text-gray-400 text-[10px]">✓</span>
                    </button>
                  )}
                  <span className="border-t border-gray-100 my-0.5" />
                  <span className="px-2.5 py-1 text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Layout</span>
                  <button className="flex items-center gap-2 px-2.5 py-1.5 hover:bg-gray-50 text-gray-700 text-left text-xs"
                    onMouseDown={(e) => { e.preventDefault(); switchToBlock(); }}>
                    <AlignJustify size={11} className="text-gray-400 flex-shrink-0" />Switch to Block
                  </button>
                  <span className="border-t border-gray-100 my-0.5" />
                  <button className="flex items-center gap-2 px-2.5 py-1.5 hover:bg-red-50 text-red-600 text-left text-xs"
                    onMouseDown={(e) => { e.preventDefault(); deleteNode(); }}>
                    <Trash2 size={11} />Delete
                  </button>
                </span>
              )}
            </span>
          </span>
          <span className="flex flex-col items-center justify-center gap-1 mx-3 mb-3 py-4 rounded-md border-2 border-dashed border-gray-200 bg-gray-50">
            <ImageIcon size={18} className="text-gray-300" />
            <span className="text-[10px] text-gray-300">Remarks image</span>
          </span>
        </span>
        <span
          onMouseDown={onResizeMouseDown}
          style={{
            position: "absolute", right: -7, top: 0, bottom: 0, width: 14,
            cursor: "col-resize", display: "flex", alignItems: "center", justifyContent: "center",
            opacity: showHandle ? 1 : 0, pointerEvents: showHandle ? "auto" : "none",
            zIndex: 20, transition: "opacity 0.1s",
          }}
        >
          <span style={{ width: 6, height: 36, borderRadius: 4, background: isDragging ? "#bfdbfe" : "#d1d5db", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <GripDots active={isDragging} />
          </span>
        </span>
      </NodeViewWrapper>
    );
  }

  return (
    <NodeViewWrapper as="span" className="inline-flex items-center" contentEditable={false}>
      {/*
        Chip — always visible box.
        The 3-dot is absolute inside here so it never adds width to the chip.
        We add paddingRight only when the dot is visible so the label text
        doesn't slide under the dot overlay.
      */}
      <span
        ref={chipRef}
        className="relative inline-flex items-center select-none cursor-default leading-snug"
        style={{
          fontSize: "inherit",
          padding: "0.05em 0.4em",
          borderRadius: 5,
          border: `1px solid ${chipBorder}`,
          background: chipBg,
          color: chipColor,
          maxWidth: "14rem",
        }}
        onMouseEnter={() => { setHovered(true); setChipRect(chipRef.current?.getBoundingClientRect() ?? null); }}
        onMouseLeave={() => { if (!menuOpen) { setHovered(false); setChipRect(null); } }}
      >
        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: "1 1 0", minWidth: 0 }}>
          {label}
        </span>
        {chipSuffix && <span style={{ opacity: 0.55, fontSize: "0.85em", flexShrink: 0 }}>{chipSuffix}</span>}

        {/* 3-dot: absolutely fills the right side of the chip, same height */}
        <span
          ref={menuRef}
          className="absolute inset-y-0 right-0 flex items-center justify-center transition-opacity"
          style={{
            width: "1.4em",
            opacity: showDot ? 1 : 0,
            pointerEvents: showDot ? "auto" : "none",
            background: dotBg,
            borderRadius: "0 4px 4px 0",
          }}
        >
          <button
            className="flex items-center justify-center w-full h-full text-gray-500 hover:text-gray-700"
            onMouseDown={(e) => { e.preventDefault(); setMenuOpen((o) => !o); }}
            onMouseEnter={() => setHovered(true)}
            tabIndex={-1}
          >
            <MoreHorizontal size={10} />
          </button>

          {menuOpen && (
            <span className="absolute left-0 top-[calc(100%+4px)] z-50 bg-white border border-gray-200 rounded-lg shadow-lg py-0.5 w-40 flex flex-col">
              <span className="px-2.5 py-1 text-[10px] font-semibold text-gray-400 uppercase tracking-wide">
                Show
              </span>
              <button
                className="flex items-center gap-2 px-2.5 py-1.5 hover:bg-gray-50 text-gray-700 text-left text-xs"
                onMouseDown={(e) => { e.preventDefault(); switchDisplayType("inline_value"); }}
              >
                <Type size={11} className="text-gray-400 flex-shrink-0" />
                Answer
                {(!displayType || displayType === "inline_value") && <span className="ml-auto text-gray-400 text-[10px]">✓</span>}
              </button>
              {allowRemarks && (
                <button
                  className="flex items-center gap-2 px-2.5 py-1.5 hover:bg-gray-50 text-gray-700 text-left text-xs"
                  onMouseDown={(e) => { e.preventDefault(); switchDisplayType("inline_remarks"); }}
                >
                  <MessageSquare size={11} className="text-gray-400 flex-shrink-0" />
                  Remarks
                  {displayType === "inline_remarks" && <span className="ml-auto text-gray-400 text-[10px]">✓</span>}
                </button>
              )}
              {allowRemarks && (
                <button
                  className="flex items-center gap-2 px-2.5 py-1.5 hover:bg-gray-50 text-gray-700 text-left text-xs"
                  onMouseDown={(e) => { e.preventDefault(); switchDisplayType("inline_remarks_image"); }}
                >
                  <ImageIcon size={11} className="text-gray-400 flex-shrink-0" />
                  Remarks Image
                  {displayType === "inline_remarks_image" && <span className="ml-auto text-gray-400 text-[10px]">✓</span>}
                </button>
              )}
              <span className="border-t border-gray-100 my-0.5" />
              <span className="px-2.5 py-1 text-[10px] font-semibold text-gray-400 uppercase tracking-wide">
                Layout
              </span>
              <button
                className="flex items-center gap-2 px-2.5 py-1.5 hover:bg-gray-50 text-gray-700 text-left text-xs"
                onMouseDown={(e) => { e.preventDefault(); switchToBlock(); }}
              >
                <AlignJustify size={11} className="text-gray-400 flex-shrink-0" />
                Switch to Block
              </button>
              <span className="border-t border-gray-100 my-0.5" />
              <button
                className="flex items-center gap-2 px-2.5 py-1.5 hover:bg-red-50 text-red-600 text-left text-xs"
                onMouseDown={(e) => { e.preventDefault(); deleteNode(); }}
              >
                <Trash2 size={11} />
                Delete
              </button>
            </span>
          )}
        </span>
      </span>

      {hovered && !menuOpen && chipRect && createPortal(
        <div
          style={{
            position: "fixed",
            top: chipRect.top - 8,
            left: chipRect.left + chipRect.width / 2,
            transform: "translate(-50%, -100%)",
            zIndex: 9999,
            pointerEvents: "none",
          }}
        >
          <div className="bg-gray-900 text-white text-[11px] rounded-lg px-2.5 py-1.5 whitespace-nowrap shadow-xl">
            {question?.blockName && (
              <div className="font-normal opacity-60 text-[10px] leading-none mb-1">{question.blockName}</div>
            )}
            <div className="font-medium leading-none">{label}</div>
          </div>
          <div
            className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0"
            style={{
              borderLeft: "4px solid transparent",
              borderRight: "4px solid transparent",
              borderTop: "4px solid #111827",
            }}
          />
        </div>,
        document.body
      )}
    </NodeViewWrapper>
  );
}
