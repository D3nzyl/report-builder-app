import { Node, mergeAttributes } from "@tiptap/core";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    dataRowBlock: {
      insertDataRowBlock: (attrs: {
        collectionLabel: string;
        primaryLabel: string;
        fields: string; // JSON: [{ label, value }]
      }) => ReturnType;
    };
  }
}

export const DataRowBlockNode = Node.create({
  name: "dataRowBlock",
  group: "block",
  atom: true,
  selectable: true,
  draggable: true,

  addAttributes() {
    return {
      collectionLabel: { default: "" },
      primaryLabel:    { default: "" },
      fields:          { default: "[]" },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="data-row-block"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, { "data-type": "data-row-block" }),
    ];
  },

  addNodeView() {
    const { ReactNodeViewRenderer } = require("@tiptap/react");
    const { DataRowBlockView } = require("./DataRowBlockView");
    return ReactNodeViewRenderer(DataRowBlockView);
  },

  addCommands() {
    return {
      insertDataRowBlock:
        (attrs) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs,
          });
        },
    };
  },
});
