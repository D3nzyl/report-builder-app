import { Node, mergeAttributes } from "@tiptap/core";
import type { QuestionType, DisplayType } from "@/lib/types";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    questionVariableBlock: {
      insertQuestionVariableBlock: (attrs: {
        questionId: string;
        variableKey: string;
        label: string;
        questionType: QuestionType;
        displayType?: DisplayType;
      }) => ReturnType;
    };
  }
}

export const QuestionVariableBlockNode = Node.create({
  name: "questionVariableBlock",
  group: "block",
  atom: true,
  selectable: true,
  draggable: true,

  addAttributes() {
    return {
      questionId:  { default: "" },
      variableKey: { default: "" },
      label:       { default: "" },
      questionType: { default: "short_text" },
      displayType: { default: "question_answer_block" },
      colSpan:     { default: 12 },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="question-variable-block"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, { "data-type": "question-variable-block" }),
      `[${HTMLAttributes.label}]`,
    ];
  },

  addNodeView() {
    const { ReactNodeViewRenderer } = require("@tiptap/react");
    const { VariableBlockView } = require("./VariableBlockView");
    return ReactNodeViewRenderer(VariableBlockView);
  },

  addCommands() {
    return {
      insertQuestionVariableBlock:
        (attrs) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: { ...attrs, displayType: attrs.displayType ?? "question_answer_block" },
          });
        },
    };
  },
});
