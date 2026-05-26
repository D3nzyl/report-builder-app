"use client";

import { useCurrentEditor } from "@tiptap/react";
import { sampleQuestions } from "@/lib/sampleData";
import type { FormQuestion, QuestionType } from "@/lib/types";
import { Type, AlignJustify, Calendar, Hash, CheckSquare, Image, List, Circle, Star, ToggleLeft, ChevronDown, Sliders, Clock, Upload, PenLine, Pencil, MapPin } from "lucide-react";

const typeIcons: Record<QuestionType, React.ReactNode> = {
  short_text:    <Type size={12} />,
  long_text:     <AlignJustify size={12} />,
  number:        <Hash size={12} />,
  radio:         <Circle size={12} />,
  rating:        <Star size={12} />,
  toggle:        <ToggleLeft size={12} />,
  single_select: <ChevronDown size={12} />,
  multi_select:  <List size={12} />,
  slider:        <Sliders size={12} />,
  date:          <Calendar size={12} />,
  datetime:      <Clock size={12} />,
  file_upload:   <Upload size={12} />,
  signature:     <PenLine size={12} />,
  sketch:        <Pencil size={12} />,
  location:      <MapPin size={12} />,
  image_upload:  <Image size={12} />,
  approval:      <CheckSquare size={12} />,
};

const typeBadgeColors: Record<QuestionType, string> = {
  short_text:    "bg-green-50 text-green-700 border-green-200",
  long_text:     "bg-teal-50 text-teal-700 border-teal-200",
  number:        "bg-orange-50 text-orange-700 border-orange-200",
  radio:         "bg-violet-50 text-violet-700 border-violet-200",
  rating:        "bg-amber-50 text-amber-700 border-amber-200",
  toggle:        "bg-lime-50 text-lime-700 border-lime-200",
  single_select: "bg-indigo-50 text-indigo-700 border-indigo-200",
  multi_select:  "bg-purple-50 text-purple-700 border-purple-200",
  slider:        "bg-cyan-50 text-cyan-700 border-cyan-200",
  date:          "bg-yellow-50 text-yellow-700 border-yellow-200",
  datetime:      "bg-orange-50 text-orange-700 border-orange-200",
  file_upload:   "bg-slate-50 text-slate-700 border-slate-200",
  signature:     "bg-rose-50 text-rose-700 border-rose-200",
  sketch:        "bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200",
  location:      "bg-emerald-50 text-emerald-700 border-emerald-200",
  image_upload:  "bg-pink-50 text-pink-700 border-pink-200",
  approval:      "bg-blue-50 text-blue-700 border-blue-200",
};

function QuestionCard({ question }: { question: FormQuestion }) {
  const { editor } = useCurrentEditor();

  function insertInline() {
    if (!editor) return;
    editor.chain().focus().insertQuestionVariableInline({
      questionId: question.id,
      variableKey: question.variableKey,
      label: question.label,
      questionType: question.type,
      displayType: "inline_value",
    }).run();
  }

  function insertBlock() {
    if (!editor) return;
    editor.chain().focus().insertQuestionVariableBlock({
      questionId: question.id,
      variableKey: question.variableKey,
      label: question.label,
      questionType: question.type,
      displayType: "question_answer_block",
    }).run();
  }

  const badgeColor = typeBadgeColors[question.type];

  return (
    <div className="border border-gray-200 rounded-lg p-3 hover:border-blue-300 hover:bg-blue-50/30 transition-colors group">
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex-1 min-w-0">
          <div className="font-medium text-sm text-gray-900 truncate">{question.label}</div>
          <div className="text-xs text-gray-400 mt-0.5 font-mono">{question.variableKey}</div>
        </div>
        <span className={`flex items-center gap-1 text-xs px-1.5 py-0.5 rounded border font-medium flex-shrink-0 ${badgeColor}`}>
          {typeIcons[question.type]}
          {question.type}
        </span>
      </div>
      <div className="flex gap-1.5">
        <button
          onClick={insertInline}
          title="Insert as inline value"
          className="flex-1 flex items-center justify-center gap-1 text-xs py-1 px-2 rounded border border-blue-200 text-blue-700 bg-blue-50 hover:bg-blue-100 transition-colors"
        >
          <Type size={11} />
          Inline
        </button>
        <button
          onClick={insertBlock}
          title="Insert as question + answer block"
          className="flex-1 flex items-center justify-center gap-1 text-xs py-1 px-2 rounded border border-purple-200 text-purple-700 bg-purple-50 hover:bg-purple-100 transition-colors"
        >
          <AlignJustify size={11} />
          Block
        </button>
      </div>
    </div>
  );
}

export function VariableTray() {
  return (
    <aside className="w-64 flex-shrink-0 bg-white border-l border-gray-200 flex flex-col">
      <div className="px-4 py-3 border-b border-gray-200">
        <h2 className="font-semibold text-sm text-gray-900">Variables</h2>
        <p className="text-xs text-gray-500 mt-0.5">Click to insert into editor</p>
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {sampleQuestions.map((q) => (
          <QuestionCard key={q.id} question={q} />
        ))}
      </div>
      <div className="px-3 py-2 border-t border-gray-100 text-xs text-gray-400 text-center">
        {sampleQuestions.length} variables available
      </div>
    </aside>
  );
}
