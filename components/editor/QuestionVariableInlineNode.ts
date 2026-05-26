import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import type { QuestionType, DisplayType } from "@/lib/types";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    questionVariableInline: {
      insertQuestionVariableInline: (attrs: {
        questionId: string;
        variableKey: string;
        label: string;
        questionType: QuestionType;
        displayType?: DisplayType;
      }) => ReturnType;
    };
  }
}

export const QuestionVariableInlineNode = Node.create({
  name: "questionVariableInline",
  group: "inline",
  inline: true,
  atom: true,
  selectable: true,
  draggable: true,

  addAttributes() {
    return {
      questionId: { default: "" },
      variableKey: { default: "" },
      label: { default: "" },
      questionType: { default: "short_text" },
      displayType: { default: "inline_value" },
    };
  },

  parseHTML() {
    return [{ tag: 'span[data-type="question-variable-inline"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "span",
      mergeAttributes(HTMLAttributes, { "data-type": "question-variable-inline" }),
      `[${HTMLAttributes.label}]`,
    ];
  },

  addNodeView() {
    // Lazy import to avoid SSR issues
    const { ReactNodeViewRenderer } = require("@tiptap/react");
    const { VariableInlineView } = require("./VariableInlineView");
    return ReactNodeViewRenderer(VariableInlineView);
  },

  addCommands() {
    return {
      insertQuestionVariableInline:
        (attrs) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: { ...attrs, displayType: attrs.displayType ?? "inline_value" },
          });
        },
    };
  },
});
