"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useEditor, EditorContent } from "@tiptap/react";
import { BubbleMenu } from "@tiptap/react/menus";
import { BlockHandle } from "./BlockHandle";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Image from "@tiptap/extension-image";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableCell } from "@tiptap/extension-table-cell";
import { TableHeader } from "@tiptap/extension-table-header";
import HorizontalRule from "@tiptap/extension-horizontal-rule";
import TextAlign from "@tiptap/extension-text-align";
import Underline from "@tiptap/extension-underline";
import Highlight from "@tiptap/extension-highlight";
import { QuestionVariableInlineNode } from "./QuestionVariableInlineNode";
import { QuestionVariableBlockNode } from "./QuestionVariableBlockNode";
import { CollectionBlockNode } from "./CollectionBlockNode";
import { RowRepeatBlockNode } from "./RowRepeatBlockNode";
import { DataRowBlockNode } from "./DataRowBlockNode";
import { ReportPreview } from "@/components/preview/ReportPreview";
import { generateReportMarkdown } from "@/lib/reportGenerator";
import { generateReportHtml } from "@/lib/reportHtmlGenerator";
import { downloadMarkdown, exportPdfFromHtml } from "@/lib/exportUtils";
import { sampleAnswers, sampleQuestions } from "@/lib/sampleData";
import { sampleCollections, executeQuery } from "@/lib/collectionData";
import type { Collection } from "@/lib/types";
import { QuestionsContext } from "@/lib/questionContext";
import type { JSONContent, Editor } from "@tiptap/core";
import type { FormQuestion, FormAnswers, QuestionType, SubField } from "@/lib/types";
import {
  Bold, Italic, Underline as UnderlineIcon, Strikethrough,
  Heading1, Heading2, Heading3,
  List, ListOrdered, Quote,
  Minus, Type, AlignJustify, Calendar, Hash, CheckSquare,
  List as ListIcon, Image as ImageIcon,
  Eye, FileDown, FileText, Loader2,
  Table as TableIcon, Code2, Pencil, Check, X, AlertCircle,
  Rows3, Columns, Plus, FileText as PageIcon, AlignLeft,
} from "lucide-react";

// ─── A4 constants ─────────────────────────────────────────────────────────────
const A4_W = 794;
const A4_H = 1122;
// Trigger a new page ~28px before the hard overflow boundary
const OVERFLOW_TRIGGER = A4_H - 28;

// ─── Initial template content ──────────────────────────────────────────────
const INITIAL_CONTENT: JSONContent = {
  type: "doc",
  content: [
    {
      type: "heading",
      attrs: { level: 1 },
      content: [{ type: "text", text: "Inspection Report" }],
    },
    {
      type: "paragraph",
      content: [
        { type: "text", text: "This inspection was conducted at " },
        {
          type: "questionVariableInline",
          attrs: {
            questionId: "q_project_name",
            variableKey: "project_name",
            label: "Project Name",
            questionType: "short_text",
            displayType: "inline_value",
          },
        },
        { type: "text", text: " on " },
        {
          type: "questionVariableInline",
          attrs: {
            questionId: "q_inspection_date",
            variableKey: "inspection_date",
            label: "Inspection Date",
            questionType: "date",
            displayType: "inline_value",
          },
        },
        { type: "text", text: "." },
      ],
    },
    {
      type: "questionVariableBlock",
      attrs: {
        questionId: "q_safety_remarks",
        variableKey: "safety_remarks",
        label: "Safety Remarks",
        questionType: "long_text",
        displayType: "question_answer_block",
      },
    },
    {
      type: "questionVariableBlock",
      attrs: {
        questionId: "q_ppe_items",
        variableKey: "ppe_items",
        label: "PPE Items Observed",
        questionType: "multi_select",
        displayType: "question_answer_block",
      },
    },
    {
      type: "questionVariableBlock",
      attrs: {
        questionId: "q_photo_evidence",
        variableKey: "photo_evidence",
        label: "Photo Evidence",
        questionType: "image_upload",
        displayType: "question_answer_block",
      },
    },
  ],
};

// ─── Slash command items ────────────────────────────────────────────────────
type SlashItem = {
  id: string;
  label: string;
  description: string;
  keywords: string[];
  icon: React.ReactNode;
  action: (editor: Editor) => void;
};

const SLASH_ITEMS: SlashItem[] = [
  {
    id: "h1", label: "Heading 1", description: "Big section heading",
    keywords: ["h1", "heading", "heading1", "title"],
    icon: <Heading1 size={16} />,
    action: (e) => e.chain().focus().toggleHeading({ level: 1 }).run(),
  },
  {
    id: "h2", label: "Heading 2", description: "Medium section heading",
    keywords: ["h2", "heading", "heading2", "subtitle"],
    icon: <Heading2 size={16} />,
    action: (e) => e.chain().focus().toggleHeading({ level: 2 }).run(),
  },
  {
    id: "h3", label: "Heading 3", description: "Small section heading",
    keywords: ["h3", "heading", "heading3"],
    icon: <Heading3 size={16} />,
    action: (e) => e.chain().focus().toggleHeading({ level: 3 }).run(),
  },
  {
    id: "p", label: "Paragraph", description: "Plain text block",
    keywords: ["p", "text", "paragraph", "plain"],
    icon: <Type size={16} />,
    action: (e) => e.chain().focus().setParagraph().run(),
  },
  {
    id: "bullet", label: "Bullet List", description: "Unordered list",
    keywords: ["bullet", "list", "ul", "unordered"],
    icon: <List size={16} />,
    action: (e) => e.chain().focus().toggleBulletList().run(),
  },
  {
    id: "ordered", label: "Numbered List", description: "Ordered list",
    keywords: ["ordered", "numbered", "ol", "list", "number"],
    icon: <ListOrdered size={16} />,
    action: (e) => e.chain().focus().toggleOrderedList().run(),
  },
  {
    id: "quote", label: "Quote", description: "Blockquote",
    keywords: ["quote", "blockquote", "callout"],
    icon: <Quote size={16} />,
    action: (e) => e.chain().focus().toggleBlockquote().run(),
  },
  {
    id: "code", label: "Code Block", description: "Monospace code block",
    keywords: ["code", "codeblock", "pre", "snippet"],
    icon: <Code2 size={16} />,
    action: (e) => e.chain().focus().toggleCodeBlock().run(),
  },
  {
    id: "divider", label: "Divider", description: "Horizontal separator",
    keywords: ["divider", "hr", "rule", "separator", "line"],
    icon: <Minus size={16} />,
    action: (e) => e.chain().focus().setHorizontalRule().run(),
  },
  {
    id: "table", label: "Table", description: "3×3 table",
    keywords: ["table", "grid", "spreadsheet"],
    icon: <TableIcon size={16} />,
    action: (e) => e.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run(),
  },
];

// ─── @ Mention Menu ──────────────────────────────────────────────────────────
type AtTab = "form" | "approval" | "collections";

