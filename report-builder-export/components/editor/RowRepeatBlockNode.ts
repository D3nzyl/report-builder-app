import { Node, mergeAttributes } from "@tiptap/core";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    rowRepeatBlock: {
      insertRowRepeatBlock: (attrs: {
        collectionId: string;
        collectionKey: string;
        label: string;
        sqlQuery: string;
      }) => ReturnType;
    };
  }
}

export const RowRepeatBlockNode = Node.create({
  name: "rowRepeatBlock",
  group: "block",
  atom: true,
  selectable: true,
  draggable: true,

  addAttributes() {
    return {
      collectionId:  { default: "" },
      collectionKey: { default: "" },
      label:         { default: "" },
      sqlQuery:      { default: "" },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="row-repeat-block"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, { "data-type": "row-repeat-block" }),
      `[Repeat: ${HTMLAttributes.label}]`,
    ];
  },

  addNodeView() {
    const { ReactNodeViewRenderer } = require("@tiptap/react");
    const { RowRepeatBlockView } = require("./RowRepeatBlockView");
    return ReactNodeViewRenderer(RowRepeatBlockView);
  },

  addCommands() {
    return {
      insertRowRepeatBlock:
        (attrs) =>
        ({ commands }) => {
          return commands.insertContent({ type: this.name, attrs });
        },
    };
  },
});
