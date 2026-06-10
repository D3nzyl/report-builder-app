"use client";

import { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import type { Editor } from "@tiptap/core";
import { NodeSelection } from "@tiptap/pm/state";
import {
  GripVertical, Plus,
  Heading1, Heading2, Heading3, Type,
  List, ListOrdered, Quote, Code2, Minus, Table as TableIcon,
} from "lucide-react";

type HandleState = {
  screenTop: number;
  screenLeft: number;
  nodePos: number;
};

const ADD_ITEMS = [
  { label: "Heading 1",     icon: <Heading1 size={13} />,     action: (e: Editor) => e.chain().focus().toggleHeading({ level: 1 }).run() },
  { label: "Heading 2",     icon: <Heading2 size={13} />,     action: (e: Editor) => e.chain().focus().toggleHeading({ level: 2 }).run() },
  { label: "Heading 3",     icon: <Heading3 size={13} />,     action: (e: Editor) => e.chain().focus().toggleHeading({ level: 3 }).run() },
  { label: "Paragraph",     icon: <Type size={13} />,         action: (e: Editor) => e.chain().focus().setParagraph().run() },
  { label: "Bullet List",   icon: <List size={13} />,         action: (e: Editor) => e.chain().focus().toggleBulletList().run() },
  { label: "Numbered List", icon: <ListOrdered size={13} />,  action: (e: Editor) => e.chain().focus().toggleOrderedList().run() },
  { label: "Quote",         icon: <Quote size={13} />,        action: (e: Editor) => e.chain().focus().toggleBlockquote().run() },
  { label: "Code Block",    icon: <Code2 size={13} />,        action: (e: Editor) => e.chain().focus().toggleCodeBlock().run() },
  { label: "Divider",       icon: <Minus size={13} />,        action: (e: Editor) => e.chain().focus().setHorizontalRule().run() },
  { label: "Table",         icon: <TableIcon size={13} />,    action: (e: Editor) => e.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run() },
];

export function BlockHandle({ editor }: { editor: Editor }) {
  const [handle, setHandle] = useState<HandleState | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const isDraggingRef = useRef(false);
  const handleRef = useRef<HandleState | null>(null);
  const addMenuRef = useRef<HTMLDivElement>(null);
  const frozenHandleRef = useRef<HandleState | null>(null);

  // Used to bridge the gap between editorEl and the portal div.
  // mouseleave on editorEl fires before mouseenter on portal, so we delay
  // the hide and cancel it if the mouse reaches the portal within 120ms.
  const mouseOnPortalRef = useRef(false);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function scheduleHide() {
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    hideTimerRef.current = setTimeout(() => {
      if (!mouseOnPortalRef.current) setHandle(null);
      hideTimerRef.current = null;
    }, 120);
  }

  function cancelHide() {
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
  }

  useEffect(() => {
    handleRef.current = handle;
  });

  useEffect(() => {
    const view = editor.view;
    const editorEl = view.dom;

    function resolveHandle(clientX: number, clientY: number): HandleState | null {
      const editorRect = editorEl.getBoundingClientRect();
      // posAtCoords returns null in the left padding zone (px-16 = 64px).
      // Clamp X to just inside the content area so we resolve a valid block.
      const effectiveX = clientX < editorRect.left + 65
        ? editorRect.left + 70
        : clientX;
      const pos = view.posAtCoords({ left: effectiveX, top: clientY });
      if (!pos) return null;

      const $pos = editor.state.doc.resolve(pos.pos);
      if ($pos.depth < 1) return null;

      const nodePos = $pos.before(1);
      const dom = view.nodeDOM(nodePos) as HTMLElement | null;
      if (!dom) return null;

      const rect = dom.getBoundingClientRect();
      return {
        screenTop: rect.top + rect.height / 2 - 12,
        screenLeft: rect.left - 56,
        nodePos,
      };
    }

    function onMouseMove(e: MouseEvent) {
      if (isDraggingRef.current || addOpen) return;
      cancelHide();
      const h = resolveHandle(e.clientX, e.clientY);
      setHandle(h);
    }

    function onMouseLeave() {
      if (isDraggingRef.current || addOpen) return;
      // Delay so mouseenter on portal can cancel this before it executes.
      scheduleHide();
    }

    editorEl.addEventListener("mousemove", onMouseMove);
    editorEl.addEventListener("mouseleave", onMouseLeave);
    return () => {
      editorEl.removeEventListener("mousemove", onMouseMove);
      editorEl.removeEventListener("mouseleave", onMouseLeave);
    };
  }, [editor, addOpen]);

  // Close add menu on outside click
  useEffect(() => {
    if (!addOpen) return;
    function onDown(e: MouseEvent) {
      if (addMenuRef.current && !addMenuRef.current.contains(e.target as Node)) {
        setAddOpen(false);
        setHandle(null);
      }
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [addOpen]);

  function onDragStart(e: React.DragEvent) {
    const h = handleRef.current;
    if (!h) return;
    const { view } = editor;
    const { state } = view;
    try {
      const selection = NodeSelection.create(state.doc, h.nodePos);
      view.dispatch(state.tr.setSelection(selection));
      const slice = selection.content();
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("text/plain", " ");
      view.dragging = { slice, move: true };
      isDraggingRef.current = true;
    } catch {
      // node not selectable
    }
  }

  function onDragEnd() {
    isDraggingRef.current = false;
    setHandle(null);
  }

  function openAddMenu(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    frozenHandleRef.current = handleRef.current;
    setAddOpen(true);
  }

  function runAddItem(action: (e: Editor) => void) {
    setAddOpen(false);
    setHandle(null);
    const h = frozenHandleRef.current;
    if (!h) { action(editor); return; }
    const { state } = editor;
    const node = state.doc.nodeAt(h.nodePos);
    if (!node) { action(editor); return; }
    const insertAt = h.nodePos + node.nodeSize;
    editor.chain()
      .focus()
      .insertContentAt(insertAt, { type: "paragraph" })
      .setTextSelection(insertAt + 1)
      .run();
    action(editor);
  }

  const visible = handle ?? (addOpen ? frozenHandleRef.current : null);
  if (!visible) return null;

  return createPortal(
    <div
      style={{ position: "fixed", top: visible.screenTop, left: visible.screenLeft, zIndex: 40 }}
      className="flex items-center gap-0.5"
      onMouseEnter={() => {
        mouseOnPortalRef.current = true;
        cancelHide();
      }}
      onMouseLeave={() => {
        mouseOnPortalRef.current = false;
        if (!isDraggingRef.current && !addOpen) setHandle(null);
      }}
    >
      {/* + button */}
      <div className="relative">
        <button
          title="Add block below"
          onMouseDown={openAddMenu}
          className="flex items-center justify-center w-6 h-6 rounded text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
        >
          <Plus size={14} />
        </button>

        {addOpen && (
          <div
            ref={addMenuRef}
            className="absolute left-7 top-0 bg-white border border-gray-200 rounded-xl shadow-xl py-1 w-56 z-50"
          >
            <div className="px-2.5 pb-0.5 pt-1">
              <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Blocks</span>
            </div>
            <div className="grid grid-cols-2 gap-0.5 px-1 pb-1">
              {ADD_ITEMS.map((b) => (
                <button
                  key={b.label}
                  className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-left text-xs text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors"
                  onMouseDown={(e) => { e.preventDefault(); runAddItem(b.action); }}
                >
                  <span className="flex items-center justify-center w-5 h-5 flex-shrink-0 text-gray-500">
                    {b.icon}
                  </span>
                  <span className="font-medium truncate">{b.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Drag grip */}
      <div
        draggable
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        title="Drag to reorder"
        className="flex items-center justify-center w-6 h-6 rounded text-gray-400 hover:text-gray-600 hover:bg-gray-100 cursor-grab active:cursor-grabbing transition-colors"
      >
        <GripVertical size={14} />
      </div>
    </div>,
    document.body
  );
}
