import matter from "gray-matter";
import {
  DocsBody,
  DocsDescription,
  DocsPage,
  DocsTitle,
} from "fumadocs-ui/page";
import { MDXContent } from "./MDXContent";

interface Props {
  /** Raw file content from GitHub (may include frontmatter) */
  source: string;
}

/**
 * Parses frontmatter, then renders the full Fumadocs page shell
 * (DocsPage → DocsTitle → DocsDescription → DocsBody → MDXContent).
 *
 * Shared by the repo+branch index page and the individual slug page.
 */
export async function DocPageContent({ source }: Props) {
  const { data: frontmatter, content } = matter(source);

  return (
    <DocsPage>
      {frontmatter.title && <DocsTitle>{frontmatter.title}</DocsTitle>}
      {frontmatter.description && (
        <DocsDescription>{frontmatter.description}</DocsDescription>
      )}
      <DocsBody>
        <MDXContent source={content} />
      </DocsBody>
    </DocsPage>
  );
}
