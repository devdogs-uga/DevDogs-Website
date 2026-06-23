import type { Root, Blockquote, Paragraph, Text } from "mdast";
import type { Plugin } from "unified";
import { visit } from "unist-util-visit";

const ADMONITION_TYPES = ["NOTE", "TIP", "IMPORTANT", "WARNING", "CAUTION"] as const;
type AdmonitionType = (typeof ADMONITION_TYPES)[number];

const remarkAdmonition: Plugin<[], Root> = () => {
  return (tree) => {

    visit(tree, "blockquote", (node: Blockquote, index: number | undefined, parent: { children: unknown[] } | undefined) => {
      if (!parent || typeof index !== "number") return;

      const firstChild = node.children[0];
      if (!firstChild || firstChild.type !== "paragraph") return;

      const firstInline = (firstChild as Paragraph).children[0];
      if (!firstInline || firstInline.type !== "text") return;

      const text = (firstInline as Text).value;
      const match = text.match(/^\[!(\w+)\]\s*/);
      if (!match) return;

      const typeRaw = match[1]!.toUpperCase();
      if (!ADMONITION_TYPES.includes(typeRaw as AdmonitionType)) return;

      const type = typeRaw.toLowerCase();
      (firstInline as Text).value = text.slice(match[0].length);
      if (!(firstInline as Text).value) {
        (firstChild as Paragraph).children.shift();
      }

      const calloutNode = {
        type: "mdxJsxFlowElement" as const,
        name: "Callout",
        attributes: [
          {
            type: "mdxJsxAttribute" as const,
            name: "type",
            value: type,
          },
        ],
        children: node.children,
        data: { _mdxExplicitJsx: true },
      };

      parent.children[index] = calloutNode as unknown as Blockquote;
    });
  };
};

export default remarkAdmonition;
