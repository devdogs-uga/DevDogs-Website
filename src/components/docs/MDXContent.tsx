import remarkFrontmatter from "remark-frontmatter";
import remarkGfm from "remark-gfm";
import { compileMDX } from "next-mdx-remote/rsc";
import mdxComponents from "fumadocs-ui/mdx";

interface Props {
  /** Raw MDX/Markdown source — frontmatter already stripped by gray-matter */
  source: string;
}

export async function MDXContent({ source }: Props) {
  const { content } = await compileMDX({
    source,
    options: {
      mdxOptions: {
        remarkPlugins: [remarkGfm, remarkFrontmatter],
      },
    },
    components: mdxComponents,
  });
  return <>{content}</>;
}
