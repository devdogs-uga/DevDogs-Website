import { createHighlighter, type Highlighter } from "shiki";
import { transformerTwoslash } from "@shikijs/twoslash";
import type { Root, Element } from "hast";
import type { Plugin } from "unified";
import { visit } from "unist-util-visit";

let highlighterPromise: Promise<Highlighter> | null = null;

function getHighlighter() {
  if (!highlighterPromise) {
    highlighterPromise = createHighlighter({
      themes: ["vitesse-dark"],
      langs: [
        "typescript",
        "javascript",
        "tsx",
        "jsx",
        "json",
        "bash",
        "shell",
        "css",
        "html",
        "markdown",
        "sql",
        "yaml",
        "toml",
        "diff",
        "text",
      ],
    });
  }
  return highlighterPromise;
}

function parseMeta(meta: string): Record<string, string> {
  const result: Record<string, string> = {};
  for (const match of meta.matchAll(/(\w+)=(?:"([^"]*)"|(\S+))/g)) {
    result[match[1]!] = match[2] ?? match[3]!;
  }
  return result;
}

const rehypeShiki: Plugin<[], Root> = () => {
  return async (tree) => {
    const highlighter = await getHighlighter();

    visit(tree, "element", (node: Element, index, parent) => {
      if (
        node.tagName !== "pre" ||
        !node.children[0] ||
        (node.children[0] as Element).tagName !== "code"
      )
        return;

      const codeEl = node.children[0] as Element;
      const className = (codeEl.properties?.className as string[]) ?? [];
      const langClass = className.find((c) => c.startsWith("language-"));
      const lang = langClass?.replace("language-", "") ?? "text";
      const meta = (codeEl.data as { meta?: string })?.meta ?? "";
      const parsedMeta = parseMeta(meta);
      const title = parsedMeta.title;

      const code = (codeEl.children[0] as { value?: string })?.value ?? "";

      const loadedLangs = highlighter.getLoadedLanguages();
      const effectiveLang = loadedLangs.includes(lang) ? lang : "text";

      const highlighted = highlighter.codeToHtml(code, {
        lang: effectiveLang,
        theme: "vitesse-dark",
        transformers: lang === "ts" || lang === "typescript" ? [transformerTwoslash()] : [],
      });

      const wrapper: Element = {
        type: "element",
        tagName: "div",
        properties: { className: ["code-block"] },
        children: [],
      };

      if (title) {
        wrapper.children.push({
          type: "element",
          tagName: "div",
          properties: { className: ["code-block-title"] },
          children: [{ type: "text", value: title }],
        });
      }

      wrapper.children.push({
        type: "raw" as "element",
        value: highlighted,
      } as unknown as Element);

      if (parent && typeof index === "number") {
        parent.children[index] = wrapper;
      }
    });
  };
};

export default rehypeShiki;
