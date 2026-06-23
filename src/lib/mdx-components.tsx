import type { MDXComponents } from "mdx/types";
import Link from "next/link";

function Callout({
  type = "note",
  children,
}: {
  type?: string;
  children: React.ReactNode;
}) {
  const styles: Record<string, string> = {
    note: "border-blue-500/30 bg-blue-500/10 text-blue-200",
    tip: "border-emerald-500/30 bg-emerald-500/10 text-emerald-200",
    important: "border-violet-500/30 bg-violet-500/10 text-violet-200",
    warning: "border-amber-500/30 bg-amber-500/10 text-amber-200",
    caution: "border-rose-500/30 bg-rose-500/10 text-rose-200",
  };
  const labels: Record<string, string> = {
    note: "Note",
    tip: "Tip",
    important: "Important",
    warning: "Warning",
    caution: "Caution",
  };

  return (
    <div
      className={`my-4 rounded-lg border px-4 py-3 text-sm ${styles[type] ?? styles.note}`}
    >
      <p className="mb-1 text-xs font-bold uppercase tracking-wider">
        {labels[type] ?? "Note"}
      </p>
      {children}
    </div>
  );
}

export const mdxComponents: MDXComponents = {
  Callout,
  a: ({ href, children, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => {
    if (href?.startsWith("/") || href?.startsWith("#")) {
      return (
        <Link href={href} {...props}>
          {children}
        </Link>
      );
    }
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" {...props}>
        {children}
      </a>
    );
  },
};
