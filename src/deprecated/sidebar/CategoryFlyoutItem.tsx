import Link from "next/link";
import { isItemActive, type NavItem } from "./sidebar-nav";

export default function CategoryFlyoutItem({
  item,
  pathname,
}: {
  item: NavItem;
  pathname: string;
}) {
  const active = isItemActive(item.href, pathname);
  return (
    <Link
      href={item.href}
      prefetch
      data-active={active || undefined}
      className="flex items-center gap-2 px-2 py-1.5 text-sm text-mauve-400 transition-colors hover:bg-mauve-800 hover:text-white data-active:bg-mauve-800 data-active:text-white"
    >
      <item.icon className="shrink-0" />
      <span>{item.title}</span>
    </Link>
  );
}
