"use client";

import { NodeViewWrapper } from "@tiptap/react";
import type { NodeViewProps } from "@tiptap/react";
import { useState, useRef, useEffect } from "react";
import { MoreHorizontal, Trash2, AlignJustify, Type, MessageSquare, ImageIcon } from "lucide-react";
import { useQuestions } from "@/lib/questionContext";
import { createPortal } from "react-dom";

export function VariableInlineView({ node, editor, getPos, deleteNode, updateAttributes }: NodeViewProps) {
  const { label, variableKey, questionType, questionId, displayType } = node.attrs as {
    label: string;
    variableKey: string;
    questionType: string;
    questionId: string;
    displayType: string;
  };

  const { questions } = useQuestions();
  const question = questions.find(q => q.id === questionId);
  const allowRemarks = question?.allowRemarks === true;

  const [menuOpen, setMenuOpen] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [isInSelection, setIsInSelection] = useState(false);
  const [chipRect, setChipRect] = useState<DOMRect | null>(null);
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
          <div className="bg-gray-900 text-white text-[11px] font-medium rounded-lg px-2.5 py-1.5 whitespace-nowrap shadow-xl leading-none">
            {label}
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
