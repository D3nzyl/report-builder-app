import { Node, mergeAttributes } from "@tiptap/core";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    collectionBlock: {
      insertCollectionBlock: (attrs: {
        collectionId: string;
        collectionKey: string;
        label: string;
        sqlQuery: string;
      }) => ReturnType;
    };
  }
}

export const CollectionBlockNode = Node.create({
  name: "collectionBlock",
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
    return [{ tag: 'div[data-type="collection-block"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, { "data-type": "collection-block" }),
      `[Collection: ${HTMLAttributes.label}]`,
    ];
  },

  addNodeView() {
    const { ReactNodeViewRenderer } = require("@tiptap/react");
    const { CollectionBlockView } = require("./CollectionBlockView");
    return ReactNodeViewRenderer(CollectionBlockView);
  },

  addCommands() {
    return {
      insertCollectionBlock:
        (attrs) =>
        ({ commands }) => {
          return commands.insertContent({ type: this.name, attrs });
        },
    };
  },
});
