import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";
import { compileMDX } from "next-mdx-remote/rsc";
import remarkAdmonition from "~/lib/mdx-plugins/remark-admonition";
import rehypeShiki from "~/lib/mdx-plugins/rehype-shiki";
import { mdxComponents } from "~/lib/mdx-components";

interface Props {
  source: string;
}

export default async function MDXContent({ source }: Props) {
  const { content } = await compileMDX({
    source,
    options: {
      mdxOptions: {
        remarkPlugins: [remarkGfm, remarkAdmonition],
        rehypePlugins: [rehypeSlug, rehypeShiki],
      },
    },
    components: mdxComponents,
  });
  return <>{content}</>;
}
