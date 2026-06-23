export function toTitleCase(name: string): string {
  return name
    .replace(/[-_]/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function stripExt(filePath: string): string {
  return filePath.replace(/\.(md|mdx)$/, "");
}