function AtMentionMenu({
  questions, collections, query, selected, activeTab, onTabChange, onSelect, onSelectCollection, top, left, flipUp,
}: {
  questions: FormQuestion[];
  collections: Collection[];
  query: string;
  selected: number;
  activeTab: AtTab;
  onTabChange: (tab: AtTab) => void;
  onSelect: (q: FormQuestion) => void;
  onSelectCollection: (c: Collection, mode: "table" | "cards") => void;
  top: number;
  left: number;
  flipUp: boolean;
}) {
  const selectedRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    selectedRef.current?.scrollIntoView({ block: "nearest" });
  }, [selected]);

  const filteredQuestions = questions.filter(q => {
    const cat = q.category ?? "form";
    if (cat !== activeTab) return false;
    if (!query) return true;
    return q.label.toLowerCase().includes(query.toLowerCase())
      || q.variableKey.toLowerCase().includes(query.toLowerCase());
  });

  const filteredCollections = collections.filter(c => {
    if (activeTab !== "collections") return false;
    if (!query) return true;
    return c.name.toLowerCase().includes(query.toLowerCase())
      || c.variableKey.toLowerCase().includes(query.toLowerCase());
  });

  const tabs: { key: AtTab; label: string }[] = [
    { key: "form", label: "Form" },
    { key: "approval", label: "Approval" },
    { key: "collections", label: "Collections" },
  ];

  return (
    <div
      className="fixed z-[100] bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden w-64"
      style={{ top, left, transform: flipUp ? "translateY(-100%)" : undefined }}
    >
      <div className="flex items-center border-b border-gray-100 px-1 pt-1">
        {tabs.map(t => (
          <button
            key={t.key}
            onMouseDown={e => { e.preventDefault(); onTabChange(t.key); }}
            className={`px-3 py-1.5 text-xs font-semibold transition-colors border-b-2 ${
              activeTab === t.key
                ? "text-blue-600 border-blue-500"
                : "text-gray-400 border-transparent hover:text-gray-600"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div className="py-1 max-h-60 overflow-y-auto">
        {activeTab === "collections" ? (
          filteredCollections.length === 0 ? (
            <div className="px-4 py-3 text-xs text-gray-400 text-center">No matching collections</div>
          ) : (
            filteredCollections.map((c, i) => (
              <div
                key={c.id}
                ref={i === selected ? (selectedRef as React.Ref<HTMLDivElement>) : null}
                className={`flex items-center gap-2 w-full px-3 py-2 transition-colors ${
                  i === selected ? "bg-violet-50" : "hover:bg-gray-50"
                }`}
              >
                {/* Main area → insert as table */}
                <button
                  className="flex items-center gap-2 flex-1 min-w-0 text-left"
                  onMouseDown={e => { e.preventDefault(); onSelectCollection(c, "table"); }}
                >
                  <span className={`flex items-center justify-center w-6 h-6 rounded flex-shrink-0 ${
                    i === selected ? "bg-violet-100 text-violet-600" : "bg-gray-100 text-gray-500"
                  }`}>
                    <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                      <rect x="0.5" y="0.5" width="10" height="10" rx="1.5" stroke="currentColor" strokeWidth="1"/>
                      <line x1="0.5" y1="3.5" x2="10.5" y2="3.5" stroke="currentColor" strokeWidth="0.8"/>
                      <line x1="3.5" y1="3.5" x2="3.5" y2="10.5" stroke="currentColor" strokeWidth="0.8"/>
                    </svg>
                  </span>
                  <span className="min-w-0 flex-1">
                    <div className={`text-sm font-medium leading-tight truncate ${
                      i === selected ? "text-violet-700" : "text-gray-800"
                    }`}>{c.name}</div>
                    <div className="text-[10px] text-gray-400 font-mono truncate">{c.variableKey} · {c.columns.length} cols · {c.rows.length} rows</div>
                  </span>
                </button>

                {/* Insert mode buttons */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    title="Insert as table"
                    onMouseDown={e => { e.preventDefault(); onSelectCollection(c, "table"); }}
                    className="flex items-center gap-1 px-1.5 py-1 rounded text-[10px] text-gray-400 hover:bg-violet-100 hover:text-violet-600 transition-colors"
                  >
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                      <rect x="0.5" y="0.5" width="9" height="9" rx="1" stroke="currentColor" strokeWidth="0.9"/>
                      <line x1="0.5" y1="3.5" x2="9.5" y2="3.5" stroke="currentColor" strokeWidth="0.8"/>
                      <line x1="3.5" y1="3.5" x2="3.5" y2="9.5" stroke="currentColor" strokeWidth="0.8"/>
                    </svg>
                    Table
                  </button>
                  <button
                    title="Insert as blocks — one per row"
                    onMouseDown={e => { e.preventDefault(); onSelectCollection(c, "cards"); }}
                    className="flex items-center gap-1 px-1.5 py-1 rounded text-[10px] text-gray-400 hover:bg-indigo-100 hover:text-indigo-600 transition-colors"
                  >
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                      <rect x="0.5" y="0.5" width="9" height="2.2" rx="0.8" stroke="currentColor" strokeWidth="0.9"/>
                      <rect x="0.5" y="3.9" width="9" height="2.2" rx="0.8" stroke="currentColor" strokeWidth="0.9"/>
                      <rect x="0.5" y="7.3" width="9" height="2.2" rx="0.8" stroke="currentColor" strokeWidth="0.9"/>
                    </svg>
                    Blocks
                  </button>
                </div>
              </div>
            ))
          )
        ) : (
          filteredQuestions.length === 0 ? (
            <div className="px-4 py-3 text-xs text-gray-400 text-center">No matching variables</div>
          ) : (
            filteredQuestions.map((q, i) => (
              <button
                key={q.id}
                ref={i === selected ? selectedRef : null}
                className={`flex items-center gap-2.5 w-full px-3 py-2 text-left transition-colors ${
                  i === selected ? "bg-blue-50" : "hover:bg-gray-50"
                }`}
                onMouseDown={e => { e.preventDefault(); onSelect(q); }}
              >
                <span className={`flex items-center justify-center w-6 h-6 rounded flex-shrink-0 text-gray-500 ${
                  i === selected ? "bg-blue-100 text-blue-600" : "bg-gray-100"
                }`}>
                  {q.type === "approval" ? <Check size={11} /> : typeIcons[q.type]}
                </span>
                <span className="min-w-0 flex-1">
                  <div className={`text-sm font-medium leading-tight truncate ${
                    i === selected ? "text-blue-700" : "text-gray-800"
                  }`}>{q.label}</div>
                </span>
              </button>
            ))
          )
        )}
      </div>
    </div>
  );
}

// ─── Slash Command Menu ──────────────────────────────────────────────────────
function SlashCommandMenu({
  items, selected, onSelect, top, left, flipUp,
}: {
  items: SlashItem[];
  selected: number;
  onSelect: (item: SlashItem) => void;
  top: number;
  left: number;
  flipUp: boolean;
}) {
  const selectedRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    selectedRef.current?.scrollIntoView({ block: "nearest" });
  }, [selected]);

  if (items.length === 0) return null;

  return (
    <div
      className="fixed z-[100] bg-white border border-gray-200 rounded-xl shadow-xl py-1 w-56 max-h-72 overflow-y-auto"
      style={{ top, left, transform: flipUp ? "translateY(-100%)" : undefined }}
    >
      <div className="px-2.5 pb-0.5 pt-1">
        <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Blocks</span>
      </div>
      <div className="grid grid-cols-2 gap-0.5 px-1 pb-1">
        {items.map((item, i) => (
          <button
            key={item.id}
            ref={i === selected ? selectedRef : null}
            className={`flex items-center gap-2 px-2 py-1.5 rounded-lg text-left transition-colors text-xs ${
              i === selected ? "bg-gray-100 text-gray-900" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            }`}
            onMouseDown={(e) => { e.preventDefault(); onSelect(item); }}
          >
            <span className="flex items-center justify-center w-5 h-5 flex-shrink-0 text-gray-500">
              {item.icon}
            </span>
            <span className="font-medium truncate">{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Type icons / labels ─────────────────────────────────────────────────────
const typeIcons: Record<QuestionType, React.ReactNode> = {
  short_text:    <Type size={11} />,
  long_text:     <AlignJustify size={11} />,
  number:        <Hash size={11} />,
  radio:         <CheckSquare size={11} />,
  rating:        <CheckSquare size={11} />,
  toggle:        <CheckSquare size={11} />,
  single_select: <CheckSquare size={11} />,
  multi_select:  <ListIcon size={11} />,
  slider:        <ListIcon size={11} />,
  date:          <Calendar size={11} />,
  datetime:      <Calendar size={11} />,
  file_upload:   <ImageIcon size={11} />,
  signature:     <ImageIcon size={11} />,
  sketch:        <ImageIcon size={11} />,
  location:      <ImageIcon size={11} />,
  image_upload:  <ImageIcon size={11} />,
  approval:      <Check size={11} />,
};

const TYPE_OPTIONS: { value: QuestionType; label: string }[] = [
  { value: "short_text",    label: "Text" },
  { value: "long_text",     label: "Long text" },
  { value: "number",        label: "Number" },
  { value: "date",          label: "Date / time" },
  { value: "single_select", label: "Single select" },
  { value: "multi_select",  label: "Multi select" },
  { value: "toggle",        label: "Toggle" },
  { value: "rating",        label: "Rating" },
  { value: "slider",        label: "Slider" },
  { value: "image_upload",  label: "Image upload" },
  { value: "file_upload",   label: "File upload" },
  { value: "signature",     label: "Signature" },
  { value: "sketch",        label: "Sketch" },
  { value: "location",      label: "Location" },
];

const SF_TYPE_OPTIONS: { value: QuestionType; label: string }[] = TYPE_OPTIONS;

// ─── Question Card ───────────────────────────────────────────────────────────
function QuestionCard({
  question, answers, onAnswerChange, onAliasChange, onUpdateQuestion,
}: {
  question: FormQuestion;
  answers: FormAnswers;
  onAnswerChange: (key: string, value: string | string[]) => void;
  onAliasChange: (id: string, alias: string) => void;
  onUpdateQuestion: (id: string, updates: Partial<FormQuestion>) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [editingAlias, setEditingAlias] = useState(false);
  const [aliasDraft, setAliasDraft] = useState(question.alias ?? "");
  const [addingSubField, setAddingSubField] = useState(false);
  const [newSfLabel, setNewSfLabel] = useState("");
  const [newSfType, setNewSfType] = useState<QuestionType>("short_text");
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  const currentValue = answers[question.variableKey];
  const displayValue = Array.isArray(currentValue) ? currentValue.join(", ") : (currentValue ?? "");

  function startEdit() {
    setDraft(displayValue);
    setEditing(true);
    setTimeout(() => inputRef.current?.focus(), 0);
  }

  function commitEdit() {
    const trimmed = draft.trim();
    if (question.type === "multi_select") {
      onAnswerChange(question.variableKey, trimmed ? trimmed.split(",").map(s => s.trim()).filter(Boolean) : []);
    } else {
      onAnswerChange(question.variableKey, trimmed);
    }
    setEditing(false);
  }

  function cancelEdit() { setEditing(false); setDraft(""); }

  function commitAlias() {
    onAliasChange(question.id, aliasDraft.trim());
    setEditingAlias(false);
  }

  function toggleMultiResponse() {
    onUpdateQuestion(question.id, { multiResponse: !question.multiResponse });
  }

  function toggleMultiField() {
    onUpdateQuestion(question.id, { multiField: !question.multiField });
  }

  function addSubField() {
    const trimmed = newSfLabel.trim();
    if (!trimmed) return;
    const sfId = `sf_${Date.now()}`;
    const sfKey = trimmed.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
    const newSf: SubField = { id: sfId, label: trimmed, variableKey: sfKey, type: newSfType };
    onUpdateQuestion(question.id, {
      subFields: [...(question.subFields ?? []), newSf],
    });
    setNewSfLabel("");
    setNewSfType("short_text");
    setAddingSubField(false);
  }

  function removeSubField(sfId: string) {
    onUpdateQuestion(question.id, {
      subFields: (question.subFields ?? []).filter(sf => sf.id !== sfId),
    });
  }

  function toggleSubFieldMultiResponse(sfId: string) {
    onUpdateQuestion(question.id, {
      subFields: (question.subFields ?? []).map(sf =>
        sf.id === sfId ? { ...sf, multiResponse: !sf.multiResponse } : sf
      ),
    });
  }

  const chipLabel = question.alias || question.label;
  const isLongText = question.type === "long_text";

  return (
    <div className="border border-gray-100 rounded-lg px-3 py-2.5 hover:border-gray-200 transition-colors bg-white">
      <div className="flex items-center gap-1.5 mb-2">
        {editingAlias ? (
          <div className="flex flex-1 gap-1">
            <input
              type="text"
              value={aliasDraft}
              onChange={e => setAliasDraft(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") commitAlias(); if (e.key === "Escape") setEditingAlias(false); }}
              placeholder={question.label}
              autoFocus
              className="flex-1 text-sm font-semibold border border-blue-300 rounded px-1.5 py-0.5 focus:outline-none focus:ring-1 focus:ring-blue-400 bg-transparent"
            />
            <button onClick={commitAlias} className="text-xs px-1.5 py-0.5 rounded bg-gray-900 text-white hover:bg-gray-700 flex-shrink-0">
              <Check size={9} />
            </button>
          </div>
        ) : (
          <button
            onClick={() => { setAliasDraft(question.alias ?? ""); setEditingAlias(true); }}
            className="group flex-1 flex items-center gap-1 text-left rounded px-1 py-0.5 hover:bg-gray-50 transition-colors min-w-0"
          >
            <span className="text-sm font-semibold text-gray-900 flex-1 truncate">{chipLabel}</span>
            <Pencil size={9} className="flex-shrink-0 text-gray-300 group-hover:text-gray-500 transition-colors" />
          </button>
        )}
        <span
          title={question.type}
          className="flex items-center justify-center w-5 h-5 rounded text-gray-400 hover:text-gray-600 hover:bg-gray-100 flex-shrink-0 cursor-help transition-colors"
        >
          {typeIcons[question.type]}
        </span>
      </div>

      {!question.multiField && (
        <div className="mb-2">
          {editing ? (
            <div className="flex flex-col gap-1">
              {isLongText ? (
                <textarea
                  ref={inputRef as React.RefObject<HTMLTextAreaElement>}
                  value={draft}
                  onChange={e => setDraft(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); commitEdit(); } if (e.key === "Escape") cancelEdit(); }}
                  rows={3}
                  className="w-full text-xs border border-blue-300 rounded-md px-2 py-1.5 resize-none focus:outline-none focus:ring-1 focus:ring-blue-400"
                  placeholder="Enter value…"
                />
              ) : (
                <input
                  ref={inputRef as React.RefObject<HTMLInputElement>}
                  type="text"
                  value={draft}
                  onChange={e => setDraft(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") commitEdit(); if (e.key === "Escape") cancelEdit(); }}
                  className="w-full text-xs border border-blue-300 rounded-md px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-400"
                  placeholder={question.type === "multi_select" ? "item1, item2, item3" : "Enter value…"}
                />
              )}
              <div className="flex gap-1">
                <button onClick={commitEdit} className="flex items-center gap-1 text-xs px-2 py-0.5 rounded bg-gray-900 text-white hover:bg-gray-700">
                  <Check size={10} /> Save
                </button>
                <button onClick={cancelEdit} className="flex items-center gap-1 text-xs px-2 py-0.5 rounded border border-gray-200 text-gray-600 hover:bg-gray-50">
                  <X size={10} /> Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={startEdit}
              className="group w-full flex items-start gap-1.5 text-left rounded px-2 py-1 bg-gray-50 hover:bg-gray-100 border border-transparent transition-colors"
            >
              <span className="text-xs text-gray-600 flex-1 min-w-0 break-words leading-relaxed">
                {displayValue || <span className="text-gray-400 italic">No value</span>}
              </span>
              <Pencil size={9} className="flex-shrink-0 mt-0.5 text-gray-300 group-hover:text-gray-500 transition-colors" />
            </button>
          )}
        </div>
      )}

      {question.multiField && (
        <div className="mb-2 px-2 py-1 rounded bg-purple-50 border border-purple-100 text-[10px] text-purple-500">
          Value defined by sub-fields
        </div>
      )}

      <div className="flex items-center gap-1.5 pt-2 border-t border-gray-100">
        <button
          onClick={toggleMultiResponse}
          title="Allow multiple responses to this question"
          className={`flex-1 flex items-center justify-center gap-1 text-[10px] py-1 rounded border transition-colors ${
            question.multiResponse
              ? "bg-blue-50 border-blue-300 text-blue-700 font-medium"
              : "border-gray-200 text-gray-400 hover:border-gray-300 hover:text-gray-600"
          }`}
        >
          <Rows3 size={9} />
          Multi Response
        </button>
        <button
          onClick={toggleMultiField}
          title="Add sub-questions within this question"
          className={`flex-1 flex items-center justify-center gap-1 text-[10px] py-1 rounded border transition-colors ${
            question.multiField
              ? "bg-purple-50 border-purple-300 text-purple-700 font-medium"
              : "border-gray-200 text-gray-400 hover:border-gray-300 hover:text-gray-600"
          }`}
        >
          <Columns size={9} />
          Multi Field
        </button>
      </div>

      {question.multiField && (
        <div className="mt-2 pt-2 border-t border-dashed border-gray-100">
          <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1.5">
            Sub-fields
          </div>

          {(question.subFields ?? []).length === 0 && !addingSubField && (
            <div className="text-[10px] text-gray-400 text-center py-1.5 rounded border border-dashed border-gray-200 mb-1.5">
              No sub-fields yet
            </div>
          )}

          {(question.subFields ?? []).map(sf => (
            <div key={sf.id} className="flex items-center gap-1 mb-1 group rounded px-1 py-0.5 hover:bg-gray-50">
              <span className="flex-1 text-xs text-gray-700 truncate min-w-0">{sf.label}</span>
              <span className="text-[9px] text-gray-400 flex-shrink-0 font-mono">{sf.type.replace("_", " ")}</span>
              <button
                onClick={() => toggleSubFieldMultiResponse(sf.id)}
                title={sf.multiResponse ? "Multi Response: on (click to disable)" : "Enable Multi Response"}
                className={`flex-shrink-0 flex items-center gap-0.5 text-[9px] px-1 py-0.5 rounded transition-colors ${
                  sf.multiResponse
                    ? "bg-blue-50 border border-blue-200 text-blue-600"
                    : "text-gray-300 hover:text-gray-500"
                }`}
              >
                <Rows3 size={8} />
              </button>
              <button
                onClick={() => removeSubField(sf.id)}
                className="flex-shrink-0 w-3.5 h-3.5 flex items-center justify-center text-gray-300 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
              >
                <X size={9} />
              </button>
            </div>
          ))}

          {addingSubField ? (
            <div className="flex flex-col gap-1 mt-1">
              <input
                type="text"
                value={newSfLabel}
                onChange={e => setNewSfLabel(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") addSubField(); if (e.key === "Escape") setAddingSubField(false); }}
                placeholder="Sub-field label"
                autoFocus
                className="w-full text-xs border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-purple-400"
              />
              <select
                value={newSfType}
                onChange={e => setNewSfType(e.target.value as QuestionType)}
                className="w-full text-xs border border-gray-300 rounded px-2 py-1 bg-white focus:outline-none focus:ring-1 focus:ring-purple-400"
              >
                {SF_TYPE_OPTIONS.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
              <div className="flex gap-1">
                <button
                  onClick={addSubField}
                  disabled={!newSfLabel.trim()}
                  className="flex-1 flex items-center justify-center gap-1 text-xs py-0.5 rounded bg-gray-900 text-white hover:bg-gray-700 disabled:opacity-40"
                >
                  <Check size={9} /> Add
                </button>
                <button
                  onClick={() => setAddingSubField(false)}
                  className="text-xs px-2 py-0.5 rounded border border-gray-200 text-gray-500 hover:bg-gray-50"
                >
                  <X size={9} />
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setAddingSubField(true)}
              className="w-full flex items-center justify-center gap-1 text-[10px] py-1 rounded border border-dashed border-purple-200 text-purple-500 hover:border-purple-300 hover:text-purple-700 transition-colors mt-1"
            >
              <Plus size={9} /> Add sub-field
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Variable Tray ───────────────────────────────────────────────────────────
function VariableTray({
  questions, answers, onAnswerChange, onAliasChange, onAddQuestion, onUpdateQuestion, onCollapse,
}: {
  questions: FormQuestion[];
  answers: FormAnswers;
  onAnswerChange: (key: string, value: string | string[]) => void;
  onAliasChange: (id: string, alias: string) => void;
  onAddQuestion: (label: string, type: QuestionType) => void;
  onUpdateQuestion: (id: string, updates: Partial<FormQuestion>) => void;
  onCollapse: () => void;
}) {
  const [adding, setAdding] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [newType, setNewType] = useState<QuestionType>("short_text");

  function submitNew() {
    const trimmed = newLabel.trim();
    if (!trimmed) return;
    onAddQuestion(trimmed, newType);
    setNewLabel("");
    setNewType("short_text");
    setAdding(false);
  }

  return (
    <aside className="w-64 flex-shrink-0 bg-white border-l border-gray-200 flex flex-col">
      <div className="px-3 py-2.5 border-b border-gray-200 flex items-center justify-between">
        <div>
          <h2 className="font-semibold text-xs text-gray-800">Variables</h2>
          <p className="text-[10px] text-gray-400 mt-0.5">@ to insert · click value to edit</p>
        </div>
        <button
          onClick={onCollapse}
          title="Collapse"
          className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded hover:bg-gray-100"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M9 3L12 6L9 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M3 3L0 6L3 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-2.5 space-y-1.5">
        {questions.map((q) => (
          <QuestionCard
            key={q.id}
            question={q}
            answers={answers}
            onAnswerChange={onAnswerChange}
            onAliasChange={onAliasChange}
            onUpdateQuestion={onUpdateQuestion}
          />
        ))}
      </div>

      <div className="border-t border-gray-100 p-2.5">
        {adding ? (
          <div className="flex flex-col gap-1.5">
            <input
              type="text"
              value={newLabel}
              onChange={e => setNewLabel(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") submitNew(); if (e.key === "Escape") setAdding(false); }}
              placeholder="Question label"
              autoFocus
              className="w-full text-xs border border-gray-300 rounded-md px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-400"
            />
            <select
              value={newType}
              onChange={e => setNewType(e.target.value as QuestionType)}
              className="w-full text-xs border border-gray-300 rounded-md px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-400 bg-white"
            >
              {TYPE_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            <div className="flex gap-1">
              <button
                onClick={submitNew}
                disabled={!newLabel.trim()}
                className="flex-1 flex items-center justify-center gap-1 text-xs py-1 rounded bg-gray-900 text-white hover:bg-gray-700 disabled:opacity-40 transition-colors"
              >
                <Check size={10} /> Add
              </button>
              <button
                onClick={() => setAdding(false)}
                className="text-xs px-2 py-1 rounded border border-gray-200 text-gray-500 hover:bg-gray-50"
              >
                <X size={10} />
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setAdding(true)}
            className="w-full flex items-center justify-center gap-1.5 text-xs py-1.5 rounded-lg border border-dashed border-gray-300 text-gray-500 hover:border-gray-400 hover:text-gray-700 transition-colors"
          >
            + Add variable
          </button>
        )}
      </div>

      <div className="px-3 py-1.5 border-t border-gray-100 text-[10px] text-gray-400 text-center">
        {questions.length} variable{questions.length !== 1 ? "s" : ""}
      </div>
    </aside>
  );
}

// ─── Bubble toolbar button ───────────────────────────────────────────────────
function BBtn({
  onClick, active = false, title, children,
}: {
  onClick: () => void; active?: boolean; title: string; children: React.ReactNode;
}) {
  return (
    <button
      type="button" title={title} onClick={onClick}
      className={`flex items-center justify-center w-7 h-7 rounded text-sm transition-colors
        ${active ? "bg-gray-100 text-gray-900" : "text-gray-500 hover:bg-gray-100 hover:text-gray-800"}`}
    >
      {children}
    </button>
  );
}

function BDivider() { return <div className="w-px h-4 bg-gray-200 mx-0.5" />; }

// ─── Shared bubble menu content ───────────────────────────────────────────────
function BubbleToolbar({ editor }: { editor: Editor }) {
  return (
    <div className="flex items-center gap-0.5 bg-white rounded-lg px-1.5 py-1 shadow-lg border border-gray-200">
      <BBtn title="Bold" active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()}><Bold size={14} /></BBtn>
      <BBtn title="Italic" active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()}><Italic size={14} /></BBtn>
      <BBtn title="Underline" active={editor.isActive("underline")} onClick={() => editor.chain().focus().toggleUnderline().run()}><UnderlineIcon size={14} /></BBtn>
      <BBtn title="Strikethrough" active={editor.isActive("strike")} onClick={() => editor.chain().focus().toggleStrike().run()}><Strikethrough size={14} /></BBtn>
      <BDivider />
      <BBtn title="Heading 1" active={editor.isActive("heading", { level: 1 })} onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}><Heading1 size={14} /></BBtn>
      <BBtn title="Heading 2" active={editor.isActive("heading", { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}><Heading2 size={14} /></BBtn>
      <BBtn title="Heading 3" active={editor.isActive("heading", { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}><Heading3 size={14} /></BBtn>
      <BDivider />
      <BBtn title="Bullet List" active={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()}><List size={14} /></BBtn>
      <BBtn title="Numbered List" active={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()}><ListOrdered size={14} /></BBtn>
      <BBtn title="Quote" active={editor.isActive("blockquote")} onClick={() => editor.chain().focus().toggleBlockquote().run()}><Quote size={14} /></BBtn>
      <BBtn title="Code" active={editor.isActive("code")} onClick={() => editor.chain().focus().toggleCode().run()}><Code2 size={14} /></BBtn>
    </div>
  );
}

// ─── Smart menu positioning ───────────────────────────────────────────────────
function menuPos(
  coords: { top: number; bottom: number; left: number },
  menuH: number,
  menuW: number,
) {
  const spaceBelow = window.innerHeight - coords.bottom - 8;
  const left = Math.min(Math.max(8, coords.left - 8), window.innerWidth - menuW - 8);
  if (spaceBelow >= menuH) {
    return { top: coords.bottom + 6, left, flipUp: false };
  }
  return { top: coords.top - 6, left, flipUp: true };
}

// ─── Shared TipTap extensions ─────────────────────────────────────────────────
function makeExtensions() {
  return [
    StarterKit.configure({ horizontalRule: false, heading: { levels: [1, 2, 3] } }),
    Placeholder.configure({ placeholder: "Type '/' for commands, or start writing…" }),
    Image,
    Table.configure({ resizable: true }),
    TableRow,
    TableCell,
    TableHeader,
    HorizontalRule,
    TextAlign.configure({ types: ["heading", "paragraph"] }),
    Underline,
    Highlight,
    QuestionVariableInlineNode,
    QuestionVariableBlockNode,
    CollectionBlockNode,
    RowRepeatBlockNode,
    DataRowBlockNode,
  ];
}

// ─── Single A4 page editor ────────────────────────────────────────────────────
function SinglePageEditor({
  initialContent,
  pageNumber,
  questions,
  collections,
  onEditorReady,
  onFocus,
  onContentChange,
  onOverflow,
  onRequestBlockInsert,
}: {
  initialContent: JSONContent | null;
  pageNumber: number;
  questions: FormQuestion[];
  collections: Collection[];
  onEditorReady: (editor: Editor) => void;
  onFocus: (editor: Editor) => void;
  onContentChange: (json: JSONContent) => void;
  onOverflow: () => void;
  onRequestBlockInsert: (pending: PendingBlockInsert) => void;
}) {
  const [slashMenu, setSlashMenu] = useState<{
    query: string; top: number; left: number; flipUp: boolean; from: number; to: number;
  } | null>(null);
  const [slashSelected, setSlashSelected] = useState(0);
  const slashMenuRef = useRef(slashMenu);
  slashMenuRef.current = slashMenu;

  const [atMenu, setAtMenu] = useState<{
    query: string; top: number; left: number; flipUp: boolean; from: number; to: number;
  } | null>(null);
  const [atSelected, setAtSelected] = useState(0);
  const [atTab, setAtTab] = useState<AtTab>("form");
  const atMenuRef = useRef(atMenu);
  atMenuRef.current = atMenu;
  const atTabRef = useRef(atTab);
  atTabRef.current = atTab;

  function checkSlashCommand(editor: Editor) {
    const { state } = editor;
    const { $from, empty } = state.selection;
    if (!empty) { setSlashMenu(null); return; }
    const textBefore = $from.parent.textContent.slice(0, $from.parentOffset);
    const match = textBefore.match(/^\/([\w]*)$/);
    if (!match) { setSlashMenu(null); return; }
    const query = match[1];
    const blockContentStart = $from.pos - $from.parentOffset;
    const coords = editor.view.coordsAtPos($from.pos);
    const { top: mt, left: ml, flipUp: mf } = menuPos(coords, 320, 224);
    setSlashMenu({ query, top: mt, left: ml, flipUp: mf, from: blockContentStart, to: $from.pos });
    setSlashSelected(0);
  }

  function checkAtMention(editor: Editor) {
    const { state } = editor;
    const { $from, empty } = state.selection;
    if (!empty) { setAtMenu(null); return; }
    const textBefore = $from.parent.textContent.slice(0, $from.parentOffset);
    const match = textBefore.match(/@([\w\s]*)$/);
    if (!match) { setAtMenu(null); return; }
    const query = match[1].trimEnd();
    const matchStart = $from.pos - match[0].length;
    const coords = editor.view.coordsAtPos($from.pos);
    const { top: mt, left: ml, flipUp: mf } = menuPos(coords, 340, 256);
    setAtMenu({ query, top: mt, left: ml, flipUp: mf, from: matchStart, to: $from.pos });
    setAtSelected(0);
    setAtTab("form");
  }

  const editor = useEditor({
    extensions: makeExtensions(),
    content: initialContent ?? undefined,
    editorProps: {
      attributes: { class: "notion-editor focus:outline-none notion-editor-page-card" },
    },
    onUpdate({ editor }) {
      onContentChange(editor.getJSON());
      checkSlashCommand(editor);
      checkAtMention(editor);
      const dom = editor.view.dom as HTMLElement;
      if (dom.scrollHeight > OVERFLOW_TRIGGER) onOverflow();
    },
    onFocus({ editor }) { onFocus(editor); },
    onSelectionUpdate({ editor }) {
      if (!editor.state.selection.empty) { setSlashMenu(null); setAtMenu(null); }
    },
  });

  useEffect(() => { if (editor) onEditorReady(editor); }, [editor]); // eslint-disable-line

  const filteredSlashItems = slashMenu
    ? SLASH_ITEMS.filter(item => {
        const q = slashMenu.query.toLowerCase();
        if (!q) return true;
        return item.keywords.some(k => k.includes(q)) || item.label.toLowerCase().includes(q);
      })
    : [];

  function executeSlashItem(item: SlashItem) {
    if (!editor || !slashMenu) return;
    const { from, to } = slashMenu;
    setSlashMenu(null);
    editor.chain().focus().deleteRange({ from, to }).run();
    item.action(editor);
  }

  function executeAtItem(question: FormQuestion) {
    if (!editor || !atMenu) return;
    const { from, to } = atMenu;
    setAtMenu(null);
    const forceBlock = question.multiField || question.type === "approval";
    if (forceBlock) {
      editor.chain().focus().deleteRange({ from, to })
        .insertQuestionVariableBlock({
          questionId: question.id, variableKey: question.variableKey,
          label: question.alias || question.label, questionType: question.type,
          displayType: "question_answer_block",
        }).run();
    } else {
      editor.chain().focus().deleteRange({ from, to })
        .insertQuestionVariableInline({
          questionId: question.id, variableKey: question.variableKey,
          label: question.alias || question.label, questionType: question.type,
          displayType: "inline_value",
        }).run();
    }
  }

  function executeCollectionItem(collection: Collection, mode: "table" | "cards" = "table") {
    if (!editor || !atMenu) return;
    const { from, to } = atMenu;
    setAtMenu(null);
    if (mode === "cards") {
      onRequestBlockInsert({ collection, from, to, editorRef: editor });
    } else {
      const sql = `SELECT * FROM ${collection.variableKey}`;
      const attrs = { collectionId: collection.id, collectionKey: collection.variableKey, label: collection.name, sqlQuery: sql };
      editor.chain().focus().deleteRange({ from, to }).insertCollectionBlock(attrs).run();
    }
  }

  useEffect(() => {
    if (!slashMenu) return;
    function handleKey(e: KeyboardEvent) {
      const items = SLASH_ITEMS.filter(item => {
        const q = slashMenuRef.current?.query.toLowerCase() ?? "";
        if (!q) return true;
        return item.keywords.some(k => k.includes(q)) || item.label.toLowerCase().includes(q);
      });
      if (e.key === "Escape") { e.preventDefault(); setSlashMenu(null); }
      else if (e.key === "ArrowDown") { e.preventDefault(); setSlashSelected(s => items.length > 0 ? (s + 1) % items.length : 0); }
      else if (e.key === "ArrowUp") { e.preventDefault(); setSlashSelected(s => items.length > 0 ? (s - 1 + items.length) % items.length : 0); }
      else if (e.key === "Enter") {
        e.preventDefault();
        const item = items[slashSelected] ?? items[0];
        if (item && slashMenuRef.current) {
          const { from, to } = slashMenuRef.current;
          setSlashMenu(null);
          editor?.chain().focus().deleteRange({ from, to }).run();
          item.action(editor!);
        }
      }
    }
    document.addEventListener("keydown", handleKey, true);
    return () => document.removeEventListener("keydown", handleKey, true);
  }, [slashMenu, slashSelected, editor]);

  useEffect(() => {
    if (!atMenu) return;
    function handleKey(e: KeyboardEvent) {
      const tab = atTabRef.current;
      const query = atMenuRef.current?.query ?? "";

      if (tab === "collections") {
        const filtered = collections.filter(c =>
          !query || c.name.toLowerCase().includes(query.toLowerCase())
            || c.variableKey.toLowerCase().includes(query.toLowerCase())
        );
        if (e.key === "Escape") { e.preventDefault(); setAtMenu(null); }
        else if (e.key === "ArrowDown") { e.preventDefault(); setAtSelected(s => filtered.length > 0 ? (s + 1) % filtered.length : 0); }
        else if (e.key === "ArrowUp") { e.preventDefault(); setAtSelected(s => filtered.length > 0 ? (s - 1 + filtered.length) % filtered.length : 0); }
        else if (e.key === "Enter") {
          e.preventDefault();
          const c = filtered[atSelected] ?? filtered[0];
          if (c && atMenuRef.current) {
            const { from, to } = atMenuRef.current;
            setAtMenu(null);
            editor?.chain().focus().deleteRange({ from, to })
              .insertCollectionBlock({
                collectionId: c.id, collectionKey: c.variableKey,
                label: c.name, sqlQuery: `SELECT * FROM ${c.variableKey}`,
              }).run(); // keyboard Enter defaults to table mode
          }
        }
        return;
      }

      const filtered = questions.filter(q => {
        const cat = q.category ?? "form";
        if (cat !== tab) return false;
        if (!query) return true;
        return q.label.toLowerCase().includes(query.toLowerCase())
          || q.variableKey.toLowerCase().includes(query.toLowerCase());
      });
      if (e.key === "Escape") { e.preventDefault(); setAtMenu(null); }
      else if (e.key === "ArrowDown") { e.preventDefault(); setAtSelected(s => filtered.length > 0 ? (s + 1) % filtered.length : 0); }
      else if (e.key === "ArrowUp") { e.preventDefault(); setAtSelected(s => filtered.length > 0 ? (s - 1 + filtered.length) % filtered.length : 0); }
      else if (e.key === "Enter") {
        e.preventDefault();
        const q = filtered[atSelected] ?? filtered[0];
        if (q && atMenuRef.current) {
          const { from, to } = atMenuRef.current;
          setAtMenu(null);
          const forceBlock = q.multiField || q.type === "approval";
          if (forceBlock) {
            editor?.chain().focus().deleteRange({ from, to })
              .insertQuestionVariableBlock({
                questionId: q.id, variableKey: q.variableKey,
                label: q.alias || q.label, questionType: q.type,
                displayType: "question_answer_block",
              }).run();
          } else {
            editor?.chain().focus().deleteRange({ from, to })
              .insertQuestionVariableInline({
                questionId: q.id, variableKey: q.variableKey,
                label: q.alias || q.label, questionType: q.type,
                displayType: "inline_value",
              }).run();
          }
        }
      }
    }
    document.addEventListener("keydown", handleKey, true);
    return () => document.removeEventListener("keydown", handleKey, true);
  }, [atMenu, atSelected, atTab, editor, questions, collections]);

  const editorClass = "h-full prose prose-base max-w-none prose-headings:font-bold prose-h1:text-3xl prose-h1:mb-2 prose-h1:mt-6 prose-h2:text-xl prose-h2:mt-5 prose-h2:mb-1.5 prose-h3:text-lg prose-h3:mt-4 prose-h3:mb-1 prose-p:leading-relaxed prose-p:my-1 prose-blockquote:border-l-4 prose-blockquote:border-gray-300 prose-blockquote:text-gray-600 prose-code:bg-gray-100 prose-code:rounded prose-code:px-1 prose-code:text-sm prose-pre:bg-gray-50 prose-pre:border prose-pre:border-gray-200";

  return (
    <div
      className="bg-white shadow-md flex-shrink-0 relative"
      style={{ width: A4_W, height: A4_H, overflow: "hidden" }}
    >
      {/* Page number label */}
      <div className="absolute bottom-3 right-4 text-[10px] text-gray-300 select-none pointer-events-none z-10">
        {pageNumber}
      </div>

      {editor && (
        <BubbleMenu
          editor={editor}
          appendTo={() => document.body}
          options={{ placement: "top" }}
          shouldShow={({ state }) => !state.selection.empty}
        >
          <BubbleToolbar editor={editor} />
        </BubbleMenu>
      )}
      {editor && <BlockHandle editor={editor} />}
      <EditorContent editor={editor} className={editorClass} />

      {slashMenu && (
        <SlashCommandMenu
          items={filteredSlashItems}
          selected={slashSelected}
          onSelect={executeSlashItem}
          top={slashMenu.top}
          left={slashMenu.left}
          flipUp={slashMenu.flipUp}
        />
      )}
      {atMenu && (
        <AtMentionMenu
          questions={questions}
          collections={collections}
          query={atMenu.query}
          selected={atSelected}
          activeTab={atTab}
          onTabChange={tab => { setAtTab(tab); setAtSelected(0); }}
          onSelect={executeAtItem}
          onSelectCollection={executeCollectionItem}
          top={atMenu.top}
          left={atMenu.left}
          flipUp={atMenu.flipUp}
        />
      )}
    </div>
  );
}

// ─── Block insert modal ───────────────────────────────────────────────────────
type PendingBlockInsert = {
  collection: Collection;
  from: number;
  to: number;
  editorRef: Editor;
};

function BlockInsertModal({
  pending,
  collections,
  onConfirm,
  onCancel,
}: {
  pending: PendingBlockInsert;
  collections: Collection[];
  onConfirm: (nodes: object[]) => void;
  onCancel: () => void;
}) {
  const [sql, setSql] = useState(`SELECT * FROM ${pending.collection.variableKey}`);
  const result = executeQuery(sql, collections);

  function handleInsert() {
    if (result.error || result.rows.length === 0) return;
    const nodes = result.rows.map(row => ({
      type: "dataRowBlock",
      attrs: {
        collectionLabel: pending.collection.name,
        primaryLabel: result.columns[0] ? String(row[result.columns[0].key] ?? "") : "Row",
        fields: JSON.stringify(
          result.columns.map(col => ({ label: col.label, value: String(row[col.key] ?? "") }))
        ),
      },
    }));
    onConfirm(nodes);
  }

  const canInsert = !result.error && result.rows.length > 0;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/25"
      onMouseDown={e => { if (e.target === e.currentTarget) onCancel(); }}
    >
      <div className="bg-white rounded-xl shadow-2xl border border-gray-200 w-[440px] p-5 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold text-gray-900">Insert blocks from collection</div>
            <div className="text-xs text-gray-400 mt-0.5">Each row in the result becomes an independent block</div>
          </div>
          <button onMouseDown={onCancel} className="text-gray-400 hover:text-gray-600 p-1 rounded hover:bg-gray-100">
            <X size={14} />
          </button>
        </div>

        {/* Collection badge */}
        <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg border border-gray-100">
          <div className="flex items-center justify-center w-5 h-5 rounded bg-violet-100 flex-shrink-0">
            <svg width="11" height="11" viewBox="0 0 11 11" fill="none" className="text-violet-600">
              <rect x="0.5" y="0.5" width="10" height="10" rx="1.5" stroke="currentColor" strokeWidth="1"/>
              <line x1="0.5" y1="3.5" x2="10.5" y2="3.5" stroke="currentColor" strokeWidth="0.8"/>
              <line x1="3.5" y1="3.5" x2="3.5" y2="10.5" stroke="currentColor" strokeWidth="0.8"/>
            </svg>
          </div>
          <span className="text-xs font-medium text-gray-700">{pending.collection.name}</span>
          <span className="text-[10px] font-mono text-gray-400">{pending.collection.variableKey}</span>
        </div>

        {/* SQL editor */}
        <div>
          <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider block mb-1.5">
            SQL Query
          </label>
          <textarea
            autoFocus
            value={sql}
            onChange={e => setSql(e.target.value)}
            onKeyDown={e => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) { e.preventDefault(); handleInsert(); }
              if (e.key === "Escape") onCancel();
            }}
            rows={3}
            spellCheck={false}
            className="w-full font-mono text-xs bg-white border border-gray-200 rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-blue-300 text-gray-800"
            placeholder={`SELECT * FROM ${pending.collection.variableKey}`}
          />
        </div>

        {/* Live preview */}
        <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs ${
          result.error
            ? "bg-red-50 border border-red-100 text-red-600"
            : result.rows.length === 0
              ? "bg-gray-50 border border-gray-100 text-gray-400"
              : "bg-green-50 border border-green-100 text-green-700"
        }`}>
          {result.error ? (
            <><AlertCircle size={12} className="flex-shrink-0" /> <span className="font-mono">{result.error}</span></>
          ) : (
            <>
              <span className="font-semibold">{result.rows.length}</span>
              <span>block{result.rows.length !== 1 ? "s" : ""} will be inserted</span>
              {result.rows.length > 0 && (
                <span className="text-[10px] opacity-60">
                  · columns: {result.columns.map(c => c.label).join(", ")}
                </span>
              )}
            </>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 pt-1">
          <button
            onMouseDown={handleInsert}
            disabled={!canInsert}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-gray-900 text-white text-xs font-medium hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <Check size={12} />
            Insert {canInsert ? result.rows.length : ""} block{canInsert && result.rows.length !== 1 ? "s" : ""}
          </button>
          <button
            onMouseDown={onCancel}
            className="px-4 py-2 rounded-lg border border-gray-200 text-gray-600 text-xs font-medium hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
        </div>
        <div className="text-[10px] text-gray-400 text-center">⌘↵ to insert</div>
      </div>
    </div>
  );
}

// ─── Main ReportEditor ───────────────────────────────────────────────────────
export function ReportEditor() {
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewJson, setPreviewJson] = useState<JSONContent | null>(null);
  const [previewQuestions, setPreviewQuestions] = useState<FormQuestion[]>([]);
  const [exporting, setExporting] = useState<"pdf" | null>(null);
  const [answers, setAnswers] = useState<FormAnswers>(sampleAnswers);
  const [questions, setQuestions] = useState<FormQuestion[]>(sampleQuestions);
  const [collections] = useState<Collection[]>(sampleCollections);
  const [pendingBlockInsert, setPendingBlockInsert] = useState<PendingBlockInsert | null>(null);
  const [pageMode, setPageMode] = useState<"pageless" | "page">("pageless");
  const [trayCollapsed, setTrayCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Multi-page state (used in page mode)
  const [pageContents, setPageContents] = useState<(JSONContent | null)[]>([INITIAL_CONTENT]);
  const pageEditorRefs = useRef<(Editor | null)[]>([]);

  // Pageless mode editor
  const pageModeRef = useRef(pageMode);
  pageModeRef.current = pageMode;

  const [slashMenu, setSlashMenu] = useState<{
    query: string; top: number; left: number; flipUp: boolean; from: number; to: number;
  } | null>(null);
  const [slashSelected, setSlashSelected] = useState(0);
  const slashMenuRef = useRef(slashMenu);
  slashMenuRef.current = slashMenu;

  const [atMenu, setAtMenu] = useState<{
    query: string; top: number; left: number; flipUp: boolean; from: number; to: number;
  } | null>(null);
  const [atSelected, setAtSelected] = useState(0);
  const [atTab, setAtTab] = useState<AtTab>("form");
  const atMenuRef = useRef(atMenu);
  atMenuRef.current = atMenu;
  const atTabRef = useRef(atTab);
  atTabRef.current = atTab;

  useEffect(() => { setMounted(true); }, []);

  function handleAnswerChange(key: string, value: string | string[]) {
    setAnswers(prev => ({ ...prev, [key]: value }));
  }

  function handleAliasChange(id: string, alias: string) {
    const question = questions.find(q => q.id === id);
    if (question) {
      const newLabel = alias || question.label;
      const editorsToUpdate: (Editor | null)[] =
        pageMode === "page" ? pageEditorRefs.current : [editor];

      for (const ed of editorsToUpdate) {
        if (!ed) continue;
        const { state } = ed;
        const tr = state.tr;
        let changed = false;
        state.doc.descendants((node, pos) => {
          if (
            (node.type.name === "questionVariableInline" ||
             node.type.name === "questionVariableBlock") &&
            node.attrs.variableKey === question.variableKey &&
            node.attrs.label !== newLabel
          ) {
            tr.setNodeMarkup(pos, undefined, { ...node.attrs, label: newLabel });
            changed = true;
          }
        });
        if (changed) ed.view.dispatch(tr);
      }
    }
    setQuestions(prev => prev.map(q => q.id === id ? { ...q, alias: alias || undefined } : q));
  }

  function handleUpdateQuestion(id: string, updates: Partial<FormQuestion>) {
    setQuestions(prev => prev.map(q => {
      if (q.id !== id) return q;
      const next = { ...q, ...updates };
      if (updates.subFields && q.columnOrder) {
        const prevKeys = new Set(q.subFields?.map(sf => sf.variableKey) ?? []);
        const newKeys = updates.subFields
          .filter(sf => !prevKeys.has(sf.variableKey))
          .map(sf => sf.variableKey);
        if (newKeys.length) next.columnOrder = [...q.columnOrder, ...newKeys];
      }
      return next;
    }));

    if (updates.subFields) {
      setAnswers(prev => {
        const next = { ...prev };
        updates.subFields!.forEach(sf => {
          if (!(sf.variableKey in next)) next[sf.variableKey] = "";
        });
        return next;
      });
    }
  }

  function handleAddQuestion(label: string, type: QuestionType) {
    const id = `q_${Date.now()}`;
    const variableKey = label.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
    const newQ: FormQuestion = { id, label, variableKey, type };
    setQuestions(prev => [...prev, newQ]);
    setAnswers(prev => ({ ...prev, [variableKey]: "" }));
  }

  function checkSlashCommand(editor: Editor) {
    const { state } = editor;
    const { $from, empty } = state.selection;
    if (!empty) { setSlashMenu(null); return; }
    const textBefore = $from.parent.textContent.slice(0, $from.parentOffset);
    const match = textBefore.match(/^\/([\w]*)$/);
    if (!match) { setSlashMenu(null); return; }
    const query = match[1];
    const blockContentStart = $from.pos - $from.parentOffset;
    const coords = editor.view.coordsAtPos($from.pos);
    const { top: mt, left: ml, flipUp: mf } = menuPos(coords, 320, 224);
    setSlashMenu({ query, top: mt, left: ml, flipUp: mf, from: blockContentStart, to: $from.pos });
    setSlashSelected(0);
  }

  function checkAtMention(editor: Editor) {
    const { state } = editor;
    const { $from, empty } = state.selection;
    if (!empty) { setAtMenu(null); return; }
    const textBefore = $from.parent.textContent.slice(0, $from.parentOffset);
    const match = textBefore.match(/@([\w\s]*)$/);
    if (!match) { setAtMenu(null); return; }
    const query = match[1].trimEnd();
    const matchStart = $from.pos - match[0].length;
    const coords = editor.view.coordsAtPos($from.pos);
    const { top: mt, left: ml, flipUp: mf } = menuPos(coords, 340, 256);
    setAtMenu({ query, top: mt, left: ml, flipUp: mf, from: matchStart, to: $from.pos });
    setAtSelected(0);
    setAtTab("form");
  }

  const editor = useEditor({
    extensions: makeExtensions(),
    content: INITIAL_CONTENT,
    editorProps: {
      attributes: {
        class: `notion-editor min-h-full focus:outline-none ${
          pageModeRef.current === "page" ? "notion-editor-page" : "notion-editor-pageless"
        }`,
      },
    },
    onUpdate({ editor }) {
      checkSlashCommand(editor);
      checkAtMention(editor);
    },
    onSelectionUpdate({ editor }) {
      if (!editor.state.selection.empty) {
        setSlashMenu(null);
        setAtMenu(null);
      }
    },
  });

  const filteredSlashItems = slashMenu
    ? SLASH_ITEMS.filter(item => {
        const q = slashMenu.query.toLowerCase();
        if (!q) return true;
        return item.keywords.some(k => k.includes(q)) || item.label.toLowerCase().includes(q);
      })
    : [];

  function executeSlashItem(item: SlashItem) {
    if (!editor || !slashMenu) return;
    const { from, to } = slashMenu;
    setSlashMenu(null);
    editor.chain().focus().deleteRange({ from, to }).run();
    item.action(editor);
  }

  useEffect(() => {
    if (!slashMenu) return;
    function handleKey(e: KeyboardEvent) {
      const items = SLASH_ITEMS.filter(item => {
        const q = slashMenuRef.current?.query.toLowerCase() ?? "";
        if (!q) return true;
        return item.keywords.some(k => k.includes(q)) || item.label.toLowerCase().includes(q);
      });
      if (e.key === "Escape") { e.preventDefault(); setSlashMenu(null); }
      else if (e.key === "ArrowDown") { e.preventDefault(); setSlashSelected(s => items.length > 0 ? (s + 1) % items.length : 0); }
      else if (e.key === "ArrowUp") { e.preventDefault(); setSlashSelected(s => items.length > 0 ? (s - 1 + items.length) % items.length : 0); }
      else if (e.key === "Enter") {
        e.preventDefault();
        const item = items[slashSelected] ?? items[0];
        if (item && slashMenuRef.current) {
          const { from, to } = slashMenuRef.current;
          setSlashMenu(null);
          editor?.chain().focus().deleteRange({ from, to }).run();
          item.action(editor!);
        }
      }
    }
    document.addEventListener("keydown", handleKey, true);
    return () => document.removeEventListener("keydown", handleKey, true);
  }, [slashMenu, slashSelected, editor]);

  function executeAtItem(question: FormQuestion) {
    if (!editor || !atMenu) return;
    const { from, to } = atMenu;
    setAtMenu(null);
    const forceBlock = question.multiField || question.type === "approval";
    if (forceBlock) {
      editor.chain().focus().deleteRange({ from, to })
        .insertQuestionVariableBlock({
          questionId: question.id, variableKey: question.variableKey,
          label: question.alias || question.label, questionType: question.type,
          displayType: "question_answer_block",
        }).run();
    } else {
      editor.chain().focus().deleteRange({ from, to })
        .insertQuestionVariableInline({
          questionId: question.id, variableKey: question.variableKey,
          label: question.alias || question.label, questionType: question.type,
          displayType: "inline_value",
        }).run();
    }
  }

  function executeCollectionItem(collection: Collection, mode: "table" | "cards" = "table") {
    if (!editor || !atMenu) return;
    const { from, to } = atMenu;
    setAtMenu(null);
    if (mode === "cards") {
      // Open modal — user configures SQL before N blocks are inserted
      setPendingBlockInsert({ collection, from, to, editorRef: editor });
    } else {
      const sql = `SELECT * FROM ${collection.variableKey}`;
      const attrs = { collectionId: collection.id, collectionKey: collection.variableKey, label: collection.name, sqlQuery: sql };
      editor.chain().focus().deleteRange({ from, to }).insertCollectionBlock(attrs).run();
    }
  }

  useEffect(() => {
    if (!atMenu) return;
    function handleKey(e: KeyboardEvent) {
      const tab = atTabRef.current;
      const query = atMenuRef.current?.query ?? "";

      if (tab === "collections") {
        const filtered = collections.filter(c =>
          !query || c.name.toLowerCase().includes(query.toLowerCase())
            || c.variableKey.toLowerCase().includes(query.toLowerCase())
        );
        if (e.key === "Escape") { e.preventDefault(); setAtMenu(null); }
        else if (e.key === "ArrowDown") { e.preventDefault(); setAtSelected(s => filtered.length > 0 ? (s + 1) % filtered.length : 0); }
        else if (e.key === "ArrowUp") { e.preventDefault(); setAtSelected(s => filtered.length > 0 ? (s - 1 + filtered.length) % filtered.length : 0); }
        else if (e.key === "Enter") {
          e.preventDefault();
          const c = filtered[atSelected] ?? filtered[0];
          if (c && atMenuRef.current) {
            const { from, to } = atMenuRef.current;
            setAtMenu(null);
            editor?.chain().focus().deleteRange({ from, to })
              .insertCollectionBlock({
                collectionId: c.id, collectionKey: c.variableKey,
                label: c.name, sqlQuery: `SELECT * FROM ${c.variableKey}`,
              }).run(); // keyboard Enter defaults to table mode
          }
        }
        return;
      }

      const filtered = questions.filter(q => {
        const cat = q.category ?? "form";
        if (cat !== tab) return false;
        if (!query) return true;
        return q.label.toLowerCase().includes(query.toLowerCase())
          || q.variableKey.toLowerCase().includes(query.toLowerCase());
      });
      if (e.key === "Escape") { e.preventDefault(); setAtMenu(null); }
      else if (e.key === "ArrowDown") { e.preventDefault(); setAtSelected(s => filtered.length > 0 ? (s + 1) % filtered.length : 0); }
      else if (e.key === "ArrowUp") { e.preventDefault(); setAtSelected(s => filtered.length > 0 ? (s - 1 + filtered.length) % filtered.length : 0); }
      else if (e.key === "Enter") {
        e.preventDefault();
        const q = filtered[atSelected] ?? filtered[0];
        if (q && atMenuRef.current) {
          const { from, to } = atMenuRef.current;
          setAtMenu(null);
          const forceBlock = q.multiField || q.type === "approval";
          if (forceBlock) {
            editor?.chain().focus().deleteRange({ from, to })
              .insertQuestionVariableBlock({
                questionId: q.id, variableKey: q.variableKey,
                label: q.alias || q.label, questionType: q.type,
                displayType: "question_answer_block",
              }).run();
          } else {
            editor?.chain().focus().deleteRange({ from, to })
              .insertQuestionVariableInline({
                questionId: q.id, variableKey: q.variableKey,
                label: q.alias || q.label, questionType: q.type,
                displayType: "inline_value",
              }).run();
          }
        }
      }
    }
    document.addEventListener("keydown", handleKey, true);
    return () => document.removeEventListener("keydown", handleKey, true);
  }, [atMenu, atSelected, atTab, editor, questions, collections]);

  // ─── Combine all page contents for export ──────────────────────────────────
  function combinePageContents(): JSONContent {
    return {
      type: "doc",
      content: pageContents.flatMap(c => c?.content ?? []),
    };
  }

  const getMarkdown = useCallback(() => {
    const json = pageMode === "page" ? combinePageContents() : editor?.getJSON();
    if (!json) return "";
    return generateReportMarkdown(json, answers, questions);
  }, [editor, answers, questions, pageMode, pageContents]); // eslint-disable-line

  function handlePreview() {
    const json = pageMode === "page" ? combinePageContents() : editor?.getJSON();
    if (!json) return;
    setPreviewJson(json);
    setPreviewQuestions(questions);
    setPreviewOpen(true);
  }

  function handleExportMd() {
    downloadMarkdown(getMarkdown());
  }

  async function handleExportPdf() {
    const json = pageMode === "page" ? combinePageContents() : editor?.getJSON();
    if (!json) return;
    setExporting("pdf");
    try { await exportPdfFromHtml(generateReportHtml(json, answers, questions)); }
    finally { setExporting(null); }
  }

  const editorClass = "h-full prose prose-base max-w-none prose-headings:font-bold prose-h1:text-3xl prose-h1:mb-2 prose-h1:mt-6 prose-h2:text-xl prose-h2:mt-5 prose-h2:mb-1.5 prose-h3:text-lg prose-h3:mt-4 prose-h3:mb-1 prose-p:leading-relaxed prose-p:my-1 prose-blockquote:border-l-4 prose-blockquote:border-gray-300 prose-blockquote:text-gray-600 prose-code:bg-gray-100 prose-code:rounded prose-code:px-1 prose-code:text-sm prose-pre:bg-gray-50 prose-pre:border prose-pre:border-gray-200";

  const headerActionsEl = mounted ? document.getElementById("header-actions") : null;

  return (
    <QuestionsContext.Provider value={{ questions, answers, updateQuestion: handleUpdateQuestion, collections }}>
      <div className="flex flex-col h-full">

        {/* ── Header portal: mode toggle + action buttons ── */}
        {headerActionsEl && createPortal(
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-0.5">
              <button
                onClick={() => setPageMode("pageless")}
                title="Pageless mode"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  pageMode === "pageless" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
                }`}
              >
                <AlignLeft size={13} /> Pageless
              </button>
              <button
                onClick={() => setPageMode("page")}
                title="A4 page mode"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  pageMode === "page" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
                }`}
              >
                <PageIcon size={13} /> A4 Page
              </button>
            </div>

            <button onClick={handlePreview}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-900 text-white text-xs font-medium hover:bg-gray-700 transition-colors">
              <Eye size={13} /> Preview
            </button>
            <button onClick={handleExportMd}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-300 text-gray-700 text-xs font-medium hover:bg-gray-50 transition-colors">
              <FileText size={13} /> Markdown
            </button>
            <button onClick={handleExportPdf} disabled={exporting === "pdf"}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-300 text-gray-700 text-xs font-medium hover:bg-gray-50 transition-colors disabled:opacity-50">
              {exporting === "pdf" ? <Loader2 size={13} className="animate-spin" /> : <FileDown size={13} />}
              PDF
            </button>
          </div>,
          headerActionsEl,
        )}

        <div className="flex flex-1 overflow-hidden">
          {/* ── Editor canvas ── */}
          <div className={`flex-1 overflow-y-auto relative ${pageMode === "page" ? "bg-[#e8e8e8]" : "bg-white"}`}>

            {pageMode === "page" ? (
              /* A4 multi-page mode */
              <div className="py-8 flex flex-col items-center gap-8">
                {pageContents.map((content, i) => (
                  <SinglePageEditor
                    key={i}
                    pageNumber={i + 1}
                    initialContent={content}
                    questions={questions}
                    collections={collections}
                    onEditorReady={(ed) => {
                      pageEditorRefs.current[i] = ed;
                    }}
                    onFocus={() => {}}
                    onContentChange={(json) => {
                      setPageContents(prev => {
                        const next = [...prev];
                        next[i] = json;
                        return next;
                      });
                    }}
                    onOverflow={() => {
                      if (i === pageContents.length - 1) {
                        setPageContents(prev => [...prev, null]);
                      }
                    }}
                    onRequestBlockInsert={setPendingBlockInsert}
                  />
                ))}
              </div>
            ) : (
              /* Pageless mode */
              <div
                data-page-mode="pageless"
                className="max-w-[794px] w-full mx-auto relative"
              >
                {editor && (
                  <BubbleMenu
                    editor={editor}
                    appendTo={() => document.body}
                    options={{ placement: "top" }}
                    shouldShow={({ state }) => !state.selection.empty}
                  >
                    <BubbleToolbar editor={editor} />
                  </BubbleMenu>
                )}
                {editor && <BlockHandle editor={editor} />}
                <EditorContent editor={editor} className={editorClass} />
              </div>
            )}

            {/* Floating "show variables" button when tray is collapsed */}
            {trayCollapsed && (
              <button
                onClick={() => setTrayCollapsed(false)}
                title="Show variables"
                className="fixed right-4 top-20 z-30 bg-white border border-gray-200 shadow-md rounded-lg px-2.5 py-2 text-xs text-gray-600 hover:bg-gray-50 flex items-center gap-1.5 transition-colors"
              >
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <rect x="1" y="1.5" width="10" height="1.2" rx="0.6" fill="currentColor" />
                  <rect x="1" y="5.4" width="10" height="1.2" rx="0.6" fill="currentColor" />
                  <rect x="1" y="9.3" width="10" height="1.2" rx="0.6" fill="currentColor" />
                </svg>
                Variables
              </button>
            )}
          </div>

          {/* ── Variable tray (hidden when collapsed) ── */}
          {!trayCollapsed && (
            <VariableTray
              questions={questions}
              answers={answers}
              onAnswerChange={handleAnswerChange}
              onAliasChange={handleAliasChange}
              onAddQuestion={handleAddQuestion}
              onUpdateQuestion={handleUpdateQuestion}
              onCollapse={() => setTrayCollapsed(true)}
            />
          )}
        </div>

        {/* Pageless-mode menus */}
        {pageMode === "pageless" && slashMenu && (
          <SlashCommandMenu
            items={filteredSlashItems}
            selected={slashSelected}
            onSelect={executeSlashItem}
            top={slashMenu.top}
            left={slashMenu.left}
            flipUp={slashMenu.flipUp}
          />
        )}
        {pageMode === "pageless" && atMenu && (
          <AtMentionMenu
            questions={questions}
            collections={collections}
            query={atMenu.query}
            selected={atSelected}
            activeTab={atTab}
            onTabChange={tab => { setAtTab(tab); setAtSelected(0); }}
            onSelect={executeAtItem}
            onSelectCollection={executeCollectionItem}
            top={atMenu.top}
            left={atMenu.left}
            flipUp={atMenu.flipUp}
          />
        )}

        {previewOpen && previewJson && (
          <ReportPreview
            editorJson={previewJson}
            answers={answers}
            questions={previewQuestions}
            onClose={() => setPreviewOpen(false)}
          />
        )}

        {/* Block insert modal — shown when user picks "Blocks" from Collections @ menu */}
        {pendingBlockInsert && (
          <BlockInsertModal
            pending={pendingBlockInsert}
            collections={collections}
            onConfirm={nodes => {
              const { from, to, editorRef } = pendingBlockInsert;
              editorRef.chain().focus().deleteRange({ from, to }).insertContent(nodes).run();
              setPendingBlockInsert(null);
            }}
            onCancel={() => setPendingBlockInsert(null)}
          />
        )}
      </div>
    </QuestionsContext.Provider>
  );
}
